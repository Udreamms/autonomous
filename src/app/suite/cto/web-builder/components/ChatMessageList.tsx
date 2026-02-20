import React, { useRef, useEffect } from "react";
import { ChatMessage, ChatStep } from "../types";
import { Check, CheckCircle2, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { PlanCard } from "./PlanCard";

interface ChatMessageListProps {
    messages: ChatMessage[];
    isGenerating: boolean;
}

export const ChatMessageList = ({ messages, isGenerating }: ChatMessageListProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isGenerating]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-30 select-none grayscale">
                    <div className="w-16 h-16 bg-[#111] rounded-[2rem] flex items-center justify-center mb-6 border border-[#222]">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Web Builder AI</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed max-w-[200px]">Empieza una conversaci├│n para generar el c├│digo de tu sitio web.</p>
                </div>
            ) : (
                messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[100%] rounded-2xl p-3 shadow-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-[#18181b] border border-[#27272a] text-gray-200 rounded-tl-none'
                            }`}>
                            {/* Message Content */}
                            <div className={msg.role === 'ai' && msg.steps?.some(s => s.status === 'current') ? 'opacity-50 blur-[0.5px]' : ''}>
                                {(() => {
                                    const trimmed = msg.content.trim();
                                    if (trimmed === "" && msg.images && msg.images.length > 0) {
                                        return null;
                                    }
                                    return msg.content.split('\n').map((line, i) => (
                                        <p key={i} className="text-xs mb-1.5 last:mb-0 leading-relaxed min-h-[1em]">{line}</p>
                                    ));
                                })()}

                                {/* Images Grid */}
                                {msg.images && msg.images.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.images.map((url, i) => (
                                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 shadow-lg group">
                                                <img
                                                    src={url}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                                                    alt="user-upload"
                                                    onClick={() => window.open(url, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* PLAN CARD (New In-Chat Approval) */}
                                {msg.plan && (
                                    <PlanCard
                                        plan={msg.plan}
                                        onApprove={() => window.dispatchEvent(new CustomEvent('approve-plan', { detail: { msgId: msg.id } }))}
                                        onReject={() => window.dispatchEvent(new CustomEvent('reject-plan', { detail: { msgId: msg.id } }))}
                                    />
                                )}

                                {/* Checklist of changes */}
                                {msg.checklist && msg.checklist.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-1.5">
                                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <div className="w-0.5 h-2 bg-blue-500 rounded-full"></div>
                                            Cambios realizados
                                        </div>
                                        {msg.checklist.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 group">
                                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${item.completed ? 'bg-blue-500/20 text-blue-400' : 'bg-[#111] text-gray-600'}`}>
                                                    <Check className="w-2 h-2" />
                                                </div>
                                                <span className={`text-[10px] transition-colors ${item.completed ? 'text-gray-300' : 'text-gray-600 italic'}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Thinking Steps */}
                            {msg.steps && (
                                <div className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-2">
                                    {msg.steps.map(step => (
                                        <div key={step.id} className="flex items-center gap-2.5">
                                            {step.status === 'done' ? <CheckCircle2 className="w-3 h-3 text-blue-500" /> :
                                                step.status === 'current' ? <Loader2 className="w-3 h-3 text-blue-400 animate-spin" /> :
                                                    <div className="w-3 h-3 rounded-full border border-gray-800" />}
                                            <span className={`text-[10px] font-medium tracking-tight ${step.status === 'current' ? 'text-blue-400' : step.status === 'done' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] text-gray-600 mt-1 mx-1 font-mono uppercase tracking-tighter">
                            {msg.role === 'user' ? 'T├║' : 'AI Assistant'}
                        </span>
                    </div>
                ))
            )}
            {isGenerating && messages[messages.length - 1]?.role !== 'ai' && (
                <div className="flex items-center gap-3 text-gray-500 animate-pulse px-4">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[10px] font-medium uppercase tracking-widest">Generando...</span>
                </div>
            )}
        </div>
    );
};
