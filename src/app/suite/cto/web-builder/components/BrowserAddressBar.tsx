import React, { useState, useEffect } from "react";
import { Monitor, ExternalLink, RefreshCw, Loader2, Maximize2, Minimize2 } from "lucide-react";

interface BrowserAddressBarProps {
    url: string;
    onNavigate: (path: string) => void;
    onRefresh: () => void;
    isRefreshing?: boolean;
    onOpenExternal?: () => void;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
}

export const BrowserAddressBar = ({
    url,
    onNavigate,
    onRefresh,
    isRefreshing = false,
    onOpenExternal,
    isMaximized = false,
    onToggleMaximize
}: BrowserAddressBarProps) => {
    const [inputValue, setInputValue] = useState(url);

    useEffect(() => {
        console.log("[BrowserAddressBar] URL Prop received:", url);
        setInputValue(url || ""); // Keep empty for placeholder "index"
    }, [url]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNavigate(inputValue);
    };

    return (
        <div className="h-10 bg-[#161616] flex items-center px-4 gap-3 border-b border-[#222] z-10 shrink-0 select-none">
            {/* Window Controls (Mac Style) */}
            <div className="flex gap-2 mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
            </div>

            {/* Address Bar Input Container */}
            <div className="flex-1 flex items-center justify-center">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-2xl flex items-center bg-[#0d0d0d] rounded-full px-4 h-7 border border-[#222] group focus-within:border-blue-500/50 transition-all shadow-inner"
                >
                    <Monitor className="w-3 h-3 text-gray-600 mr-2 group-focus-within:text-blue-400 transition-colors" />
                    <span className="text-[11px] text-gray-500 font-medium select-none">localhost:3000/</span>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[11px] text-gray-200 font-medium px-0.5 placeholder:text-gray-700 h-full"
                        placeholder="index"
                        spellCheck={false}
                    />
                </form>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 ml-2">
                <button
                    onClick={onToggleMaximize}
                    title={isMaximized ? "Restore" : "Maximize"}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-95"
                >
                    {isMaximized ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                    )}
                </button>
                <button
                    onClick={onOpenExternal}
                    title="Open in new tab"
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-95"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onRefresh}
                    title="Reload preview"
                    disabled={isRefreshing}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all active:rotate-180 disabled:opacity-30"
                >
                    {isRefreshing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>
        </div>
    );
};
