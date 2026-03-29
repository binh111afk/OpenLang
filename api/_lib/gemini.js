const axios = require('axios');
const { loadEnvFiles } = require('./env');

loadEnvFiles();

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.VITE_GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function ensureGeminiConfig() {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY.');
  }
}

function extractText(responseData) {
  const candidates = Array.isArray(responseData?.candidates)
    ? responseData.candidates
    : [];

  const parts = candidates.flatMap((candidate) =>
    Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [],
  );

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
}

function parseJsonFromText(text) {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Gemini did not return valid JSON.');
    }

    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
}

async function generateGeminiJson(prompt) {
  ensureGeminiConfig();

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    },
    {
      params: { key: GEMINI_API_KEY },
      timeout: 30000,
    },
  );

  const text = extractText(response.data);
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return parseJsonFromText(text);
}

module.exports = {
  generateGeminiJson,
};
