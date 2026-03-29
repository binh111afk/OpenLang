const { generateAIJson } = require('./_lib/gemini');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

function containsJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/u.test(String(text || ''));
}

function containsVietnameseSignal(text) {
  const value = String(text || '').toLowerCase().trim();
  if (!value) {
    return false;
  }

  return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/u.test(value)
    || /\b(tôi|ban|bạn|em|anh|chi|chị|la|là|mot|một|de|để|hoc|học|ngay|moi|mỗi|va|và|cua|của|dùng|tren|trên|voi|với|cho|con|qua|trai)\b/u.test(value);
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

    return !hasJapanese
      && looksLikeEnglishWord(normalized.frontWord)
      && !containsVietnameseSignal(normalized.example)
      && normalizeForCompare(normalized.backMeaning) !== normalizeForCompare(normalized.frontWord)
      && normalizeForCompare(normalized.exampleTranslation) !== normalizeForCompare(normalized.example);
  }

  return (
    containsJapanese(normalized.frontWord) || containsJapanese(normalized.example)
  );
}

function normalizeForCompare(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
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
  - example must be English only
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

function buildRetryPrompt(basePrompt, language) {
  return `${basePrompt}

IMPORTANT CORRECTION:
- ${language === 'english'
    ? 'Return an English example sentence only. Do not use Vietnamese in the example field.'
    : 'Return a Japanese example sentence only. Do not use English or Vietnamese in the example field.'}
- Keep backMeaning and exampleTranslation in Vietnamese.
- Return JSON only.
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

    const basePrompt = buildPrompt({
      frontWord: payload.frontWord,
      language: payload.language,
    });

    let { provider, result } = await generateAIJson(basePrompt);

    if (!isValidCardForLanguage(result, payload.language)) {
      const retried = await generateAIJson(buildRetryPrompt(basePrompt, payload.language));
      provider = retried.provider;
      result = retried.result;
    }

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
