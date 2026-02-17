"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramWebhook = void 0;
const functions = require("firebase-functions");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOmni_1 = require("../helpers/kanbanOmni");
/**
 * TELEGRAM WEBHOOK HANDLER
 *
 * URL: https://[project-id].cloudfunctions.net/telegramWebhook
 */
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
        const update = req.body;
        if (update.message) {
            functions.logger.info('Received Telegram message', update.message);
            try {
                const unifiedMsg = (0, messageNormalizer_1.normalizeTelegramMessage)(update.message);
                await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMsg);
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