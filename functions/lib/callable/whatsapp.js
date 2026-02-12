"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsappMediaMessage = exports.sendWhatsappMessage = void 0;
// src/callable/whatsapp.ts
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const whatsappAPI_1 = require("../helpers/whatsappAPI");
const db = admin.firestore();
// Common function to log any outgoing message to the Firestore card
async function logMessageInCard(groupId, cardId, text, whatsappMessageId) {
    const cardRef = db.collection('kanban-groups').doc(groupId).collection('cards').doc(cardId);
    await cardRef.update({
        lastMessage: text.length > 40 ? text.substring(0, 37) + '...' : text,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        messages: admin.firestore.FieldValue.arrayUnion({
            sender: 'agent', // Represents a human agent, not the bot
            text: text,
            timestamp: new Date(),
            whatsappMessageId: whatsappMessageId || null,
        }),
    });
}
// Function to handle sending TEXT messages
exports.sendWhatsappMessage = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { cardId, groupId, message, toNumber } = data;
    if (!cardId || !groupId || !message || !toNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required data for sending a text message.');
    }
    try {
        const response = await (0, whatsappAPI_1.sendMessage)(toNumber, message);
        const wa_id = (_b = (_a = response === null || response === void 0 ? void 0 : response.messages) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
        await logMessageInCard(groupId, cardId, message, wa_id);
        return { success: true, messageId: wa_id };
    }
    catch (error) {
        functions.logger.error(`Error in sendWhatsappMessage for card ${cardId}:`, error.message);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Function to handle sending MEDIA messages (images, documents, etc.)
exports.sendWhatsappMediaMessage = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { cardId, groupId, fileUrl, toNumber, fileName } = data;
    if (!cardId || !groupId || !fileUrl || !toNumber || !fileName) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required data for sending a media message.');
    }
    try {
        const response = await (0, whatsappAPI_1.sendMediaMessage)(toNumber, fileUrl, fileName);
        const wa_id = (_b = (_a = response === null || response === void 0 ? void 0 : response.messages) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
        const logText = `Archivo enviado: ${fileName}`;
        await logMessageInCard(groupId, cardId, logText, wa_id);
        return { success: true, messageId: wa_id };
    }
    catch (error) {
        functions.logger.error(`Error in sendWhatsappMediaMessage for card ${cardId}:`, error.message);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=whatsapp.js.map