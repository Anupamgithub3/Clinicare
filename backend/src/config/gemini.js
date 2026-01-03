const { GoogleGenerativeAI } = require('@google/generative-ai');

// Debugging: Check if API key is present
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is missing in environment variables!");
} else {
  console.log(`Gemini initialized with Key: ${apiKey.substring(0, 5)}...`);
}

const genAI = new GoogleGenerativeAI(apiKey);

const generateContent = async (prompt, modelName = 'gemini-pro') => {
  try {
    console.log(`Sending request to Gemini model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("GEMINI API ERROR DETAILED:", JSON.stringify(error, null, 2));
    console.error("Error Message:", error.message);
    // Return the actual error to the user for now to help specific debugging
    return `Error connecting to AI: ${error.message}`;
  }
};

module.exports = {
  genAI,
  generateContent,
};

