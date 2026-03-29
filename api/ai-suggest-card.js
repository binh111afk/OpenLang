const { generateAIJson } = require('./_lib/gemini');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

function buildPrompt({ frontWord, language }) {
  return `
You are generating one flashcard suggestion for a language learning app.

Return ONLY valid JSON with this exact shape:
{
  "frontWord": "string",
  "frontFurigana": "string or empty",
  "backMeaning": "string",
  "example": "string",
  "exampleTranslation": "string"
}

Requirements:
- Input word: ${frontWord}
- Target language: ${language === 'japanese' ? 'Japanese' : 'English'}
- If target language is English:
  - frontWord must stay in English
  - backMeaning and exampleTranslation must be Vietnamese
  - example must be a natural English sentence using the word
- If target language is Japanese:
  - frontWord must stay in Japanese
  - include frontFurigana if applicable
  - backMeaning and exampleTranslation must be Vietnamese
  - example must be a natural Japanese sentence using the word
- No markdown or explanation.
`.trim();
}

module.exports = async (req, res) => {
  if (withCors(req, res)) {
    return;
  }

  if (!['POST'].includes(req.method)) {
    return allowMethods(res, ['POST', 'OPTIONS']);
  }

  try {
    const payload = await readJsonBody(req);

    if (!payload.frontWord) {
      return sendJson(res, 400, { error: 'Missing frontWord.' });
    }

    if (!payload.language) {
      return sendJson(res, 400, { error: 'Missing language.' });
    }

    const { provider, result } = await generateAIJson(
      buildPrompt({
        frontWord: payload.frontWord,
        language: payload.language,
      }),
    );

    return sendJson(res, 200, { card: result, provider });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown AI suggestion error.',
    });
  }
};
