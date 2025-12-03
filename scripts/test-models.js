const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const genAI = new GoogleGenerativeAI(envConfig.GEMINI_API_KEY);

async function listModels() {
    try {
        // There isn't a direct "listModels" on the client instance in the JS SDK usually, 
        // but we can try a simple generation on a known model like 'gemini-pro' to see if it works.
        // Actually, the error message suggested calling ListModels. 
        // The JS SDK might not expose it directly easily without using the google-auth library, 
        // but let's try to just test 'gemini-1.5-flash-latest' or 'gemini-pro'.

        console.log("Testing gemini-1.5-flash-latest...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-flash-latest works!");
        } catch (e) {
            console.log("gemini-1.5-flash-latest failed:", e.message);
        }

        console.log("Testing gemini-pro...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hello");
            console.log("gemini-pro works!");
        } catch (e) {
            console.log("gemini-pro failed:", e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
