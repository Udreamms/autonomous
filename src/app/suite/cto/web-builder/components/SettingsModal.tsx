import React, { useState } from "react";
import { X, Settings, Trash2, Globe, Loader2, Github, Check, ExternalLink, RefreshCw, LogOut } from "lucide-react";

interface SettingsModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    repoUrl: string;
    repoName?: string;
    githubUser?: any;
    onDisconnect: () => void;
    handleClearCache: () => void;
    onOpenGitHubSettings: () => void;
    handleSync: () => void;
    isSyncing: boolean;
    hasChanges?: boolean;
    onCheckChanges?: () => Promise<any>;
}

export const SettingsModal = ({
    show, setShow, repoUrl, repoName, githubUser, onDisconnect, handleClearCache, onOpenGitHubSettings, handleSync, isSyncing,
    hasChanges, onCheckChanges
}: SettingsModalProps) => {
    const [isChecking, setIsChecking] = useState(false);

    if (!show) return null;

    const handleVerifyChanges = async () => {
        if (!onCheckChanges) return;
        setIsChecking(true);
        await onCheckChanges();
        setIsChecking(false);
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
                            <h2 className="text-lg font-bold text-white tracking-tight">Configuration</h2>
                            <p className="text-xs text-gray-500 font-medium">Manage your repository and preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShow(false)}
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
                                <a
                                    href={repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Open in GitHub <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>

                        {!githubUser ? (
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
                                        <div className="text-xs text-gray-500">Link a repository to save your work</div>
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                                    Connect
                                </div>
                            </button>
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
                                        title="Disconnect"
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
                                                <RefreshCw className={`w-3.5 h-3.5 ${hasChanges ? '' : ''}`} />
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

