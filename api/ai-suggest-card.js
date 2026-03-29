const { generateAIJson } = require('./_lib/gemini');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

function containsJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/u.test(String(text || ''));
}

function looksLikeEnglishWord(text) {
  return /^[A-Za-z][A-Za-z\s' -]*$/.test(String(text || '').trim());
}

function normalizeCard(card) {
  return {
    frontWord: String(card?.frontWord || '').trim(),
    frontFurigana: String(card?.frontFurigana || '').trim(),
    backMeaning: String(card?.backMeaning || '').trim(),
    example: String(card?.example || '').trim(),
    exampleTranslation: String(card?.exampleTranslation || '').trim(),
  };
}

function isValidCardForLanguage(card, language) {
  const normalized = normalizeCard(card);

  if (language === 'english') {
    const hasJapanese =
      containsJapanese(normalized.frontWord) ||
      containsJapanese(normalized.frontFurigana) ||
      containsJapanese(normalized.example);

    return !hasJapanese && looksLikeEnglishWord(normalized.frontWord);
  }

  return (
    containsJapanese(normalized.frontWord) || containsJapanese(normalized.example)
  );
}

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
  - do NOT output Japanese, Kanji, Hiragana, Katakana, or Romaji
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

    if (!isValidCardForLanguage(result, payload.language)) {
      return sendJson(res, 422, {
        error:
          payload.language === 'english'
            ? 'AI đã trả về nội dung không phải tiếng Anh.'
            : 'AI đã trả về nội dung không phải tiếng Nhật.',
        provider,
      });
    }

    return sendJson(res, 200, { card: normalizeCard(result), provider });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown AI suggestion error.',
    });
  }
};
