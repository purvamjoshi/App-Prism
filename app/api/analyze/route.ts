import { NextResponse } from "next/server";
import gplay from "google-play-scraper";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBY5QSUMdrzxreqKlbbtKSdP7n8l6XZwwY");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: Request) {
  try {
    const { appId } = await req.json();

    if (!appId) {
      return NextResponse.json({ error: "App ID is required" }, { status: 400 });
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

    // 2. Split Reviews by Week
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay()); // Last Sunday
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setMilliseconds(-1);

    const thisWeekReviews = reviews.data.filter((r: any) => new Date(r.date) >= startOfThisWeek);
    const lastWeekReviews = reviews.data.filter((r: any) => {
      const d = new Date(r.date);
      return d >= startOfLastWeek && d < startOfThisWeek;
    });

    const formatReviews = (reviews: any[]) =>
      reviews.map((r: any) => `Date: ${r.date}, Rating: ${r.score}, Text: "${r.text}"`).join("\n");

    const prompt = `
      Analyze the reviews for the app "${appId}". I have split them into two periods: "This Week" and "Last Week".

      Reviews (This Week):
      ${formatReviews(thisWeekReviews)}

      Reviews (Last Week):
      ${formatReviews(lastWeekReviews)}

      Task:
      For EACH period ("this_week" and "last_week"), provide the following analysis:
      1.  **Weekly Summary**: A concise paragraph (approx. 50 words) summarizing the overall sentiment and key events/issues.
      2.  **Weekly Ratings**: Group ratings by date. Return an array of daily stats.
      3.  **Themes**: Identify the top 5 themes. For each theme, provide the theme name and the percentage of positive vs. negative sentiment (must sum to 100%).
      4.  **Quotes**: Select 3 most relevant user quotes. For each, include the text, rating, date, sentiment label ("Positive" or "Negative"), and a short content tag (max 3 words).
      5.  **Action Items**: Suggest 3 actionable steps.
      
      Return ONLY valid JSON in the following format (no markdown code blocks):
      {
        "this_week": {
          "weekly_summary": "...",
          "weekly_ratings": [{ "date": "...", "positive": 10, "negative": 2 }],
          "themes": [{ "name": "...", "sentiment": { "positive": 80, "negative": 20 } }],
          "quotes": [{ "text": "...", "rating": 5, "time": "...", "sentiment": "Positive", "tag": "..." }],
          "action_items": ["..."]
        },
        "last_week": {
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

    // Sort weekly_ratings by date ascending to ensure chronological order
    const sortByDate = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

    if (analysis.this_week?.weekly_ratings) {
      analysis.this_week.weekly_ratings.sort(sortByDate);
    }
    if (analysis.last_week?.weekly_ratings) {
      analysis.last_week.weekly_ratings.sort(sortByDate);
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
