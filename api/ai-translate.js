const { generateAIJson } = require('./_lib/gemini');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

const SUPPORTED_LANGUAGES = new Set(['vietnamese', 'english', 'japanese']);

function toLabel(language) {
  if (language === 'vietnamese') return 'Vietnamese';
  if (language === 'english') return 'English';
  if (language === 'japanese') return 'Japanese';
  return language;
}

function looksLikeSentence(text) {
  const value = String(text || '').trim();
  if (!value) return false;

  // Heuristic: sentence usually has multiple words or ending punctuation.
  const wordCount = value.split(/\s+/).filter(Boolean).length;
  return wordCount >= 3 || /[.!?。！？]$/.test(value);
}

function normalizeBreakdownItem(item) {
  const synonymsRaw = Array.isArray(item?.synonyms) ? item.synonyms : [];
  const synonyms = synonymsRaw
    .map((syn) => String(syn || '').trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    word: String(item?.word || '').trim(),
    reading: String(item?.reading || '').trim() || undefined,
    meaning: String(item?.meaning || '').trim(),
    partOfSpeech: String(item?.partOfSpeech || '').trim() || 'Khác',
    synonyms,
    shortExample: String(item?.shortExample || '').trim(),
  };
}

function normalizeResult(result, isSentence) {
  const translatedText = String(result?.translatedText || '').trim();
  const alternativesRaw = result?.alternatives && typeof result.alternatives === 'object'
    ? result.alternatives
    : {};
  const alternatives = {
    formal: String(alternativesRaw.formal || '').trim(),
    casual: String(alternativesRaw.casual || '').trim(),
    slang: String(alternativesRaw.slang || '').trim(),
  };
  const breakdownRaw = Array.isArray(result?.breakdown) ? result.breakdown : [];
  const breakdown = isSentence
    ? breakdownRaw
        .map(normalizeBreakdownItem)
        .filter((item) => item.word && item.meaning)
    : [];

  return {
    translatedText,
    alternatives,
    breakdown,
  };
}

function normalizeForMatch(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function breakdownAlignsWithTranslatedText(translatedText, breakdown, targetLang) {
  if (!Array.isArray(breakdown) || !breakdown.length) {
    return false;
  }

  const normalizedTranslated = normalizeForMatch(translatedText);
  if (!normalizedTranslated) {
    return false;
  }

  return breakdown.every((item) => {
    const word = String(item?.word || '').trim();
    if (!word) {
      return false;
    }

    if (targetLang === 'japanese') {
      // For Japanese output, each chunk should appear in translated sentence exactly.
      return String(translatedText).includes(word);
    }

    const normalizedWord = normalizeForMatch(word);
    return Boolean(normalizedWord) && normalizedTranslated.includes(normalizedWord);
  });
}

function buildPrompt({ text, sourceLang, targetLang, isSentence }) {
  return `
You are a translation assistant for a language learning app.

Return ONLY valid JSON with this exact shape:
{
  "translatedText": "string",
  "alternatives": {
    "formal": "string",
    "casual": "string",
    "slang": "string"
  },
  "breakdown": [
    {
      "word": "string",
      "reading": "string or empty",
      "meaning": "string",
      "partOfSpeech": "string",
      "synonyms": ["string", "string", "string"],
      "shortExample": "string"
    }
  ]
}

Task:
- Translate from ${toLabel(sourceLang)} to ${toLabel(targetLang)}.
- Input text: ${text}

Rules:
- translatedText must be NATURAL SPEAKING (daily conversation style), not literal dictionary translation.
- Prefer COMMONLY USED words over rare/archaic words.
- Example for Vietnamese->English: prefer "stupid" or "dumb" over less common choices like "dull" when context matches.
- alternatives.formal, alternatives.casual, alternatives.slang must contain 3 different expression styles in target language.
- If input is a sentence (${isSentence ? 'YES' : 'NO'}):
  - Provide useful sentence decomposition in breakdown.
  - IMPORTANT: breakdown.word must be words/chunks taken directly from translatedText, not from source text.
  - breakdown items should follow the same order as words/chunks in translatedText when possible.
  - For each breakdown item, provide at least 2-3 useful synonyms in synonyms.
  - For each breakdown item, provide one short example sentence in target language (shortExample).
- If input is NOT a sentence:
  - Set breakdown to [] exactly.
- Keep meaning in Vietnamese for easier learning.
- reading is required mainly for Japanese words; otherwise use empty string.
- Do not add markdown or explanation outside JSON.
`.trim();
}

function buildRetryPrompt(basePrompt) {
  return `${basePrompt}

IMPORTANT CORRECTION:
- The previous breakdown was invalid.
- Every breakdown.word MUST be copied from translatedText (exact word/chunk from translated sentence).
- Never use source-language tokens in breakdown.word.
- Keep translatedText and alternatives in natural speaking style.
- Return JSON only.
`.trim();
}

function validatePayload(payload) {
  const text = String(payload?.text || '').trim();
  const sourceLang = String(payload?.sourceLang || '').trim();
  const targetLang = String(payload?.targetLang || '').trim();

  if (!text) return 'Missing text.';
  if (!sourceLang) return 'Missing sourceLang.';
  if (!targetLang) return 'Missing targetLang.';
  if (!SUPPORTED_LANGUAGES.has(sourceLang)) return 'Unsupported sourceLang.';
  if (!SUPPORTED_LANGUAGES.has(targetLang)) return 'Unsupported targetLang.';
  if (sourceLang === targetLang) return 'sourceLang and targetLang must be different.';

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

    const text = String(payload.text || '').trim();
    const sourceLang = String(payload.sourceLang || '').trim();
    const targetLang = String(payload.targetLang || '').trim();
    const isSentence = looksLikeSentence(text);

    let { provider, result } = await generateAIJson(
      buildPrompt({
        text,
        sourceLang,
        targetLang,
        isSentence,
      }),
    );

    let normalized = normalizeResult(result, isSentence);

    if (
      isSentence &&
      normalized.breakdown.length > 0 &&
      !breakdownAlignsWithTranslatedText(normalized.translatedText, normalized.breakdown, targetLang)
    ) {
      const retried = await generateAIJson(
        buildRetryPrompt(
          buildPrompt({
            text,
            sourceLang,
            targetLang,
            isSentence,
          }),
        ),
      );

      provider = retried.provider;
      result = retried.result;
      normalized = normalizeResult(result, isSentence);
    }

    if (!normalized.translatedText) {
      return sendJson(res, 422, {
        error: 'AI response is missing translated text.',
        provider,
      });
    }

    if (
      isSentence &&
      normalized.breakdown.length > 0 &&
      !breakdownAlignsWithTranslatedText(normalized.translatedText, normalized.breakdown, targetLang)
    ) {
      return sendJson(res, 422, {
        error: 'AI breakdown is not aligned with translated sentence.',
        provider,
      });
    }

    return sendJson(res, 200, {
      translatedText: normalized.translatedText,
      alternatives: normalized.alternatives,
      breakdown: normalized.breakdown,
      isSentence,
      provider,
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown AI translation error.',
    });
  }
};
