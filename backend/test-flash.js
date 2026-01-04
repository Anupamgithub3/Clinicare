require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
async function test() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
        await model.generateContent("hi");
        console.log("SUCCESS");
    } catch (e) {
        console.log("FAILED: " + e.message);
    }
}
test();
