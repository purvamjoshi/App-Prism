import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { sendWeeklyReport } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { analysis, appId } = await req.json();
  const appTitle = analysis.appTitle || appId;

  if (!analysis) {
    return NextResponse.json({ error: "Analysis data required" }, { status: 400 });
  }

  try {
    const response = await sendWeeklyReport(session.user.email, analysis, appTitle);
    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
