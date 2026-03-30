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
  return {
    word: String(item?.word || '').trim(),
    reading: String(item?.reading || '').trim() || undefined,
    meaning: String(item?.meaning || '').trim(),
    partOfSpeech: String(item?.partOfSpeech || '').trim() || 'Khác',
  };
}

function normalizeResult(result, isSentence) {
  const translatedText = String(result?.translatedText || '').trim();
  const breakdownRaw = Array.isArray(result?.breakdown) ? result.breakdown : [];
  const breakdown = isSentence
    ? breakdownRaw
        .map(normalizeBreakdownItem)
        .filter((item) => item.word && item.meaning)
    : [];

  return {
    translatedText,
    breakdown,
  };
}

function buildPrompt({ text, sourceLang, targetLang, isSentence }) {
  return `
You are a translation assistant for a language learning app.

Return ONLY valid JSON with this exact shape:
{
  "translatedText": "string",
  "breakdown": [
    {
      "word": "string",
      "reading": "string or empty",
      "meaning": "string",
      "partOfSpeech": "string"
    }
  ]
}

Task:
- Translate from ${toLabel(sourceLang)} to ${toLabel(targetLang)}.
- Input text: ${text}

Rules:
- translatedText must be natural and accurate in target language.
- If input is a sentence (${isSentence ? 'YES' : 'NO'}):
  - Provide useful sentence decomposition in breakdown.
  - breakdown items should follow the same order as words/chunks in translatedText when possible.
- If input is NOT a sentence:
  - Set breakdown to [] exactly.
- Keep meaning in Vietnamese for easier learning.
- reading is required mainly for Japanese words; otherwise use empty string.
- Do not add markdown or explanation outside JSON.
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

    const { provider, result } = await generateAIJson(
      buildPrompt({
        text,
        sourceLang,
        targetLang,
        isSentence,
      }),
    );

    const normalized = normalizeResult(result, isSentence);

    if (!normalized.translatedText) {
      return sendJson(res, 422, {
        error: 'AI response is missing translated text.',
        provider,
      });
    }

    return sendJson(res, 200, {
      translatedText: normalized.translatedText,
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
