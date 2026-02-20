
import * as functions from 'firebase-functions';
import axios from 'axios';

// Get token from environment variables (preferred) or config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Generic function to make requests to Telegram API
async function callTelegramApi(method: string, data: object): Promise<any> {
    if (!TELEGRAM_BOT_TOKEN) {
        functions.logger.error('Missing TELEGRAM_BOT_TOKEN in environment.');
        throw new Error('Telegram Bot Token is not configured.');
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;

    try {
        const response = await axios.post(url, data);
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        functions.logger.error(`Telegram API Error (${method}):`, errorData);
        throw new Error(`Telegram API Error: ${JSON.stringify(errorData)}`);
    }
}

/**
 * Sends a text message to a user via Telegram.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<any> {
    if (!text) return;
    return await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: text
    });
}

/**
 * Sends a photo to a user.
 */
export async function sendTelegramPhoto(chatId: string, photoUrl: string, caption?: string): Promise<any> {
    return await callTelegramApi('sendPhoto', {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption
    });
}

/**
 * Sends a generic document/video/audio.
 */
export async function sendTelegramMedia(chatId: string, mediaUrl: string, type: 'video' | 'audio' | 'document', caption?: string): Promise<any> {
    const method = type === 'video' ? 'sendVideo' : type === 'audio' ? 'sendAudio' : 'sendDocument';
    const payload: any = {
        chat_id: chatId,
        caption: caption
    };
    payload[type] = mediaUrl;
    return await callTelegramApi(method, payload);
}

/**
 * Sends Buttons (Inline Keyboard).
 */
export async function sendTelegramButtons(chatId: string, text: string, buttons: { id: string, title: string }[]): Promise<any> {
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
export async function sendTelegramLocation(chatId: string, lat: number, long: number): Promise<any> {
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
export async function markTelegramMessageAsRead(chatId: string): Promise<any> {
    // No-op for now
    return Promise.resolve();
}
