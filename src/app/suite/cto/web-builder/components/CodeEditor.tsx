import React, { useState, useEffect, useRef } from "react";
import { X, Copy, Download, Maximize2, Minimize2, ChevronRight, FileCode, Search, AlertTriangle } from "lucide-react";
import { FileTree } from "./FileTree";

interface CodeEditorProps {
    showCode: boolean;
    setShowCode: (show: boolean) => void;
    files: Record<string, string>;
    updateFiles: (files: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    activeFile: string;
    setActiveFile: (path: string) => void;
    expandedFolders: Set<string>;
    setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
    runtimeErrors?: Record<string, string>;
}

export const CodeEditor = ({
    showCode,
    setShowCode,
    files,
    updateFiles,
    activeFile,
    setActiveFile,
    expandedFolders,
    setExpandedFolders,
    runtimeErrors = {}
}: CodeEditorProps) => {
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [isMaxEditor, setIsMaxEditor] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync activeFile with openFiles
    useEffect(() => {
        if (activeFile) {
            setOpenFiles(prev => prev.includes(activeFile) ? prev : [...prev, activeFile]);
        }
    }, [activeFile]);

    // Handle closing a tab
    const closeTab = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        const nextFiles = openFiles.filter(f => f !== path);
        setOpenFiles(nextFiles);
        if (activeFile === path && nextFiles.length > 0) {
            setActiveFile(nextFiles[nextFiles.length - 1]);
        } else if (nextFiles.length === 0) {
            setActiveFile("");
        }
    };

    const handleCopy = () => {
        const content = files[activeFile] || "";
        navigator.clipboard.writeText(content);
    };

    const handleDownload = () => {
        const content = files[activeFile] || "";
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.split('/').pop() || 'file.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!showCode) return null;

    const codeContent = files[activeFile] || "";
    const lines = codeContent.split('\n');

    return (
        <div className={`fixed z-[100] bg-[#0d0d0d] flex flex-col overflow-hidden transition-all duration-300 border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isMaxEditor ? 'inset-0 rounded-none' : 'inset-6 rounded-2xl'
            }`}>
            {/* Main Header / Tab Bar */}
            <div className="flex items-center justify-between bg-[#141414] border-b border-[#222] h-11">
                <div className="flex-1 flex items-center overflow-x-auto no-scrollbar h-full">
                    {openFiles.map(path => (
                        <div
                            key={path}
                            onClick={() => setActiveFile(path)}
                            className={`group flex items-center gap-2 px-4 h-full cursor-pointer text-[13px] border-r border-[#222] transition-colors relative min-w-[120px] max-w-[200px] ${activeFile === path
                                ? 'bg-[#1e1e1e] text-white'
                                : 'bg-[#141414] text-[#858585] hover:bg-[#1a1a1a] hover:text-[#cccccc]'
                                }`}
                        >
                            {activeFile === path && <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />}
                            <span className="truncate flex-1">{path}</span>
                            {runtimeErrors[path] && (
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" title={runtimeErrors[path]} />
                            )}
                            <button
                                onClick={(e) => closeTab(e, path)}
                                className={`p-0.5 rounded hover:bg-[#333] transition-opacity ${activeFile === path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 px-3 border-l border-[#222] h-full bg-[#141414]">
                    <button onClick={handleCopy} className="p-2 text-[#858585] hover:text-white rounded-lg transition-colors" title="Copiar c├│digo">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={handleDownload} className="p-2 text-[#858585] hover:text-white rounded-lg transition-colors" title="Descargar archivo">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsMaxEditor(!isMaxEditor)} className="p-2 text-[#858585] hover:text-white rounded-lg transition-colors">
                        {isMaxEditor ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <div className="w-[1px] h-4 bg-[#333] mx-1" />
                    <button onClick={() => setShowCode(false)} className="p-2 text-[#858585] hover:text-red-400 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* File Explorer Sidebar */}
                <div className="w-[280px] bg-[#0d0d0d] border-r border-[#222] flex flex-col overflow-hidden">
                    <FileTree
                        files={files}
                        activeFile={activeFile}
                        setActiveFile={setActiveFile}
                        expandedFolders={expandedFolders}
                        setExpandedFolders={setExpandedFolders}
                    />
                </div>

                {/* Editor Surface */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e] relative overflow-hidden">
                    {/* Floating Error Banner */}
                    {runtimeErrors[activeFile] && (
                        <div className="absolute top-4 left-4 right-4 z-[110] animate-in slide-in-from-top duration-500">
                            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl p-4 flex items-start gap-4 shadow-2xl shadow-red-500/20">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-red-200 text-xs font-bold uppercase tracking-wider mb-1">Error de Ejecución</h4>
                                    <p className="text-red-100/80 text-sm leading-relaxed font-mono">
                                        {runtimeErrors[activeFile]}
                                    </p>
                                    <div className="mt-3 flex gap-3">
                                        <button
                                            onClick={() => window.parent.postMessage({ type: 'ask-ai-fix', error: runtimeErrors[activeFile], file: activeFile }, '*')}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-bold rounded-lg transition-all border border-red-500/20"
                                        >
                                            Solicitar Corrección a IA
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!activeFile ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#555] bg-[#0d0d0d]">
                            <FileCode className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm font-medium">Selecciona un archivo para editar</p>
                        </div>
                    ) : (
                        <div className="flex flex-1 overflow-hidden">
                            {/* Line Numbers */}
                            <div className="w-12 bg-[#1e1e1e] text-[#555] text-right pr-4 pt-4 font-mono text-[13px] select-none border-r border-[#2a2a2a]">
                                {lines.map((_, i) => (
                                    <div key={i} className="h-6 leading-6">{i + 1}</div>
                                ))}
                            </div>

                            {/* Editor Textarea */}
                            <textarea
                                ref={textareaRef}
                                className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[14px] p-4 pt-4 resize-none focus:outline-none custom-scrollbar leading-6"
                                value={codeContent}
                                onChange={(e) => updateFiles(prev => ({ ...prev, [activeFile]: e.target.value }))}
                                spellCheck={false}
                                wrap="off"
                            />
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className={`h-6 flex items-center px-4 justify-between text-[11px] font-medium transition-colors ${runtimeErrors[activeFile] ? 'bg-red-900/50 text-red-200' : 'bg-[#007acc] text-white'}`}>
                        <div className="flex items-center gap-4">
                            {runtimeErrors[activeFile] ? (
                                <span className="font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    Error: {runtimeErrors[activeFile]}
                                </span>
                            ) : (
                                <>
                                    <span>{activeFile.endsWith('.tsx') ? 'TypeScript React' : activeFile.endsWith('.css') ? 'CSS' : 'Text'}</span>
                                    <span>UTF-8</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Spaces: 4</span>
                            <span>Line: {lines.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

