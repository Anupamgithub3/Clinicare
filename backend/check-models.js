require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Fetching available models...');
    try {
        // Note: There isn't a direct listModels method on the client instance in some SDK versions, 
        // but we can try a basic model to valid key. 
        // Standard way usually involves an admin SDK or just guessing.
        // However, let's try the new 'gemini-1.5-flash' which `symptomsService.js` uses.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("test");
        console.log("✅ gemini-1.5-flash works!");
    } catch (e) {
        console.log("❌ gemini-1.5-flash failed:", e.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model.generateContent("test");
        console.log("✅ gemini-pro works!");
    } catch (e) {
        console.log("❌ gemini-pro failed:", e.message);
    }
}

listModels();
