// Test script to verify Firebase Admin SDK connection
import { db, auth } from '../src/lib/firebase-admin';

async function testFirebaseConnection() {
    console.log('\n🔍 Testing Firebase Admin SDK Connection...\n');

    try {
        // Test 1: List collections
        console.log('Test 1: Listing Firestore collections...');
        const collections = await db.listCollections();
        console.log(`✅ Found ${collections.length} collections:`);
        collections.forEach(col => console.log(`   - ${col.id}`));

        // Test 2: Try to read from a collection (if exists)
        if (collections.length > 0) {
            const firstCollection = collections[0];
            console.log(`\nTest 2: Reading from collection "${firstCollection.id}"...`);
            const snapshot = await firstCollection.limit(5).get();
            console.log(`✅ Found ${snapshot.size} documents in "${firstCollection.id}"`);
        }

        // Test 3: Check auth
        console.log('\nTest 3: Checking Firebase Auth...');
        const users = await auth.listUsers(1);
        console.log(`✅ Auth is working. Found ${users.users.length} user(s)`);

        console.log('\n✅ All Firebase tests passed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Firebase connection test failed:');
        console.error(error);
        process.exit(1);
    }
}

testFirebaseConnection();
