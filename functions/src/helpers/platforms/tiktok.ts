
import { MessagingAdapter } from './types';
import * as tiktokAPI from '../tiktokAPI';

export class TikTokAdapter implements MessagingAdapter {
    async sendMessage(to: string, text: string): Promise<any> {
        return tiktokAPI.sendTikTokDM(to, text);
    }

    async sendMediaMessage(to: string, mediaUrl: string, caption: string, mediaType?: 'image' | 'video' | 'audio' | 'file'): Promise<any> {
        // Fallback to text link
        const msg = caption ? `${caption}\n${mediaUrl}` : mediaUrl;
        return tiktokAPI.sendTikTokDM(to, msg);
    }

    async sendButtonMessage(to: string, text: string, buttons: { id: string, title: string }[]): Promise<any> {
        let menu = text + '\n';
        buttons.forEach((b, i) => menu += `[${i + 1}] ${b.title}\n`);
        return tiktokAPI.sendTikTokDM(to, menu);
    }

    async sendListMessage(to: string, text: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): Promise<any> {
        let menu = text + '\n';
        sections.forEach(sec => {
            menu += `--- ${sec.title} ---\n`;
            sec.rows.forEach(r => menu += `- ${r.title}\n`);
        });
        return tiktokAPI.sendTikTokDM(to, menu);
    }

    async sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<any> {
        return tiktokAPI.sendTikTokDM(to, `${name}\n${address}\nhttps://maps.google.com/?q=${lat},${long}`);
    }

    async markAsRead(messageId: string): Promise<any> {
        return Promise.resolve();
    }
}
