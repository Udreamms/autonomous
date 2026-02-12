"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappWebhook = void 0;
// src/webhooks/whatsapp.ts
const functions = require("firebase-functions");
const kanban_1 = require("../helpers/kanban");
const botEngine_1 = require("../helpers/botEngine");
const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    // --- VERIFICACIÓN DE WEBHOOK (GET) ---
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        // Puedes cambiar 'royalty_token_2026' por el que tengas configurado en Meta
        const VERIFY_TOKEN = ((_a = functions.config().whatsapp) === null || _a === void 0 ? void 0 : _a.verify_token) || 'royalty_token_2026';
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            functions.logger.info('Webhook Verified Successfully (GET)');
            res.status(200).send(challenge);
            return;
        }
        else {
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
        const change = (_d = (_c = (_b = entry === null || entry === void 0 ? void 0 : entry[0]) === null || _b === void 0 ? void 0 : _b.changes) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value;
        if (!change)
            return;
        // --- CASO 1: MANEJO DE ESTADOS (READ, DELIVERED, SENT) ---
        if (change.statuses && change.statuses.length > 0) {
            const statusUpdate = change.statuses[0];
            if (statusUpdate.status === 'read') {
                const recipientId = statusUpdate.recipient_id;
                functions.logger.info(`[Status Update] Message read by ${recipientId}`);
                await (0, kanban_1.updateReadStatus)(recipientId);
            }
            return;
        }
        // --- CASO 2: MANEJO DE MENSAJES ENTRANTES ---
        const message = (_e = change.messages) === null || _e === void 0 ? void 0 : _e[0];
        if (!message)
            return;
        const contact = (_f = change.contacts) === null || _f === void 0 ? void 0 : _f[0];
        const from = message.from; // Formato: 593963142795
        const contactName = ((_g = contact === null || contact === void 0 ? void 0 : contact.profile) === null || _g === void 0 ? void 0 : _g.name) || 'Usuario';
        // EXTRACCIÓN DEL MENSAJE
        let body = '';
        if (message.type === 'text') {
            body = message.text.body;
        }
        else if (message.type === 'interactive') {
            const interactive = message.interactive;
            body = ((_h = interactive.button_reply) === null || _h === void 0 ? void 0 : _h.title) || ((_j = interactive.list_reply) === null || _j === void 0 ? void 0 : _j.title) || '[Interacción]';
        }
        else if (['image', 'video', 'audio', 'voice', 'document', 'sticker'].includes(message.type)) {
            body = `[${message.type.toUpperCase()}]${((_k = message[message.type]) === null || _k === void 0 ? void 0 : _k.caption) ? ' ' + message[message.type].caption : ''}`;
        }
        else {
            body = `[Mensaje tipo: ${message.type}]`;
        }
        functions.logger.info(`📩 Webhook Received from ${from} (Card match attempt): "${body}"`);
        try {
            // 1. Gestionar Tarjeta en Kanban
            const cardData = await (0, kanban_1.handleKanbanUpdate)(from, contactName, body, 'whatsapp');
            if (!cardData) {
                functions.logger.warn(`[Kanban Sync] Could not find or create card for ${from}`);
                return;
            }
            functions.logger.info(`[Kanban Sync] Card ${cardData.isNew ? 'CREATED' : 'UPDATED'} for ${from}`);
            // 2. Ejecutar Bot (Opcional)
            const activeBot = await (0, botEngine_1.getActiveBot)();
            if (activeBot) {
                // Lógica de reinicio de bot tras 24h
                const now = new Date();
                let shouldRestart = false;
                if (cardData.isNew) {
                    shouldRestart = true;
                }
                else if ((_l = cardData.botState) === null || _l === void 0 ? void 0 : _l.lastInteraction) {
                    const lastInteraction = cardData.botState.lastInteraction.toDate
                        ? cardData.botState.lastInteraction.toDate()
                        : new Date(0);
                    if ((now.getTime() - lastInteraction.getTime()) > TWENTY_FOUR_HOURS_IN_MS) {
                        shouldRestart = true;
                    }
                }
                else if (!cardData.botState) {
                    shouldRestart = true;
                }
                if (shouldRestart || ((_m = cardData.botState) === null || _m === void 0 ? void 0 : _m.status) === 'active') {
                    if (shouldRestart)
                        delete cardData.botState;
                    await (0, botEngine_1.executeBotFlow)(activeBot, from, cardData, body);
                }
            }
        }
        catch (error) {
            functions.logger.error('Error in whatsappWebhook processing:', error);
        }
    }
    else {
        res.sendStatus(405); // Method Not Allowed
    }
});
//# sourceMappingURL=whatsapp.js.map