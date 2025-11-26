const gplay = require("google-play-scraper");

async function debugScraper() {
    try {
        const appId = "com.nextbillion.groww";
        console.log(`Fetching reviews for ${appId}...`);

        // Handle potential default export mismatch
        const scraper = gplay.default || gplay;

        // Fetch 1000 reviews
        const reviews = await scraper.reviews({
            appId: appId,
            sort: scraper.sort.NEWEST,
            num: 1000,
        });

        if (!reviews.data || reviews.data.length === 0) {
            console.log("No reviews found.");
            return;
        }

        const dates = reviews.data.map(r => new Date(r.date));
        const newest = new Date(Math.max(...dates));
        const oldest = new Date(Math.min(...dates));

        console.log(`Fetched ${reviews.data.length} reviews.`);
        console.log(`Newest Review: ${newest.toISOString()}`);
        console.log(`Oldest Review: ${oldest.toISOString()}`);

        // Count reviews per day
        const counts = {};
        reviews.data.forEach(r => {
            const dateStr = new Date(r.date).toISOString().split('T')[0];
            counts[dateStr] = (counts[dateStr] || 0) + 1;
        });

        console.log("\nReviews per day:");
        console.table(counts);

    } catch (e) {
        console.error("Error:", e);
    }
}

debugScraper();
