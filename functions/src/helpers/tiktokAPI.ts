
import * as functions from 'firebase-functions';
import axios from 'axios';

// TikTok Direct Message API is limited/specific to business accounts.
// Env Vars: TIKTOK_ACCESS_TOKEN, TIKTOK_BUSINESS_ID

const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;

async function callTikTokApi(endpoint: string, method: string, data: any): Promise<any> {
    if (!ACCESS_TOKEN) {
        functions.logger.error('TikTok Access Token missing');
        return;
    }

    // Placeholder URL - TikTok API structure varies by version and region
    const url = `https://business-api.tiktok.com/open_api/v1.3/${endpoint}`;

    try {
        const response = await axios({
            url: url,
            method: method as any,
            headers: {
                'Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            },
            data: data
        });
        return response.data;
    } catch (error: any) {
        functions.logger.error(`TikTok API Error (${endpoint}):`, error.response?.data || error.message);
        throw new Error(`TikTok API Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
}

export async function sendTikTokDM(recipientId: string, text: string): Promise<any> {
    // Current Business API might not support proactive DMs easily without specific permissions.
    // This is a "best effort" wiring.
    return await callTikTokApi('business/message/send/', 'POST', {
        recipient_id: recipientId,
        message_type: 'text',
        text: text
    });
}
