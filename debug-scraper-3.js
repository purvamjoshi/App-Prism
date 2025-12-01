const gplay = require("google-play-scraper");

console.log("gplay object keys:", Object.keys(gplay));
console.log("gplay.default:", gplay.default);
console.log("gplay.sort:", gplay.sort);

async function testScraper() {
    try {
        // Handle potential default export mismatch
        const scraper = gplay.default || gplay;

        console.log("Fetching reviews for com.nextbillion.groww...");
        const reviews = await scraper.reviews({
            appId: "com.nextbillion.groww",
            sort: scraper.sort ? scraper.sort.NEWEST : 2, // 2 is usually NEWEST
            num: 100,
        });
        console.log(`Successfully fetched ${reviews.data.length} reviews.`);
    } catch (error) {
        console.error("Scraper failed:", error);
    }
}

testScraper();
