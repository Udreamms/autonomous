"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
async function inspectBotFlow(botId) {
    var _a;
    console.log(`Inspecting Bot ID: ${botId}`);
    try {
        const botRef = db.collection('chatbots').doc(botId);
        const doc = await botRef.get();
        if (!doc.exists) {
            console.log('Bot not found!');
            return;
        }
        const data = doc.data();
        console.log('Bot Name:', data === null || data === void 0 ? void 0 : data.name);
        const nodes = ((_a = data === null || data === void 0 ? void 0 : data.flow) === null || _a === void 0 ? void 0 : _a.nodes) || [];
        console.log(`Found ${nodes.length} nodes.`);
        nodes.forEach((node, index) => {
            console.log(`\n--- Node ${index + 1}: ${node.type} (ID: ${node.id}) ---`);
            if (node.type === 'listMessageNode') {
                console.log('DATA:', JSON.stringify(node.data, null, 2));
                const sections = node.data.sections || [];
                console.log(`Sections count: ${sections.length}`);
                sections.forEach((sec, i) => {
                    console.log(`  Section ${i}: "${sec.title}" - Rows: ${(sec.rows || []).length}`);
                    (sec.rows || []).forEach((row) => {
                        console.log(`    - Row: "${row.title}" (ID: ${row.id})`);
                    });
                });
                if (sections.length === 0)
                    console.warn('⚠️ WARNING: No sections found in this list node!');
            }
            else if (node.type === 'quickReplyNode') {
                console.log('Buttons:', node.data.buttons);
            }
        });
    }
    catch (error) {
        console.error('Error inspecting bot:', error);
    }
}
async function run() {
    const botsSnapshot = await db.collection('chatbots').where('isActive', '==', true).limit(1).get();
    if (!botsSnapshot.empty) {
        await inspectBotFlow(botsSnapshot.docs[0].id);
    }
    else {
        console.log("No active bot found.");
    }
}
run();
//# sourceMappingURL=diagnoseBot.js.map