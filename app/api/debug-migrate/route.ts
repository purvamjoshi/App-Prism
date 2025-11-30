import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Starting manual migration via API...");

        // We use npx prisma db push. 
        // Note: In Vercel serverless, we might need to point to the local node_modules binary if npx isn't found,
        // but npx is usually available.
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');

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
