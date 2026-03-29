const axios = require('axios');
const { loadEnvFiles } = require('./env');

loadEnvFiles();

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY =
  process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ||
  process.env.OPENRONTER_API_KEY ||
  process.env.VITE_OPENROUTER_API_KEY;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

function parseJsonFromText(text, providerLabel) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!cleaned) {
    throw new Error(`${providerLabel} returned an empty response.`);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error(`${providerLabel} did not return valid JSON.`);
    }

    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
}

function extractGeminiText(responseData) {
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

function extractChatCompletionText(responseData) {
  const choices = Array.isArray(responseData?.choices) ? responseData.choices : [];

  return choices
    .map((choice) => choice?.message?.content || '')
    .join('\n')
    .trim();
}

async function tryGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing.');
  }

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

  return parseJsonFromText(extractGeminiText(response.data), 'Gemini');
}

async function tryGroq(prompt) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is missing.');
  }

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: GROQ_MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  );

  return parseJsonFromText(extractChatCompletionText(response.data), 'Groq');
}

async function tryOpenRouter(prompt) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is missing.');
  }

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: OPENROUTER_MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3001',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'OpenLang',
      },
      timeout: 30000,
    },
  );

  return parseJsonFromText(extractChatCompletionText(response.data), 'OpenRouter');
}

async function generateAIJson(prompt) {
  const providers = [
    { name: 'gemini', fn: tryGemini },
    { name: 'groq', fn: tryGroq },
    { name: 'openrouter', fn: tryOpenRouter },
  ];

  const errors = [];

  for (const provider of providers) {
    try {
      const result = await provider.fn(prompt);
      return {
        provider: provider.name,
        result,
      };
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Unknown AI provider error.';

      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(`All AI providers failed. ${errors.join(' | ')}`);
}

module.exports = {
  generateAIJson,
  generateGeminiJson: async (prompt) => {
    const { result } = await generateAIJson(prompt);
    return result;
  },
};
