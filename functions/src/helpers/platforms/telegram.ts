
import { MessagingAdapter } from './types';
import * as telegramAPI from '../telegramAPI';

export class TelegramAdapter implements MessagingAdapter {
    async sendMessage(to: string, text: string): Promise<any> {
        return telegramAPI.sendTelegramMessage(to, text);
    }

    async sendMediaMessage(to: string, mediaUrl: string, caption: string, mediaType?: 'image' | 'video' | 'audio' | 'file'): Promise<any> {
        if (mediaType === 'image') {
            return telegramAPI.sendTelegramPhoto(to, mediaUrl, caption);
        } else if (mediaType === 'video' || mediaType === 'audio') {
            return telegramAPI.sendTelegramMedia(to, mediaUrl, mediaType, caption);
        } else {
            return telegramAPI.sendTelegramMedia(to, mediaUrl, 'document', caption);
        }
    }

    async sendButtonMessage(to: string, text: string, buttons: { id: string, title: string }[]): Promise<any> {
        return telegramAPI.sendTelegramButtons(to, text, buttons);
    }

    async sendListMessage(to: string, text: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): Promise<any> {
        // Telegram doesn't have a native List Message like WhatsApp.
        // We will flatten it into buttons (Inline Keyboard) if small, or just text.
        // Similar strategy to Messenger.
        const allOptions: any[] = [];
        sections.forEach(sec => allOptions.push(...sec.rows));

        if (allOptions.length <= 10) {
            return telegramAPI.sendTelegramButtons(to, text, allOptions);
        } else {
            let menuText = text + '\n';
            allOptions.forEach(opt => menuText += `- ${opt.title}\n`);
            return telegramAPI.sendTelegramMessage(to, menuText);
        }
    }

    async sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<any> {
        // Telegram sendLocation takes lat/long. Name/address would be a separate text message if needed.
        await telegramAPI.sendTelegramLocation(to, lat, long);
        if (name || address) {
            await telegramAPI.sendTelegramMessage(to, `${name}\n${address}`);
        }
    }

    async markAsRead(messageId: string): Promise<any> {
        return telegramAPI.markTelegramMessageAsRead(messageId);
    }
}
