import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
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
