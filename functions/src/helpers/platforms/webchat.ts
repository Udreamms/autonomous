
import { MessagingAdapter } from './types';


export class WebChatAdapter implements MessagingAdapter {
    // WebChat relies on Firestore real-time updates.
    // The "sendMessage" action really just ensures the message is logged in the conversation history,
    // which the bot engine already does via logBotMessage. 
    // However, if we need to trigger a push notification or specific event, we do it here.

    // For this architecture, we assume the Frontend widget listens to the 'messages' array in the card document.
    // So this adapter is mostly a pass-through or a safeguard.

    async sendMessage(to: string, text: string): Promise<any> {
        // No external API call needed. 
        // Logic handled by logBotMessage in botEngine which updates Firestore.
        return Promise.resolve();
    }

    async sendMediaMessage(to: string, mediaUrl: string, caption: string, mediaType?: 'image' | 'video' | 'audio' | 'file'): Promise<any> {
        // No external API call needed.
        return Promise.resolve();
    }

    async sendButtonMessage(to: string, text: string, buttons: { id: string, title: string }[]): Promise<any> {
        // No external API call needed.
        // Frontend widget should render buttons from the message history payload (type: 'interactive' or handle custom format).
        // We rely on logBotMessage saving it.
        return Promise.resolve();
    }

    async sendListMessage(to: string, text: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): Promise<any> {
        // No external API call needed.
        return Promise.resolve();
    }

    async sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<any> {
        // No external API call needed.
        return Promise.resolve();
    }

    async markAsRead(messageId: string): Promise<any> {
        // No external API call needed.
        return Promise.resolve();
    }
}
