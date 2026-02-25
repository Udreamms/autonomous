import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { normalizeMetaMessage } from '../helpers/messageNormalizer';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOmni';
import { executeBotFlow, getActiveBot } from '../helpers/botEngine';

/**
 * META WEBHOOK HANDLER
 * Supports: Instagram Graph API, Facebook Graph API (Messenger)
 * 
 * URL: https://[project-id].cloudfunctions.net/metaWebhook
 */


export const metaWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // 1. VERIFICATION REQUEST (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Check verify token against .env or config
        const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'malamia';

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                functions.logger.info('Meta Webhook Verified');
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        } else {
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
                        const unifiedMessage = normalizeMetaMessage(webhookEvent, platform);
                        const cardResult = await handleKanbanUpdateOmni(unifiedMessage);

                        // --- BOT TRIGGER ---
                        if (cardResult && cardResult.success) {


                            // Optimización: Solo invocar bot si es mensaje de texto entrante del usuario
                            if (unifiedMessage.message_type === 'text') {
                                const activeBot = await getActiveBot();
                                if (activeBot) {

                                    // Actually admin is already imported.

                                    // We need to find where the card is. handleKanbanUpdateOmni puts it in a group.
                                    // Since we don't know the group ID easily without querying or modifying handleKanbanUpdateOmni to return it.
                                    // handleKanbanUpdateOmni DOES return { success: true, cardId: cardRef.id, isNew }.
                                    // It does NOT return groupId.
                                    // We can search for the card by ID (collectionGroup query).

                                    // However, for speed, let's just pass the ID and let botEngine find it?
                                    // executeBotFlow takes (bot, to, cardData, userMessage).
                                    // cardData needs botState.

                                    // Let's do a quick lookup.
                                    const cardsQuery = admin.firestore().collectionGroup('cards').where(admin.firestore.FieldPath.documentId(), '==', cardResult.cardId);
                                    const cardSnap = await cardsQuery.get();

                                    if (!cardSnap.empty) {
                                        const fullCardData = { id: cardSnap.docs[0].id, ...cardSnap.docs[0].data() };
                                        await executeBotFlow(activeBot, unifiedMessage.external_id, fullCardData, unifiedMessage.message_text);
                                    }
                                }
                            }
                        }
                    }
                }
                res.status(200).send('EVENT_RECEIVED');
            } else {
                res.sendStatus(404);
            }
        } catch (error) {
            functions.logger.error('Error processing Meta webhook', error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(405);
    }
});
