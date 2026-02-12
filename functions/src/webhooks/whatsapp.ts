// src/webhooks/whatsapp.ts
import * as functions from 'firebase-functions';
import { handleKanbanUpdate, updateReadStatus } from '../helpers/kanban';
import { getActiveBot, executeBotFlow } from '../helpers/botEngine';

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

export const whatsappWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // --- VERIFICACIÓN DE WEBHOOK (GET) ---
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Puedes cambiar 'royalty_token_2026' por el que tengas configurado en Meta
        const VERIFY_TOKEN = functions.config().whatsapp?.verify_token || 'royalty_token_2026';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            functions.logger.info('Webhook Verified Successfully (GET)');
            res.status(200).send(challenge);
            return;
        } else {
            functions.logger.warn('Webhook Verification Failed (GET)');
            res.sendStatus(403);
            return;
        }
    }

    // --- RECEPCIÓN DE EVENTOS (POST) ---
    if (req.method === 'POST') {
        // Responder rápido a Meta para evitar reintentos
        res.status(200).send('EVENT_RECEIVED');

        const { entry } = req.body;
        const change = entry?.[0]?.changes?.[0]?.value;
        if (!change) return;

        // --- CASO 1: MANEJO DE ESTADOS (READ, DELIVERED, SENT) ---
        if (change.statuses && change.statuses.length > 0) {
            const statusUpdate = change.statuses[0];
            if (statusUpdate.status === 'read') {
                const recipientId = statusUpdate.recipient_id;
                functions.logger.info(`[Status Update] Message read by ${recipientId}`);
                await updateReadStatus(recipientId);
            }
            return;
        }

        // --- CASO 2: MANEJO DE MENSAJES ENTRANTES ---
        const message = change.messages?.[0];
        if (!message) return;

        const contact = change.contacts?.[0];
        const from = message.from; // Formato: 593963142795
        const contactName = contact?.profile?.name || 'Usuario';

        // EXTRACCIÓN DEL MENSAJE
        let body = '';
        if (message.type === 'text') {
            body = message.text.body;
        } else if (message.type === 'interactive') {
            const interactive = message.interactive;
            body = interactive.button_reply?.title || interactive.list_reply?.title || '[Interacción]';
        } else if (['image', 'video', 'audio', 'voice', 'document', 'sticker'].includes(message.type)) {
            body = `[${message.type.toUpperCase()}]${message[message.type]?.caption ? ' ' + message[message.type].caption : ''}`;
        } else {
            body = `[Mensaje tipo: ${message.type}]`;
        }

        functions.logger.info(`📩 Webhook Received from ${from} (Card match attempt): "${body}"`);

        try {
            // 1. Gestionar Tarjeta en Kanban
            const cardData = await handleKanbanUpdate(from, contactName, body, 'whatsapp');

            if (!cardData) {
                functions.logger.warn(`[Kanban Sync] Could not find or create card for ${from}`);
                return;
            }

            functions.logger.info(`[Kanban Sync] Card ${cardData.isNew ? 'CREATED' : 'UPDATED'} for ${from}`);

            // 2. Ejecutar Bot (Opcional)
            const activeBot = await getActiveBot();
            if (activeBot) {
                // Lógica de reinicio de bot tras 24h
                const now = new Date();
                let shouldRestart = false;

                if (cardData.isNew) {
                    shouldRestart = true;
                } else if (cardData.botState?.lastInteraction) {
                    const lastInteraction = cardData.botState.lastInteraction.toDate
                        ? cardData.botState.lastInteraction.toDate()
                        : new Date(0);
                    if ((now.getTime() - lastInteraction.getTime()) > TWENTY_FOUR_HOURS_IN_MS) {
                        shouldRestart = true;
                    }
                } else if (!cardData.botState) {
                    shouldRestart = true;
                }

                if (shouldRestart || cardData.botState?.status === 'active') {
                    if (shouldRestart) delete cardData.botState;
                    await executeBotFlow(activeBot, from, cardData, body);
                }
            }
        } catch (error) {
            functions.logger.error('Error in whatsappWebhook processing:', error);
        }
    } else {
        res.sendStatus(405); // Method Not Allowed
    }
});
