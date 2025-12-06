const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Read .env manually
// Read .env from root
const envPath = path.resolve(__dirname, '..', '.env');
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
        console.log("Testing gemini-2.0-flash...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent("Hello");
            console.log("gemini-2.0-flash works!");
        } catch (e) {
            console.log("gemini-2.0-flash failed:", e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
