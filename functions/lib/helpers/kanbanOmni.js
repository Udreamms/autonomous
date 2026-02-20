"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleKanbanUpdateOmni = handleKanbanUpdateOmni;
exports.updateReadStatus = updateReadStatus;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
/**
 * OMNICHANNEL KANBAN MANAGER
 *
 * Handles Creation & Updates of Kanban Cards for ALL platforms.
 */
async function handleKanbanUpdateOmni(message) {
    const db = admin.firestore();
    const { source_platform, external_id, contact_name, message_text, message_type, timestamp, platform_metadata } = message;
    // --- 1. SEARCH FOR EXISTING CARD ---
    // Strategy A: Search by unified external_id (Best for Social Media: IG, X, TikTok)
    let snapshot = await db.collectionGroup('cards')
        .where(`platform_ids.${source_platform}`, '==', external_id)
        .limit(1)
        .get();
    // Strategy B: Search by Phone Number (mainly for WhatsApp/SMS)
    if (snapshot.empty && (source_platform === 'whatsapp' || source_platform === 'sms')) {
        const cleanNumber = external_id.replace(/\+/g, '');
        snapshot = await db.collectionGroup('cards').where('contactNumberClean', '==', cleanNumber).limit(1).get();
        if (snapshot.empty) {
            snapshot = await db.collectionGroup('cards').where('contactNumber', '==', external_id).limit(1).get();
        }
    }
    // --- 2. Pre-query ALL groups OUTSIDE the transaction ---
    // IMPORTANT: Never query with where() inside a Firestore transaction — results
    // can come back empty even when data exists. We resolve the group ID here instead.
    const groupsRef = db.collection('kanban-groups');
    // NOTE: No orderBy here — it requires a composite Firestore index.
    // We find "Bandeja de Entrada" in memory which is equally effective.
    const allGroupsSnap = await groupsRef.get();
    if (allGroupsSnap.empty) {
        functions.logger.error('[Omni] CRITICAL: No kanban-groups found in DB!');
        throw new Error('No Kanban groups found. Please create at least one group in the app.');
    }
    // Find "Bandeja de Entrada" case-insensitively. Fall back to first group by order.
    const inboxGroupDoc = allGroupsSnap.docs.find(g => (g.data().name || '').toLowerCase().includes('bandeja')) || allGroupsSnap.docs[0];
    const inboxGroupId = inboxGroupDoc.id;
    functions.logger.info(`[Omni] Inbox group resolved: id=${inboxGroupId} name="${inboxGroupDoc.data().name}"`);
    // --- 3. EXECUTE TRANSACTION (Update or Create) ---
    return db.runTransaction(async (transaction) => {
        let cardRef;
        let isNew = false;
        if (!snapshot.empty) {
            // -> UPDATE EXISTING CARD
            cardRef = snapshot.docs[0].ref;
            functions.logger.info(`[Omni] Updating existing card for ${source_platform}:${external_id}`);
            const updatePayload = {
                lastMessage: message_text,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                last_interaction_source: source_platform,
                last_interaction_type: message_type,
                [`platform_ids.${source_platform}`]: external_id,
            };
            if (platform_metadata) {
                updatePayload[`platform_metadata.${source_platform}`] = platform_metadata;
            }
            updatePayload.messages = admin.firestore.FieldValue.arrayUnion({
                sender: 'user',
                text: message_text,
                type: message_type,
                timestamp: timestamp || new Date(),
                platform: source_platform,
                media_url: message.media_url || null
            });
            transaction.update(cardRef, updatePayload);
        }
        else {
            // -> CREATE NEW CARD in Bandeja de Entrada
            isNew = true;
            cardRef = groupsRef.doc(inboxGroupId).collection('cards').doc();
            functions.logger.info(`[Omni] Creating NEW card for ${source_platform}:${external_id} in group ${inboxGroupId}`);
            const newCardData = {
                contactName: contact_name || 'Nuevo Contacto',
                contactNumber: (source_platform === 'whatsapp' || source_platform === 'sms') ? external_id : null,
                contactNumberClean: (source_platform === 'whatsapp' || source_platform === 'sms') ? external_id.replace(/\+/g, '') : null,
                // Identity Map — links this card to this platform user
                platform_ids: {
                    [source_platform]: external_id
                },
                platform_metadata: platform_metadata ? {
                    [source_platform]: platform_metadata
                } : {},
                // Standard Kanban Fields
                lastMessage: message_text,
                source: source_platform,
                channel: source_platform, // UI uses 'channel' to show icon
                primary_channel: source_platform,
                groupId: inboxGroupId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                // Messages Array
                messages: [{
                        sender: 'user',
                        text: message_text,
                        type: message_type,
                        timestamp: timestamp || new Date(),
                        platform: source_platform,
                        media_url: message.media_url || null
                    }],
            };
            transaction.set(cardRef, newCardData);
        }
        return { success: true, cardId: cardRef.id, isNew };
    });
}
// --- HELPER: UPDATE READ STATUS ---
async function updateReadStatus(recipientId, platform = 'whatsapp') {
    const db = admin.firestore();
    let cardsRef = db.collectionGroup('cards').where(`platform_ids.${platform}`, '==', recipientId);
    let snapshot = await cardsRef.get();
    if (snapshot.empty && platform === 'whatsapp') {
        cardsRef = db.collectionGroup('cards').where('contactNumberClean', '==', recipientId);
        snapshot = await cardsRef.get();
    }
    if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
            lastReadAt: admin.firestore.FieldValue.serverTimestamp()
        });
        functions.logger.info(`[Read Receipt] Updated lastReadAt for ${recipientId} (${platform})`);
    }
}
//# sourceMappingURL=kanbanOmni.js.map