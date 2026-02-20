"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Maximize2, Minimize2, Sparkles, Plus, History } from "lucide-react";

import { INITIAL_FILES } from "./constants";
import { ReasoningLevel } from "./types";

// Hooks
import { useProjects } from "./hooks/useProjects";
import { useFileSystem } from "./hooks/useFileSystem";
import { useChatAI } from "./hooks/useChatAI";

// Components
import { Toolbar } from "./components/Toolbar";
import { ChatSidebar } from "./components/ChatSidebar";
import { PreviewArea } from "./components/PreviewArea";
import { CodeEditor } from "./components/CodeEditor";
import { DashboardModal } from "./components/DashboardModal";
import { SettingsModal } from "./components/SettingsModal";
import { NewProjectModal } from "./components/NewProjectModal";
// removed duplicate import
import { ToastContainer, useToast } from "./components/Toast";

export default function WebBuilderPage() {
    // --- Global UI State ---
    const [activeTool, setActiveTool] = useState("select");
    const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [zoom, setZoom] = useState(100);
    const [showCode, setShowCode] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src", "src/app", "src/components"]));

    // AI Config
    const [selectedModel, setSelectedModel] = useState("Gemini 2.0 Flash");
    const [reasoningLevel, setReasoningLevel] = useState<ReasoningLevel>("medium");

    // Runtime Monitoring (Bridge between Visor and Editor)
    const [runtimeErrors, setRuntimeErrors] = useState<Record<string, string>>({});

    // --- Viewport / Pan State ---
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0, offX: 0, offY: 0 });

    const handlePanStart = (e: React.MouseEvent) => {
        if (activeTool !== 'hand') return;
        setIsPanning(true);
        panStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            offX: panOffset.x,
            offY: panOffset.y
        };
    };

    const handlePanMove = (e: React.MouseEvent) => {
        if (!isPanning || activeTool !== 'hand') return;
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPanOffset({
            x: panStartRef.current.offX + dx,
            y: panStartRef.current.offY + dy
        });
    };

    const handlePanEnd = () => {
        setIsPanning(false);
    };

    const resetPan = () => {
        setPanOffset({ x: 0, y: 0 });
        setZoom(100);
    };

    // Repo/Auth
    const [user] = useAuthState(auth);
    const [repoUrl, setRepoUrl] = useState("");
    const [deploymentUrl, setDeploymentUrl] = useState("");
    const [isCommiting, setIsCommiting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [githubUser, setGithubUser] = useState<any>(null);

    // --- Hooks Integration ---
    const {
        projects, setProjects, activeProjectId, activeProject,
        handleNewProject: createProject, handleSwitchProject, deleteProject, updateProjectLastModified, updateProject
    } = useProjects(INITIAL_FILES);

    const {
        files, setFiles, updateFiles, activeFile, setActiveFile, generatedTheme,
        setGeneratedTheme, history, future, handleUndo, handleRedo, deleteProjectFiles,
        syncStatus, triggerSync, hasChanges, checkChanges
    } = useFileSystem(activeProjectId, updateProjectLastModified);

    // Toast Utility
    const { toasts, showToast, removeToast } = useToast();

    const {
        isGenerating,
        chatHistory,
        conversations,
        activeConversationId,
        setActiveConversationId,
        handleGenerate,
        handleNewConversation,
        deleteConversation,
        cancelGeneration,
        statusMessage
    } = useChatAI(
        activeProjectId, files, updateFiles, setActiveFile, setGeneratedTheme, showToast,
        selectedModel, reasoningLevel
    );

    // --- Derived Effects ---
    useEffect(() => {
        if (activeProject) {
            setRepoUrl(activeProject.repoUrl || "");
            setDeploymentUrl(activeProject.deploymentUrl || "");
        } else {
            setRepoUrl("");
            setDeploymentUrl("");
        }
    }, [activeProject]);

    // Cleanup when deleting project
    const onProjectDelete = (id: string) => {
        deleteProject(id);
        deleteProjectFiles(id);
        // Conversations are subcollections, we'll let Firestore cleanup or handle later
    };

    const handleClearCache = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleCreateProject = async (name: string) => {
        await createProject(name);
    };

    // --- Message Handling (Bridge for AI Actions) ---
    useEffect(() => {
        const handleGlobalMessage = (e: MessageEvent) => {
            if (e.data?.type === 'ask-ai-fix') {
                const { error, file } = e.data;
                showToast(`Analizando error en ${file}...`, "info");
                handleGenerate(`Tengo este error en el archivo ${file}: "${error}". Por favor, arréglalo asegurándote de que todas las dependencias e importaciones estén correctas.`);
            }
        };
        window.addEventListener('message', handleGlobalMessage);
        return () => window.removeEventListener('message', handleGlobalMessage);
    }, [handleGenerate, showToast]);

    // 1. Initial Load: GitHub user from cookie
    useEffect(() => {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('github_user='));

        if (userCookie) {
            try {
                const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
                setGithubUser(prev => {
                    // Only update if the data has actually changed to avoid re-render loops
                    if (JSON.stringify(prev) === JSON.stringify(userData)) return prev;
                    return userData;
                });
            } catch (e) {
                console.error('Failed to parse GitHub user cookie', e);
            }
        }
    }, []);

    // 2. Handle redirect-back from GitHub auth (URL params)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pid = params.get('projectId');
        const connected = params.get('github_connected');

        if (connected === 'true') {
            showToast("¡Cuenta de GitHub conectada!", "success");
            setShowSettings(true);

            if (pid && pid !== activeProjectId) {
                handleSwitchProject(pid);
            }

            // Clean up URL to prevent multiple triggers on refresh
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [activeProjectId, handleSwitchProject, showToast]);

    const handleDisconnectGitHub = async () => {
        try {
            await fetch('/api/auth/github/disconnect', { method: 'POST' });
            setGithubUser(null);
            if (activeProjectId) {
                updateProject(activeProjectId, {
                    repoUrl: "",
                    repoName: "",
                    githubConnected: false
                });
            }
            showToast("GitHub account disconnected", "success");
        } catch (e: any) {
            showToast("Failed to disconnect GitHub", "error");
        }
    };

    const handleDeployComplete = (url: string) => {
        setDeploymentUrl(url);
        if (activeProjectId) {
            updateProject(activeProjectId, {
                deploymentUrl: url,
                lastDeployed: Date.now()
            });
        }
        showToast("Project deployed successfully!", "success");
    };
    const handlePublish = async () => {
        if (!activeProjectId) return;

        setIsPublishing(true);
        try {
            if (!repoUrl) {
                showToast("Detección de repositorio: Creando uno nuevo para este proyecto...", "info");
            } else {
                showToast("Sincronizando cambios a GitHub...", "info");
            }

            const result = await triggerSync({
                autoCreate: true,
                projectName: activeProject?.name,
                repoUrl: repoUrl || activeProject?.repoUrl
            });

            if (result?.success && result.repoUrl) {
                await updateProject(activeProjectId, {
                    repoUrl: result.repoUrl,
                    repoName: result.repoName || result.repoUrl.split('/').slice(-2).join('/'),
                    githubConnected: true
                });
            }

            setIsPublishing(false);
            if (result?.error) {
                showToast(result.error, "error");
            } else {
                showToast("¡Proyecto publicado con éxito!", "success");
            }
        } catch (e) {
            console.error("Publish failed", e);
            showToast("Error al publicar el proyecto", "error");
            setIsPublishing(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#050505] text-white flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Top Toolbar */}

            {activeProjectId ? (
                <>
                    {/* Top Toolbar */}
                    <Toolbar
                        activeTool={activeTool} setActiveTool={setActiveTool}
                        viewMode={viewMode} setViewMode={setViewMode}
                        zoom={zoom} setZoom={setZoom}
                        handleUndo={handleUndo} handleRedo={handleRedo}
                        historyLength={history.length} futureLength={future.length}
                        user={user} showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu}
                        projects={projects} activeProjectId={activeProjectId} handleSwitchProject={handleSwitchProject}
                        showCode={showCode} setShowCode={setShowCode}
                        repoUrl={repoUrl} isGenerating={isGenerating}
                        isCommiting={isCommiting} isPublishing={isPublishing}
                        handleCommit={() => setIsCommiting(true)}
                        handlePublish={handlePublish}
                        setShowHistory={setShowHistory} setShowSettings={setShowSettings}
                        syncStatus={syncStatus} triggerSync={triggerSync}

                        // New Props for Dropdown
                        activeProjectName={activeProject?.name}
                        files={files}
                        onSyncComplete={() => {
                            showToast("Synced to GitHub successfully!", "success");
                            updateProjectLastModified(activeProjectId);
                        }}
                        onDeployComplete={handleDeployComplete}
                        resetPan={resetPan}
                    />

                    {/* GitHub Sync and Deploy Buttons REMOVED (Moved to Toolbar) */}

                    <div className="flex-1 flex overflow-hidden relative">
                        <ChatSidebar
                            messages={chatHistory}
                            isGenerating={isGenerating}
                            statusMessage={statusMessage}
                            handleGenerate={(msg) => activeProjectId && handleGenerate(msg)}
                            projectOpen={!!activeProjectId}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            reasoningLevel={reasoningLevel}
                            setReasoningLevel={setReasoningLevel}
                            conversations={conversations}
                            activeConversationId={activeConversationId}
                            setActiveConversationId={setActiveConversationId}
                            handleNewConversation={handleNewConversation}
                            deleteConversation={deleteConversation}
                            cancelGeneration={cancelGeneration}
                        />

                        {/* Main Canvas Area */}
                        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#050505]">
                            {/* Background Grid */}
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            />

                            {/* Code Editor Modal */}
                            <CodeEditor
                                showCode={showCode}
                                setShowCode={setShowCode}
                                files={files}
                                updateFiles={updateFiles}
                                activeFile={activeFile}
                                setActiveFile={setActiveFile}
                                expandedFolders={expandedFolders}
                                setExpandedFolders={setExpandedFolders}
                                runtimeErrors={runtimeErrors}
                            />

                            {/* Device Simulator */}
                            <div
                                onMouseDown={handlePanStart}
                                onMouseMove={handlePanMove}
                                onMouseUp={handlePanEnd}
                                onMouseLeave={handlePanEnd}
                                className={`transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] shadow-2xl ${isMaximized
                                    ? 'w-full h-full rounded-none border-0'
                                    : viewMode === 'mobile' ? 'w-[375px] h-[812px] rounded-[3rem] border-8 border-[#1a1a1a]'
                                        : viewMode === 'tablet' ? 'w-[768px] h-[1024px] rounded-[2rem] border-8 border-[#1a1a1a]'
                                            : 'w-[92%] h-[86%] rounded-xl border border-[#1a1a1a]'
                                    } bg-white overflow-hidden relative group ${activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                                style={{
                                    transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                                    transformOrigin: 'center center'
                                }}
                            >
                                {/* Panning Overlay (Blocks iframe interaction while dragging) */}
                                {activeTool === 'hand' && (
                                    <div className="absolute inset-0 z-20" />
                                )}

                                {/* Address Bar */}
                                <div className="absolute top-0 left-0 right-0 h-8 bg-[#f5f5f5] flex items-center px-4 gap-2 border-b border-gray-200 z-10">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                                    </div>
                                    <div className="flex-1 max-w-md mx-auto h-5 bg-white rounded flex items-center px-2 text-[10px] text-gray-400 shadow-sm">
                                        {`localhost:3000/${activeFile.split('/').pop()?.replace('.tsx', '')}`}
                                    </div>
                                    <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 rounded hover:bg-gray-200 text-gray-500">
                                        {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                    </button>
                                </div>

                                {/* Preview Area */}
                                <div className="mt-8 h-full overflow-y-auto bg-white text-black">
                                    <PreviewArea
                                        files={files}
                                        activeFile={activeFile}
                                        setRuntimeErrors={setRuntimeErrors}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // WELCOME SCREEN (Full View)
                <div className="flex-1 flex items-center justify-center bg-[#050505] relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5" />

                    <div className="relative text-center max-w-2xl px-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-8">
                            <Sparkles className="w-3 h-3" /> Digital Builder Pro
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-tight text-balance">
                            Build your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">masterpiece</span>
                        </h1>
                        <p className="text-gray-400 text-lg mb-10 leading-relaxed font-light max-w-xl mx-auto">
                            Crea proyectos web con lenguaje natural, gestiona múltiples sitios localmente y publica cuando estés listo.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <button
                                onClick={() => setShowNewProjectModal(true)}
                                className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/5 flex items-center gap-3"
                            >
                                <Plus className="w-5 h-5" /> Iniciar Nuevo Proyecto
                            </button>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="px-8 py-4 bg-[#111] text-white border border-[#222] font-bold rounded-2xl hover:bg-[#161616] transition-all flex items-center gap-3"
                            >
                                <History className="w-5 h-5" /> Ver Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <DashboardModal
                show={showHistory}
                setShow={setShowHistory}
                projects={projects}
                activeProjectId={activeProjectId}
                handleSwitchProject={handleSwitchProject}
                deleteProject={onProjectDelete}
                handleNewProject={() => { setShowHistory(false); setShowNewProjectModal(true); }}
            />

            <SettingsModal
                show={showSettings}
                setShow={setShowSettings}
                repoUrl={repoUrl}
                githubUser={githubUser}
                repoName={activeProject?.repoName}
                onDisconnect={handleDisconnectGitHub}
                handleClearCache={handleClearCache}
                onOpenGitHubSettings={() => {
                    const baseUrl = window.location.origin;
                    window.location.href = `${baseUrl}/api/auth/github?projectId=${activeProjectId}`;
                }}
                handleSync={handlePublish}
                isSyncing={isPublishing}
                hasChanges={hasChanges}
                onCheckChanges={() => checkChanges(repoUrl || activeProject?.repoUrl)}
            />

            <NewProjectModal
                show={showNewProjectModal}
                setShow={setShowNewProjectModal}
                onCreate={handleCreateProject}
            />
        </div>
    );
}
