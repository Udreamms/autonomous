"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = sendTelegramMessage;
exports.sendTelegramPhoto = sendTelegramPhoto;
exports.sendTelegramMedia = sendTelegramMedia;
exports.sendTelegramButtons = sendTelegramButtons;
exports.sendTelegramLocation = sendTelegramLocation;
exports.markTelegramMessageAsRead = markTelegramMessageAsRead;
const functions = require("firebase-functions");
const axios_1 = require("axios");
// Get token from environment variables (preferred) or config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Generic function to make requests to Telegram API
async function callTelegramApi(method, data) {
    var _a;
    if (!TELEGRAM_BOT_TOKEN) {
        functions.logger.error('Missing TELEGRAM_BOT_TOKEN in environment.');
        throw new Error('Telegram Bot Token is not configured.');
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
    try {
        const response = await axios_1.default.post(url, data);
        return response.data;
    }
    catch (error) {
        const errorData = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message;
        functions.logger.error(`Telegram API Error (${method}):`, errorData);
        throw new Error(`Telegram API Error: ${JSON.stringify(errorData)}`);
    }
}
/**
 * Sends a text message to a user via Telegram.
 */
async function sendTelegramMessage(chatId, text) {
    if (!text)
        return;
    return await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: text
    });
}
/**
 * Sends a photo to a user.
 */
async function sendTelegramPhoto(chatId, photoUrl, caption) {
    return await callTelegramApi('sendPhoto', {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption
    });
}
/**
 * Sends a generic document/video/audio.
 */
async function sendTelegramMedia(chatId, mediaUrl, type, caption) {
    const method = type === 'video' ? 'sendVideo' : type === 'audio' ? 'sendAudio' : 'sendDocument';
    const payload = {
        chat_id: chatId,
        caption: caption
    };
    payload[type] = mediaUrl;
    return await callTelegramApi(method, payload);
}
/**
 * Sends Buttons (Inline Keyboard).
 */
async function sendTelegramButtons(chatId, text, buttons) {
    const inlineKeyboard = buttons.map(btn => ([{
            text: btn.title,
            callback_data: btn.id
        }]));
    return await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: text,
        reply_markup: {
            inline_keyboard: inlineKeyboard
        }
    });
}
/**
 * Sends Location.
 */
async function sendTelegramLocation(chatId, lat, long) {
    return await callTelegramApi('sendLocation', {
        chat_id: chatId,
        latitude: lat,
        longitude: long
    });
}
/**
 * For Telegram, "mark as read" is not a standard user-facing feature like WhatsApp/Messenger checks,
 * but currently bots cannot force "read" status on user's side easily without interactions.
 * We can leave this empty or no-op.
 */
async function markTelegramMessageAsRead(chatId) {
    // No-op for now
    return Promise.resolve();
}
//# sourceMappingURL=telegramAPI.js.map