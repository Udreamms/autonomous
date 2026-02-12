"use client";

import React from "react";
import { Layout, Palette, Code2, Rocket, Search, MousePointer2, Layers, Plus } from "lucide-react";


export default function WebBuilderPage() {
    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">

            {/* Sidebar Toolset */}
            <div className="w-56 border-r border-white/5 bg-[#0d0d0d] flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <h1 className="text-base font-medium text-white tracking-tight">
                        Web Builder AI
                    </h1>
                </div>
                <div className="flex-1 p-3 space-y-4 overflow-auto">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase font-medium mb-2 ml-1 tracking-wider">Componentes</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { icon: <Layout className="w-3.5 h-3.5" />, label: "Hero" },
                                { icon: <Palette className="w-3.5 h-3.5" />, label: "Nav" },
                                { icon: <Layers className="w-3.5 h-3.5" />, label: "Grid" },
                                { icon: <Plus className="w-3.5 h-3.5" />, label: "Form" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center justify-center p-2.5 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing group">
                                    <div className="text-gray-500 group-hover:text-blue-400 transition-colors mb-1.5">{item.icon}</div>
                                    <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wide">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[9px] text-gray-500 uppercase font-medium mb-2 ml-1 tracking-wider">Prompt a Web</p>
                        <div className="space-y-2">
                            <textarea
                                placeholder="Ex: Crea una landing page para un spa de lujo..."
                                className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2.5 text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-gray-600 resize-none font-medium text-white"
                            />
                            <button className="w-full bg-blue-600 hover:bg-blue-500 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/10">
                                <Rocket className="w-3 h-3" /> Generar con IA
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 flex flex-col relative bg-[#050505]">
                <div className="h-10 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between px-4 z-10">
                    <div className="flex items-center gap-3 bg-black/40 px-2 py-1 rounded-full border border-white/10">
                        <button className="p-0.5 hover:bg-white/10 rounded transition-colors"><MousePointer2 className="w-3.5 h-3.5 text-blue-400" /></button>
                        <div className="w-[1px] h-2.5 bg-white/10"></div>
                        <button className="p-0.5 hover:bg-white/10 rounded transition-colors"><Code2 className="w-3.5 h-3.5 text-gray-500" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="text-[10px] font-medium text-gray-400 hover:text-white transition-colors px-2 uppercase tracking-wide">Previsualizar</button>
                        <button className="bg-white text-black px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide hover:bg-gray-200 transition-colors">Publicar</button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-auto p-8 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] flex justify-center">
                    <div className="w-full max-w-4xl aspect-[16/10] bg-white rounded-t-2xl shadow-2xl overflow-hidden flex flex-col transform scale-95 origin-top">
                        <div className="w-full h-6 bg-gray-100 flex items-center px-3 gap-1.5 border-b border-gray-200">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <div className="ml-3 flex-1 h-4 bg-white rounded flex items-center px-2">
                                <Search className="w-2 h-2 text-gray-300 mr-1" />
                                <span className="text-[8px] text-gray-300 font-medium">tusitio.com/index.html</span>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-300 flex-col space-y-3">
                            <div className="w-48 h-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="w-32 h-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="w-24 h-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
