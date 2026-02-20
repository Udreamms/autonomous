"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xWebhook = void 0;
const functions = require("firebase-functions");
/**
 * X (TWITTER) WEBHOOK HANDLER (CRC Check + Events)
 *
 * URL: https://[project-id].cloudfunctions.net/xWebhook
 */
const crypto = require("crypto");
exports.xWebhook = functions.https.onRequest(async (req, res) => {
    // 1. CRC CHECK (GET) - Required for registering webhook
    if (req.method === 'GET') {
        const crcToken = req.query.crc_token;
        if (crcToken) {
            const consumerSecret = process.env.X_CONSUMER_SECRET || 'YOUR_CONSUMER_SECRET';
            const hmac = crypto.createHmac('sha256', consumerSecret).update(crcToken).digest('base64');
            res.status(200).json({ response_token: `sha256=${hmac}` });
        }
        else {
            res.sendStatus(400);
        }
        return;
    }
    // 2. EVENTS (POST)
    if (req.method === 'POST') {
        functions.logger.info('Received X event', req.body);
        // const { getActiveBot, executeBotFlow } = await import('../helpers/botEngine');
        // const { handleKanbanUpdateOmni } = await import('../helpers/kanbanOmni');
        // const { normalizeXMessage } = await import('../helpers/messageNormalizer');
        // const admin = await import('firebase-admin');
        try {
            // Assuming single event for simplicity, real X payload has 'events' array
            // const event = req.body.direct_message_events?.[0]; 
            // const users = req.body.users;
            // Simplified normalize call:
            // const unifiedMsg = normalizeXMessage(event, users);
            // await handleKanbanUpdateOmni(unifiedMsg);
            // ... Bot logic ...
            // Since exact payload parsing depends on API version (v1.1 vs v2), and we are in "wiring" phase,
            // I will leave the detailed parsing commented but structure ready.
            functions.logger.info('X Webhook Logic Ready - Payload received');
        }
        catch (e) {
            functions.logger.error('X Webhook Error', e);
        }
        res.sendStatus(200);
    }
});
//# sourceMappingURL=x.js.map