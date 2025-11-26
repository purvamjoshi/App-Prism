const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyBY5QSUMdrzxreqKlbbtKSdP7n8l6XZwwY");

async function listModels() {
    try {
        // There isn't a direct listModels method on the main class in some versions, 
        // but usually we can try to get a model and run a simple prompt, or use the API directly.
        // However, the error message suggested "Call ListModels".
        // Let's try to use the model manager if available, or just fetch via REST.

        // Using REST API to list models
        const apiKey = "AIzaSyBY5QSUMdrzxreqKlbbtKSdP7n8l6XZwwY";
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
