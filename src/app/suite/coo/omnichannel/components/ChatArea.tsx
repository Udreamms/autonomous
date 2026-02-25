import React, { useState } from 'react';
import { MoreVertical, Info, Send, Paperclip, Smile, Image as ImageIcon, FileText } from 'lucide-react';

interface ChatAreaProps {
    activeConversationId: string;
    toggleContactPanel: () => void;
}

export default function ChatArea({ activeConversationId, toggleContactPanel }: ChatAreaProps) {
    const [message, setMessage] = useState('');

    // Dummy Messages
    const messages = [
        { id: '1', sender: 'agent', text: 'Hola Alfonso, ¿cómo te puedo ayudar hoy con tu vuelo?', time: '10:30 AM', status: 'read' },
        { id: '2', sender: 'customer', text: 'Hola, quería ver si es posible cambiar la fecha para el 15 de este mes', time: '10:35 AM' },
        { id: '3', sender: 'agent', text: 'Claro que sí, déjame revisar la disponibilidad.', time: '10:38 AM', status: 'delivered' },
        { id: '4', sender: 'customer', text: 'Quedo atento, gracias!', time: '10:40 AM' }
    ];

    return (
        <div className="flex-1 flex flex-col h-full relative">

            {/* Header */}
            <div className="h-16 border-b border-neutral-800 bg-[#111] flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-sm">
                        A
                    </div>
                    <div>
                        <h2 className="font-semibold text-white tracking-wide">Alfonso Perez</h2>
                        <div className="flex items-center text-xs text-neutral-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 inline-block"></span>
                            Online
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2 text-neutral-400">
                    <button className="p-2 hover:bg-neutral-800 rounded-md transition-colors tooltip" aria-label="Mark as Unread">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </button>
                    <button className="p-2 hover:bg-neutral-800 rounded-md transition-colors" title="Contact Info" onClick={toggleContactPanel}>
                        <Info size={20} />
                    </button>
                    <button className="p-2 hover:bg-neutral-800 rounded-md transition-colors" title="More Actions">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a] space-y-4">
                <div className="text-center text-xs text-neutral-500 my-4 uppercase tracking-wider font-semibold">Today</div>

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'customer' && (
                            <div className="w-8 h-8 rounded-full bg-neutral-800 mr-2 flex-shrink-0 self-end mb-1"></div>
                        )}

                        <div className={`max-w-[70%] group ${msg.sender === 'agent' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>

                            <div className={`p-3 rounded-2xl relative ${msg.sender === 'agent'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-neutral-800 text-neutral-100 rounded-bl-none'
                                }`}>
                                <p className="leading-relaxed">{msg.text}</p>
                            </div>

                            <div className="flex items-center mt-1 text-[11px] text-neutral-500 px-1 font-medium">
                                <span>{msg.time}</span>
                                {msg.sender === 'agent' && (
                                    <span className="ml-1 text-blue-500">
                                        {msg.status === 'read' ? '✓✓' : '✓'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {msg.sender === 'agent' && (
                            <div className="w-8 h-8 rounded-full bg-neutral-700 ml-2 flex-shrink-0 self-end mb-1">
                                <img src="/agent-avatar.svg" alt="Agent" className="w-full h-full rounded-full object-cover" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#111] border-t border-neutral-800 flex-shrink-0">
                <div className="flex items-end bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 transition-shadow">

                    <button className="p-3 text-neutral-400 hover:text-white transition-colors">
                        <Smile size={20} />
                    </button>

                    <textarea
                        className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white py-3 resize-none max-h-32 min-h-[44px]"
                        placeholder="Type your reply here... (Shift + Enter for new line)"
                        rows={1}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    <div className="flex items-center px-2 pb-2 h-[44px]">
                        <button className="p-2 text-neutral-400 hover:text-white transition-colors">
                            <ImageIcon size={18} />
                        </button>
                        <button className="p-2 text-neutral-400 hover:text-white transition-colors">
                            <FileText size={18} />
                        </button>
                        <button
                            className={`ml-2 p-2 rounded-lg transition-colors flex items-center justify-center
                                ${message.trim().length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20' : 'bg-neutral-800 text-neutral-500'}
                            `}
                        >
                            <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
                        </button>
                    </div>

                </div>

                <div className="flex justify-between items-center mt-2 px-2 text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
                    <span>Press Enter to send</span>
                    <div className="flex gap-4">
                        <span className="hover:text-neutral-300 cursor-pointer">Private Note</span>
                        <span className="text-blue-500 hover:text-blue-400 cursor-pointer">Reply</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
