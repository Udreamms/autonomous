import { Search, Filter, MoreHorizontal, ArrowLeft, PanelLeftClose, PanelLeftOpen, UserPlus, Download, RefreshCw, Settings, Instagram, Facebook, Globe, Ghost, MessageSquare, Twitter, Send, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const KanbanHeader = ({
    searchTerm,
    setSearchTerm,
    channelStats,
    isSidebarCollapsed,
    toggleSidebar
}: any) => {
    return (
        <div className="h-[52px] border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-20">
            <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/5"
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </Button>
                    <div className="h-6 w-[1px] bg-neutral-800" />
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                            <MessageSquare size={16} className="text-blue-500" />
                        </div>
                        <h1 className="text-[15px] font-semibold text-white tracking-tight">Bandeja de Entrada</h1>
                    </div>
                </div>

                <div className="h-6 w-[1px] bg-neutral-800 mx-2" />

                {/* Stats Bar */}
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
                    {/* WhatsApp */}
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -right-0.5 -top-0.5 animate-pulse" />
                            <MessageSquare size={11} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-neutral-200">{channelStats.whatsapp}</span>
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">WhatsApp</span>
                        </div>
                    </div>

                    <div className="w-[1px] h-2.5 bg-neutral-800/50" />

                    {/* Instagram */}
                    <div className="flex items-center gap-1.5">
                        <Instagram size={11} className="text-pink-500" />
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-neutral-200">{channelStats.instagram}</span>
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Instagram</span>
                        </div>
                    </div>

                    <div className="w-[1px] h-2.5 bg-neutral-800/50" />

                    {/* Messenger */}
                    <div className="flex items-center gap-1.5">
                        <Facebook size={11} className="text-blue-600" />
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-neutral-200">{channelStats.messenger}</span>
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Messenger</span>
                        </div>
                    </div>

                    <div className="w-[1px] h-2.5 bg-neutral-800/50" />

                    {/* Web */}
                    <div className="flex items-center gap-1.5">
                        <Globe size={11} className="text-cyan-400" />
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-neutral-200">{channelStats.web}</span>
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Web</span>
                        </div>
                    </div>

                    <div className="w-[1px] h-2.5 bg-neutral-800/50" />

                    {/* New Platforms */}
                    <div className="flex items-center gap-1.5">
                        <Twitter size={11} className="text-neutral-400" />
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-neutral-200">{channelStats.x}</span>
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">X</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Music size={11} className="text-pink-400" />
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-neutral-200">{channelStats.tiktok}</span>
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">TikTok</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Send size={11} className="text-sky-500" />
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-neutral-200">{channelStats.telegram}</span>
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">TG</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative group/search w-64 transition-all duration-300 focus-within:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 group-focus-within/search:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Buscar conversaciones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-8 bg-black/20 border-white/5 text-[11px] placeholder:text-neutral-600 focus:bg-black/40 transition-all rounded-lg"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[9px] font-medium text-neutral-500 opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>

                <div className="h-4 w-[1px] bg-neutral-800" />

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-neutral-400 hover:text-white text-[11px] px-3 font-normal border border-transparent hover:border-white/5 hover:bg-white/5">
                        <Filter size={14} />
                        <span>Filtrar</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-400 hover:text-white border border-transparent hover:border-white/5 hover:bg-white/5">
                        <RefreshCw size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-400 hover:text-white border border-transparent hover:border-white/5 hover:bg-white/5">
                        <Settings size={14} />
                    </Button>
                </div>

                <div className="pl-2">
                    <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-lg shadow-blue-900/20 text-[11px] px-3 font-medium rounded-lg">
                        <UserPlus size={14} />
                        <span>Nuevo Chat</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};
