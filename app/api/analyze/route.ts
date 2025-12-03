import { NextResponse } from "next/server";
import { analyzeApp } from "@/lib/analyze";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const { appId } = await req.json();
    const session = await auth();

    // 1. Check Cache (Global)
    // Find any recent analysis for this app (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cachedEntry = await prisma.searchHistory.findFirst({
      where: {
        appId: appId,
        timestamp: { gt: twentyFourHoursAgo },
        result: { not: null } // Ensure result exists
      },
      orderBy: { timestamp: "desc" },
    });

    if (cachedEntry && cachedEntry.result) {
      console.log(`Returning cached result for ${appId}`);
      return NextResponse.json(cachedEntry.result);
    }

    // 2. Perform Analysis
    console.log(`Analyzing ${appId} (No cache found)`);
    const analysis = await analyzeApp(appId);

    // 3. Save to History (Cache it)
    if (session?.user?.id) {
      await prisma.searchHistory.create({
        data: {
          appId: appId,
          userId: session.user.id,
          result: analysis as any, // Cast to any for Json type compatibility
        },
      });
    }

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze reviews", details: error.message },
      { status: 500 }
    );
  }
}
