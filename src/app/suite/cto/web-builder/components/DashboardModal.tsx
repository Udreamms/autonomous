import React from "react";
import { X, LayoutGrid, Clock, Trash2, Globe, ExternalLink, Plus } from "lucide-react";
import { WebProject } from "../types";

interface DashboardModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    projects: WebProject[];
    activeProjectId: string | null;
    handleSwitchProject: (id: string) => void;
    deleteProject: (id: string) => void;
    handleNewProject: () => void;
}

export const DashboardModal = ({
    show, setShow, projects, activeProjectId, handleSwitchProject, deleteProject, handleNewProject
}: DashboardModalProps) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-5xl bg-[#09090b] border border-[#222] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-[#1a1a1a] flex items-center justify-between bg-gradient-to-r from-[#09090b] to-[#111]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter text-white">Historial de Chats</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Gestiona tus conversaciones con la IA</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleNewProject}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all text-xs"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Chat
                        </button>
                        <button onClick={() => setShow(false)} className="p-3 hover:bg-white/5 rounded-xl transition-colors">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#0c0c0e]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.length === 0 ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center grayscale opacity-30">
                                <Globe className="w-20 h-20 text-gray-600 mb-6" />
                                <p className="text-sm font-bold text-white uppercase tracking-widest">No hay chats recientes</p>
                                <button onClick={handleNewProject} className="mt-4 text-xs text-blue-500 hover:underline">┬íInicia tu primer chat ahora!</button>
                            </div>
                        ) : (
                            projects.map(proj => (
                                <div
                                    key={proj.id}
                                    onClick={() => { handleSwitchProject(proj.id); setShow(false); }}
                                    className={`group relative aspect-[16/11] bg-[#111] border rounded-[2rem] p-6 flex flex-col justify-between transition-all cursor-pointer overflow-hidden ${activeProjectId === proj.id ? 'border-blue-500/50 shadow-2xl shadow-blue-500/10' : 'border-[#222] hover:border-gray-700 hover:bg-[#141417]'
                                        }`}
                                >
                                    {/* Preview Fake */}
                                    <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-[#1a1a1c] to-transparent opacity-50"></div>

                                    <div className="relative z-10 flex items-start justify-between">
                                        <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl group-hover:scale-110 transition-transform">
                                            <Globe className={`w-5 h-5 ${activeProjectId === proj.id ? 'text-blue-500' : 'text-gray-500'}`} />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }}
                                            className="p-2 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-lg font-black tracking-tight text-white mb-2 truncate">{proj.name}</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                                                <Clock className="w-3 h-3 text-gray-600" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                                    {new Date(proj.lastModified).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {proj.previewUrl && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-md border border-green-500/10">
                                                    <ExternalLink className="w-3 h-3 text-green-500" />
                                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Live</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Badge */}
                                    {activeProjectId === proj.id && (
                                        <div className="absolute top-4 right-4 bg-blue-600 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-white shadow-lg">
                                            Active
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
