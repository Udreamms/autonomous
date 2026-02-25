import React, { useState } from 'react';
import { User, Phone, MapPin, Mail, Globe, Tag, Clock, Calendar, ChevronRight, FileText, CheckCircle } from 'lucide-react';

interface ContactPanelProps {
    activeConversationId: string;
}

export default function ContactPanel({ activeConversationId }: ContactPanelProps) {
    const [activeTab, setActiveTab] = useState('details'); // details, past_chats, notes

    return (
        <div className="w-[320px] bg-[#0d0d0d] border-l border-neutral-900 flex flex-col h-full flex-shrink-0 overflow-y-auto">

            {/* Contact Header */}
            <div className="p-6 flex flex-col items-center justify-center border-b border-neutral-900 bg-neutral-900/10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg ring-4 ring-neutral-900 mb-3">
                    A
                </div>
                <h2 className="font-semibold text-white tracking-wide text-lg">Alfonso Perez</h2>
                <p className="text-neutral-400 text-sm mt-0.5">alfonso.perez@example.com</p>

                <div className="flex gap-2 mt-4">
                    <button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-xs font-medium transition-colors ring-1 ring-inset ring-neutral-700/50">Edit</button>
                    <button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-xs font-medium transition-colors ring-1 ring-inset ring-neutral-700/50">Merge</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-900 px-2 sticky top-0 bg-[#0d0d0d] z-10">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 py-3 text-[13px] font-medium transition-colors border-b-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-neutral-300'}`}
                >
                    Details
                </button>
                <button
                    onClick={() => setActiveTab('past_chats')}
                    className={`flex-1 py-3 text-[13px] font-medium transition-colors border-b-2 ${activeTab === 'past_chats' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-neutral-300'}`}
                >
                    History
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-3 text-[13px] font-medium transition-colors border-b-2 ${activeTab === 'notes' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-neutral-300'}`}
                >
                    Notes
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5">

                {activeTab === 'details' && (
                    <div className="space-y-6">

                        {/* Status */}
                        <div>
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Conversation Attributes</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400 flex items-center"><CheckCircle size={14} className="mr-2" /> Status</span>
                                    <span className="w-24 text-right bg-blue-500/10 text-blue-400 font-medium px-2 py-0.5 rounded cursor-pointer ring-1 ring-inset ring-blue-500/20">Open</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400 flex items-center"><User size={14} className="mr-2" /> Assignee</span>
                                    <span className="w-24 text-right bg-neutral-800 text-neutral-200 font-medium px-2 py-0.5 rounded cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis">John Doe</span>
                                </div>
                            </div>
                        </div>

                        {/* Custom Attributes */}
                        <div className="pt-2">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Contact Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <Phone size={14} className="text-neutral-500 mr-3" />
                                    <span className="text-white font-medium">+52 55 1234 5678</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Globe size={14} className="text-neutral-500 mr-3" />
                                    <span className="text-white font-medium">Mexico</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <MapPin size={14} className="text-neutral-500 mr-3" />
                                    <span className="text-white font-medium">10:45 AM (Local)</span>
                                </div>
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="pt-2">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                Labels
                                <button className="text-blue-500 hover:text-blue-400 text-2xl font-light leading-none mb-1">+</button>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-red-500/20 border border-red-500/30 text-red-500 text-xs px-2 py-1 rounded-md font-medium flex items-center ring-1 ring-inset ring-red-500/10 hover:bg-red-500/30 cursor-pointer">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                                    Urgent
                                </span>
                                <span className="bg-green-500/20 border border-green-500/30 text-green-500 text-xs px-2 py-1 rounded-md font-medium flex items-center ring-1 ring-inset ring-green-500/10 hover:bg-green-500/30 cursor-pointer">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                    Sales Lead
                                </span>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'past_chats' && (
                    <div className="space-y-4">
                        <div className="text-sm text-neutral-400 pb-2">Previous conversations with this contact.</div>
                        <div className="p-3 border border-neutral-800 bg-neutral-900 rounded-lg cursor-pointer hover:border-neutral-700 transition-colors group">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-semibold text-white group-hover:text-blue-400">#1024</span>
                                <span className="text-neutral-500">Jan 12</span>
                            </div>
                            <p className="text-[13px] text-neutral-400 line-clamp-2">Hola, tuve un problema con la plataforma al intentar pagar mi reservación.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="flex flex-col h-full">
                        <textarea
                            className="w-full h-32 bg-neutral-900 border border-neutral-800 rounded-md p-3 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-shadow"
                            placeholder="Add a private note for your team..."
                        ></textarea>
                        <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium py-2 rounded-md mt-3 transition-colors ring-1 ring-inset ring-neutral-700/50">Save Note</button>
                    </div>
                )}

            </div>
        </div>
    );
}
