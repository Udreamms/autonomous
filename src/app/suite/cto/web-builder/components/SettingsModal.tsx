import React, { useState, useEffect, useMemo } from "react";
import { X, Settings, Trash2, Globe, Loader2, Github, Check, ExternalLink, RefreshCw, LogOut, ArrowRight, FolderGit2, Search, PlusCircle } from "lucide-react";

interface SettingsModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    repoUrl: string;
    repoName?: string;
    githubUser?: any;
    projectId?: string;
    onDisconnect: () => void;
    handleClearCache: () => void;
    onOpenGitHubSettings: () => void;
    handleSync: () => void;
    isSyncing: boolean;
    hasChanges?: boolean;
    onCheckChanges?: () => Promise<any>;
    onSaveRepoUrl?: (url: string, name?: string) => Promise<void>;
    projectName?: string;
}

export const SettingsModal = ({
    show, setShow, repoUrl, repoName, githubUser, projectId, onDisconnect, handleClearCache,
    onOpenGitHubSettings, handleSync, isSyncing, hasChanges, onCheckChanges, onSaveRepoUrl,
    projectName
}: SettingsModalProps) => {
    const [isChecking, setIsChecking] = useState(false);
    // Step 1: repo input. Step 2: GitHub OAuth redirect.
    const [step, setStep] = useState<'idle' | 'repo-input'>('idle');
    const [repoInput, setRepoInput] = useState("");
    const [repoType, setRepoType] = useState<'existing' | 'new' | 'picker'>('picker');
    const [isSaving, setIsSaving] = useState(false);

    // Repo Picker State
    const [repos, setRepos] = useState<any[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchRepos = async () => {
        if (!githubUser) return;
        setIsLoadingRepos(true);
        try {
            const res = await fetch('/api/auth/github/repos');
            const data = await res.json();
            if (data.repos) {
                setRepos(data.repos);
            }
        } catch (e) {
            console.error("Failed to fetch repos", e);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    useEffect(() => {
        if (show && githubUser && step === 'repo-input' && repos.length === 0) {
            fetchRepos();
        }
    }, [show, githubUser, step]);

    const filteredRepos = useMemo(() => {
        return repos.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [repos, searchQuery]);

    if (!show) return null;

    const handleVerifyChanges = async () => {
        if (!onCheckChanges) return;
        setIsChecking(true);
        await onCheckChanges();
        setIsChecking(false);
    };

    const handleConnectClick = () => {
        setRepoInput("");
        setStep('repo-input');
    };

    const handleRepoSubmit = async (selectedRepo?: any) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (selectedRepo && onSaveRepoUrl) {
                await onSaveRepoUrl(selectedRepo.html_url, selectedRepo.full_name);
            } else if (repoType === 'existing' && repoInput.trim() && onSaveRepoUrl) {
                // Save the provided repo URL to Firestore before authorizing
                await onSaveRepoUrl(repoInput.trim());
            } else if (repoType === 'new' && projectId) {
                // Mark THIS project as pending auto-create after OAuth
                localStorage.setItem(`pendingAutoCreate_${projectId}`, '1');
                onOpenGitHubSettings();
                return; // OAuth redirect happens inside onOpenGitHubSettings
            }
        } finally {
            setIsSaving(false);
            setStep('idle');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#09090b] border border-[#222] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0c0c0e]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                            <Settings className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Configuration {projectName ? `— ${projectName}` : ''}</h2>
                            <p className="text-xs text-gray-500 font-medium">Manage your repository and preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setShow(false); setStep('idle'); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* GitHub Integration Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <Github className="w-3.5 h-3.5" /> Repository Source
                            </div>
                            {repoUrl && (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                                    <Check className="w-3.5 h-3.5" /> Cambios Sincronizados
                                </span>
                            )}
                        </div>

                        {!repoUrl ? (
                            <>
                                {githubUser && step !== 'repo-input' && (
                                    <div className={`mb-6 p-4 border rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 transition-all duration-300 ${repoUrl
                                        ? 'bg-green-500/5 border-green-500/20 shadow-lg shadow-green-500/5'
                                        : 'bg-blue-500/5 border-blue-500/10'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={githubUser.avatar_url} className={`w-10 h-10 rounded-full border shadow-lg transition-colors ${repoUrl ? 'border-green-500/30' : 'border-blue-500/20'
                                                    }`} />
                                                {repoUrl && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#09090b] flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${repoUrl ? 'text-green-400' : 'text-blue-400'
                                                    }`}>
                                                    {repoUrl ? 'Proyecto Vinculado' : 'GitHub Account'}
                                                </div>
                                                <div className="text-sm font-bold text-white leading-tight">
                                                    {repoUrl ? (repoName || repoUrl.split('/').slice(-2).join('/')) : `@${githubUser.login}`}
                                                </div>
                                                {repoUrl && (
                                                    <div className="text-[10px] text-gray-500 font-medium">@{githubUser.login}</div>
                                                )}
                                            </div>
                                        </div>

                                        {repoUrl ? (
                                            <button
                                                onClick={onDisconnect}
                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold rounded-lg transition-all active:scale-95 border border-red-500/20 flex items-center gap-1.5"
                                            >
                                                <LogOut className="w-3 h-3" /> Desvincular
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleConnectClick}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                            >
                                                Vincular Repositorio
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* ── STEP 1: Repo Input ── */}
                                {step === 'repo-input' ? (
                                    <div className="p-4 bg-[#111] border border-blue-500/30 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-center gap-2">
                                            <FolderGit2 className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-bold text-white">Configurar Repositorio</span>
                                        </div>

                                        {/* Tabs: Picker / New / Manual */}
                                        <div className="flex gap-1 p-1 bg-[#0c0c0e] rounded-xl border border-[#222]">
                                            <button
                                                onClick={() => setRepoType('picker')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${repoType === 'picker' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                🔍 Seleccionar
                                            </button>
                                            <button
                                                onClick={() => setRepoType('new')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${repoType === 'new' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                ✨ Crear nuevo
                                            </button>
                                            <button
                                                onClick={() => setRepoType('existing')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${repoType === 'existing' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                🔗 Manual
                                            </button>
                                        </div>

                                        {repoType === 'picker' ? (
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        placeholder="Buscar tus repositorios..."
                                                        className="w-full bg-[#0c0c0e] border border-[#333] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/50"
                                                    />
                                                </div>

                                                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                                                    {isLoadingRepos ? (
                                                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500">
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Cargando repositorios...</span>
                                                        </div>
                                                    ) : filteredRepos.length > 0 ? (
                                                        filteredRepos.map(repo => (
                                                            <button
                                                                key={repo.id}
                                                                onClick={() => handleRepoSubmit(repo)}
                                                                className="w-full p-3 bg-[#0c0c0e] border border-[#222] hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl text-left flex items-center justify-between transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <FolderGit2 className="w-4 h-4 text-gray-500 group-hover:text-blue-400 shrink-0" />
                                                                    <div className="truncate">
                                                                        <div className="text-xs font-bold text-white truncate">{repo.name}</div>
                                                                        <div className="text-[10px] text-gray-500 truncate">{repo.full_name}</div>
                                                                    </div>
                                                                </div>
                                                                <ArrowRight className="w-3 h-3 text-gray-700 group-hover:text-blue-400 shrink-0" />
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="py-8 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                                            No se encontraron repositorios
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : repoType === 'existing' ? (
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-medium">URL del repositorio de GitHub</label>
                                                <input
                                                    type="url"
                                                    value={repoInput}
                                                    onChange={e => setRepoInput(e.target.value)}
                                                    placeholder="https://github.com/usuario/mi-repo"
                                                    className="w-full bg-[#0c0c0e] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors"
                                                    onKeyDown={e => e.key === 'Enter' && handleRepoSubmit()}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                Se creará automáticamente un repositorio privado en tu cuenta de GitHub después de autorizar.
                                            </p>
                                        )}

                                        {repoType !== 'picker' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setStep('idle')}
                                                    className="flex-1 py-2 bg-[#1a1a1a] text-gray-400 text-xs font-bold rounded-xl hover:bg-[#222] transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleRepoSubmit()}
                                                    disabled={isSaving || (repoType === 'existing' && !repoInput.trim())}
                                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (repoType === 'new' ? <PlusCircle className="w-3.5 h-3.5" /> : <Github className="w-3.5 h-3.5" />)}
                                                    {repoType === 'existing' ? 'Vincular Repositorio' : 'Autorizar con GitHub'} <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* ── Default: Connect button ── */
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        {!repoUrl && (
                                            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                                    <Github className="w-4 h-4 text-yellow-500" />
                                                </div>
                                                <div className="text-[11px] font-medium text-yellow-200/70 leading-relaxed">
                                                    Este proyecto aún no está vinculado a un repositorio. Los cambios solo se guardan localmente.
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={onOpenGitHubSettings}
                                            className="w-full p-4 bg-[#111] border border-[#222] hover:border-white/20 rounded-2xl text-left flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                                                    <Github className="w-5 h-5 text-gray-300" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">Connect GitHub</div>
                                                    <div className="text-xs text-gray-500">{githubUser ? 'Configure or switch account' : 'Link a repository to save your work'}</div>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 bg-[#1a1a1a] group-hover:bg-[#222] text-gray-400 text-xs font-bold rounded-lg transition-colors border border-[#333]">
                                                {githubUser ? 'Configure' : 'Connect'}
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-4 bg-[#111] border border-[#222] rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={githubUser?.avatar_url || "https://github.com/identicons/default.png"}
                                            alt="User"
                                            className="w-10 h-10 rounded-full border border-[#333]"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white text-sm">
                                                    {githubUser?.name || githubUser?.login}
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase tracking-wider border border-green-500/20">Connected</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                                                {repoUrl ? (repoName || repoUrl.replace('https://github.com/', '')) : 'No Repository Selected'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onDisconnect}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Desvincular repositorio de este proyecto"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>

                                {repoUrl && (
                                    <div className="pt-4 border-t border-[#222] grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleSync}
                                            disabled={isSyncing || !hasChanges}
                                            className={`col-span-1 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${hasChanges
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-[#1a1a1a] text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {isSyncing ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            )}
                                            {isSyncing ? 'Syncing...' : 'Sync Changes'}
                                        </button>

                                        <button
                                            onClick={handleVerifyChanges}
                                            disabled={isChecking || isSyncing}
                                            className="col-span-1 px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-xl text-xs font-medium text-gray-300 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                            Check Status
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* App Preferences */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <Settings className="w-3.5 h-3.5" /> Data Management
                        </div>

                        <div className="p-4 bg-[#111] border border-[#222] rounded-2xl flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-white text-sm">Local Cache</div>
                                <div className="text-xs text-gray-500">Clear temporary files and reset editor state.</div>
                            </div>
                            <button
                                onClick={handleClearCache}
                                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
