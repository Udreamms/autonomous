import React from 'react';
import { Search, Filter, Clock, MessageCircle } from 'lucide-react';

interface ChatListProps {
    selectedFolder: string;
    activeConversationId: string | null;
    setActiveConversationId: (id: string) => void;
}

export default function ChatList({ selectedFolder, activeConversationId, setActiveConversationId }: ChatListProps) {
    // Dummy Data
    const conversations = [
        { id: '1', name: 'Alfonso Perez', channel: 'WhatsApp', snippet: 'Necesito ayuda con mi ticket de vuelo', time: '10:42 AM', unread: 2, status: 'open' },
        { id: '2', name: 'Maria Gonzalez', channel: 'Instagram', snippet: 'A qué hora abren?', time: 'Yesterday', unread: 0, status: 'open' },
        { id: '3', name: 'Carlos Slim', channel: 'Messenger', snippet: 'Quiero comprar el paquete premium', time: 'Mon', unread: 1, status: 'open' },
        { id: '4', name: 'Juanito Banana', channel: 'Web Chat', snippet: 'Hola, tengo una duda sobre la visa', time: 'Last Week', unread: 0, status: 'resolved' },
        { id: '5', name: 'Ana Mendoza', channel: 'WhatsApp', snippet: 'Gracias por la información', time: 'Feb 12', unread: 0, status: 'open' },
    ];

    return (
        <div className="w-[340px] bg-[#0d0d0d] border-r border-neutral-900 flex flex-col h-full flex-shrink-0">
            {/* Header & Search */}
            <div className="p-4 border-b border-neutral-900 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg capitalize">{selectedFolder} Conversations</h2>
                    <button className="text-neutral-400 hover:text-white">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search contacts, messages..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-600"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-neutral-900/50">
                    {conversations.map(chat => (
                        <button
                            key={chat.id}
                            onClick={() => setActiveConversationId(chat.id)}
                            className={`w-full flex items-start p-4 text-left transition-colors hover:bg-neutral-900 relative ${activeConversationId === chat.id ? 'bg-neutral-900' : ''
                                }`}
                        >
                            {/* Active indicator bar */}
                            {activeConversationId === chat.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                            )}

                            {/* Avatar */}
                            <div className="relative mr-3 flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                                    {chat.name.charAt(0)}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0d0d0d] flex items-center justify-center
                                    ${chat.channel === 'WhatsApp' ? 'bg-green-500' :
                                        chat.channel === 'Instagram' ? 'bg-pink-500' :
                                            chat.channel === 'Messenger' ? 'bg-blue-500' : 'bg-neutral-500'}
                                `}>
                                    <MessageCircle size={8} className="text-white" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className={`font-medium truncate pr-2 ${chat.unread > 0 ? 'text-white' : 'text-neutral-300'}`}>
                                        {chat.name}
                                    </h3>
                                    <span className="text-[11px] text-neutral-500 flex-shrink-0 font-medium">
                                        {chat.time}
                                    </span>
                                </div>
                                <p className={`truncate text-[13px] ${chat.unread > 0 ? 'text-neutral-300 font-medium' : 'text-neutral-500'}`}>
                                    {chat.snippet}
                                </p>
                            </div>

                            {/* Unread Badge */}
                            {chat.unread > 0 && (
                                <div className="ml-2 flex-shrink-0 pt-1">
                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block min-w-[1.25rem] text-center">
                                        {chat.unread}
                                    </span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
