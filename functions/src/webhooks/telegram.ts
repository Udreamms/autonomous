import * as functions from 'firebase-functions';
import { normalizeTelegramMessage } from '../helpers/messageNormalizer';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOmni';

/**
 * TELEGRAM WEBHOOK HANDLER
 * 
 * URL: https://[project-id].cloudfunctions.net/telegramWebhook
 */

export const telegramWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    if (req.method === 'POST') {
        const update = req.body;

        if (update.message) {
            functions.logger.info('Received Telegram message', update.message);
            try {
                const unifiedMsg = normalizeTelegramMessage(update.message);
                await handleKanbanUpdateOmni(unifiedMsg);
                res.sendStatus(200);
            } catch (error) {
                functions.logger.error('Error processing Telegram webhook', error);
                res.sendStatus(500);
            }
        } else {
            // Acknowledge other updates (edits, typing, etc.)
            res.sendStatus(200);
        }
    } else {
        res.sendStatus(405);
    }
});
