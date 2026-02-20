import * as functions from 'firebase-functions';
import { normalizeTelegramMessage } from '../helpers/messageNormalizer';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOmni';
import * as admin from 'firebase-admin';

/**
 * TELEGRAM WEBHOOK HANDLER
 * 
 * URL: https://[project-id].cloudfunctions.net/telegramWebhook
 */

export const telegramWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
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
                const unifiedMsg = normalizeTelegramMessage(update.message);
                const cardResult = await handleKanbanUpdateOmni(unifiedMsg);

                if (cardResult && cardResult.success) {
                    // Optimización: Solo invocar bot si es mensaje de texto entrante del usuario (o comando)
                    if (unifiedMsg.message_type === 'text') {
                        const { getActiveBot, executeBotFlow } = await import('../helpers/botEngine');
                        const activeBot = await getActiveBot();
                        if (activeBot) {
                            const db = (await import('firebase-admin')).firestore();
                            // Fetch full card data to pass to bot
                            const cardSnap = await db.collectionGroup('cards').where(admin.firestore.FieldPath.documentId(), '==', cardResult.cardId).get();
                            if (!cardSnap.empty) {
                                const fullCardData = { id: cardSnap.docs[0].id, ...cardSnap.docs[0].data() };
                                await executeBotFlow(activeBot, unifiedMsg.external_id, fullCardData, unifiedMsg.message_text);
                            }
                        }
                    }
                }

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
