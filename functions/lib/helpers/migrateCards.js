"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCards = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
/**
 * ONE-TIME MIGRATION: Adds `platform_ids`, `channel`, and `contactNumberClean`
 * to existing Kanban cards that were created before the omnichannel refactor.
 *
 * CALL ONCE via: GET https://us-central1-udreamms-platform-1.cloudfunctions.net/migrateCards
 * After migration is confirmed, remove this function and redeploy.
 */
exports.migrateCards = functions.https.onRequest(async (req, res) => {
    const db = admin.firestore();
    // Security: basic check to prevent accidental runs
    const secret = req.query.secret;
    if (secret !== 'udreamms-migrate-2025') {
        res.status(403).send('Unauthorized');
        return;
    }
    functions.logger.info('[Migration] Starting card migration...');
    const groupsSnap = await db.collection('kanban-groups').get();
    if (groupsSnap.empty) {
        res.json({ success: true, message: 'No groups found', updated: 0 });
        return;
    }
    let totalUpdated = 0;
    let totalSkipped = 0;
    const errors = [];
    const BATCH_SIZE = 400;
    let batch = db.batch();
    let batchCount = 0;
    for (const groupDoc of groupsSnap.docs) {
        const cardsSnap = await groupDoc.ref.collection('cards').get();
        for (const cardDoc of cardsSnap.docs) {
            const data = cardDoc.data();
            // Determine what platform this card belongs to
            // If it already has platform_ids, it's already migrated
            if (data.platform_ids && Object.keys(data.platform_ids).length > 0) {
                totalSkipped++;
                continue;
            }
            // Determine platform from `source` field (old field name)
            const sourcePlatform = data.source || 'whatsapp';
            const externalId = data.contactNumber || data.contactNumberClean || '';
            if (!externalId) {
                functions.logger.warn(`[Migration] Card ${cardDoc.id} has no contactNumber, skipping.`);
                totalSkipped++;
                continue;
            }
            const updateData = {
                // New unified platform identity map
                platform_ids: {
                    [sourcePlatform]: externalId
                },
                // Channel field for UI icon rendering
                channel: sourcePlatform,
                primary_channel: sourcePlatform,
                // Ensure contactNumberClean exists (self-healing)
                contactNumberClean: externalId.replace(/\+/g, ''),
            };
            // If platform_metadata is missing, initialize it
            if (!data.platform_metadata) {
                updateData.platform_metadata = {};
            }
            batch.update(cardDoc.ref, updateData);
            batchCount++;
            totalUpdated++;
            // Commit batch every BATCH_SIZE writes
            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                functions.logger.info(`[Migration] Committed batch of ${batchCount} cards`);
                batch = db.batch();
                batchCount = 0;
            }
        }
    }
    // Commit remaining
    if (batchCount > 0) {
        await batch.commit();
        functions.logger.info(`[Migration] Committed final batch of ${batchCount} cards`);
    }
    const summary = {
        success: true,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: errors.length > 0 ? errors : undefined,
        message: `Migration complete. ${totalUpdated} cards updated, ${totalSkipped} already migrated.`
    };
    functions.logger.info('[Migration] Done:', summary);
    res.json(summary);
});
//# sourceMappingURL=migrateCards.js.map