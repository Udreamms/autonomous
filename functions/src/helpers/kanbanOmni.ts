import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { UnifiedMessage } from '../types/message';

/**
 * OMNICHANNEL KANBAN MANAGER
 * 
 * Handles Creation & Updates of Kanban Cards for ALL platforms.
 */
export async function handleKanbanUpdateOmni(message: UnifiedMessage): Promise<any> {
    const db = admin.firestore(); // Lazy init
    const {
        source_platform,
        external_id,
        contact_name,
        message_text,
        message_type,
        timestamp,
        platform_metadata
    } = message;

    // --- 1. SEARCH FOR EXISTING CARD ---

    // Strategy A: Search by unified external_id (Best for Social Media: IG, X, TikTok)
    let cardsQuery = db.collectionGroup('cards')
        .where(`platform_ids.${source_platform}`, '==', external_id)
        .limit(1);

    let snapshot = await cardsQuery.get();

    // Strategy B: Search by Phone Number (If available, mainly for WhatsApp/SMS integration consistency)
    if (snapshot.empty && (source_platform === 'whatsapp' || source_platform === 'sms')) {
        const cleanNumber = external_id.replace(/\+/g, ''); // Basic clean
        // Try matching contactNumberClean (standard) or contactNumber (legacy)
        const phoneQuery = db.collectionGroup('cards').where('contactNumberClean', '==', cleanNumber).limit(1);
        snapshot = await phoneQuery.get();

        if (snapshot.empty) {
            const legacyQuery = db.collectionGroup('cards').where('contactNumber', '==', external_id).limit(1);
            snapshot = await legacyQuery.get();
        }
    }

    // --- 2. EXECUTE TRANSACTION (Update or Create) ---
    return db.runTransaction(async (transaction) => {
        let cardRef: admin.firestore.DocumentReference;
        let isNew = false;

        if (!snapshot.empty) {
            // -> UPDATE EXISTING
            const cardDoc = snapshot.docs[0];
            cardRef = cardDoc.ref;
            // Removed unused currentMessages logic

            functions.logger.info(`[Omni] Updating existing card for ${source_platform}:${external_id}`);

            // Build update payload
            const updatePayload: any = {
                lastMessage: message_text,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                // Update badge/source info to reflect most recent interaction
                last_interaction_source: source_platform,
                last_interaction_type: message_type,
            };

            // Merge Platform Metadata (Upsert)
            if (platform_metadata) {
                updatePayload[`platform_metadata.${source_platform}`] = platform_metadata;
            }

            // Ensure platform_ids mapping exists (for linking future messages)
            updatePayload[`platform_ids.${source_platform}`] = external_id;

            // Add Message to Array
            updatePayload.messages = admin.firestore.FieldValue.arrayUnion({
                sender: 'user', // "user" means the contact
                text: message_text,
                type: message_type,
                timestamp: timestamp || new Date(),
                platform: source_platform, // Track which channel this specific message came from
                media_url: message.media_url || null
            });

            transaction.update(cardRef, updatePayload);

        } else {
            // -> CREATE NEW (In "Bandeja de Entrada")
            isNew = true;
            functions.logger.info(`[Omni] Creating NEW card for ${source_platform}:${external_id}`);

            // Find "Bandeja de Entrada" Group
            const groupsRef = db.collection('kanban-groups');
            const inboxQuery = groupsRef.where('name', '==', 'Bandeja de Entrada').limit(1);
            const inboxSnap = await transaction.get(inboxQuery);

            let groupId;
            if (!inboxSnap.empty) {
                groupId = inboxSnap.docs[0].id;
            } else {
                // Fallback: First group available
                const fallbackQuery = groupsRef.orderBy('order').limit(1);
                const fallbackSnap = await fallbackQuery.get();
                if (fallbackSnap.empty) throw new Error('Kanban Groups not initialized');
                groupId = fallbackSnap.docs[0].id;
            }

            // Create Card Document Ref
            cardRef = groupsRef.doc(groupId).collection('cards').doc();

            const newCardData = {
                contactName: contact_name || 'Nuevo Contacto',
                // contactNumber: Only if source IS phone-based, else leave undefined or store in separate field
                contactNumber: (source_platform === 'whatsapp' || source_platform === 'sms') ? external_id : null,
                contactNumberClean: (source_platform === 'whatsapp' || source_platform === 'sms') ? external_id.replace(/\+/g, '') : null,

                // Identity Map
                platform_ids: {
                    [source_platform]: external_id
                },
                platform_metadata: platform_metadata ? {
                    [source_platform]: platform_metadata
                } : {},

                // Standard Kanban Fields
                lastMessage: message_text,
                source: source_platform, // Primary source (origin)
                groupId: groupId,
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

                // Channel Icon Hints for UI
                primary_channel: source_platform
            };

            transaction.set(cardRef, newCardData);
        }

        return { success: true, cardId: cardRef.id, isNew };
    });
}
