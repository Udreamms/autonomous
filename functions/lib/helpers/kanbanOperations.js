"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveCard = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
/**
 * Move Card Function
 * Callable via httpsCallable from client.
 */
exports.moveCard = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // Ensure properly initialized (failsafe)
    if (!admin.apps.length)
        admin.initializeApp();
    const db = admin.firestore();
    const { cardId, sourceGroupId, destGroupId } = data;
    if (!cardId || !destGroupId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing cardId or destGroupId');
    }
    try {
        const cardRef = db.collection('kanban-groups').doc(sourceGroupId).collection('cards').doc(cardId);
        const cardSnap = await cardRef.get();
        if (!cardSnap.exists) {
            // Check if it's already in dest (race condition or retry)
            const destRef = db.collection('kanban-groups').doc(destGroupId).collection('cards').doc(cardId);
            const destSnap = await destRef.get();
            if (destSnap.exists)
                return { success: true, message: 'Already moved' };
            throw new functions.https.HttpsError('not-found', 'Card not found in source group');
        }
        const cardData = cardSnap.data() || {};
        // 1. Create in Destination
        const newCardRef = db.collection('kanban-groups').doc(destGroupId).collection('cards').doc(cardId);
        const historyEntry = {
            id: `hist_${Date.now()}`,
            type: 'status',
            content: `Movido de grupo`, // You can enhance this with group names if lookup
            timestamp: admin.firestore.Timestamp.now(),
            author: ((_b = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.name) || 'Usuario'
        };
        // 2. Transaction for atomicity (Move = Copy + Delete)
        await db.runTransaction(async (t) => {
            t.set(newCardRef, Object.assign(Object.assign({}, cardData), { groupId: destGroupId, updatedAt: admin.firestore.FieldValue.serverTimestamp(), history: admin.firestore.FieldValue.arrayUnion(historyEntry) }));
            t.delete(cardRef);
        });
        return { success: true };
    }
    catch (error) {
        console.error('Move Card Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to move card');
    }
});
//# sourceMappingURL=kanbanOperations.js.map