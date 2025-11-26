const gplay = require('google-play-scraper');

async function test() {
    try {
        console.log("Fetching reviews...");
        const reviews = await gplay.reviews({
            appId: 'com.nextbillion.groww',
            sort: gplay.sort.NEWEST,
            num: 40,
        });
        console.log("Success! Found " + reviews.data.length + " reviews.");
        console.log("First review:", reviews.data[0]);
    } catch (e) {
        console.error("Error fetching reviews:", e);
    }
}

test();
