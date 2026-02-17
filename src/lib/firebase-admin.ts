import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Check if firebase-admin has already been initialized to avoid "already exists" error in dev
if (!admin.apps.length) {
    try {
        // Try to load the service account file from the project root
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id,
            });
            console.log('✅ Firebase Admin initialized successfully with serviceAccountKey.json');
            console.log(`📊 Project ID: ${serviceAccount.project_id}`);
            console.log(`📧 Service Account: ${serviceAccount.client_email}`);
        } else {
            // Fallback to default credentials (for production environments like Cloud Run, Vercel, etc.)
            console.warn('⚠️ serviceAccountKey.json not found, trying default credentials...');
            admin.initializeApp();
            console.log('✅ Firebase Admin initialized with default credentials');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error);
        throw error;
    }
} else {
    console.log('ℹ️ Firebase Admin already initialized');
}

const db = admin.firestore();
const auth = admin.auth();

// Test connection on initialization
db.listCollections()
    .then(collections => {
        console.log('✅ Firestore connection successful');
        console.log(`📁 Available collections: ${collections.map(c => c.id).join(', ') || 'None yet'}`);
    })
    .catch(error => {
        console.error('❌ Firestore connection failed:', error.message);
    });

export { admin, db, auth };
