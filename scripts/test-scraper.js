const gplayImport = require('google-play-scraper');
const gplay = gplayImport.default || gplayImport;

async function test() {
    try {
        console.log("gplay keys:", Object.keys(gplay));
        if (gplay.sort) {
            console.log("gplay.sort keys:", Object.keys(gplay.sort));
        } else {
            console.log("gplay.sort is undefined");
        }

        console.log("Fetching reviews...");
        const reviews = await gplay.reviews({
            appId: 'com.nextbillion.groww',
            sort: gplay.sort ? gplay.sort.NEWEST : 0, // Fallback if sort is missing
            num: 40,
        });
        console.log("Success! Found " + reviews.data.length + " reviews.");
        console.log("First review:", reviews.data[0]);
    } catch (e) {
        console.error("Error fetching reviews:", e);
    }
}

test();
