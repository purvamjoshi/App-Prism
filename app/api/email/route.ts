import { auth } from "@/auth";
import { LoopsClient } from "loops";
import { NextResponse } from "next/server";

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

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

  // Use Last 7 Days data for the email
  const data = analysis.last_7_days;

  if (!data) {
    return NextResponse.json({ error: "No analysis data found for Last 7 Days" }, { status: 400 });
  }

  try {
    // Construct HTML content for the emailContent variable
    const emailContent = `
      <h2>Weekly Pulse: ${appTitle}</h2>
      
      <p><strong>Summary:</strong> ${data.summary}</p>

      <h3>Top Themes</h3>
      <ul>
        ${data.themes.map((t: any) => `<li><strong>${t.name}</strong>: ${t.sentiment.positive}% Positive / ${t.sentiment.negative}% Negative</li>`).join("")}
      </ul>
      
      <h3>User Voices</h3>
      ${data.quotes.map((q: any) => `
        <div style="margin-bottom: 10px; padding: 10px; border-left: 3px solid ${q.sentiment === 'Positive' ? '#10b981' : '#ef4444'}; background: #f9f9f9;">
          <p style="margin: 0; font-style: italic;">"${q.text}"</p>
          <small style="display: block; margin-top: 5px;">${q.rating} ⭐ - ${new Date(q.time).toLocaleDateString()}</small>
        </div>
      `).join("")}
      
      <h3>Recommended Actions</h3>
      <ul>
        ${data.action_items.map((a: string) => `<li>${a}</li>`).join("")}
      </ul>
    `;

    const response = await loops.sendTransactionalEmail({
      transactionalId: "cmif2qsxeg0222a0iv1rg598g",
      email: session.user.email,
      dataVariables: {
        emailContent: emailContent,
      },
    });

    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
