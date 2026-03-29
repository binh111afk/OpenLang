const { generateGeminiJson } = require('./_lib/gemini');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

function buildPrompt({ topic, language, cardCount, difficultyRating }) {
  const targetLanguage =
    language === 'japanese' ? 'Japanese' : 'English';

  return `
You are generating a flashcard deck for a language learning app.

Return ONLY valid JSON with this exact shape:
{
  "deckName": "string",
  "description": "string",
  "cards": [
    {
      "frontWord": "string",
      "frontFurigana": "string or empty",
      "backMeaning": "string",
      "example": "string",
      "exampleTranslation": "string"
    }
  ]
}

Requirements:
- Topic: ${topic}
- Target language to learn: ${targetLanguage}
- Number of cards: ${cardCount}
- Difficulty rating: ${difficultyRating}/5
- If language is English: frontWord must be English and backMeaning/exampleTranslation must be Vietnamese.
- If language is Japanese: frontWord must be Japanese, frontFurigana must be included when appropriate, backMeaning/exampleTranslation must be Vietnamese.
- example must be a natural short sentence in the target language using the frontWord.
- description should be concise and user-friendly in Vietnamese.
- deckName should be concise and attractive in Vietnamese.
- Do not include markdown, comments, or explanation.
`.trim();
}

function validatePayload(payload) {
  if (!payload.topic) {
    return 'Missing topic.';
  }

  if (!payload.language) {
    return 'Missing language.';
  }

  return null;
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
    const validationError = validatePayload(payload);

    if (validationError) {
      return sendJson(res, 400, { error: validationError });
    }

    const result = await generateGeminiJson(
      buildPrompt({
        topic: payload.topic,
        language: payload.language,
        cardCount: Math.min(Math.max(Number(payload.cardCount) || 8, 4), 20),
        difficultyRating: Math.min(Math.max(Number(payload.difficultyRating) || 3, 1), 5),
      }),
    );

    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown AI generation error.',
    });
  }
};
