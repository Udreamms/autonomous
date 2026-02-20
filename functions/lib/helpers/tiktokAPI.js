"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTikTokDM = sendTikTokDM;
const functions = require("firebase-functions");
const axios_1 = require("axios");
// TikTok Direct Message API is limited/specific to business accounts.
// Env Vars: TIKTOK_ACCESS_TOKEN, TIKTOK_BUSINESS_ID
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
async function callTikTokApi(endpoint, method, data) {
    var _a, _b;
    if (!ACCESS_TOKEN) {
        functions.logger.error('TikTok Access Token missing');
        return;
    }
    // Placeholder URL - TikTok API structure varies by version and region
    const url = `https://business-api.tiktok.com/open_api/v1.3/${endpoint}`;
    try {
        const response = await (0, axios_1.default)({
            url: url,
            method: method,
            headers: {
                'Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            },
            data: data
        });
        return response.data;
    }
    catch (error) {
        functions.logger.error(`TikTok API Error (${endpoint}):`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error(`TikTok API Error: ${JSON.stringify(((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message)}`);
    }
}
async function sendTikTokDM(recipientId, text) {
    // Current Business API might not support proactive DMs easily without specific permissions.
    // This is a "best effort" wiring.
    return await callTikTokApi('business/message/send/', 'POST', {
        recipient_id: recipientId,
        message_type: 'text',
        text: text
    });
}
//# sourceMappingURL=tiktokAPI.js.map