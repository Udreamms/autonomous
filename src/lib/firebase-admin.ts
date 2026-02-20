import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Check if firebase-admin has already been initialized to avoid "already exists" error in dev
if (!admin.apps.length) {
    try {
        // In production/Vercel/Cloud Run, this usually uses GOOGLE_APPLICATION_CREDENTIALS
        // In local dev, we check for serviceAccountKey.json
        // Note: In Next.js Edge Runtime this might have issues, but we are using Node.js runtime for api routes by default.

        // We can try to load the service account file if it exists locally
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin initialized with serviceAccountKey.json');
        } else {
            console.warn(`[Firebase Admin] Service account file not found at ${serviceAccountPath}`);
            console.warn("Trying to initialize with default credentials...");
            admin.initializeApp();
            console.log('Firebase Admin initialized with default credentials (likely from environment)');
        }
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
    }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
