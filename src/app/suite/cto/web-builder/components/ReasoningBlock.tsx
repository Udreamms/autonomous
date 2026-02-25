import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, Sparkles, Loader2, Circle, CheckCircle2 } from 'lucide-react';
import { ChatStep } from '../types';

interface ReasoningBlockProps {
    content: string;
    steps?: ChatStep[];
    thinkingTime?: number;
    isGenerating?: boolean;
}

export const ReasoningBlock = ({ content, steps = [], thinkingTime, isGenerating }: ReasoningBlockProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extract content inside <think> tags
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const reasoningText = thinkMatch ? thinkMatch[1].trim() : "";

    if (!reasoningText && (!steps || steps.length === 0) && !isGenerating) return null;

    const laboralSteps = steps.filter(s => s.type === 'laboral' || !s.type);
    const proximoSteps = steps.filter(s => s.type === 'proximo');

    return (
        <div className="mb-4 w-full">
            {/* Thinking Time Header */}
            <div className="flex items-center gap-2 mb-3 px-1 text-gray-500">
                <span className="text-xs font-medium tracking-tight">
                    {isGenerating ? "Pensándolo..." : `Pensamiento durante ${thinkingTime || 0}s`}
                </span>
            </div>

            {/* Main Reasoning Card */}
            <div className="border border-[#27272a] bg-[#111111]/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
                {/* Active Step Header (if any) */}
                <div className="px-4 py-3 border-b border-[#222] bg-[#18181b]/50">
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                        <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Edición</span>
                            <div className="px-2 py-0.5 rounded-md bg-[#222] text-[#aaa] text-[10px] font-mono border border-[#333]">
                                code_delta.ts
                            </div>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    {/* Brief description if expanded or static */}
                    <div className="mt-2 text-[11px] text-gray-300 font-medium truncate opacity-90">
                        {laboralSteps.find(s => s.status === 'current')?.label || "Evolucionando el diseño..."}
                    </div>
                </div>

                {/* Steps Sections */}
                <div className="p-4 space-y-4">
                    {/* LABORAL SECTION */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-blue-500/50"></div>
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Laboral</span>
                        </div>

                        {laboralSteps.length > 0 ? laboralSteps.map(step => (
                            <div key={step.id} className="flex items-center gap-3 group">
                                <div className="relative">
                                    {(step.status === 'current' && isGenerating) ? (
                                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                    ) : (step.status === 'done' || step.status === 'current') ? (
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-gray-800" />
                                    )}
                                </div>
                                <span className={`text-[11px] font-semibold tracking-tight transition-colors ${step.status === 'current' ? 'text-white' : 'text-gray-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                        )) : (
                            isGenerating && (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                    <span className="text-[11px] font-semibold text-white tracking-tight">
                                        Procesando solicitud...
                                    </span>
                                </div>
                            )
                        )}
                    </div>

                    {/* PRÓXIMO SECTION */}
                    {proximoSteps.length > 0 && (
                        <div className="space-y-3 pt-1">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-[1px] bg-gray-500/30"></div>
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Próximo</span>
                            </div>

                            {proximoSteps.map(step => (
                                <div key={step.id} className="flex items-center gap-3 opacity-60">
                                    <Circle className="w-4 h-4 text-gray-800" />
                                    <span className="text-[11px] font-semibold text-gray-600 tracking-tight">
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detailed Reasoning Toggle */}
                <AnimatePresence>
                    {isExpanded && reasoningText && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-[#222] bg-black/20"
                        >
                            <div className="p-4 text-[10px] text-gray-500 font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                                {reasoningText}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
