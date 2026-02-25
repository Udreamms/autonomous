import React from 'react';
import { Mail, Users, CheckCircle, Tag, Hash, Settings, ChevronDown, MessageSquare } from 'lucide-react';

interface SidebarProps {
    selectedFolder: string;
    setSelectedFolder: (folder: string) => void;
}

export default function InboxSidebar({ selectedFolder, setSelectedFolder }: SidebarProps) {
    const folders = [
        { id: 'mine', label: 'Mine', icon: <Users size={16} /> },
        { id: 'unassigned', label: 'Unassigned', icon: <CheckCircle size={16} /> },
        { id: 'all', label: 'All', icon: <Mail size={16} /> },
    ];

    const channels = [
        { id: 'whatsapp1', label: 'WhatsApp Main', type: 'whatsapp' },
        { id: 'ig1', label: 'Instagram CS', type: 'instagram' },
    ];

    return (
        <div className="w-64 bg-[#0a0a0a] border-r border-neutral-900 flex flex-col h-full flex-shrink-0">
            {/* Header / Brand */}
            <div className="h-14 flex items-center px-4 border-b border-neutral-900">
                <div className="w-6 h-6 bg-blue-600 rounded mr-2 flex items-center justify-center">
                    <MessageSquare size={14} className="text-white" />
                </div>
                <span className="font-semibold text-white tracking-wide">Inbox</span>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-6">

                {/* Standard Folders */}
                <div className="px-3 space-y-1">
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => setSelectedFolder(folder.id)}
                            className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${selectedFolder === folder.id
                                    ? 'bg-blue-600/10 text-blue-500 font-medium'
                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                }`}
                        >
                            <span className="mr-3">{folder.icon}</span>
                            {folder.label}
                            {/* Dummy untagged/unread count */}
                            {folder.id === 'all' && (
                                <span className="ml-auto bg-neutral-800 text-xs px-1.5 py-0.5 rounded-full">12</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Channels (Inboxes) */}
                <div className="px-3">
                    <div className="flex items-center text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">
                        <span className="flex-1 text-left">Inboxes</span>
                        <ChevronDown size={14} />
                    </div>
                    <div className="space-y-1">
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => setSelectedFolder(channel.id)}
                                className={`w-full flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${selectedFolder === channel.id
                                        ? 'bg-blue-600/10 text-blue-500 font-medium'
                                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                    }`}
                            >
                                <Hash size={16} className="mr-3 opacity-60" />
                                <span className="truncate">{channel.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Labels */}
                <div className="px-3">
                    <div className="flex items-center text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">
                        <span className="flex-1 text-left">Labels</span>
                        <ChevronDown size={14} />
                    </div>
                    <div className="space-y-1">
                        {['Sales', 'Support', 'Urgent'].map(label => (
                            <button
                                key={label}
                                className="w-full flex items-center px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                            >
                                <div className={`w-2 h-2 rounded-full mr-3 ${label === 'Urgent' ? 'bg-red-500' :
                                        label === 'Sales' ? 'bg-green-500' : 'bg-blue-500'
                                    }`} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Footer Settings */}
            <div className="p-3 border-t border-neutral-900">
                <button className="w-full flex items-center px-3 py-2 rounded-md text-sm text-neutral-400 hover:bg-neutral-900 transition-colors">
                    <Settings size={16} className="mr-3" />
                    Settings
                </button>
            </div>
        </div>
    );
}
