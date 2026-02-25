
import { useState, useEffect, useCallback } from "react";
import { ChatMessage, ChatStep, ConversationState, ReasoningLevel, ChatConversation } from "../types";
import { generateCodePrompt, detectIndustry, generateDesignSpec } from "../ai/promptTemplates";
import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    query,
    orderBy,
    deleteDoc,
    doc,
    setDoc,
    onSnapshot
} from "firebase/firestore";

interface AIResponse {
    type: "question" | "plan" | "code_update" | "message";
    content: string;
    plan?: {
        summary: string;
        structure: string[];
        features: string[];
        theme: string;
    };
    files?: { path: string; content: string }[];
}

export const useChatAI = (
    activeProjectId: string | null,
    files: Record<string, string>,
    updateFiles: (files: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => Promise<void> | void,
    setActiveFile: (path: string) => void,
    setGeneratedTheme: (theme: 'default' | 'art' | 'tech' | 'cosmetics') => void,
    showToast: (msg: string, type?: 'success' | 'info') => void,
    selectedModel: string,
    reasoningLevel: ReasoningLevel
) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationState, setConversationState] = useState<ConversationState>('idle');
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    // Fetch Conversations when project changes
    useEffect(() => {
        if (!activeProjectId) {
            setConversations([]);
            setActiveConversationId(null);
            return;
        }

        const convoCol = collection(db, "web-projects", activeProjectId, "conversations");
        const q = query(convoCol, orderBy("updatedAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatConversation));
            setConversations(list);

            // Auto-select first if none active
            if (list.length > 0 && !activeConversationId) {
                setActiveConversationId(list[0].id);
            }
        }, (error) => {
            console.error("Firestore Permission Error (Conversations):", error);
            showToast("Error de permisos en Firestore. Asegúrate de actualizar tus reglas para la colección 'conversations'.", "info");
        });

        return () => unsubscribe();
    }, [activeProjectId]);

    // Fetch Messages for active conversation
    useEffect(() => {
        if (!activeProjectId || !activeConversationId) {
            setMessages([]);
            return;
        }

        const msgCol = collection(db, "web-projects", activeProjectId, "conversations", activeConversationId, "messages");
        const q = query(msgCol, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
            setMessages(list);
        }, (error) => {
            console.error("Firestore Permission Error (Messages):", error);
        });

        return () => unsubscribe();
    }, [activeProjectId, activeConversationId]);

    const saveChatMessage = async (projectId: string, convoId: string, message: ChatMessage) => {
        try {
            // Firestore doesn't like undefined fields
            const cleanMessage = JSON.parse(JSON.stringify({
                ...message,
                timestamp: message.timestamp || Date.now()
            }, (_, v) => v === undefined ? null : v));

            const msgCol = collection(db, "web-projects", projectId, "conversations", convoId, "messages");
            await addDoc(msgCol, cleanMessage);

            // Update conversation snippet
            const convoRef = doc(db, "web-projects", projectId, "conversations", convoId);
            await setDoc(convoRef, {
                lastMessage: message.content.substring(0, 100) || (message.images?.length ? "Imagen enviada" : ""),
                updatedAt: Date.now()
            }, { merge: true });

        } catch (e) {
            console.error("Failed to save message to Firestore", e);
        }
    };

    const handleNewConversation = useCallback(async () => {
        if (!activeProjectId) return;
        try {
            const convoCol = collection(db, "web-projects", activeProjectId, "conversations");
            const newConvo = await addDoc(convoCol, {
                title: "Nuevo Chat",
                updatedAt: Date.now()
            });
            setActiveConversationId(newConvo.id);
            setMessages([]);
        } catch (e) {
            console.error("Failed to create conversation", e);
        }
    }, [activeProjectId]);

    const deleteConversation = useCallback(async (convoId: string) => {
        if (!activeProjectId) return;
        try {
            await deleteDoc(doc(db, "web-projects", activeProjectId, "conversations", convoId));
            if (activeConversationId === convoId) {
                setActiveConversationId(null);
            }
        } catch (e) {
            console.error("Failed to delete conversation", e);
        }
    }, [activeProjectId, activeConversationId]);

    const cancelGeneration = useCallback(() => {
        if (abortController) {
            abortController.abort('User cancelled generation');
            setAbortController(null);
            setIsGenerating(false);
            showToast('Generación cancelada', 'info');
        }
    }, [abortController, showToast]);

    const handleGenerate = useCallback(async (userMsg: string, images?: { id: string, url: string, file?: File }[]) => {
        if (!activeProjectId) return;

        // Ensure we have a conversation
        let convoId = activeConversationId;
        if (!convoId) {
            const convoCol = collection(db, "web-projects", activeProjectId, "conversations");
            const newConvo = await addDoc(convoCol, {
                title: userMsg.substring(0, 40).trim() || "Nueva conversación",
                updatedAt: Date.now()
            });
            convoId = newConvo.id;
            setActiveConversationId(convoId);
        } else {
            // Auto-update title if the conversation still has a placeholder name
            const activeConvo = conversations.find(c => c.id === convoId);
            const placeholderTitles = ["Nuevo Chat", "Nueva conversación", ""];
            if (activeConvo && placeholderTitles.includes(activeConvo.title?.trim() || "")) {
                const convoRef = doc(db, "web-projects", activeProjectId, "conversations", convoId);
                const autoTitle = userMsg.substring(0, 40).trim() || "Chat sin título";
                await setDoc(convoRef, { title: autoTitle }, { merge: true });
            }
        }

        // Process images to base64 for API
        const processedImages = images ? await Promise.all(images.map(async img => {
            if (img.file) {
                return new Promise<{ data: string; mimeType: string }>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        resolve({
                            data: base64.split(',')[1],
                            mimeType: img.file?.type || 'image/jpeg'
                        });
                    };
                    reader.readAsDataURL(img.file!);
                });
            }
            return null;
        })) : [];

        const validImages = processedImages.filter(Boolean) as { data: string; mimeType: string }[];
        const startTime = Date.now();

        // Auto-ingest images into the project filesystem
        if (validImages.length > 0) {
            console.log("[useChatAI] Auto-ingesting images into project assets...");
            await updateFiles(prevFiles => {
                const newFiles = { ...prevFiles };
                validImages.forEach((img, idx) => {
                    const ext = img.mimeType.split('/')[1] || 'jpg';
                    const timestamp = Date.now();
                    const path = `public/assets/uploads/img_${timestamp}_${idx}.${ext}`;
                    newFiles[path] = img.data; // Store base64 data
                });
                return newFiles;
            });
        }

        // Add user message via SDK
        const userChatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: userMsg,
            images: images?.map(img => img.url) // Save URLs for UI
        };
        await saveChatMessage(activeProjectId, convoId, userChatMessage);

        const controller = new AbortController();
        setAbortController(controller);
        setIsGenerating(true);
        setStatusMessage("Preparando archivos y subiendo imágenes...");
        try {
            if (activeProjectId && convoId) {
                // Determine if it's a new project or an improvement
                const isNew = Object.keys(files).length <= 1; // src/app/page.tsx is always there
                if (isNew) setStatusMessage("Diseñando arquitectura inicial...");
                else setStatusMessage("Analizando código existente...");
            }

            const isNewProject = Object.keys(files).length <= 1;
            const isFirstMessage = messages.length === 0;
            const isRecreateRequest = userMsg.toLowerCase().includes("recarga") ||
                userMsg.toLowerCase().includes("reinicia") ||
                userMsg.toLowerCase().includes("recrea");

            // Prepare current files with the newly ingested images for the AI call
            let apiFiles = { ...files };
            if (validImages.length > 0) {
                validImages.forEach((img, idx) => {
                    const ext = img.mimeType.split('/')[1] || 'jpg';
                    const timestamp = Date.now();
                    const path = `public/assets/uploads/img_${timestamp}_${idx}.${ext}`;
                    apiFiles[path] = img.data;
                });
            }

            // Auto-switch to Pro model for initial generation or explicit re-creation
            let modelToUse = selectedModel;
            if (reasoningLevel === 'high') {
                modelToUse = 'Multipass Agentic (Vertex)';
                setStatusMessage("Iniciando flujo multi-agente de Vertex AI (Arquitecto + Programador + Pulidor)...");
            } else if ((isNewProject && isFirstMessage) || isRecreateRequest) {
                modelToUse = "Gemini 1.5 Pro";
                setStatusMessage("Utilizando Gemini 1.5 Pro para estructuración premium...");
            }

            // Add status cycle for multi-agent
            let statusInterval: NodeJS.Timeout | null = null;
            if (modelToUse === 'Multipass Agentic (Vertex)') {
                let step = 0;
                const steps = [
                    "Vertex AI: Arquitecto planificando estructura...",
                    "Vertex AI: Programador generando código reactivo...",
                    "Vertex AI: Pulidor visual aplicando animaciones y estilos premium...",
                    "Vertex AI: Finalizando ensamblaje del proyecto..."
                ];
                statusInterval = setInterval(() => {
                    if (step < steps.length - 1) {
                        step++;
                        setStatusMessage(steps[step]);
                    }
                }, 8000);
            }

            const res = await fetch('/api/web-builder/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userChatMessage].map(m => {
                        const payload: any = { role: m.role, content: m.content };
                        if (m.id === userChatMessage.id && validImages.length > 0) {
                            payload.images = validImages;
                        }
                        return payload;
                    }),
                    currentFiles: apiFiles,
                    model: modelToUse
                }),
                signal: controller.signal
            });

            if (statusInterval) clearInterval(statusInterval);

            const data: AIResponse = await res.json();
            const endTime = Date.now();
            const thinkingTime = Math.floor((endTime - startTime) / 1000);

            setStatusMessage("Procesando respuesta técnica...");

            // 1. TRY EXTREMELY ROBUST JSON EXTRACTION (Rescuing code from "dirty" responses)
            let parsedData: AIResponse | null = null;
            if (data.type === 'message') {
                try {
                    const text = data.content || "";
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            const extracted = JSON.parse(jsonMatch[0]);
                            if (extracted.type && ['code_update', 'plan', 'question', 'message'].includes(extracted.type)) {
                                parsedData = { ...data, ...extracted };
                            }
                        } catch (e) { }
                    }
                } catch (e) {
                    console.warn("Silent rescue failed", e);
                }
            }

            const finalData = parsedData || data;

            // Simulate Structured Steps for ReasoningBlock
            const generatedSteps: ChatStep[] = [];
            if (finalData.type === 'plan') {
                generatedSteps.push(
                    { id: '1', label: 'Analizar requerimientos', status: 'done', type: 'laboral' },
                    { id: '2', label: 'Diseñar arquitectura de componentes', status: 'current', type: 'laboral' },
                    { id: '3', label: 'Estructurar plan de ejecución', status: 'pending', type: 'proximo' },
                    { id: '4', label: 'Validar coherencia visual', status: 'pending', type: 'proximo' }
                );
            } else if (finalData.type === 'code_update') {
                generatedSteps.push(
                    { id: '1', label: 'Análisis de diferencias (Diffing)', status: 'done', type: 'laboral' },
                    { id: '2', label: 'Aplicar parches quirúrgicos', status: 'done', type: 'laboral' },
                    { id: '3', label: 'Ensamblar archivos modificados', status: 'current', type: 'laboral' },
                    { id: '4', label: 'Sincronizar visor y editor', status: 'pending', type: 'proximo' }
                );
            } else {
                generatedSteps.push(
                    { id: '1', label: 'Analizar consulta del usuario', status: 'done', type: 'laboral' },
                    { id: '2', label: 'Generar respuesta contextual', status: 'done', type: 'laboral' }
                );
            }

            // Mark all active/pending steps as 'done' for the final message persistence
            const finalSteps: ChatStep[] = generatedSteps.map(s => ({
                ...s,
                status: 'done' as const
            }));

            if (finalData.type === 'code_update' && finalData.files && finalData.files.length > 0) {
                console.group("[AI Code Update]");
                console.log("Files received:", finalData.files.map(f => f.path));
                console.log("Content sizes:", finalData.files.map(f => `${f.path}: ${f.content.length} chars`));

                await updateFiles(prevFiles => {
                    const newFiles = { ...prevFiles };
                    finalData.files!.forEach(f => {
                        newFiles[f.path] = f.content;
                    });
                    return newFiles;
                });
                setStatusMessage("Sincronizando cambios locales...");
                console.groupEnd();

                setActiveFile(finalData.files[0].path);
                showToast(`Se han aplicado ${finalData.files.length} mejoras al código.`, "success");
            }
            else if (finalData.type === 'code_update' && (!finalData.files || finalData.files.length === 0)) {
                console.warn("[AI] Code update received but no files found. Raw content:", finalData.content);
            }

            let aiChatMessage: ChatMessage | null = null;

            if (finalData.type === 'plan' && finalData.plan) {
                aiChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'ai' as const,
                    content: finalData.content || `He preparado un plan para "${finalData.plan.summary}".`,
                    plan: finalData.plan,
                    thinkingTime,
                    steps: finalSteps
                };
            }
            else if (finalData.type === 'code_update' && finalData.files) {
                aiChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'ai' as const,
                    content: finalData.content || "Mejoras aplicadas correctamente.",
                    checklist: finalData.files.map(f => ({ label: `Actualizado ${f.path}`, completed: true })),
                    thinkingTime,
                    steps: finalSteps
                };
            }
            else {
                aiChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'ai' as const,
                    content: finalData.content || "",
                    thinkingTime,
                    steps: finalSteps
                };
            }

            if (aiChatMessage) {
                await saveChatMessage(activeProjectId, convoId, aiChatMessage);

                // Set first user message as title if it was "Nuevo Chat"
                const currentConvo = conversations.find(c => c.id === convoId);
                if (currentConvo && currentConvo.title === "Nuevo Chat") {
                    const convoRef = doc(db, "web-projects", activeProjectId, "conversations", convoId);
                    await setDoc(convoRef, { title: userMsg.substring(0, 30) }, { merge: true });
                }
            }

        } catch (e: any) {
            console.error("AI Generation failed", e);

            // Don't show error if user cancelled
            if (e.name === 'AbortError' || e.message?.includes('cancelled')) {
                console.log('[AI] Generation cancelled by user');
                return;
            }

            if (activeProjectId && convoId) {
                saveChatMessage(activeProjectId, convoId, {
                    id: crypto.randomUUID(),
                    role: 'ai' as const,
                    content: "Lo siento, hubo un error al procesar tu solicitud."
                });
            }
        } finally {
            setIsGenerating(false);
            setStatusMessage("");
            setAbortController(null);
        }
    }, [activeProjectId, activeConversationId, messages, files, selectedModel, updateFiles, setActiveFile, showToast, conversations]);

    return {
        isGenerating,
        statusMessage,
        chatHistory: messages,
        conversations,
        activeConversationId,
        setActiveConversationId,
        handleGenerate,
        handleNewConversation,
        deleteConversation,
        cancelGeneration
    };
};
