
import * as functions from 'firebase-functions';
import axios from 'axios';
import * as crypto from 'crypto';
import * as OAuth from 'oauth-1.0a';

// Twitter API v2 Credentials
// For DMs, we often need OAuth 1.0a User Context or OAuth 2.0 PKCE.
// Simplified here assuming standard OAuth 1.0a for DMs if using v1.1 or v2 with user context.
// Env Vars: X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET

const API_KEY = process.env.X_API_KEY;
const API_KEY_SECRET = process.env.X_API_KEY_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

const oauth = new OAuth({
    consumer: { key: API_KEY || '', secret: API_KEY_SECRET || '' },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string: string, key: string) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    },
});

async function makeXRequest(url: string, method: string, data?: any): Promise<any> {
    if (!API_KEY || !API_KEY_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
        functions.logger.error('Missing X API credentials.');
        throw new Error('X API credentials not configured.');
    }

    const requestData = {
        url: url,
        method: method,
        data: data
    };

    const token = {
        key: ACCESS_TOKEN,
        secret: ACCESS_TOKEN_SECRET,
    };

    const headers = oauth.toHeader(oauth.authorize(requestData, token));

    try {
        const response = await axios({
            url: url,
            method: method as any,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            data: data
        });
        return response.data;
    } catch (error: any) {
        functions.logger.error(`X API Error (${url}):`, error.response?.data || error.message);
        throw new Error(`X API Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
}

/**
 * Sends a Direct Message via Twitter API v2
 * Note: Check current Twitter API specs, they change frequently.
 * Assuming POST /2/dm_conversations/with/:participant_id/messages
 */
export async function sendXDM(recipientId: string, text: string): Promise<any> {
    const url = `https://api.twitter.com/2/dm_conversations/with/${recipientId}/messages`;
    return await makeXRequest(url, 'POST', {
        text: text
    });
}

/**
 * Sends Media DM (Complex flow: Upload INIT -> APPEND -> FINALIZE -> Send DM with media_id)
 * Simplified here to just text or link for now as media upload is multi-step.
 */
export async function sendXMediaDM(recipientId: string, mediaUrl: string): Promise<any> {
    // Media upload is complex in X API. Sending as link for MVP.
    const text = `Sent a media file: ${mediaUrl}`;
    return await sendXDM(recipientId, text);
}
