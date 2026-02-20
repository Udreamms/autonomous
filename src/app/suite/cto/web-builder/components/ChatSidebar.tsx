
import React, { useState } from "react";
import { MoreHorizontal, Plus, History, MessageSquare, Trash2, X, Sparkles } from "lucide-react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ChatConversation, ChatMessage, ReasoningLevel, WebProject } from "../types";

interface ChatSidebarProps {
    messages: ChatMessage[];
    isGenerating: boolean;
    statusMessage?: string;
    handleGenerate: (msg: string, images?: { id: string, url: string, file?: File }[]) => void;
    projectOpen: boolean;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    reasoningLevel: ReasoningLevel;
    setReasoningLevel: (level: ReasoningLevel) => void;

    // Conversation Props
    conversations: ChatConversation[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string) => void;
    handleNewConversation: () => void;
    deleteConversation: (id: string) => void;
    cancelGeneration?: () => void;
}

export const ChatSidebar = ({
    messages, isGenerating, handleGenerate, projectOpen,
    selectedModel, setSelectedModel, reasoningLevel, setReasoningLevel,
    conversations, activeConversationId, setActiveConversationId, handleNewConversation, deleteConversation,
    cancelGeneration, statusMessage
}: ChatSidebarProps) => {
    const [input, setInput] = useState("");
    const [selectedImages, setSelectedImages] = useState<{ id: string, url: string, file?: File }[]>([]);
    const [showHistoryList, setShowHistoryList] = useState(false);

    const onSend = () => {
        if (!input.trim() && selectedImages.length === 0) return;
        handleGenerate(input, selectedImages);
        setInput("");
        setSelectedImages([]);
    };

    // Listen for Approval Events from ChatMessageList
    React.useEffect(() => {
        const handleApprove = () => {
            handleGenerate("Plan aprobado. Procede a generar el código.");
        };
        const handleReject = () => {
            handleGenerate("No me convence el plan. Propón otra cosa.");
        };

        window.addEventListener('approve-plan', handleApprove);
        window.addEventListener('reject-plan', handleReject);

        return () => {
            window.removeEventListener('approve-plan', handleApprove);
            window.removeEventListener('reject-plan', handleReject);
        };
    }, [handleGenerate]);

    return (
        <div className="w-[320px] border-r border-[#222] flex flex-col bg-[#09090b] relative z-20">
            {/* Header with Actions */}
            <div className="h-14 border-b border-[#222] flex items-center justify-between px-3 shrink-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    Asistente de Diseño
                </span>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleNewConversation}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Nuevo Chat"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowHistoryList(!showHistoryList)}
                        className={`p-2 rounded-lg transition-colors ${showHistoryList ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Historial de Chats"
                    >
                        <History className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Ajustes">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* History Overlay or Chat List */}
            {showHistoryList ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 animate-in fade-in slide-in-from-left-4 duration-200">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-sm font-bold text-gray-300">Tus chats</span>
                    </div>

                    <div className="space-y-1">
                        {conversations.map(convo => (
                            <div
                                key={convo.id}
                                onClick={() => { setActiveConversationId(convo.id); setShowHistoryList(false); }}
                                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeConversationId === convo.id
                                    ? 'bg-[#202023] text-white border border-[#333]'
                                    : 'text-gray-400 hover:bg-[#151518] hover:text-gray-200 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                                    <span className="text-sm truncate">{convo.title}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                                    className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {conversations.length === 0 && (
                            <div className="text-center py-10 text-xs text-gray-500">
                                No hay conversaciones previas.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <ChatMessageList
                        messages={messages}
                        isGenerating={isGenerating}
                    />

                    <ChatInput
                        input={input}
                        setInput={setInput}
                        handleGenerate={onSend}
                        isGenerating={isGenerating}
                        projectOpen={projectOpen}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        reasoningLevel={reasoningLevel}
                        setReasoningLevel={setReasoningLevel}
                        selectedImages={selectedImages}
                        setSelectedImages={setSelectedImages}
                        cancelGeneration={cancelGeneration}
                        statusMessage={statusMessage}
                    />
                </>
            )}
        </div>
    );
};
