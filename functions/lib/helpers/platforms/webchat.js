"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebChatAdapter = void 0;
class WebChatAdapter {
    // WebChat relies on Firestore real-time updates.
    // The "sendMessage" action really just ensures the message is logged in the conversation history,
    // which the bot engine already does via logBotMessage. 
    // However, if we need to trigger a push notification or specific event, we do it here.
    // For this architecture, we assume the Frontend widget listens to the 'messages' array in the card document.
    // So this adapter is mostly a pass-through or a safeguard.
    async sendMessage(to, text) {
        // No external API call needed. 
        // Logic handled by logBotMessage in botEngine which updates Firestore.
        return Promise.resolve();
    }
    async sendMediaMessage(to, mediaUrl, caption, mediaType) {
        // No external API call needed.
        return Promise.resolve();
    }
    async sendButtonMessage(to, text, buttons) {
        // No external API call needed.
        // Frontend widget should render buttons from the message history payload (type: 'interactive' or handle custom format).
        // We rely on logBotMessage saving it.
        return Promise.resolve();
    }
    async sendListMessage(to, text, buttonText, sections) {
        // No external API call needed.
        return Promise.resolve();
    }
    async sendLocationMessage(to, lat, long, name, address) {
        // No external API call needed.
        return Promise.resolve();
    }
    async markAsRead(messageId) {
        // No external API call needed.
        return Promise.resolve();
    }
}
exports.WebChatAdapter = WebChatAdapter;
//# sourceMappingURL=webchat.js.map