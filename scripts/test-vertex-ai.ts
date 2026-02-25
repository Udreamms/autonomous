import { VertexAI } from '@google-cloud/vertexai';
import * as fs from 'fs';
import * as path from 'path';

// Manually load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

async function verifyVertex() {
    console.log('--- Verifying Vertex AI Configuration ---');
    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'udreamms-platform-1';
    const location = 'us-central1';

    console.log(`Project: ${project}`);
    console.log(`Location: ${location}`);

    let keyOptions = {};
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.log('Service account found in environment.');
        try {
            const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            keyOptions = { credentials };
        } catch (e) {
            console.error('Error parsing service account JSON:', e);
            return;
        }
    } else {
        console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT not found. Falling back to default credentials.');
    }

    const vertexAI = new VertexAI({ project, location, ...keyOptions });

    try {
        console.log('\nTesting Gemini 1.5 Flash...');
        const flashModel = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });
        const flashResult = await flashModel.generateContent('Hello code builder!');
        const flashResp = await flashResult.response;
        console.log('Flash Response:', flashResp.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) + '...');
        console.log('✅ Gemini 1.5 Flash is working.');

        console.log('\nTesting Gemini 1.5 Pro...');
        const proModel = vertexAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });
        const proResult = await proModel.generateContent('Plan a complex React app structure in JSON.');
        const proResp = await proResult.response;
        console.log('Pro Response:', proResp.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) + '...');
        console.log('✅ Gemini 1.5 Pro is working.');

        console.log('\nTesting CodeGemma Autocomplete...');
        const gemmaModel = vertexAI.getGenerativeModel({ model: 'codegemma-7b' });
        const gemmaResult = await gemmaModel.generateContent('<|fim_prefix|>function hello() {<|fim_suffix|>}<|fim_middle|>');
        const gemmaResp = await gemmaResult.response;
        console.log('Gemma Response:', gemmaResp.candidates?.[0]?.content?.parts?.[0]?.text);
        console.log('✅ CodeGemma is working.');

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.message);
        if (error.details) console.error('Details:', error.details);
    }
}

verifyVertex();
