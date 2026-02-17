import * as functions from 'firebase-functions';

/**
 * X (TWITTER) WEBHOOK HANDLER (CRC Check + Events)
 * 
 * URL: https://[project-id].cloudfunctions.net/xWebhook
 */
import * as crypto from 'crypto';

export const xWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // 1. CRC CHECK (GET) - Required for registering webhook
    if (req.method === 'GET') {
        const crcToken = req.query.crc_token as string;
        if (crcToken) {
            const consumerSecret = process.env.X_CONSUMER_SECRET || 'YOUR_CONSUMER_SECRET';
            const hmac = crypto.createHmac('sha256', consumerSecret).update(crcToken).digest('base64');
            res.status(200).json({ response_token: `sha256=${hmac}` });
        } else {
            res.sendStatus(400);
        }
        return;
    }

    // 2. EVENTS (POST)
    if (req.method === 'POST') {
        functions.logger.info('Received X event', req.body);
        // Process normalizeXMessage(req.body)
        res.sendStatus(200);
    }
});
