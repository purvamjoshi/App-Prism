import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Starting manual migration via API...");

        // We use npx prisma db push. 
        // We must set HOME and npm_config_cache to /tmp because the default home dir is read-only in Vercel.
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
            env: {
                ...process.env,
                HOME: '/tmp',
                npm_config_cache: '/tmp/.npm',
            }
        });

        console.log("Migration stdout:", stdout);
        if (stderr) console.error("Migration stderr:", stderr);

        return NextResponse.json({
            success: true,
            message: "Database migration attempted.",
            output: stdout,
            errorOutput: stderr
        });
    } catch (error: any) {
        console.error("Migration failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
