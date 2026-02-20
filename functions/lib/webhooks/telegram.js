"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramWebhook = void 0;
const functions = require("firebase-functions");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOmni_1 = require("../helpers/kanbanOmni");
const admin = require("firebase-admin");
/**
 * TELEGRAM WEBHOOK HANDLER
 *
 * URL: https://[project-id].cloudfunctions.net/telegramWebhook
 */
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
        const secretToken = req.headers['x-telegram-bot-api-secret-token'];
        if (secretToken !== 'malamia') {
            functions.logger.warn('Telegram Secret Token Mismatch');
            res.sendStatus(403);
            return;
        }
        const update = req.body;
        if (update.message) {
            functions.logger.info('Received Telegram message', update.message);
            try {
                const unifiedMsg = (0, messageNormalizer_1.normalizeTelegramMessage)(update.message);
                const cardResult = await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMsg);
                if (cardResult && cardResult.success) {
                    // Optimización: Solo invocar bot si es mensaje de texto entrante del usuario (o comando)
                    if (unifiedMsg.message_type === 'text') {
                        const { getActiveBot, executeBotFlow } = await Promise.resolve().then(() => require('../helpers/botEngine'));
                        const activeBot = await getActiveBot();
                        if (activeBot) {
                            const db = (await Promise.resolve().then(() => require('firebase-admin'))).firestore();
                            // Fetch full card data to pass to bot
                            const cardSnap = await db.collectionGroup('cards').where(admin.firestore.FieldPath.documentId(), '==', cardResult.cardId).get();
                            if (!cardSnap.empty) {
                                const fullCardData = Object.assign({ id: cardSnap.docs[0].id }, cardSnap.docs[0].data());
                                await executeBotFlow(activeBot, unifiedMsg.external_id, fullCardData, unifiedMsg.message_text);
                            }
                        }
                    }
                }
                res.sendStatus(200);
            }
            catch (error) {
                functions.logger.error('Error processing Telegram webhook', error);
                res.sendStatus(500);
            }
        }
        else {
            // Acknowledge other updates (edits, typing, etc.)
            res.sendStatus(200);
        }
    }
    else {
        res.sendStatus(405);
    }
});
//# sourceMappingURL=telegram.js.map