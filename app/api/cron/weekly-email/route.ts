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
        // 1. Fetch all subscriptions
        const subscriptions = await prisma.subscription.findMany({
            include: {
                user: {
                    select: { email: true }
                }
            }
        });

        const results = [];

        // 2. Process each subscription
        for (const sub of subscriptions) {
            if (!sub.user.email) {
                continue;
            }

            try {
                console.log(`Processing weekly email for ${sub.user.email} (App: ${sub.appId})`);

                // Analyze the app
                const analysis = await analyzeApp(sub.appId);
                const appTitle = analysis.appTitle || sub.appTitle || sub.appId;

                // Send the email
                await sendWeeklyReport(sub.user.email, analysis, appTitle);

                results.push({ email: sub.user.email, status: 'sent', appId: sub.appId });

            } catch (error: any) {
                console.error(`Failed to process for ${sub.user.email} (App: ${sub.appId}):`, error);
                results.push({ email: sub.user.email, status: 'failed', appId: sub.appId, error: error.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Cron job failed:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
