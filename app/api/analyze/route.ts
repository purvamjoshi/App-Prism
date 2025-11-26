import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import gplay from "google-play-scraper";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { appId } = await req.json();

        if (!appId) {
            return NextResponse.json({ error: "App ID is required" }, { status: 400 });
        }

        // 1. Scrape Reviews
        // Note: google-play-scraper might throw if appId is invalid
        const reviews = await gplay.reviews({
            appId: appId,
            sort: (gplay.sort as any).NEWEST,
            num: 50,
        });

        const reviewsText = reviews.data.map((r: any) =>
            `Rating: ${r.score}/5\nDate: ${r.date}\nText: ${r.text}`
        ).join("\n---\n");

        // 2. Analyze with Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      Analyze these Google Play Store reviews for the app "${appId}".
      
      Reviews:
      ${reviewsText}
      
      Output a JSON object with the following structure:
      {
        "themes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5"],
        "quotes": [
          { "text": "quote text", "rating": 5, "time": "date string from review" }
        ],
        "action_items": ["Action 1", "Action 2", "Action 3"]
      }
      
      - "themes": Top 5 recurring themes/topics.
      - "quotes": 3-5 representative quotes. Include the star rating and date.
      - "action_items": 3 specific, actionable recommendations for the product team.
      
      Return ONLY valid JSON. Do not use markdown code blocks.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if present
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const analysis = JSON.parse(cleanJson);

        // 3. Save History
        // Check if entry exists for this user/app combo to avoid duplicates or just create new entry?
        // User asked for "history", so maybe a log is better.
        await prisma.searchHistory.create({
            data: {
                appId,
                userId: session.user.id,
            },
        });

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("Analysis error:", error);
        return NextResponse.json({ error: "Failed to analyze reviews. Check App ID or try again." }, { status: 500 });
    }
}
