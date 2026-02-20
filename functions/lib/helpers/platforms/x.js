"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XAdapter = void 0;
const xAPI = require("../xAPI");
class XAdapter {
    async sendMessage(to, text) {
        return xAPI.sendXDM(to, text);
    }
    async sendMediaMessage(to, mediaUrl, caption, mediaType) {
        // X DM media upload is complex. Fallback to link + caption.
        const msg = caption ? `${caption}\n${mediaUrl}` : mediaUrl;
        return xAPI.sendXDM(to, msg);
    }
    async sendButtonMessage(to, text, buttons) {
        // X DMs support Quick Replies options but API is restrictive.
        // Sending as text menu.
        let menu = text + '\n';
        buttons.forEach((b, i) => menu += `[${i + 1}] ${b.title}\n`);
        return xAPI.sendXDM(to, menu);
    }
    async sendListMessage(to, text, buttonText, sections) {
        let menu = text + '\n';
        sections.forEach(sec => {
            menu += `--- ${sec.title} ---\n`;
            sec.rows.forEach(row => menu += `- ${row.title}: ${row.description || ''}\n`);
        });
        return xAPI.sendXDM(to, menu);
    }
    async sendLocationMessage(to, lat, long, name, address) {
        return xAPI.sendXDM(to, `${name}\n${address}\nhttps://maps.google.com/?q=${lat},${long}`);
    }
    async markAsRead(messageId) {
        // Not supported/Critical for X DMs in this context
        return Promise.resolve();
    }
}
exports.XAdapter = XAdapter;
//# sourceMappingURL=x.js.map