
import React from 'react';
import {
    Sparkles,
    FileCode2,
    Layout,
    ListChecks,
    Check,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanCardProps {
    plan: {
        summary: string;
        structure: string[];
        features: string[];
        theme: string;
    };
    onApprove: () => void;
    onReject: () => void;
}

export const PlanCard = ({ plan, onApprove, onReject }: PlanCardProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const themeColors = {
        art: 'from-pink-500/20 to-purple-600/20 text-pink-400 border-pink-500/30',
        tech: 'from-blue-500/20 to-cyan-600/20 text-cyan-400 border-cyan-500/30',
        cosmetics: 'from-rose-400/20 to-orange-500/20 text-rose-300 border-rose-400/30',
        default: 'from-blue-600/20 to-indigo-600/20 text-blue-400 border-blue-500/30',
    };

    const currentTheme = (typeof plan.theme === 'string' ? plan.theme.toLowerCase() :
        (plan.theme && typeof plan.theme === 'object' && (plan.theme as any).name) ? (plan.theme as any).name.toLowerCase() :
            'default') as keyof typeof themeColors;
    const themeStyle = themeColors[currentTheme] || themeColors.default;

    // Helper to safely render text that might be an object from AI
    const safeText = (text: any, fallback = "") => {
        if (typeof text === 'string') return text;
        if (typeof text === 'number') return String(text);
        if (text && typeof text === 'object') {
            // Case where theme is {FONT: "...", COLORS: [...]}
            if (text.name) return String(text.name);
            if (text.FONT) return `Design: ${text.FONT}`;
            if (text.font) return `Design: ${text.font}`;
            if (Array.isArray(text)) return text.join(", ");
            // Return first interesting string property or truncated JSON
            const keys = Object.keys(text);
            if (keys.length > 0 && typeof text[keys[0]] === 'string') return text[keys[0]];
            return JSON.stringify(text).substring(0, 40) + "...";
        }
        return fallback;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mt-4 overflow-hidden rounded-2xl border bg-[#0c0c0e]/90 backdrop-blur-2xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
            {/* Header / Theme Badge */}
            <div className={`px-4 py-3 bg-gradient-to-r ${themeStyle} flex items-center justify-between border-b border-white/10`}>
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-sm">
                        Plan Propuesto: {safeText(plan.theme, 'Modern')}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                    <span className="text-[8px] font-black opacity-90 uppercase tracking-tighter text-white">AI Engine v2</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 space-y-5">
                {/* Summary */}
                <div className="relative pl-4 border-l-2 border-white/10">
                    <p className="text-[14px] text-white/95 leading-relaxed font-medium italic tracking-tight">
                        "{safeText(plan.summary)}"
                    </p>
                </div>

                {/* Details Accordion */}
                <div className="space-y-3">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center justify-between w-full group py-1"
                    >
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ListChecks className="w-3 h-3 text-blue-500" />
                            Detalles T├®cnicos
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-4"
                            >
                                {/* Features */}
                                <div>
                                    <h4 className="text-[9px] font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                                        <Layout className="w-2.5 h-2.5" /> Funcionalidades
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1.5 ml-1">
                                        {plan.features?.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-2 group">
                                                <div className="mt-1 w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors"></div>
                                                <span className="text-[11px] text-gray-400 group-hover:text-gray-300 transition-colors">
                                                    {safeText(feature)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Structure */}
                                <div>
                                    <h4 className="text-[9px] font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                                        <FileCode2 className="w-2.5 h-2.5" /> Estructura de Proyecto
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5 ml-1">
                                        {plan.structure?.map((file: any, i) => (
                                            <div key={i} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-gray-500 font-mono flex items-center gap-1.5 hover:border-blue-500/30 hover:text-blue-400 transition-all cursor-default">
                                                <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                                                {typeof file === 'string' ? file.split('/').pop() : 'file'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onApprove}
                        className="flex-1 group relative overflow-hidden bg-white text-black text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center justify-center gap-2">
                            <Check className="w-3.5 h-3.5" />
                            Aprobar e Implementar
                        </div>
                    </button>
                    <button
                        onClick={onReject}
                        className="px-4 bg-[#1a1a1c] hover:bg-[#222225] text-red-500 border border-red-500/20 text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all hover:border-red-500/50 active:scale-95"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Bottom Glow */}
            <div className={`h-1 w-full bg-gradient-to-r ${themeStyle} opacity-30`} />
        </motion.div>
    );
};
