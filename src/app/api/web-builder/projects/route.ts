import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Update project metadata
export async function PATCH(req: Request) {
    try {
        const { projectId, ...updates } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Update project in Firestore
        await db.collection('web-projects').doc(projectId).update({
            ...updates,
            lastModified: Date.now()
        });

        return NextResponse.json({ success: true, message: 'Project updated successfully' });

    } catch (error: any) {
        console.error('[Projects API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
