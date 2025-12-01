import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Starting manual migration via API...");
        console.log("CWD:", process.cwd());

        // Explicitly locate the schema file
        // In Vercel, it's usually at process.cwd() + '/prisma/schema.prisma'
        const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
        console.log("Target Schema Path:", schemaPath);

        if (!fs.existsSync(schemaPath)) {
            console.error("Schema NOT found at target path.");
            // List files to help debug
            try {
                const files = fs.readdirSync(process.cwd());
                console.log("Files in CWD:", files);
                if (files.includes('prisma')) {
                    const prismaFiles = fs.readdirSync(path.join(process.cwd(), 'prisma'));
                    console.log("Files in prisma dir:", prismaFiles);
                }
            } catch (e) {
                console.error("Error listing files:", e);
            }
        } else {
            console.log("Schema found!");
        }

        // Pass the explicit schema path to the command
        const cmd = `npx prisma db push --accept-data-loss --schema "${schemaPath}"`;
        console.log("Executing command:", cmd);

        const { stdout, stderr } = await execAsync(cmd, {
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
            stack: error.stack,
            cwd: process.cwd()
        }, { status: 500 });
    }
}
