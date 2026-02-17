"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webchatWebhook = void 0;
const functions = require("firebase-functions");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOmni_1 = require("../helpers/kanbanOmni");
/**
 * WEB CHAT WEBHOOK HANDLER
 *
 * Receives messages from the custom website widget.
 * URL: https://[project-id].cloudfunctions.net/webchatWebhook
 */
// Simple in-memory rate limiting check could go here, or Auth check
// For now, assuming direct post from widget secured by CORS/Origin check in Firebase Config
exports.webchatWebhook = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*'); // Secure this in production!
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method === 'POST') {
        try {
            const body = req.body;
            // Expected body: { sessionId, text, visitorName?, attachments? }
            if (!body.sessionId || !body.text) {
                res.status(400).send('Missing required fields');
                return;
            }
            functions.logger.info('Received WebChat message', body);
            const unifiedMsg = (0, messageNormalizer_1.normalizeWebChatMessage)(body);
            await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMsg);
            res.status(200).json({ success: true });
        }
        catch (error) {
            functions.logger.error('Error processing WebChat webhook', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    else {
        res.sendStatus(405);
    }
});
//# sourceMappingURL=webchat.js.map