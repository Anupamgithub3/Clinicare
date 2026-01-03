require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Gemini Models:");
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(m.name.replace('models/', ''));
                }
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
