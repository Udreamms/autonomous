import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

interface PreviewAreaProps {
    files: Record<string, string>;
    activeFile?: string;
    setRuntimeErrors?: (errs: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export const PreviewArea = ({ files, activeFile, setRuntimeErrors }: PreviewAreaProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);
    const [previewHTML, setPreviewHTML] = useState<string>('');
    const [error, setError] = useState<string>('');

    const refreshPreview = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/web-builder/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Preview generation failed');
            }

            const html = await response.text();
            setPreviewHTML(html);
            setLoading(false);
        } catch (err: any) {
            console.error('[PreviewArea] Error:', err);
            setError(err.message);
            setLoading(false);

            if (setRuntimeErrors) {
                setRuntimeErrors(prev => ({ ...prev, [activeFile || 'preview']: err.message }));
            }
        }
    };

    // Refresh preview when files change
    useEffect(() => {
        const timer = setTimeout(() => {
            refreshPreview();
        }, 500); // Debounce updates

        return () => clearTimeout(timer);
    }, [files]);

    // Update iframe when HTML changes
    useEffect(() => {
        if (previewHTML && iframeRef.current) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;

            if (doc) {
                doc.open();
                doc.write(previewHTML);
                doc.close();
            }
        }
    }, [previewHTML]);

    return (
        <div className="w-full h-full bg-[#050505] relative overflow-hidden">
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-50 transition-opacity duration-300">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-2 border-blue-500/20 rounded-full"></div>
                            <div className="w-12 h-12 border-2 border-t-blue-500 rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                        <div className="text-center">
                            <p className="text-white/70 text-xs font-medium tracking-wide">Generating Preview</p>
                            <p className="text-white/30 text-[10px] mt-1">Transpiling components...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && !loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-40 p-8">
                    <div className="max-w-2xl w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="text-red-400 text-2xl">⚠️</div>
                            <div className="flex-1">
                                <h3 className="text-red-400 font-bold text-lg mb-2">Preview Error</h3>
                                <p className="text-red-300/80 text-sm font-mono whitespace-pre-wrap">{error}</p>
                                <button
                                    onClick={refreshPreview}
                                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 text-sm font-medium transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Refresh Button */}
            <button
                onClick={refreshPreview}
                disabled={loading}
                className="absolute top-4 right-4 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 active:scale-95 transition-all z-[60] group backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Preview"
            >
                <RefreshCw className={`w-4 h-4 text-white/50 group-hover:text-blue-400 transition-all duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            </button>

            {/* Preview Iframe */}
            <iframe
                ref={iframeRef}
                className="w-full h-full border-none bg-black"
                sandbox="allow-scripts allow-same-origin"
                title="Preview"
            />
        </div>
    );
};
