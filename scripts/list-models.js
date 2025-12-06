const { GoogleGenerativeAI } = require("@google/generative-ai");

const fs = require('fs');
const path = require('path');

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
        // Using REST API to list models
        const apiKey = envConfig.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
