require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // note: listModels is a method on the *client* or we iterate. 
        // Actually the SDK doesn't have a direct 'client.listModels' helper easily accessible 
        // without using the specific API approach, but let's try a workaround or 
        // use the REST API if needed. Wait, GoogleGenerativeAI usually assumes you know the model.
        // Let's try to just hit the REST API directly to list models to be sure.

        // Easier approach with fetch since SDK might abstract it.
        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else {
            console.log("Available Models:");
            if (data.models) {
                data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
            } else {
                console.log("No models found.");
            }
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

listModels();
