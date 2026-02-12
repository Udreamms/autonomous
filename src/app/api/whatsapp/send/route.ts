import { NextResponse } from 'next/server';
import axios from 'axios';
import { db, admin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const bodyValue = await req.json();
        const { message, toNumber, cardId, groupId, type, template } = bodyValue;

        if (!message || !toNumber) {
            return NextResponse.json(
                { error: 'Missing required fields: message and toNumber' },
                { status: 400 }
            );
        }

        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        console.log('[WhatsApp API] =================================');
        console.log('[WhatsApp API] Debug Env Vars:');
        console.log(`[WhatsApp API] Token: ${token ? 'Present' : 'MISSING'} (${typeof token}) length=${token?.length}`);
        console.log(`[WhatsApp API] PhoneID: ${phoneNumberId ? 'Present' : 'MISSING'} (${typeof phoneNumberId}) length=${phoneNumberId?.length}`);
        console.log('[WhatsApp API] NODE_ENV:', process.env.NODE_ENV);
        console.log('[WhatsApp API] =================================');

        if (!token || !phoneNumberId) {
            console.error('[WhatsApp API] CRITICAL: Environment variables NOT found!');
            console.error('[WhatsApp API] Please check your .env.local file has:');
            console.error('[WhatsApp API] - WHATSAPP_ACCESS_TOKEN');
            console.error('[WhatsApp API] - WHATSAPP_PHONE_NUMBER_ID');
            return NextResponse.json(
                {
                    error: 'Server configuration error: Missing WhatsApp credentials',
                    suggestion: 'El administrador debe configurar las credenciales de WhatsApp en el servidor.'
                },
                { status: 500 }
            );
        }

        const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

        // Universal Normalization: Meta API expects digits only (including country code)
        let cleanTo = toNumber.replace(/\D/g, '');

        // Safety: If it's a local number without country code (common in basic UIs), 
        // we keep it as is and let Meta return an error if it's invalid, 
        // BUT we log it clearly to assist debugging.
        if (cleanTo.length < 10) {
            console.warn(`[WhatsApp API Trace] Warning: Number seems too short for international format: ${cleanTo}`);
        }

        console.log(`[WhatsApp API Trace] Destination: ${cleanTo} (from raw: ${toNumber})`);

        // Prepare WhatsApp Payload
        let payload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanTo,
        };


        if (type === 'template' && template) {
            console.log('[WhatsApp API] Sending TEMPLATE message');
            payload.type = 'template';
            payload.template = {
                name: template.name,
                language: {
                    code: template.language?.code || 'es'
                },
                components: template.components || []
            };
        } else {
            // Default to Text
            payload.type = 'text';
            payload.text = {
                preview_url: false,
                body: message,
            };
        }

        // 1. Send to WhatsApp
        let response;
        try {
            console.log(`[WhatsApp API] Sending POST to Meta v19.0...`);
            console.log(`[WhatsApp API] URL: ${url}`);
            console.log(`[WhatsApp API] Payload:`, JSON.stringify(payload, null, 2));
            console.log(`[WhatsApp API] Token (first 20 chars): ${token.substring(0, 20)}...`);

            response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => true, // Accept all status codes to debug full response
                timeout: 10000
            });
            console.log(`[WhatsApp API Trace] Response Status:`, response.status);
            console.log(`[WhatsApp API Trace] Response Data:`, JSON.stringify(response.data, null, 2));

            if (response.status >= 400) {
                throw new Error(JSON.stringify(response.data));
            }

            console.log(`[WhatsApp API] ✅ SUCCESS! Message ID:`, response.data?.messages?.[0]?.id);
        } catch (apiError: any) {
            const errorBody = apiError.response?.data || apiError.message;
            console.error(`[WhatsApp API] ❌ FAILED to send message`);
            console.error(`[WhatsApp API] Error:`, JSON.stringify(errorBody, null, 2));
            console.error(`[WhatsApp API] Status:`, apiError.response?.status);

            // Map common Meta errors to helpful suggestions
            let suggestion = 'Verifica que el número tenga código de país y que el token sea vigente.';
            const errorCode = errorBody?.error?.code;
            const errorMessage = errorBody?.error?.message || 'Unknown error';

            console.error(`[WhatsApp API] Error Code:`, errorCode);
            console.error(`[WhatsApp API] Error Message:`, errorMessage);

            if (errorCode === 131030) {
                suggestion = 'La ventana de 24 horas está cerrada. El cliente debe enviarte un mensaje primero antes de que puedas responder con texto libre.';
            } else if (errorCode === 131026) {
                suggestion = 'El número de teléfono no es válido o no está registrado en WhatsApp.';
            } else if (errorCode === 190) {
                suggestion = 'El Token de acceso ha expirado o es inválido. Por favor, actualiza WHATSAPP_ACCESS_TOKEN en el .env.';
            } else if (errorCode === 100) {
                suggestion = 'Parámetros inválidos. Verifica el formato del número de teléfono.';
            } else if (errorCode === 132001) {
                suggestion = 'La plantilla "custom_message" no existe en tu cuenta de Meta. Debes crearla en el Administrador de WhatsApp.';
            }

            return NextResponse.json(
                {
                    error: 'Meta API Error',
                    details: errorBody,
                    suggestion: suggestion,
                    errorCode: errorCode,
                    errorMessage: errorMessage
                },
                { status: 502 }
            );
        }

        const wa_id = response.data?.messages?.[0]?.id;

        // 2. Log in Firestore
        // If cardId and groupId are provided, update existing card
        // Otherwise, find or create a card for this contact
        let finalCardId = cardId;
        let finalGroupId = groupId;

        if (!finalCardId || !finalGroupId) {
            console.log('[WhatsApp API] No card/group provided, searching for existing card by phone...');

            // Search for existing card by phone number across all groups
            const groupsSnapshot = await db.collection('kanban-groups').orderBy('order', 'asc').get();
            let foundCard: any = null;
            let foundGroupId: string | null = null;

            for (const groupDoc of groupsSnapshot.docs) {
                const cardsSnapshot = await groupDoc.ref.collection('cards').get();
                for (const cardDoc of cardsSnapshot.docs) {
                    const cardData = cardDoc.data();
                    const cardPhone = (cardData.contactNumber || '').replace(/\D/g, '');
                    if (cardPhone === cleanTo) {
                        foundCard = cardDoc;
                        foundGroupId = groupDoc.id;
                        break;
                    }
                }
                if (foundCard) break;
            }

            if (foundCard) {
                console.log('[WhatsApp API] Found existing card:', foundCard.id);
                finalCardId = foundCard.id;
                finalGroupId = foundGroupId;
            } else {
                // Create new card in first group
                console.log('[WhatsApp API] Creating new card in first group...');
                const firstGroup = groupsSnapshot.docs[0];
                if (!firstGroup) {
                    return NextResponse.json(
                        { error: 'No Kanban groups found. Please create at least one group.' },
                        { status: 500 }
                    );
                }

                finalGroupId = firstGroup.id;
                const newCardRef = firstGroup.ref.collection('cards').doc();
                finalCardId = newCardRef.id;

                await newCardRef.set({
                    contactNumber: toNumber,
                    contactNumberClean: cleanTo, // Store clean number
                    contactName: 'Nuevo Contacto',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    messages: [],
                    lastMessage: '',
                });
                console.log('[WhatsApp API] Created new card:', finalCardId);
            }
        }

        // Update the card with the new message
        const cardRef = db.collection('kanban-groups').doc(finalGroupId).collection('cards').doc(finalCardId);

        await cardRef.update({
            lastMessage: message.length > 40 ? message.substring(0, 37) + '...' : message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            contactNumberClean: cleanTo, // Self-healing
            messages: admin.firestore.FieldValue.arrayUnion({
                sender: 'agent',
                text: message,
                timestamp: new Date(),
                whatsappMessageId: wa_id || null,
            }),
        });

        return NextResponse.json({
            success: true,
            data: response.data,
            messageId: wa_id,
            sentTo: cleanTo,
            cardId: finalCardId,
            groupId: finalGroupId
        });
    } catch (error: any) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return NextResponse.json(
            {
                error: 'Failed to send message',
                details: error.response?.data || error.message,
            },
            { status: 500 }
        );
    }
}
