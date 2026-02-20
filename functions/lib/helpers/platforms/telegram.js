"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAdapter = void 0;
const telegramAPI = require("../telegramAPI");
class TelegramAdapter {
    async sendMessage(to, text) {
        return telegramAPI.sendTelegramMessage(to, text);
    }
    async sendMediaMessage(to, mediaUrl, caption, mediaType) {
        if (mediaType === 'image') {
            return telegramAPI.sendTelegramPhoto(to, mediaUrl, caption);
        }
        else if (mediaType === 'video' || mediaType === 'audio') {
            return telegramAPI.sendTelegramMedia(to, mediaUrl, mediaType, caption);
        }
        else {
            return telegramAPI.sendTelegramMedia(to, mediaUrl, 'document', caption);
        }
    }
    async sendButtonMessage(to, text, buttons) {
        return telegramAPI.sendTelegramButtons(to, text, buttons);
    }
    async sendListMessage(to, text, buttonText, sections) {
        // Telegram doesn't have a native List Message like WhatsApp.
        // We will flatten it into buttons (Inline Keyboard) if small, or just text.
        // Similar strategy to Messenger.
        const allOptions = [];
        sections.forEach(sec => allOptions.push(...sec.rows));
        if (allOptions.length <= 10) {
            return telegramAPI.sendTelegramButtons(to, text, allOptions);
        }
        else {
            let menuText = text + '\n';
            allOptions.forEach(opt => menuText += `- ${opt.title}\n`);
            return telegramAPI.sendTelegramMessage(to, menuText);
        }
    }
    async sendLocationMessage(to, lat, long, name, address) {
        // Telegram sendLocation takes lat/long. Name/address would be a separate text message if needed.
        await telegramAPI.sendTelegramLocation(to, lat, long);
        if (name || address) {
            await telegramAPI.sendTelegramMessage(to, `${name}\n${address}`);
        }
    }
    async markAsRead(messageId) {
        return telegramAPI.markTelegramMessageAsRead(messageId);
    }
}
exports.TelegramAdapter = TelegramAdapter;
//# sourceMappingURL=telegram.js.map