
import { MessagingAdapter } from './types';
import * as xAPI from '../xAPI';

export class XAdapter implements MessagingAdapter {
    async sendMessage(to: string, text: string): Promise<any> {
        return xAPI.sendXDM(to, text);
    }

    async sendMediaMessage(to: string, mediaUrl: string, caption: string, mediaType?: 'image' | 'video' | 'audio' | 'file'): Promise<any> {
        // X DM media upload is complex. Fallback to link + caption.
        const msg = caption ? `${caption}\n${mediaUrl}` : mediaUrl;
        return xAPI.sendXDM(to, msg);
    }

    async sendButtonMessage(to: string, text: string, buttons: { id: string, title: string }[]): Promise<any> {
        // X DMs support Quick Replies options but API is restrictive.
        // Sending as text menu.
        let menu = text + '\n';
        buttons.forEach((b, i) => menu += `[${i + 1}] ${b.title}\n`);
        return xAPI.sendXDM(to, menu);
    }

    async sendListMessage(to: string, text: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): Promise<any> {
        let menu = text + '\n';
        sections.forEach(sec => {
            menu += `--- ${sec.title} ---\n`;
            sec.rows.forEach(row => menu += `- ${row.title}: ${row.description || ''}\n`);
        });
        return xAPI.sendXDM(to, menu);
    }

    async sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<any> {
        return xAPI.sendXDM(to, `${name}\n${address}\nhttps://maps.google.com/?q=${lat},${long}`);
    }

    async markAsRead(messageId: string): Promise<any> {
        // Not supported/Critical for X DMs in this context
        return Promise.resolve();
    }
}
