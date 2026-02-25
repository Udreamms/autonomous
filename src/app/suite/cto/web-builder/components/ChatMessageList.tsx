import React, { useRef, useEffect } from "react";
import { ChatMessage, ChatStep } from "../types";
import { Check, CheckCircle2, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { ReasoningBlock } from "./ReasoningBlock";

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

    // Helper to strip <think> tags from content
    const cleanContent = (content: string) => {
        return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    };

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-30 select-none grayscale">
                    <div className="w-16 h-16 bg-[#111] rounded-[2rem] flex items-center justify-center mb-6 border border-[#222]">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Web Builder AI</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed max-w-[200px]">Empieza una conversación para generar el código de tu sitio web.</p>
                </div>
            ) : (
                messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[100%] rounded-2xl p-3 shadow-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-[#18181b] border border-[#27272a] text-gray-200 rounded-tl-none'
                            }`}>

                            {/* Reasoning Block (Dyad/Adorable port) */}
                            {msg.role === 'ai' && (
                                <ReasoningBlock
                                    content={msg.content}
                                    steps={msg.steps}
                                    thinkingTime={msg.thinkingTime}
                                    isGenerating={isGenerating && idx === messages.length - 1}
                                />
                            )}

                            {/* Message Content */}
                            <div className={msg.role === 'ai' && msg.steps?.some(s => s.status === 'current') ? 'opacity-50 blur-[0.5px]' : ''}>
                                {(() => {
                                    const cleaned = msg.role === 'ai' ? cleanContent(msg.content) : msg.content.trim();
                                    if (cleaned === "" && msg.images && msg.images.length > 0) {
                                        return null;
                                    }
                                    return cleaned.split('\n').map((line, i) => (
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

                            </div>

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
