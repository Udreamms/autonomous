"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokAdapter = void 0;
const tiktokAPI = require("../tiktokAPI");
class TikTokAdapter {
    async sendMessage(to, text) {
        return tiktokAPI.sendTikTokDM(to, text);
    }
    async sendMediaMessage(to, mediaUrl, caption, mediaType) {
        // Fallback to text link
        const msg = caption ? `${caption}\n${mediaUrl}` : mediaUrl;
        return tiktokAPI.sendTikTokDM(to, msg);
    }
    async sendButtonMessage(to, text, buttons) {
        let menu = text + '\n';
        buttons.forEach((b, i) => menu += `[${i + 1}] ${b.title}\n`);
        return tiktokAPI.sendTikTokDM(to, menu);
    }
    async sendListMessage(to, text, buttonText, sections) {
        let menu = text + '\n';
        sections.forEach(sec => {
            menu += `--- ${sec.title} ---\n`;
            sec.rows.forEach(r => menu += `- ${r.title}\n`);
        });
        return tiktokAPI.sendTikTokDM(to, menu);
    }
    async sendLocationMessage(to, lat, long, name, address) {
        return tiktokAPI.sendTikTokDM(to, `${name}\n${address}\nhttps://maps.google.com/?q=${lat},${long}`);
    }
    async markAsRead(messageId) {
        return Promise.resolve();
    }
}
exports.TikTokAdapter = TikTokAdapter;
//# sourceMappingURL=tiktok.js.map