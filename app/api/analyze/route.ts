import { NextResponse } from "next/server";
import gplay from "google-play-scraper";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// CRITICAL: Do not hardcode API keys here. Use environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

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

    // 1. Fetch Reviews & App Details
    // Use hardcoded integer 2 for NEWEST if sort enum is missing to be safe
    const sortOption = scraper.sort ? scraper.sort.NEWEST : 2;

    // Fetch reviews and app details in parallel
    const [reviews, appDetails] = await Promise.all([
      scraper.reviews({
        appId: appId,
        sort: sortOption,
        num: 3000,
      }),
      scraper.app({ appId: appId }).catch(() => ({ title: appId })) // Fallback to ID if fetch fails
    ]);

    const appTitle = appDetails.title || appId;
    console.log(`Fetched ${reviews.data.length} reviews for ${appTitle}`);

    if (reviews.data && reviews.data.length > 0) {
      const dates = reviews.data.map((r: any) => new Date(r.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      console.log(`Review Date Range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
    }

    if (!reviews.data || reviews.data.length === 0) {
      return NextResponse.json({ error: "No reviews found" }, { status: 404 });
    }

    // 2. Split Reviews by Period
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Normalize to start of day

    const fifteenDaysAgo = new Date(now);
    fifteenDaysAgo.setDate(now.getDate() - 15);
    fifteenDaysAgo.setHours(0, 0, 0, 0); // Normalize to start of day

    const last7DaysReviews = reviews.data.filter((r: any) => new Date(r.date) >= sevenDaysAgo);
    const last15DaysReviews = reviews.data.filter((r: any) => new Date(r.date) >= fifteenDaysAgo);

    const formatReviews = (reviews: any[]) =>
      reviews.map((r: any) => `Date: ${r.date}, Rating: ${r.score}, Text: "${r.text}"`).join("\n");

    // Helper to calculate daily ratings programmatically
    const calculateDailyRatings = (reviews: any[], startDate: Date) => {
      const ratingsMap = new Map<string, { positive: number; negative: number }>();

      // Initialize all dates in range with 0
      const currentDate = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (currentDate <= today) {
        ratingsMap.set(currentDate.toISOString().split('T')[0], { positive: 0, negative: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      reviews.forEach((r: any) => {
        const dateStr = new Date(r.date).toISOString().split('T')[0];
        if (ratingsMap.has(dateStr)) {
          const stats = ratingsMap.get(dateStr)!;
          if (r.score >= 4) stats.positive++;
          else if (r.score <= 2) stats.negative++;
          // Neutral (3) ignored for pos/neg split as per typical sentiment analysis, or could be counted as neutral
        }
      });

      return Array.from(ratingsMap.entries()).map(([date, stats]) => ({
        date,
        positive: stats.positive,
        negative: stats.negative
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const dailyRatings7Days = calculateDailyRatings(last7DaysReviews, sevenDaysAgo);
    const dailyRatings15Days = calculateDailyRatings(last15DaysReviews, fifteenDaysAgo);

    const prompt = `
      Analyze the reviews for the app "${appTitle}". I have provided two datasets: "Last 7 Days" and "Last 15 Days".

      Reviews (Last 7 Days):
      ${formatReviews(last7DaysReviews)}

      Reviews (Last 15 Days):
      ${formatReviews(last15DaysReviews)}

      Task:
      For EACH period ("last_7_days" and "last_15_days"), provide the following analysis:
      1.  **Summary**: A concise paragraph (approx. 50 words) summarizing the overall sentiment and key events/issues.
      2.  **Themes**: Identify the top 5 themes. For each theme, provide the theme name and the percentage of positive vs. negative sentiment (must sum to 100%).
      3.  **Quotes**: Select 3 most relevant user quotes. For each, include the text, rating, date, sentiment label ("Positive" or "Negative"), and a short content tag (max 3 words).
      4.  **Action Items**: Suggest 3 actionable steps.
      
      Return ONLY valid JSON in the following format (no markdown code blocks):
      {
        "last_7_days": {
          "summary": "...",
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

    // Merge programmatic daily ratings into the analysis result
    analysis.last_7_days.daily_ratings = dailyRatings7Days;
    analysis.last_15_days.daily_ratings = dailyRatings15Days;

    // Add appTitle to the result
    analysis.appTitle = appTitle;

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze reviews", details: error.message },
      { status: 500 }
    );
  }
}
