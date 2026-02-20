import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const githubToken = cookieStore.get('github_token')?.value;

        if (!githubToken) {
            return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 });
        }

        const { projectId, repoUrl, projectName } = await req.json();

        if (!projectId || !repoUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const vercelToken = process.env.VERCEL_TOKEN;

        if (!vercelToken) {
            return NextResponse.json({
                error: 'Vercel token not configured. Add VERCEL_TOKEN to your .env.local file.'
            }, { status: 500 });
        }

        // Extract repo owner and name from GitHub URL
        // Example: https://github.com/user/repo -> user/repo
        const repoPath = repoUrl.replace('https://github.com/', '');

        // Create deployment on Vercel
        const deploymentResponse = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${vercelToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `web-builder-${projectId}`,
                gitSource: {
                    type: 'github',
                    repo: repoPath,
                    ref: 'main'
                },
                projectSettings: {
                    framework: 'vite',
                    buildCommand: 'npm run build',
                    outputDirectory: 'dist',
                    installCommand: 'npm install'
                }
            })
        });

        if (!deploymentResponse.ok) {
            const errorData = await deploymentResponse.json();
            console.error('[Deploy] Vercel API error:', errorData);
            throw new Error(errorData.error?.message || 'Deployment failed');
        }

        const deployment = await deploymentResponse.json();

        // Get deployment URL
        const deploymentUrl = `https://${deployment.url}`;

        return NextResponse.json({
            success: true,
            url: deploymentUrl,
            deploymentId: deployment.id,
            status: deployment.readyState
        });

    } catch (error: any) {
        console.error('[Deploy] Error:', error);
        return NextResponse.json({
            error: error.message || 'Deployment failed'
        }, { status: 500 });
    }
}

// Get deployment status
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const deploymentId = searchParams.get('deploymentId');

        if (!deploymentId) {
            return NextResponse.json({ error: 'Deployment ID required' }, { status: 400 });
        }

        const vercelToken = process.env.VERCEL_TOKEN;

        if (!vercelToken) {
            return NextResponse.json({ error: 'Vercel token not configured' }, { status: 500 });
        }

        const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
            headers: {
                'Authorization': `Bearer ${vercelToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch deployment status');
        }

        const deployment = await response.json();

        return NextResponse.json({
            status: deployment.readyState,
            url: `https://${deployment.url}`,
            createdAt: deployment.createdAt
        });

    } catch (error: any) {
        console.error('[Deploy Status] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
