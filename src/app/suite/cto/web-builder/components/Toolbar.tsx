import React from "react";
import {
    MousePointer2, Hand, ZoomIn, Undo2, Redo2, Globe, MonitorCheck,
    Smartphone, Tablet, Monitor, Code2, GitCommit, Loader2, History, Settings, ChevronDown, LayoutGrid, Upload, Rocket, Package
} from "lucide-react";
import { ReasoningLevel } from "../types";
import { GitHubSyncButton } from "./GitHubSyncButton";
import { DeployButton } from "./DeployButton";

interface ToolbarProps {
    activeTool: string;
    setActiveTool: (tool: string) => void;
    viewMode: "desktop" | "tablet" | "mobile";
    setViewMode: (mode: "desktop" | "tablet" | "mobile") => void;
    zoom: number;
    setZoom: (zoom: number) => void;
    handleUndo: () => void;
    handleRedo: () => void;
    historyLength: number;
    futureLength: number;
    user: any;
    showUserMenu: boolean;
    setShowUserMenu: (show: boolean) => void;
    projects: any[];
    activeProjectId: string | null;
    handleSwitchProject: (id: string) => void;
    showCode: boolean;
    setShowCode: (show: boolean) => void;
    repoUrl: string;
    isGenerating: boolean;
    isCommiting: boolean;
    isPublishing: boolean;
    handleCommit: () => void;
    handlePublish: () => void;
    setShowHistory: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
    triggerSync: () => void;

    // Publish / Deploy Props
    activeProjectName?: string;
    files: Record<string, string>;
    onSyncComplete: () => void;
    onDeployComplete: (url: string) => void;
    resetPan?: () => void;
}

export const Toolbar = ({
    activeTool, setActiveTool, viewMode, setViewMode, zoom,
    handleUndo, handleRedo, historyLength, futureLength,
    user, showUserMenu, setShowUserMenu, projects, activeProjectId, handleSwitchProject,
    showCode, setShowCode, repoUrl, isGenerating, isCommiting, isPublishing,
    handleCommit, handlePublish, setShowHistory, setShowSettings,
    syncStatus, triggerSync,
    activeProjectName, files, onSyncComplete, onDeployComplete,
    resetPan, setZoom
}: ToolbarProps) => {
    const [showPublishMenu, setShowPublishMenu] = React.useState(false);
    const publishMenuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (publishMenuRef.current && !publishMenuRef.current.contains(event.target as Node)) {
                setShowPublishMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
        <div className="h-14 border-b border-[#222] bg-[#09090b] flex items-center justify-between px-4 z-[90] shrink-0">
            {/* Left: Dashboard / Project Name */}
            {/* Left: Dashboard / Project Name */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <div className="p-1.5 rounded-lg group-hover:bg-white/10 transition-colors">
                        <Package className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Mis Proyectos</span>
                </button>

                {activeProjectName && (
                    <>
                        <div className="h-4 w-[1px] bg-[#333]"></div>
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-sm font-semibold tracking-tight">{activeProjectName}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Right: Tools & Actions Island */}
            <div className="flex items-center gap-2">

                {/* Tools Group */}
                <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#222]">
                    {[
                        { id: 'select', icon: MousePointer2, title: 'Seleccionar' },
                        { id: 'hand', icon: Hand, title: 'Mano (Pan)' },
                        { id: 'zoom', icon: ZoomIn, title: 'Zoom (Clic para rotar)' }
                    ].map(tool => (
                        <button
                            key={tool.id}
                            title={tool.title}
                            onClick={() => {
                                if (tool.id === 'zoom' && activeTool === 'zoom') {
                                    // Cycle zoom: 100 -> 150 -> 200 -> 50 -> 100
                                    const levels = [100, 150, 200, 50];
                                    const next = levels[(levels.indexOf(zoom) + 1) % levels.length];
                                    setZoom(next);
                                }
                                setActiveTool(tool.id);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${activeTool === tool.id ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <tool.icon className={`w-3.5 h-3.5 ${activeTool === 'zoom' && tool.id === 'zoom' ? 'text-blue-400' : ''}`} />
                        </button>
                    ))}
                </div>

                {/* View Modes Group */}
                <div className="flex items-center gap-3 bg-[#111] p-1 pr-3 rounded-xl border border-[#222]">
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'desktop', icon: Monitor },
                            { id: 'tablet', icon: Tablet },
                            { id: 'mobile', icon: Smartphone }
                        ].map(view => (
                            <button
                                key={view.id}
                                onClick={() => setViewMode(view.id as any)}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === view.id ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <view.icon className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-[1px] bg-[#222]"></div>
                    <button
                        onClick={resetPan}
                        title="Restablecer vista"
                        className="text-[10px] text-gray-500 font-mono hover:text-blue-400 transition-colors px-1"
                    >
                        {zoom}%
                    </button>
                </div>


                {/* Undo/Redo Group */}
                <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#222]">
                    <button onClick={handleUndo} disabled={historyLength === 0} className="p-1.5 text-gray-500 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed rounded-lg hover:bg-white/5"><Undo2 className="w-3.5 h-3.5" /></button>
                    <button onClick={handleRedo} disabled={futureLength === 0} className="p-1.5 text-gray-500 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed rounded-lg hover:bg-white/5"><Redo2 className="w-3.5 h-3.5" /></button>
                </div>

                <div className="h-4 w-[1px] bg-[#222] mx-2"></div>

                {/* Publish Button / Menu */}
                {activeProjectId && (
                    <div className="relative" ref={publishMenuRef}>
                        {!repoUrl ? (
                            // Standard Publish Button (No Repo) -> triggers settings/link
                            <button
                                onClick={handlePublish}
                                className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isPublishing ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 cursor-wait' :
                                    'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 hover:border-green-500/30 cursor-pointer'
                                    }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isPublishing ? 'bg-blue-500 animate-pulse' :
                                    'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] group-hover:bg-green-400'
                                    }`} />
                                <span className="text-[10px] font-bold tracking-widest uppercase">
                                    {isPublishing ? 'PUBLISHING...' : 'PUBLISH'}
                                </span>
                            </button>
                        ) : (
                            // Connected State -> Menu
                            <>
                                <button
                                    onClick={() => setShowPublishMenu(!showPublishMenu)}
                                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showPublishMenu ? 'bg-green-500/20 border-green-500/30' : 'bg-green-500/10 border-green-500/20'
                                        } text-green-400 hover:bg-green-500/20 hover:border-green-500/30 cursor-pointer`}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">PUBLISH</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${showPublishMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {showPublishMenu && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                                        <div className="p-2 flex flex-col gap-1">
                                            <div className="px-2 py-1.5 rounded-lg hover:bg-[#27272a] transition-colors flex items-center justify-between group">
                                                <div className="flex items-center gap-2 text-gray-300 group-hover:text-white">
                                                    <Upload className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
                                                    <span className="text-xs font-medium">Sync Source</span>
                                                </div>
                                                {/* Use raw component but style it minimally or just use the button directly provided? 
                                                    The component renders a button. Let's wrap it nicely. */}
                                                <GitHubSyncButton
                                                    projectId={activeProjectId}
                                                    repoUrl={repoUrl}
                                                    files={files}
                                                    onSyncComplete={() => {
                                                        onSyncComplete();
                                                        triggerSync(); // Trigger local sync logic too if needed
                                                    }}
                                                />
                                            </div>

                                            <div className="h-[1px] bg-[#27272a] my-1" />

                                            <div className="px-2 py-1.5 rounded-lg hover:bg-[#27272a] transition-colors flex items-center justify-between group">
                                                <div className="flex items-center gap-2 text-gray-300 group-hover:text-white">
                                                    <Rocket className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                                                    <span className="text-xs font-medium">Deploy Live</span>
                                                </div>
                                                <DeployButton
                                                    projectId={activeProjectId}
                                                    repoUrl={repoUrl}
                                                    projectName={activeProjectName}
                                                    onDeployComplete={onDeployComplete}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Code Toggle */}
                <button
                    onClick={() => setShowCode(!showCode)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${showCode ? 'bg-white text-black border-white' : 'bg-[#111] hover:bg-[#222] border-[#222] text-gray-400'}`}
                >
                    <Code2 className="w-4 h-4" />
                </button>

                {/* User Profile */}
                {user && (
                    <div className="relative ml-1">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#111] border border-[#222] hover:border-gray-500 transition-colors"
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-black border border-gray-400">
                                    {user.email?.[0].toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#09090b] rounded-full"></div>
                        </button>

                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                <div className="p-4 border-b border-[#27272a] bg-[#202023]">
                                    <div className="flex items-center gap-3">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border border-gray-500" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-bold text-black">{user.email?.[0].toUpperCase()}</div>
                                        )}
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</span>
                                            <span className="text-xs text-gray-400 truncate">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#27272a] mb-1">My Web Builder Projects</div>
                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                        {projects.length === 0 ? (
                                            <div className="px-3 py-4 text-xs text-gray-500 italic text-center">No active projects.</div>
                                        ) : (
                                            projects.map(proj => (
                                                <button
                                                    key={proj.id}
                                                    onClick={() => { handleSwitchProject(proj.id); setShowUserMenu(false); }}
                                                    className={`w-full px-3 py-2 text-xs text-left transition-colors flex items-center justify-between group ${activeProjectId === proj.id ? 'bg-blue-600/10 text-blue-400' : 'text-gray-300 hover:bg-[#27272a]'}`}
                                                >
                                                    <span className="truncate max-w-[120px]">{proj.name}</span>
                                                    {activeProjectId === proj.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="p-2 border-t border-[#27272a]">
                                    <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#27272a] rounded-lg transition-colors"><Settings className="w-3.5 h-3.5" /> Settings</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
