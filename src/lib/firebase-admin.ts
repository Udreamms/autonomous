import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Check if firebase-admin has already been initialized to avoid "already exists" error in dev
if (!admin.apps.length) {
    try {
        // In production/Vercel/Cloud Run, this usually uses GOOGLE_APPLICATION_CREDENTIALS
        // In local dev, we check for serviceAccountKey.json
        // Note: In Next.js Edge Runtime this might have issues, but we are using Node.js runtime for api routes by default.

        // 1. Check for Service Account in Environment Variable (Preferred for security/CI/Vercel)
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'udreamms-platform-1';
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

        if (serviceAccountEnv) {
            try {
                const serviceAccount = JSON.parse(serviceAccountEnv);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId
                });
                console.log(`Firebase Admin initialized for ${projectId} from FIREBASE_SERVICE_ACCOUNT`);
            } catch (jsonError) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable. Ensuring it is a valid JSON string.');
                throw jsonError;
            }
        } else if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId
            });
            console.log(`Firebase Admin initialized for ${projectId} with serviceAccountKey.json`);
        } else {
            console.warn(`[Firebase Admin] Service account not found in ENV or at ${serviceAccountPath}`);
            console.warn(`Attempting fallback initialization for project: ${projectId}`);
            admin.initializeApp({
                projectId
            });
            console.log(`Firebase Admin initialized for ${projectId} with default credentials/ADC`);
        }
    } catch (error: any) {
        console.error('CRITICAL: Failed to initialize Firebase Admin:', error.message);
        if (error.code === 'permission-denied' || error.message?.includes('PERMISSION_DENIED')) {
            console.error('HINT: This is usually because your local environment lacks GOOGLE_APPLICATION_CREDENTIALS or a Service Account Key.');
        }
    }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
