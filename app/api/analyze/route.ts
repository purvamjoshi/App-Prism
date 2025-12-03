import { NextResponse } from "next/server";
import { analyzeApp } from "@/lib/analyze";

export async function POST(req: Request) {
  try {
    const { appId } = await req.json();

    const analysis = await analyzeApp(appId);

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze reviews", details: error.message },
      { status: 500 }
    );
  }
}
