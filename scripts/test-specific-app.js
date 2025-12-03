const gplay = require("google-play-scraper").default || require("google-play-scraper");

const appId = "com.vlv.aravali";

async function testScraper() {
    console.log(`Testing scraper for ${appId}...`);
    try {
        const app = await gplay.app({ appId });
        console.log("App details fetched successfully:", app.title);

        const reviews = await gplay.reviews({
            appId,
            sort: gplay.sort.NEWEST,
            num: 100
        });
        console.log(`Fetched ${reviews.data.length} reviews.`);
        if (reviews.data.length > 0) {
            console.log("Sample review:", reviews.data[0].text);
        } else {
            console.log("No reviews found.");
        }
    } catch (error) {
        console.error("Scraper failed:", error);
    }
}

testScraper();
