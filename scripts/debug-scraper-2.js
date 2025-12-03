const gplay = require('google-play-scraper');
console.log("gplay.default keys:", Object.keys(gplay.default));
if (gplay.default.sort) {
    console.log("gplay.default.sort keys:", Object.keys(gplay.default.sort));
}
