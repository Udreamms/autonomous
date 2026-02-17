import * as admin from 'firebase-admin';
admin.initializeApp();

export { whatsappWebhook } from './webhooks/whatsapp';
export { metaWebhook } from './webhooks/meta';
export { telegramWebhook } from './webhooks/telegram';
export { xWebhook } from './webhooks/x';
export { webchatWebhook } from './webhooks/webchat';
// Export others as they are created...
