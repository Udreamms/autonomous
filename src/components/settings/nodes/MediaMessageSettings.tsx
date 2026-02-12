// src/components/settings/nodes/MediaMessageSettings.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label'; // <--- Importación agregada
import { 
    Bold, Italic, Code, Smile, Link as LinkIcon, 
    Image as ImageIcon, Film, FileText, Music, Edit2
} from 'lucide-react';
import { SettingsSection, Field, FileUploader } from '../SharedComponents';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface NodeSettingsProps {
    node: Node;
    updateNodeConfig: (nodeId: string, data: object) => void;
}

const COMMON_VARIABLES = [
    { label: 'Nombre', value: '{{first_name}}' },
    { label: 'Apellido', value: '{{last_name}}' },
    { label: 'Empresa', value: '{{company}}' }
];

export const MediaMessageSettings = ({ node, updateNodeConfig }: NodeSettingsProps) => {
    const [config, setConfig] = useState({
        url: node.data.url || '',
        caption: node.data.caption || '',
        filename: node.data.filename || '',
        mediaType: node.data.mediaType || 'image',
    });
    const [inputType, setInputType] = useState<'upload' | 'url'>('upload');
    const captionRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setConfig(prev => ({ ...prev, ...node.data }));
        if (node.data.url && node.data.url.startsWith('http') && !node.data.url.includes('firebase')) {
            setInputType('url');
        }
    }, [node.data]);

    const handleUpdate = (data: any) => {
        const newConfig = { ...config, ...data };
        setConfig(newConfig);
        updateNodeConfig(node.id, newConfig);
    };
    
    // Auto-detect media type from URL or MimeType
    const detectMediaType = (filenameOrMime: string) => {
        const lower = filenameOrMime.toLowerCase();
        if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/) || lower.startsWith('image/')) return 'image';
        if (lower.match(/\.(mp4|mov|avi|mkv)$/) || lower.startsWith('video/')) return 'video';
        if (lower.match(/\.(mp3|wav|ogg)$/) || lower.startsWith('audio/')) return 'audio';
        return 'document';
    };

    const handleUploadSuccess = (url: string, filename: string, fileType: string) => {
        const type = detectMediaType(fileType || filename);
        handleUpdate({ url, filename, mediaType: type });
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        const type = detectMediaType(url);
        // Try to extract filename from URL
        const filename = url.split('/').pop()?.split('?')[0] || 'archivo_externo';
        handleUpdate({ url, filename, mediaType: type });
    };

    // --- Rich Text Logic for Caption ---
    const insertText = (textToInsert: string, wrap: boolean = false) => {
        if (!captionRef.current) return;
        const start = captionRef.current.selectionStart;
        const end = captionRef.current.selectionEnd;
        const text = config.caption || '';
        let newText = '';
        
        if (wrap) {
            const selectedText = text.substring(start, end);
            newText = text.substring(0, start) + textToInsert + selectedText + textToInsert + text.substring(end);
        } else {
            newText = text.substring(0, start) + textToInsert + text.substring(end);
        }
        
        handleUpdate({ caption: newText });
        setTimeout(() => captionRef.current?.focus(), 0);
    };

    return (
        <SettingsSection title="🖼️ Mensaje Multimedia">
            
            {/* 1. Selección de Origen */}
            <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'upload' | 'url')} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2 bg-neutral-900">
                    <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
                    <TabsTrigger value="url">Usar URL Pública</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="mt-4">
                    <FileUploader onUploadSuccess={handleUploadSuccess} initialUrl={config.url} initialFilename={config.filename} />
                </TabsContent>
                
                <TabsContent value="url" className="mt-4 space-y-3">
                    <Field label="Enlace directo del archivo" htmlFor="media-url">
                        <div className="flex gap-2">
                            <Input 
                                id="media-url" 
                                placeholder="https://ejemplo.com/imagen.jpg" 
                                value={config.url} 
                                onChange={handleUrlChange}
                                className="font-mono text-xs"
                            />
                            <Button variant="outline" size="icon" title="Verificar"><LinkIcon size={14}/></Button>
                        </div>
                    </Field>
                </TabsContent>
            </Tabs>

            {/* 2. Previsualización y Renombrado (Solo si hay URL) */}
            {config.url && (
                <div className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-3 mb-6 space-y-3">
                    <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-neutral-900 rounded border border-neutral-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {config.mediaType === 'image' ? (
                                <img src={config.url} alt="Preview" className="w-full h-full object-cover" />
                            ) : config.mediaType === 'video' ? (
                                <Film size={24} className="text-blue-400" />
                            ) : config.mediaType === 'audio' ? (
                                <Music size={24} className="text-pink-400" />
                            ) : (
                                <FileText size={24} className="text-orange-400" />
                            )}
                        </div>

                        {/* Metadata Editor */}
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="uppercase text-[10px] tracking-wider bg-neutral-950">
                                    {config.mediaType}
                                </Badge>
                                <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[150px]">{config.url}</span>
                            </div>
                            
                            <div className="relative">
                                <Edit2 size={12} className="absolute left-2 top-2.5 text-neutral-500" />
                                <Input 
                                    value={config.filename} 
                                    onChange={(e) => handleUpdate({ filename: e.target.value })}
                                    className="h-8 pl-7 text-sm font-medium bg-neutral-900 border-neutral-600 focus:border-purple-500"
                                    placeholder="Nombre del archivo..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Editor de Caption (Solo para Image/Video/Doc) */}
            {['image', 'video', 'document'].includes(config.mediaType) && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-semibold text-neutral-400">Pie de Foto (Caption)</Label>
                        
                        {/* Mini Toolbar */}
                        <div className="flex bg-neutral-800 rounded-md border border-neutral-700 p-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertText('*', true)}><Bold size={12}/></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertText('_', true)}><Italic size={12}/></Button>
                            
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6"><Smile size={12}/></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-none" align="end">
                                    <EmojiPicker onEmojiClick={(e) => insertText(e.emoji)} theme={Theme.DARK} height={300} width={280} />
                                </PopoverContent>
                            </Popover>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-400"><Code size={12}/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-neutral-900 border-neutral-700">
                                    {COMMON_VARIABLES.map(v => (
                                        <DropdownMenuItem key={v.value} onClick={() => insertText(v.value)} className="cursor-pointer text-xs">
                                            {v.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <Textarea 
                        ref={captionRef}
                        id="media-caption" 
                        value={config.caption || ''} 
                        onChange={(e) => handleUpdate({ caption: e.target.value })} 
                        placeholder="Escribe una descripción..." 
                        className="min-h-[80px] text-sm resize-none bg-neutral-900"
                    />
                </div>
            )}
        </SettingsSection>
    );
};
