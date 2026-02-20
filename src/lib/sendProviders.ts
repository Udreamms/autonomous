
import axios from 'axios';

// --- Meta (Instagram & Messenger) ---

/**
 * Generic function to make requests to Meta Graph API
 */
async function callMetaSendApi(messageData: object, token?: string): Promise<any> {
    const accessToken = token || process.env.META_PAGE_ACCESS_TOKEN;

    if (!accessToken) {
        console.error('Missing Access Token (Meta/Instagram).');
        throw new Error('Access Token is not configured.');
    }

    // Using v19.0 as per plan
    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;

    try {
        const response = await axios.post(url, messageData);
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error('Meta API Error:', JSON.stringify(errorData, null, 2));
        throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`);
    }
}

/**
 * Sends a message via Meta API (Instagram or Messenger).
 * Note: Platform distinction is handled by the recipient ID (PSID/IGSID).
 */
export async function sendMetaMessage(recipientId: string, text: string, token?: string): Promise<any> {
    if (!text) return;

    const messageData = {
        recipient: { id: recipientId },
        message: { text: text }
    };

    return await callMetaSendApi(messageData, token);
}

// --- Telegram ---

/**
 * Generic function to make requests to Telegram Bot API
 */
async function callTelegramApi(method: string, data: object): Promise<any> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        console.error('Missing TELEGRAM_BOT_TOKEN in environment.');
        throw new Error('Telegram Bot Token is not configured.');
    }

    const url = `https://api.telegram.org/bot${botToken}/${method}`;

    try {
        const response = await axios.post(url, data);
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error(`Telegram API Error (${method}):`, errorData);
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
