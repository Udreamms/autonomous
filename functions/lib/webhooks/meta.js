"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaWebhook = void 0;
const functions = require("firebase-functions");
// import * as admin from 'firebase-admin';
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOmni_1 = require("../helpers/kanbanOmni");
/**
 * META WEBHOOK HANDLER
 * Supports: Instagram Graph API, Facebook Graph API (Messenger)
 *
 * URL: https://[project-id].cloudfunctions.net/metaWebhook
 */
exports.metaWebhook = functions.https.onRequest(async (req, res) => {
    // 1. VERIFICATION REQUEST (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        // Check verify token against .env or config
        const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'udreamms_secure_token';
        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                functions.logger.info('Meta Webhook Verified');
                res.status(200).send(challenge);
            }
            else {
                res.sendStatus(403);
            }
        }
        else {
            res.sendStatus(403);
        }
        return;
    }
    // 2. EVENT NOTIFICATION (POST)
    if (req.method === 'POST') {
        try {
            const body = req.body;
            // Support both 'instagram' and 'page' (messenger) objects
            if (body.object === 'instagram' || body.object === 'page') {
                const platform = body.object === 'instagram' ? 'instagram' : 'messenger';
                // Iterate over entries
                for (const entry of body.entry) {
                    const webhookEvent = entry.messaging ? entry.messaging[0] : null;
                    if (webhookEvent) {
                        functions.logger.info(`Received ${platform} message`, webhookEvent);
                        // --- NORMALIZATION & PROCESSING ---
                        const unifiedMessage = (0, messageNormalizer_1.normalizeMetaMessage)(webhookEvent, platform);
                        await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMessage);
                    }
                }
                res.status(200).send('EVENT_RECEIVED');
            }
            else {
                res.sendStatus(404);
            }
        }
        catch (error) {
            functions.logger.error('Error processing Meta webhook', error);
            res.sendStatus(500);
        }
    }
    else {
        res.sendStatus(405);
    }
});
//# sourceMappingURL=meta.js.map