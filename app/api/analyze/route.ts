import { NextResponse } from "next/server";
import gplay from "google-play-scraper";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// CRITICAL: Do not hardcode API keys here. Use environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: Request) {
  try {
    const { appId } = await req.json();

    if (!appId) {
      return NextResponse.json({ error: "App ID is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Server Configuration Error: Missing GEMINI_API_KEY" }, { status: 500 });
    }

    // Handle potential default export mismatch for google-play-scraper
    const scraper = (gplay as any).default || gplay;

    // 1. Fetch Reviews (Limit 1500)
    const reviews = await scraper.reviews({
      appId: appId,
      sort: scraper.sort.NEWEST,
      num: 1500,
    });

    if (!reviews.data || reviews.data.length === 0) {
      return NextResponse.json({ error: "No reviews found" }, { status: 404 });
    }

    // 2. Split Reviews by Period
    const now = new Date();
    // Normalize "now" to end of day for consistent filtering if needed, or just use current time.
    // Let's keep it simple: "Last 7 Days" = [now - 7 days, now]

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const fifteenDaysAgo = new Date(now);
    fifteenDaysAgo.setDate(now.getDate() - 15);

    const last7DaysReviews = reviews.data.filter((r: any) => new Date(r.date) >= sevenDaysAgo);
    const last15DaysReviews = reviews.data.filter((r: any) => new Date(r.date) >= fifteenDaysAgo);

    const formatReviews = (reviews: any[]) =>
      reviews.map((r: any) => `Date: ${r.date}, Rating: ${r.score}, Text: "${r.text}"`).join("\n");

    const prompt = `
      Analyze the reviews for the app "${appId}". I have provided two datasets: "Last 7 Days" and "Last 15 Days".

      Reviews (Last 7 Days):
      ${formatReviews(last7DaysReviews)}

      Reviews (Last 15 Days):
      ${formatReviews(last15DaysReviews)}

      Task:
      For EACH period ("last_7_days" and "last_15_days"), provide the following analysis:
      1.  **Summary**: A concise paragraph (approx. 50 words) summarizing the overall sentiment and key events/issues.
      2.  **Daily Ratings**: Group ratings by date. Return an array of daily stats.
      3.  **Themes**: Identify the top 5 themes. For each theme, provide the theme name and the percentage of positive vs. negative sentiment (must sum to 100%).
      4.  **Quotes**: Select 3 most relevant user quotes. For each, include the text, rating, date, sentiment label ("Positive" or "Negative"), and a short content tag (max 3 words).
      5.  **Action Items**: Suggest 3 actionable steps.
      
      Return ONLY valid JSON in the following format (no markdown code blocks):
      {
        "last_7_days": {
          "summary": "...",
          "daily_ratings": [{ "date": "YYYY-MM-DD", "positive": 10, "negative": 2 }],
          "themes": [{ "name": "...", "sentiment": { "positive": 80, "negative": 20 } }],
          "quotes": [{ "text": "...", "rating": 5, "time": "...", "sentiment": "Positive", "tag": "..." }],
          "action_items": ["..."]
        },
        "last_15_days": {
          // Same structure as above
        }
      }
    `;

    // 3. Call Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up JSON string if needed (remove markdown)
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(cleanedText);

    // Sort daily_ratings by date ascending to ensure chronological order
    const sortByDate = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

    if (analysis.last_7_days?.daily_ratings) {
      analysis.last_7_days.daily_ratings.sort(sortByDate);
    }
    if (analysis.last_15_days?.daily_ratings) {
      analysis.last_15_days.daily_ratings.sort(sortByDate);
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
