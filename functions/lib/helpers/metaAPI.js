"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTAGRAM_ACCESS_TOKEN = void 0;
exports.sendMetaMessage = sendMetaMessage;
exports.sendMetaMediaMessage = sendMetaMediaMessage;
exports.markMetaMessageAsRead = markMetaMessageAsRead;
exports.sendMetaQuickReplies = sendMetaQuickReplies;
const functions = require("firebase-functions");
const axios_1 = require("axios");
// Get tokens from environment variables
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
exports.INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
// Generic function to make requests to Graph API
async function callSendApi(messageData, token) {
    var _a;
    const accessToken = token || PAGE_ACCESS_TOKEN;
    if (!accessToken) {
        functions.logger.error('Missing Access Token (Meta/Instagram).');
        throw new Error('Access Token is not configured.');
    }
    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    try {
        const response = await axios_1.default.post(url, messageData);
        return response.data;
    }
    catch (error) {
        const errorData = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message;
        functions.logger.error('Meta API Error:', errorData);
        throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`);
    }
}
/**
 * Sends a text message to a user via Messenger.
 */
async function sendMetaMessage(recipientId, text, token) {
    if (!text)
        return;
    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text
        }
    };
    return await callSendApi(messageData, token);
}
/**
 * Sends a media message (image, video, etc.).
 */
async function sendMetaMediaMessage(recipientId, mediaUrl, mediaType = 'image', token) {
    if (!mediaUrl)
        return;
    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: mediaType,
                payload: {
                    url: mediaUrl,
                    is_reusable: true
                }
            }
        }
    };
    return await callSendApi(messageData, token);
}
/**
 * Marks a message as read in Messenger.
 * Note: Facebook does not have an explicit "mark as read" endpoint same as WhatsApp, but we can send "sender_action: mark_seen".
 */
async function markMetaMessageAsRead(recipientId, token) {
    const messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: 'mark_seen'
    };
    return await callSendApi(messageData, token);
}
/**
 * Sends Quick Replies (Buttons).
 * Facebook Quick Replies are different from WhatsApp Buttons.
 */
async function sendMetaQuickReplies(recipientId, text, quickReplies, token) {
    // Format quick replies for Messenger
    // Expected format: { content_type: 'text', title: 'Yes', payload: 'YES_PAYLOAD' }
    const formattedQRs = quickReplies.slice(0, 13).map(qr => ({
        content_type: 'text',
        title: (qr.title || 'Opción').substring(0, 20),
        payload: qr.id || qr.payload || qr.title
    }));
    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text,
            quick_replies: formattedQRs
        }
    };
    return await callSendApi(messageData, token);
}
//# sourceMappingURL=metaAPI.js.map