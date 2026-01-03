const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiSummary = require('../models/AiSummary');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ FIX: Use supported model
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

/**
 * STEP 1: Generate AI response during chat
 */
const generateResponse = async (messages) => {
  const conversation = messages
    .map(
      (m) =>
        `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`
    )
    .join('\n');

  const prompt = `
You are a medical intake assistant.
Your task is ONLY to ask questions and collect information.
Do NOT diagnose.
Do NOT suggest medicines.

Conversation so far:
${conversation}

Ask the next appropriate question.
`;

  const result = await model.generateContent(prompt);
  const aiText = result.response.text();

  return {
    response: aiText,
    phaseTransition: null,
  };
};

/**
 * STEP 2: Analyze symptoms and create summary
 */
const analyzeSymptoms = async (messages, sessionId, userId) => {
  const conversation = messages
    .map(
      (m) =>
        `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`
    )
    .join('\n');

  const prompt = `
From the conversation below, create a SHORT medical summary.
Do NOT diagnose.
Do NOT prescribe.

Conversation:
${conversation}

Return a simple paragraph summary.
`;

  const result = await model.generateContent(prompt);
  const summaryText = result.response.text();

  const summary = await AiSummary.create({
    userId,
    sessionId,
    summary: summaryText,
    sentToDoctor: true,
  });

  return summary;
};

module.exports = {
  generateResponse,
  analyzeSymptoms,
};
