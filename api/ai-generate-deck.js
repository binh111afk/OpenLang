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
    || /\b(tôi|ban|bạn|em|anh|chi|chị|la|là|mot|một|de|để|hoc|học|ngay|moi|mỗi|va|và|cua|của|dùng|dùng|tren|trên|voi|với|cho|con|qua|trai)\b/u.test(value);
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

function filterCardsByLanguage(cards, language) {
  const normalizedCards = Array.isArray(cards) ? cards.map(normalizeCard) : [];

  if (language === 'english') {
    return normalizedCards.filter((card) => {
      if (!card.frontWord || !card.backMeaning) {
        return false;
      }

      const hasJapanese =
        containsJapanese(card.frontWord) ||
        containsJapanese(card.frontFurigana) ||
        containsJapanese(card.example);

      const englishExampleLooksWrong =
        !card.example ||
        containsJapanese(card.example) ||
        containsVietnameseSignal(card.example);

      const vietnameseMeaningLooksWrong =
        !card.backMeaning ||
        containsJapanese(card.backMeaning) ||
        normalizeForCompare(card.backMeaning) === normalizeForCompare(card.frontWord);

      const vietnameseTranslationLooksWrong =
        !card.exampleTranslation ||
        containsJapanese(card.exampleTranslation) ||
        normalizeForCompare(card.exampleTranslation) === normalizeForCompare(card.example);

      return !hasJapanese
        && looksLikeEnglishWord(card.frontWord)
        && !englishExampleLooksWrong
        && !vietnameseMeaningLooksWrong
        && !vietnameseTranslationLooksWrong;
    });
  }

  return normalizedCards.filter((card) => {
    if (!card.frontWord || !card.backMeaning) {
      return false;
    }

    return containsJapanese(card.frontWord) || containsJapanese(card.example);
  });
}

function normalizeForCompare(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

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
- If language is English: every frontWord must be English only. Do NOT generate Japanese, Kanji, Hiragana, Katakana, Romaji, or mixed-language cards.
- If language is English: example must be ENGLISH only.
- If language is English: backMeaning and exampleTranslation must be VIETNAMESE only.
- If language is Japanese: frontWord must be Japanese, frontFurigana must be included when appropriate, backMeaning/exampleTranslation must be Vietnamese.
- example must be a natural short sentence in the target language using the frontWord.
- description should be concise and user-friendly in Vietnamese.
- deckName should be concise and attractive in Vietnamese.
- Do not include markdown, comments, or explanation.
`.trim();
}

function buildRetryPrompt(basePrompt, language) {
  return `${basePrompt}

IMPORTANT CORRECTION:
- The previous answer used the wrong language format.
- ${language === 'english'
    ? 'For English decks: frontWord and example MUST be English. backMeaning and exampleTranslation MUST be Vietnamese.'
    : 'For Japanese decks: frontWord and example MUST be Japanese. backMeaning and exampleTranslation MUST be Vietnamese.'}
- Return JSON only and fix every invalid card.
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

    const basePrompt = buildPrompt({
      topic: payload.topic,
      language: payload.language,
      cardCount: Math.min(Math.max(Number(payload.cardCount) || 8, 4), 20),
      difficultyRating: Math.min(Math.max(Number(payload.difficultyRating) || 3, 1), 5),
    });

    let { provider, result } = await generateAIJson(basePrompt);
    let filteredCards = filterCardsByLanguage(result.cards, payload.language);

    if (filteredCards.length < Math.max(3, Math.floor((Number(payload.cardCount) || 8) / 2))) {
      const retried = await generateAIJson(buildRetryPrompt(basePrompt, payload.language));
      provider = retried.provider;
      result = retried.result;
      filteredCards = filterCardsByLanguage(result.cards, payload.language);
    }

    if (!filteredCards.length) {
      return sendJson(res, 422, {
        error:
          payload.language === 'english'
            ? 'AI đã sinh sai ngôn ngữ. Không có thẻ tiếng Anh hợp lệ.'
            : 'AI đã sinh sai ngôn ngữ. Không có thẻ tiếng Nhật hợp lệ.',
        provider,
      });
    }

    return sendJson(res, 200, {
      ...result,
      cards: filteredCards,
      provider,
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown AI generation error.',
    });
  }
};
