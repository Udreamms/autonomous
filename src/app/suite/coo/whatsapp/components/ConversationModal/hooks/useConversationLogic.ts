import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db, functions } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, updateDoc, query, collection, where, getDocs, serverTimestamp, Timestamp, arrayUnion, orderBy, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { useDropzone } from 'react-dropzone';
import { CardData, Message, Note, CheckIn, ConversationModalProps } from '../types';
import { COLUMN_CHECKLISTS } from '../ConversationChecklistSystem';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { groupMessagesByDate } from '../utils';
import { socialPlatforms } from '../constants';

// const sendWhatsappMessage = httpsCallable(functions, 'sendWhatsappMessage');
const moveCardCallable = httpsCallable(functions, 'moveCard');

export const useConversationLogic = ({ isOpen, onClose, card, groupName, groups = [] }: ConversationModalProps) => {
    const [liveCardData, setLiveCardData] = useState<CardData | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [contactInfo, setContactInfo] = useState<Partial<CardData>>({});
    const [crmData, setCrmData] = useState<Partial<CardData> | null>(null); // Store raw CRM data
    const [activeTab, setActiveTab] = useState<'perfil' | 'pagos' | 'notas' | 'historial' | null>(null);
    const [activePlatform, setActivePlatform] = useState('WhatsApp');
    const [isEditing, setIsEditing] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string; } | null>(null);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [isAddingCheckIn, setIsAddingCheckIn] = useState(false);
    const [newCheckIn, setNewCheckIn] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingCheckInId, setEditingCheckInId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({
        type: 'visa' as const,
        last4: '',
        expiry: '',
        brand: ''
    });
    const [newHistoryComment, setNewHistoryComment] = useState('');

    // New state to track the REAL Kanban card once identified/created
    const [forcedCardId, setForcedCardId] = useState<string | null>(null);
    const [forcedGroupId, setForcedGroupId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { uploading, progress, uploadFile } = useFileUpload();

    // Reset forced state when props change significantly
    useEffect(() => {
        setForcedCardId(null);
        setForcedGroupId(null);
    }, [card?.id]);

    // Memos
    const currentGroupId = useMemo(() => {
        return forcedGroupId || liveCardData?.groupId || card?.groupId;
    }, [forcedGroupId, liveCardData?.groupId, card?.groupId]);

    const currentCardId = useMemo(() => {
        return forcedCardId || liveCardData?.id || card?.id;
    }, [forcedCardId, liveCardData?.id, card?.id]);

    const currentGroupName = useMemo(() => {
        if (!currentGroupId || !groups.length) return groupName || 'default';
        const currentGroup = groups.find(g => g.id === currentGroupId);
        return currentGroup?.name || groupName || 'default';
    }, [currentGroupId, groups, groupName]);

    const dynamicItems = liveCardData?.checkIns || [];
    const completedDynamicItems = dynamicItems.filter(item => item.completed);
    const totalItems = dynamicItems.length;
    const totalCompleted = completedDynamicItems.length;
    const checklistProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

    // 24h Window Check
    const isWithin24Hours = useMemo(() => {
        if (!liveCardData?.messages || liveCardData.messages.length === 0) return false;

        // Find last message from USER
        // Messages are usually appended, so last is at end. But we should double check timestamp.
        const userMessages = liveCardData.messages.filter(m => m.sender !== 'agent');
        if (userMessages.length === 0) return false; // Never received a message -> Window closed (needs template)

        const lastUserMsg = userMessages[userMessages.length - 1];
        if (!lastUserMsg.timestamp) return false;

        const lastMsgDate = lastUserMsg.timestamp.toDate();
        const now = new Date();
        const diffHours = (now.getTime() - lastMsgDate.getTime()) / (1000 * 60 * 60);

        return diffHours < 24;
    }, [liveCardData?.messages]);

    const nextGroup = useMemo(() => {
        if (!groups.length || !currentGroupId) return null;
        const currentIndex = groups.findIndex(g => g.id === currentGroupId);
        if (currentIndex !== -1 && currentIndex < groups.length - 1) {
            return groups[currentIndex + 1];
        }
        return null;
    }, [groups, currentGroupId]);

    // Effects
    useEffect(() => {
        if (!liveCardData) return;
        const hasItems = liveCardData.checkIns && liveCardData.checkIns.length > 0;
        const allCompleted = hasItems && liveCardData?.checkIns?.every(i => i.completed);

        if (allCompleted && nextGroup && currentCardId && currentGroupId) {
            const triggerMove = async () => {
                try {
                    const movePromise = moveCardCallable({
                        sourceGroupId: currentGroupId,
                        destGroupId: nextGroup.id,
                        cardId: currentCardId
                    });

                    const compositePromise = movePromise.then(async () => {
                        await updateDoc(doc(db, 'kanban-groups', nextGroup.id, 'cards', currentCardId), {
                            checkIns: [],
                            checklistStatus: {},
                            history: arrayUnion({
                                id: `hist_${Date.now()}`,
                                type: 'status',
                                content: `Movido automáticamente a ${nextGroup.name}`,
                                timestamp: Timestamp.now(),
                                author: 'Sistema'
                            })
                        });
                        return "Moved and Cleared";
                    });

                    toast.promise(compositePromise, {
                        loading: 'Hito alcanzado: Moviendo a la siguiente etapa...',
                        success: `¡Felicidades! Cliente movido a ${nextGroup.name}`,
                        error: 'No se pudo mover automáticamente'
                    });

                    await compositePromise;
                } catch (error) {
                    console.error("Auto-move error:", error);
                }
            };

            const timer = setTimeout(triggerMove, 1500);
            return () => clearTimeout(timer);
        }
    }, [checklistProgress, nextGroup, currentCardId, currentGroupId, liveCardData]);

    useEffect(() => {
        // If no card and no forced ID, reset and exit
        if (!card && !forcedCardId) {
            setLiveCardData(null);
            return;
        }

        let isMounted = true;
        let unsubscribe: (() => void) | null = null;
        let unsubscribeCRM: (() => void) | null = null;

        const initLogic = async () => {
            try {
                // If unmounted before we start, stop.
                if (!isMounted) return;

                // Priority 1: Forced ID (Real ID from a sent message)
                if (forcedCardId && forcedGroupId) {
                    console.log('[useConversationLogic] 🔒 Using Forced Real ID:', forcedCardId);
                    const cardRef = doc(db, 'kanban-groups', forcedGroupId, 'cards', forcedCardId);

                    const unsub = onSnapshot(cardRef, (docSnap) => {
                        if (!isMounted) return;
                        if (docSnap.exists()) {
                            const data = docSnap.data() as CardData;
                            console.log('[useConversationLogic] 📡 Real-time Update (Forced ID):', forcedCardId, 'Messages:', data.messages?.length);
                            setLiveCardData({ ...data, id: docSnap.id, groupId: forcedGroupId });
                        }
                    }, (err) => {
                        console.error('[useConversationLogic] ❌ Snapshot Error:', err);
                    });

                    // If we are still mounted, assign subscription. Else, unsubscribe immediately.
                    if (isMounted) {
                        unsubscribe = unsub;
                    } else {
                        unsub();
                    }
                    return;
                }

                // Priority 2: Standard Search (if needed)
                if (!card?.id) return;

                let finalGroups = groups;
                if (!finalGroups || finalGroups.length === 0) {
                    const groupsSnap = await getDocs(query(collection(db, 'kanban-groups'), orderBy('order', 'asc')));
                    if (!isMounted) return;
                    finalGroups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                }

                // Helper to search
                const findAndSubscribe = async (cardIdToFind?: string, phoneNumberToFind?: string): Promise<boolean> => {
                    console.log('[useConversationLogic] 🔍 Searching...', { cardIdToFind, phoneNumberToFind });

                    for (const group of finalGroups) {
                        if (!isMounted) return false;

                        try {
                            let cardRef = cardIdToFind ? doc(db, 'kanban-groups', group.id, 'cards', cardIdToFind) : null;
                            let cardSnap = cardRef ? await getDoc(cardRef) : null;

                            // Phone Search Logic
                            if ((!cardSnap || !cardSnap.exists()) && phoneNumberToFind) {
                                // ... (Search logic remains the same, simplified for brevity in this thought, but effectively implies searching)
                                const allCardsSnap = await getDocs(collection(db, 'kanban-groups', group.id, 'cards'));
                                if (!isMounted) return false;

                                const phoneVariants = [
                                    phoneNumberToFind,
                                    phoneNumberToFind.startsWith('+') ? phoneNumberToFind : `+${phoneNumberToFind}`,
                                    phoneNumberToFind.replace(/\D/g, ''),
                                ];

                                const digitsOnly = phoneNumberToFind.replace(/\D/g, '');
                                if (digitsOnly.length >= 9 && !digitsOnly.startsWith('593')) {
                                    phoneVariants.push(`+593${digitsOnly}`);
                                    phoneVariants.push(`593${digitsOnly}`);
                                }

                                for (const cardDoc of allCardsSnap.docs) {
                                    const cData = cardDoc.data();
                                    const cPhone = cData.contactNumber || '';
                                    if (phoneVariants.some(v => v.replace(/\D/g, '') === cPhone.replace(/\D/g, ''))) {
                                        cardSnap = cardDoc;
                                        cardRef = cardDoc.ref;
                                        break;
                                    }
                                }
                            }

                            if (cardSnap && cardSnap.exists() && cardRef) {
                                console.log('[useConversationLogic] ✅ Match Found in Group:', group.name);

                                // Subscribe
                                const unsub = onSnapshot(cardRef, (docSnap) => {
                                    if (!isMounted) return;
                                    if (docSnap.exists()) {
                                        const data = docSnap.data() as CardData;
                                        console.log('[useConversationLogic] 📡 Real-time Update (Search Match):', docSnap.id, 'Messages:', data.messages?.length);
                                        setLiveCardData({ ...data, id: docSnap.id, groupId: group.id });

                                        // Update stable refs
                                        setForcedCardId(docSnap.id);
                                        setForcedGroupId(group.id);
                                    }
                                }, (err) => console.error('Snapshot Error:', err));

                                if (isMounted) {
                                    if (unsubscribe) unsubscribe(); // Cancel previous if any
                                    unsubscribe = unsub;
                                } else {
                                    unsub();
                                }
                                return true;
                            }

                        } catch (e) {
                            if (isMounted) console.warn('Group search error:', e);
                        }
                    }
                    return false;
                };

                // Execute Search
                const isTempId = card.id?.startsWith('temp-');
                const phoneToSearch = card.contactNumber || (card as any).phone;

                let found = false;
                if (!isTempId) found = await findAndSubscribe(card.id, phoneToSearch);
                if (!found && phoneToSearch && isMounted) found = await findAndSubscribe(undefined, phoneToSearch);

                if (!found && isMounted) {
                    console.log('[useConversationLogic] ⚠️ No card found. Running in detached mode.');
                }

            } catch (error) {
                if (isMounted) console.error("Error in initLogic:", error);
            }
        };

        initLogic();

        // CRM Sync Logic (Separate listener)
        const initCRM = async () => {
            const phone = card?.contactNumber || (card as any)?.phone;

            // ... Logic to decide target ID ...
            // Simplified: just match by phone if ID is temp or missing, else use ID
            let targetId = (card?.id && !card.id.startsWith('temp-') && (card as any).contactId) || null;
            // Actually, we trust card.id if it's not temp. But let's stick to the robust logic: if we have a contactId, use it.

            if (card?.id && !card.id.startsWith('temp-') && (card as any).contactId) {
                targetId = (card as any).contactId;
            }

            // If we don't have a contact ID yet, try to find one by phone
            if (!targetId && phone) {
                const digits = phone.replace(/\D/g, '');
                const crmQuery = query(collection(db, 'contacts'), where('phone', 'in', [`+${digits}`, digits]));
                const snap = await getDocs(crmQuery);
                if (!snap.empty) targetId = snap.docs[0].id;
            }

            if (targetId && isMounted) {
                const unsub = onSnapshot(doc(db, 'contacts', targetId), (snap) => {
                    if (!isMounted) return;
                    if (snap.exists()) {
                        const data = snap.data();
                        setCrmData(data);
                        setContactInfo(prev => ({
                            ...prev,
                            ...data,
                            id: snap.id,
                            contactName: data.name || prev.contactName,
                            contactNumber: data.phone || prev.contactNumber
                        }));
                    }
                });
                unsubscribeCRM = unsub;
            }
        };

        initCRM();

        return () => {
            console.log('[useConversationLogic] 🧹 Cleaning up listeners');
            isMounted = false;
            if (unsubscribe) unsubscribe();
            if (unsubscribeCRM) unsubscribeCRM();
        };
    }, [card?.id, card?.groupId, groups, card?.contactNumber, forcedCardId, forcedGroupId]);

    useEffect(() => {
        if (!isEditing && liveCardData) {
            setContactInfo(prev => {
                // Base is the current contactInfo (which might have CRM data)
                // Overwrite with liveCardData (Kanban) ONLY if the Kanban field is NOT empty
                // OR if we don't have CRM data for that field.
                // Helper to decide value: prefer CRM (Source of Truth), else fallback to liveCardData
                const merge = (key: keyof CardData, defaultVal: any = '') => {
                    const kanbanVal = liveCardData[key];
                    const crmVal = (crmData as any)?.[key];

                    // CRM IS THE SINGLE SOURCE OF TRUTH
                    // If CRM has value, ALWAYS use it.
                    if (crmVal !== undefined && crmVal !== null && crmVal !== '') return crmVal;

                    // Fallback to Kanban if CRM is empty for this field
                    if (kanbanVal !== undefined && kanbanVal !== null && kanbanVal !== '') return kanbanVal;

                    return defaultVal;
                };

                return {
                    ...prev,
                    ...liveCardData, // Start with all liveCardData
                    // Now patch specific fields to ensure we don't lose CRM data if liveCardData has them empty
                    birthDate: merge('birthDate'),
                    birthPlace: merge('birthPlace'),
                    nationality: merge('nationality'),
                    birthCity: merge('birthCity'),
                    birthState: merge('birthState'),
                    birthCountry: merge('birthCountry'),
                    nationalId: merge('nationalId'),

                    // Pasaporte
                    passportNumber: merge('passportNumber'),
                    passportCountry: merge('passportCountry'),
                    passportCity: merge('passportCity'),
                    passportState: merge('passportState'),
                    passportIssuedDate: merge('passportIssuedDate'),
                    passportExpiryDate: merge('passportExpiryDate'),

                    // Address
                    address: merge('address'),
                    city: merge('city'),
                    state: merge('state'),
                    country: merge('country'),
                    postalCode: merge('postalCode'),

                    // Ensure vital fields
                    contactName: merge('contactName'),
                    company: merge('company'),
                    email: merge('email'),
                    website: merge('website'),

                    notes: liveCardData.notes || [],
                    socials: liveCardData.socials || {},
                };
            });
        }
    }, [liveCardData, isEditing, crmData]);

    // Auto-scroll only when new messages are added, not when scrolling history
    const prevMessageCountRef = useRef<number>(0);
    useEffect(() => {
        const currentCount = liveCardData?.messages?.length || 0;
        if (currentCount > prevMessageCountRef.current) {
            // Only scroll if message count increased (new message added)
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessageCountRef.current = currentCount;
    }, [liveCardData?.messages]);

    // Handlers
    const toggleChecklistItem = async (item: string) => {
        if (!currentCardId || !currentGroupId) return;
        const newStatus = !liveCardData?.checklistStatus?.[item];
        const updatedChecklistStatus = { ...(liveCardData?.checklistStatus || {}), [item]: newStatus };
        setLiveCardData(prev => prev ? ({ ...prev, checklistStatus: updatedChecklistStatus }) : null);
        try {
            const historyEvent = {
                id: `hist_${Date.now()}`,
                type: 'checklist',
                content: `${newStatus ? 'Completado' : 'Pendiente'}: ${item}`,
                timestamp: Timestamp.now(),
                author: 'Agente'
            };
            await updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                checklistStatus: updatedChecklistStatus,
                history: arrayUnion(historyEvent)
            });
        } catch (error) {
            console.error("Error updating checklist:", error);
            toast.error("Error al actualizar el checklist");
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        // Validate we have a phone number
        const rawPhone = liveCardData?.contactNumber || card?.contactNumber;
        const phoneNumber = normalizePhoneNumber(rawPhone || '');

        if (!phoneNumber) {
            toast.error('No se puede enviar: falta el número de teléfono del contacto.');
            return;
        }

        setIsSending(true);

        const tempMessage: Message = {
            text: newMessage,
            sender: 'agent',
            timestamp: Timestamp.now()
        };

        // 1. Optimistic UI Update (Visual only, no DB write to avoid duplicates)
        setLiveCardData(prev => {
            if (!prev) return {
                // If it's a new card (null state), create a temporary state
                ...card as any,
                id: currentCardId || 'temp', // Use currentCardId if available (even if temp)
                messages: [tempMessage]
            };
            return {
                ...prev,
                messages: [...(prev.messages || []), tempMessage]
            };
        });

        const messageToSend = newMessage;
        setNewMessage(''); // Clear input immediately

        try {
            // 2. Send via API
            const apiCardId = currentCardId?.startsWith('temp-') ? undefined : currentCardId;

            let payload: any = {
                message: messageToSend,
                toNumber: phoneNumber,
                cardId: apiCardId,
                groupId: currentGroupId
            };

            // If outside 24h window, send as Template
            if (!isWithin24Hours) {
                console.log('[useConversationLogic] 🕒 Outside 24h window. Sending as Template: custom_message');
                payload = {
                    ...payload,
                    type: 'template',
                    template: {
                        name: 'custom_message',
                        language: { code: 'es' },
                        components: [
                            {
                                type: 'body',
                                parameters: [
                                    { type: 'text', text: messageToSend }
                                ]
                            }
                        ]
                    }
                };
            }

            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[ConversationModal] API Error Response:', errorData);

                // Show specific error message with details
                const errorMessage = errorData.suggestion || errorData.error || 'Failed to send';
                const errorDetails = errorData.details ? JSON.stringify(errorData.details) : '';

                console.error('[ConversationModal] Error details:', errorDetails);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('[ConversationModal] ✅ Message sent successfully:', result);

            // Only show success if we actually got a success response
            if (result.success) {
                toast.success(`Mensaje enviado a ${result.sentTo}`);
            } else {
                throw new Error('API returned non-success response');
            }

            // CRITICAL: Update source of truth if we just created/connected a card
            if (result.cardId && result.groupId) {
                if (result.cardId !== currentCardId || result.groupId !== currentGroupId) {
                    console.log('🔗 Linking to real Kanban Card:', result.cardId);
                    setForcedGroupId(result.groupId);
                    setForcedCardId(result.cardId);
                }
            }

        } catch (error: any) {
            console.error('Error sending message:', error);

            let displayMsg = 'Error al enviar el mensaje.';
            if (typeof error === 'string') {
                displayMsg = error;
            } else if (error instanceof Error) {
                displayMsg = error.message;
            } else if (error && typeof error === 'object') {
                displayMsg = (error as any).suggestion || (error as any).message || (error as any).error || JSON.stringify(error);
            }

            toast.error(displayMsg);

            // Rollback optimistic update if needed
            setLiveCardData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    messages: prev.messages?.filter(m => m !== tempMessage)
                };
            });
            setNewMessage(messageToSend); // Restore text
        } finally {
            setIsSending(false);
        }
    };

    const sendTemplateMessage = async (templateName: string = 'hello_world') => {
        const rawPhone = liveCardData?.contactNumber || card?.contactNumber;
        const phoneNumber = normalizePhoneNumber(rawPhone || '');

        if (!phoneNumber) {
            toast.error('No se puede enviar: falta el número de teléfono.');
            return;
        }

        setIsSending(true);
        const tempMsg: Message = {
            text: `[PLANTILLA] ${templateName}`,
            sender: 'agent',
            timestamp: Timestamp.now()
        };

        // Optimistic
        setLiveCardData(prev => {
            if (!prev) return { ...card as any, id: currentCardId || 'temp', messages: [tempMsg] };
            return { ...prev, messages: [...(prev.messages || []), tempMsg] };
        });

        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Plantilla enviada: ${templateName}`,
                    toNumber: phoneNumber,
                    cardId: currentCardId?.startsWith('temp-') ? undefined : currentCardId,
                    groupId: currentGroupId,
                    type: 'template',
                    template: { name: templateName, language: { code: templateName === 'hello_world' ? 'en_US' : 'es' } }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }

            const result = await response.json();
            if (result.success) {
                toast.success('Plantilla enviada correctamente');
                if (result.cardId && result.groupId) {
                    setForcedGroupId(result.groupId);
                    setForcedCardId(result.cardId);
                }
            }
        } catch (error: any) {
            console.error('Template Send Error:', error);
            // Try to parse the real error from the response if possible, or use the thrown message
            let errMsg = 'Error al enviar plantilla';
            if (error.message && error.message.includes('{')) {
                try {
                    const parsed = JSON.parse(error.message);
                    errMsg = parsed.suggestion || parsed.error || errMsg;
                } catch (e) { }
            }
            toast.error(errMsg);
            setLiveCardData(prev => prev ? ({ ...prev, messages: prev.messages?.filter(m => m !== tempMsg) }) : null);
        } finally {
            setIsSending(false);
        }
    };

    const handleInfoSave = async () => {
        // We allow update if we have at least a phone number, to update CRM
        // We use the ORIGINAL phone number to find the contact, even if it's being edited
        const rawPhone = liveCardData?.contactNumber || card?.contactNumber;
        const originalPhone = normalizePhoneNumber(rawPhone || '');
        if (!originalPhone) return;

        try {
            // 1. Update Kanban Card if it exists (Real ID)
            if (currentCardId && currentGroupId && !currentCardId.startsWith('temp-')) {
                await updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), contactInfo);
            }

            // 2. Update CRM Contacts (Always)
            // Robust Query: Find contact by both formats (+digits and plain digits)
            const cleanDigits = originalPhone.replace(/\D/g, '');
            const withPlus = `+${cleanDigits}`;
            const withoutPlus = cleanDigits;

            const contactsQuery = query(collection(db, 'contacts'), where('phone', 'in', [withPlus, withoutPlus]));
            const contactsSnapshot = await getDocs(contactsQuery);
            let contactId = contactInfo.id;

            if (!contactsSnapshot.empty) {
                contactId = contactsSnapshot.docs[0].id;
                for (const cDoc of contactsSnapshot.docs) {
                    await updateDoc(cDoc.ref, {
                        ...contactInfo, // Spread existing info

                        // Explicitly Map Nested/Complex Fields to ensure they are saved
                        // Identity
                        birthDate: contactInfo.birthDate || '',
                        birthPlace: contactInfo.birthPlace || '',
                        nationality: contactInfo.nationality || '',
                        birthCity: contactInfo.birthCity || '',
                        birthState: contactInfo.birthState || '',
                        birthCountry: contactInfo.birthCountry || '',
                        nationalId: contactInfo.nationalId || '',

                        // Passport
                        passportNumber: contactInfo.passportNumber || '',
                        passportCountry: contactInfo.passportCountry || '',
                        passportCity: contactInfo.passportCity || '',
                        passportState: contactInfo.passportState || '',
                        passportIssuedDate: contactInfo.passportIssuedDate || '',
                        passportExpiryDate: contactInfo.passportExpiryDate || '',

                        // Address
                        address: contactInfo.address || '',
                        city: contactInfo.city || '',
                        state: contactInfo.state || '',
                        country: contactInfo.country || '',
                        postalCode: contactInfo.postalCode || '',

                        // Family
                        spouseName: contactInfo.spouseName || '',
                        spouseBirthDate: contactInfo.spouseBirthDate || '',
                        marriageDate: contactInfo.marriageDate || '',
                        fatherName: contactInfo.fatherName || '',
                        fatherBirthDate: contactInfo.fatherBirthDate || '',
                        motherName: contactInfo.motherName || '',
                        motherBirthDate: contactInfo.motherBirthDate || '',

                        // Education
                        schoolName: contactInfo.schoolName || '',
                        schoolProgram: contactInfo.schoolProgram || '',
                        universityName: contactInfo.universityName || '',
                        universityProgram: contactInfo.universityProgram || '',

                        // Employment
                        company: contactInfo.company || '',
                        occupation: contactInfo.occupation || '',
                        currentEmployer: contactInfo.currentEmployer || '',
                        monthlySalary: contactInfo.monthlySalary || '',

                        // Essential
                        name: contactInfo.contactName || cDoc.data().name || '',
                        firstName: contactInfo.firstName || cDoc.data().firstName || '',
                        lastName: contactInfo.lastName || cDoc.data().lastName || '',
                        email: contactInfo.email || cDoc.data().email || '',
                        // Keep current format or use the one from input
                        phone: contactInfo.contactNumber ? normalizePhoneNumber(contactInfo.contactNumber) : cDoc.data().phone,
                        lastUpdated: serverTimestamp()
                    });
                }
            } else {
                // CREATE NEW CRM CONTACT
                const cleanPhone = normalizePhoneNumber(originalPhone);
                const newContact = {
                    ...contactInfo,
                    name: contactInfo.contactName || 'Nuevo Cliente',
                    phone: cleanPhone,
                    createdAt: serverTimestamp(),
                    lastUpdated: serverTimestamp(),
                    source: 'chat_restored'
                };
                const docRef = await addDoc(collection(db, 'contacts'), newContact);
                contactId = docRef.id;
                console.log('[handleInfoSave] Created new CRM contact:', contactId);
            }

            // 3. Log to History
            if (currentCardId && currentGroupId && !currentCardId.startsWith('temp-')) {
                const changes: any[] = [];
                const fieldLabels: Record<string, string> = {
                    contactName: 'Nombre',
                    contactNumber: 'Teléfono',
                    email: 'Email',
                    company: 'Empresa',
                    city: 'Ciudad',
                    profession: 'Profesión',
                    address: 'Dirección',
                    postalCode: 'Código Postal',
                    gender: 'Género',
                    birthDate: 'Fecha de Nacimiento',
                    website: 'Sitio Web',
                    passport: 'Pasaporte/DNI',
                    clientType: 'Tipo de Cliente',
                    occupation: 'Ocupación',
                    interests: 'Intereses',
                    serviceType: 'Tipo de Servicio',
                    paymentStatus: 'Estado de Pago',
                    serviceDetails: 'Detalles del Servicio',
                    backupLink: 'Link de Respaldo',
                    contractLink: 'Link de Contrato',
                    invoiceLink: 'Link de Factura'
                };

                Object.keys(fieldLabels).forEach(key => {
                    const newValue = (contactInfo as any)[key];
                    const oldValue = (liveCardData as any)?.[key];

                    if (newValue !== undefined && newValue !== oldValue) {
                        changes.push({
                            field: fieldLabels[key],
                            page: 'Perfil de Contacto',
                            old: oldValue || '(vacío)',
                            new: newValue || '(vacío)'
                        });
                    }
                });

                if (changes.length > 0) {
                    const historyEvent: any = {
                        id: `hist_${Date.now()}`,
                        type: 'edit',
                        content: 'Datos de contacto actualizados',
                        details: changes,
                        timestamp: Timestamp.now(),
                        author: 'Agente'
                    };
                    await updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                        history: arrayUnion(historyEvent)
                    });
                }
            }

            toast.success('Información actualizada.');
            setIsEditing(false);
            return contactId;
        } catch (error) {
            console.error("Error saving information:", error);
            toast.error('No se pudo actualizar.');
            return null;
        }
    };

    const handleSaveNote = async () => {
        if (!newNote.trim() || !currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) {
            toast.error("Necesitas enviar un mensaje primero para crear la tarjeta.");
            return;
        }
        const noteObject: Note = {
            id: `note_${Date.now()}`,
            text: newNote,
            author: 'Agente',
            timestamp: Timestamp.now()
        };
        const historyEvent = {
            id: `hist_${Date.now()}`,
            type: 'comment',
            content: `Nota agregada: ${newNote.substring(0, 50)}${newNote.length > 50 ? '...' : ''}`,
            timestamp: Timestamp.now(),
            author: 'Agente'
        };
        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                notes: arrayUnion(noteObject),
                history: arrayUnion(historyEvent)
            }),
            {
                loading: 'Guardando nota...',
                success: () => { setNewNote(''); setIsAddingNote(false); return 'Nota guardada.'; },
                error: 'Error al guardar la nota.',
            }
        );
    };

    const handleSaveCheckIn = async (customText?: string) => {
        const textToSave = (typeof customText === 'string' && customText) ? customText : newCheckIn;
        if (!textToSave || !textToSave.trim() || !currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) {
            toast.error("Necesitas enviar un mensaje primero para crear la tarjeta.");
            return;
        }
        const checkInObject = { id: `checkin_${Date.now()}`, text: textToSave, author: 'Agente', timestamp: Timestamp.now() };
        const historyEvent = {
            id: `hist_${Date.now()}`,
            type: 'status',
            content: `Tarea creada: ${textToSave}`,
            timestamp: Timestamp.now(),
            author: 'Agente'
        };
        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                checkIns: arrayUnion(checkInObject),
                history: arrayUnion(historyEvent)
            }),
            {
                loading: 'Guardando tarea...',
                success: () => { setNewCheckIn(''); setIsAddingCheckIn(false); return 'Tarea guardada'; },
                error: 'Error al guardar la tarea'
            }
        );
    };

    const handleSavePaymentMethod = async () => {
        if (!currentCardId || !currentGroupId || !newPayment.last4 || currentCardId.startsWith('temp-')) {
            toast.error("Por favor completa los datos básicos o inicia una conversación primero");
            return;
        }
        const paymentMethodObject = {
            id: `pm_${Date.now()}`,
            ...newPayment,
            isDefault: (liveCardData?.paymentMethods?.length || 0) === 0
        };
        const historyEvent = {
            id: `hist_${Date.now()}`,
            type: 'payment',
            content: `Nuevo método de pago: ${newPayment.type.toUpperCase()} (****${newPayment.last4})`,
            details: {
                type: newPayment.type,
                brand: newPayment.brand,
                last4: newPayment.last4,
                expiry: newPayment.expiry
            },
            timestamp: Timestamp.now(),
            author: 'Agente'
        };
        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                paymentMethods: arrayUnion(paymentMethodObject),
                history: arrayUnion(historyEvent)
            }),
            {
                loading: 'Guardando método de pago...',
                success: () => {
                    setIsAddingPayment(false);
                    setNewPayment({ type: 'visa', last4: '', expiry: '', brand: '' });
                    return 'Método de pago guardado correctamente';
                },
                error: 'Error al guardar el método de pago',
            }
        );
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!currentCardId || !currentGroupId || !confirm('¿Realmente quieres eliminar esta nota?')) return;
        const historyEvent = {
            id: `hist_${Date.now()}`,
            type: 'system',
            content: `Nota eliminada`,
            timestamp: Timestamp.now(),
            author: 'Agente'
        };
        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                notes: liveCardData?.notes?.filter((n) => n.id !== noteId) || [],
                history: arrayUnion(historyEvent)
            }),
            { loading: 'Eliminando nota...', success: 'Nota eliminada correctamente', error: 'Error al eliminar la nota' }
        );
    };

    const handleDeleteCheckIn = async (checkInId: string) => {
        if (!currentCardId || !currentGroupId || !confirm('¿Realmente quieres eliminar este check-in?')) return;
        const historyEvent = {
            id: `hist_${Date.now()}`,
            type: 'system',
            content: `Tarea eliminada`,
            timestamp: Timestamp.now(),
            author: 'Agente'
        };
        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                checkIns: liveCardData?.checkIns?.filter((c) => c.id !== checkInId) || [],
                history: arrayUnion(historyEvent)
            }),
            { loading: 'Eliminando check-in...', success: 'Check-in eliminado correctamente', error: 'Error al eliminar the check-in' }
        );
    };

    const handleSaveEditedNote = async () => {
        if (!currentCardId || !currentGroupId || !editingNoteId || !editText.trim()) return;
        const updatedNotes = liveCardData?.notes?.map(n => n.id === editingNoteId ? { ...n, text: editText } : n) || [];
        const historyEvent = {
            id: `hist_${Date.now()}`,
            type: 'edit',
            content: `Nota editada`,
            timestamp: Timestamp.now(),
            author: 'Agente'
        };
        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                notes: updatedNotes,
                history: arrayUnion(historyEvent)
            }),
            { loading: 'Guardando cambios...', success: () => { setEditingNoteId(null); setEditText(''); return 'Nota actualizada.'; }, error: 'Error al actualizar.' }
        );
    };

    const handleSaveEditedCheckIn = async () => {
        if (!currentCardId || !currentGroupId || !editingCheckInId || !editText.trim()) return;
        const updatedCheckIns = liveCardData?.checkIns?.map(c => c.id === editingCheckInId ? { ...c, text: editText } : c) || [];
        const historyEvent = {
            id: `hist_${Date.now()}`,
            type: 'edit',
            content: `Tarea editada`,
            timestamp: Timestamp.now(),
            author: 'Agente'
        };
        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                checkIns: updatedCheckIns,
                history: arrayUnion(historyEvent)
            }),
            { loading: 'Guardando check-in...', success: () => { setEditingCheckInId(null); setEditText(''); return 'Check-in actualizado.'; }, error: 'Error al actualizar.' }
        );
    };

    const handleToggleCheckIn = async (checkIn: CheckIn) => {
        if (!currentCardId || !currentGroupId) return;
        const item = liveCardData?.checkIns?.find(c => c.id === checkIn.id);
        const newStatus = !item?.completed;
        const updatedCheckIns = liveCardData?.checkIns?.map(c => c.id === checkIn.id ? { ...c, completed: newStatus } : c) || [];
        try {
            const historyEvent = {
                id: `hist_${Date.now()}`,
                type: 'status',
                content: `${newStatus ? 'Tarea completada' : 'Tarea pendiente'}: ${item?.text}`,
                timestamp: Timestamp.now(),
                author: 'Agente'
            };
            await updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                checkIns: updatedCheckIns,
                history: arrayUnion(historyEvent)
            });
        } catch (error) {
            console.error("Error toggling check-in:", error);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!card || acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFilePreviewUrl(url);
        } else {
            setFilePreviewUrl(null);
        }
    }, [card]);

    const handleDisplayFileSend = async () => {
        if (!selectedFile || !liveCardData?.contactNumber) return;
        // NOTE: We need a real card ID to attach file. 
        if (!currentCardId || currentCardId.startsWith('temp-')) {
            toast.error('Envía un mensaje de texto primero para iniciar la conversación.');
            return;
        }
        await uploadFile(selectedFile, { cardId: currentCardId, groupId: currentGroupId!, toNumber: liveCardData.contactNumber });
        if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        setSelectedFile(null);
        setFilePreviewUrl(null);
    };

    const handleCancelPreview = () => {
        if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        setSelectedFile(null);
        setFilePreviewUrl(null);
    };

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

    const handleSaveHistoryComment = async () => {
        if (!newHistoryComment.trim() || !currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) {
            toast.error("Inicia una conversación primero para guardar comentarios.");
            return;
        }

        const commentEvent = {
            id: `hist_${Date.now()}`,
            type: 'comment',
            content: newHistoryComment,
            timestamp: Timestamp.now(),
            author: 'Agente'
        };

        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                history: arrayUnion(commentEvent)
            }),
            {
                loading: 'Guardando comentario...',
                success: () => {
                    setNewHistoryComment('');
                    return 'Comentario guardado';
                },
                error: 'Error al guardar el comentario'
            }
        );
    };

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContactInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const onEmojiClick = (emojiData: any) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    const handleEditNote = (note: Note) => {
        setEditingNoteId(note.id);
        setEditText(note.text);
    };

    const handleSaveMute = async (duration: string | null) => {
        if (!currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) return;

        let mutedUntil: Timestamp | null = null;
        if (duration) {
            const now = new Date();
            if (duration === '8h') now.setHours(now.getHours() + 8);
            if (duration === '1w') now.setDate(now.getDate() + 7);
            if (duration === 'always') now.setFullYear(now.getFullYear() + 100);
            mutedUntil = Timestamp.fromDate(now);
        }

        const historyEvent = {
            id: `hist_${Date.now()}`,
            type: 'system',
            content: duration ? `Notificaciones silenciadas por ${duration}` : 'Notificaciones reactivadas',
            timestamp: Timestamp.now(),
            author: 'Agente'
        };

        toast.promise(
            updateDoc(doc(db, 'kanban-groups', currentGroupId, 'cards', currentCardId), {
                mutedUntil,
                history: arrayUnion(historyEvent)
            }),
            {
                loading: 'Actualizando silencio...',
                success: duration ? 'Notificaciones silenciadas.' : 'Notificaciones activadas.',
                error: 'Error al actualizar.'
            }
        );
    };

    const handleEditCheckIn = (checkIn: CheckIn) => {
        setEditingCheckInId(checkIn.id);
        setEditText(checkIn.text);
    };

    const groupedMessages = useMemo(() => groupMessagesByDate(liveCardData?.messages || []), [liveCardData?.messages]);

    const isMessageRead = useCallback((msg: Message) =>
        liveCardData?.lastReadAt && msg.timestamp
            ? msg.timestamp.seconds <= liveCardData.lastReadAt.seconds
            : false, [liveCardData?.lastReadAt]);

    const currentPlatform = useMemo(() => socialPlatforms.find(p => p.name === activePlatform) || socialPlatforms[0], [activePlatform]);

    return {
        liveCardData, // Note: This might be null if card is not found yet, which is expected for new contacts
        newMessage,
        setNewMessage,
        isSending,
        contactInfo: {
            ...contactInfo,
            id: crmData?.id || contactInfo.id // Prioritize CRM ID
        },
        setContactInfo,
        currentCardId,
        crmId: crmData?.id || contactInfo.id,
        activeTab,
        setActiveTab,
        activePlatform,
        setActivePlatform,
        isWithin24Hours,
        isEditing,
        setIsEditing,
        previewFile,
        setPreviewFile,
        isAddingNote,
        setIsAddingNote,
        newNote,
        setNewNote,
        isAddingCheckIn,
        setIsAddingCheckIn,
        newCheckIn,
        setNewCheckIn,
        selectedFile,
        filePreviewUrl,
        editingNoteId,
        setEditingNoteId,
        editingCheckInId,
        setEditingCheckInId,
        editText,
        setEditText,
        isAddingPayment,
        setIsAddingPayment,
        newPayment,
        setNewPayment,
        messagesEndRef,
        uploading,
        progress,
        currentGroupName,
        checklistProgress,
        handleSendMessage,
        handleInfoSave,
        handleSaveNote,
        handleSaveCheckIn,
        handleSavePaymentMethod,
        handleDeleteNote,
        handleDeleteCheckIn,
        handleSaveEditedNote,
        handleSaveEditedCheckIn,
        handleToggleCheckIn,
        handleDisplayFileSend,
        handleCancelPreview,
        getRootProps,
        getInputProps,
        isDragActive,
        open,
        handleInfoChange,
        onEmojiClick,
        toggleChecklistItem,
        groupedMessages,
        isMessageRead,
        sendTemplateMessage,
        currentPlatform,
        handleEditNote,
        handleEditCheckIn,
        handleSaveMute,
        newHistoryComment,
        setNewHistoryComment,
        handleSaveHistoryComment
    };
};
