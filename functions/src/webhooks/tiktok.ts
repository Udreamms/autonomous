
import * as functions from 'firebase-functions';
import { normalizeTikTokMessage } from '../helpers/messageNormalizer';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOmni';
import * as admin from 'firebase-admin';

/**
 * TIKTOK WEBHOOK HANDLER
 * 
 * URL: https://[project-id].cloudfunctions.net/tiktokWebhook
 */

export const tiktokWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
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
            } else {
                res.sendStatus(403);
            }
        } else {
            // Some TikTok integrations use a simple success return
            res.sendStatus(200);
        }
        return;
    }

    if (req.method === 'POST') {
        functions.logger.info('Received TikTok event', req.body);

        try {
            // TikTok payload structure varies. using generic normalization.
            const unifiedMsg = normalizeTikTokMessage(req.body);
            const cardResult = await handleKanbanUpdateOmni(unifiedMsg);

            if (cardResult && cardResult.success) {
                if (unifiedMsg.message_type === 'text') {
                    const { getActiveBot, executeBotFlow } = await import('../helpers/botEngine');
                    const activeBot = await getActiveBot();
                    if (activeBot) {
                        const db = admin.firestore();
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
            functions.logger.error('Error processing TikTok webhook', error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(405);
    }
});
