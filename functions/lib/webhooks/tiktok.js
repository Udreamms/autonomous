"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokWebhook = void 0;
const functions = require("firebase-functions");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOmni_1 = require("../helpers/kanbanOmni");
const admin = require("firebase-admin");
/**
 * TIKTOK WEBHOOK HANDLER
 *
 * URL: https://[project-id].cloudfunctions.net/tiktokWebhook
 */
exports.tiktokWebhook = functions.https.onRequest(async (req, res) => {
    // 1. VERIFICATION (Optional/Challenge)
    // TikTok sometimes requires a challenge verification similar to Meta
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode && token) {
            if (mode === 'subscribe' && token === 'malamia') {
                functions.logger.info('TikTok Webhook Verified');
                res.status(200).send(challenge);
            }
            else {
                res.sendStatus(403);
            }
        }
        else {
            // Some TikTok integrations use a simple success return
            res.sendStatus(200);
        }
        return;
    }
    if (req.method === 'POST') {
        functions.logger.info('Received TikTok event', req.body);
        try {
            // TikTok payload structure varies. using generic normalization.
            const unifiedMsg = (0, messageNormalizer_1.normalizeTikTokMessage)(req.body);
            const cardResult = await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMsg);
            if (cardResult && cardResult.success) {
                if (unifiedMsg.message_type === 'text') {
                    const { getActiveBot, executeBotFlow } = await Promise.resolve().then(() => require('../helpers/botEngine'));
                    const activeBot = await getActiveBot();
                    if (activeBot) {
                        const db = admin.firestore();
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
            functions.logger.error('Error processing TikTok webhook', error);
            res.sendStatus(500);
        }
    }
    else {
        res.sendStatus(405);
    }
});
//# sourceMappingURL=tiktok.js.map