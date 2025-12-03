import { prisma } from "@/lib/prisma";
import { analyzeApp } from "@/lib/analyze";
import { sendWeeklyReport } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    // Verify cron secret if needed (optional but recommended for production)
    // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    try {
        // 1. Fetch all users with weekly email enabled
        const users = await prisma.user.findMany({
            where: { isWeeklyEmailEnabled: true },
            include: {
                searchHistory: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                },
            },
        });

        const results = [];

        // 2. Process each user
        for (const user of users) {
            if (!user.email || user.searchHistory.length === 0) {
                continue;
            }

            const lastAppId = user.searchHistory[0].appId;

            try {
                console.log(`Processing weekly email for ${user.email} (App: ${lastAppId})`);

                // Analyze the app
                const analysis = await analyzeApp(lastAppId);
                const appTitle = analysis.appTitle || lastAppId;

                // Send the email
                await sendWeeklyReport(user.email, analysis, appTitle);

                results.push({ email: user.email, status: 'sent', appId: lastAppId });

            } catch (error: any) {
                console.error(`Failed to process for ${user.email}:`, error);
                results.push({ email: user.email, status: 'failed', error: error.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Cron job failed:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
