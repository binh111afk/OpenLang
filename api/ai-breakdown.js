const axios = require('axios');
const { loadEnvFiles } = require('./_lib/env');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

loadEnvFiles();

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

function parseJsonFromText(text) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!cleaned) {
    throw new Error('Groq returned empty content.');
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Groq did not return valid JSON.');
    }

    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
}

function normalizeItem(item) {
  const synonymsRaw = Array.isArray(item?.synonyms) ? item.synonyms : [];
  const synonyms = synonymsRaw
    .map((synonym) => String(synonym || '').trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    word: String(item?.word || '').trim(),
    pos: String(item?.pos || '').trim() || 'unknown',
    meaning_vi: String(item?.meaning_vi || '').trim() || 'Xem ngữ cảnh',
    synonyms,
    usage_note: String(item?.usage_note || '').trim(),
  };
}

function buildUserPrompt({ sourceText, translatedText, sourceLang, targetLang }) {
  return `
Câu gốc (${sourceLang}): ${sourceText}
Câu đã dịch (${targetLang}): ${translatedText}

Hãy bóc tách theo cấu trúc JSON đã yêu cầu.
- Chỉ dùng từ/cụm thực sự xuất hiện trong câu đã dịch cho field "word".
- Với mỗi từ khóa chính, cho 3-5 từ đồng nghĩa phổ biến, tự nhiên.
- usage_note ngắn gọn, có tính thực tế giao tiếp.
- Không thêm markdown hay giải thích ngoài JSON.
`.trim();
}

module.exports = async (req, res) => {
  if (withCors(req, res)) {
    return;
  }

  if (!['POST'].includes(req.method)) {
    return allowMethods(res, ['POST', 'OPTIONS']);
  }

  if (!GROQ_API_KEY) {
    return sendJson(res, 500, { error: 'Missing GROQ_API_KEY.' });
  }

  try {
    const payload = await readJsonBody(req);
    const sourceText = String(payload.sourceText || '').trim();
    const translatedText = String(payload.translatedText || '').trim();
    const sourceLang = String(payload.sourceLang || '').trim() || 'unknown';
    const targetLang = String(payload.targetLang || '').trim() || 'unknown';

    if (!sourceText || !translatedText) {
      return sendJson(res, 400, { error: 'Missing sourceText or translatedText.' });
    }

    const systemPrompt = 'Bạn là chuyên gia ngôn ngữ của OpenLang. Tôi sẽ cung cấp một câu gốc và một câu đã dịch. Hãy bóc tách từng từ trong câu đã dịch, xác định từ loại (Part of speech), và quan trọng nhất là đề xuất 3-5 từ đồng nghĩa (Synonyms) cho các từ khóa chính.';

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: buildUserPrompt({ sourceText, translatedText, sourceLang, targetLang }) },
          {
            role: 'user',
            content: `
Trả về chính xác JSON dạng:
{
  "analysis": [
    {
      "word": "stupid",
      "pos": "adjective",
      "meaning_vi": "ngu ngốc",
      "synonyms": ["dumb", "foolish", "unintelligent", "brainless"],
      "usage_note": "Từ này khá nặng nề, nên dùng 'silly' với bạn bè."
    }
  ]
}
`.trim(),
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

    const content = response.data?.choices?.[0]?.message?.content || '';
    const parsed = parseJsonFromText(content);
    const rawAnalysis = Array.isArray(parsed?.analysis) ? parsed.analysis : [];
    const analysis = rawAnalysis
      .map(normalizeItem)
      .filter((item) => item.word && item.meaning_vi);

    return sendJson(res, 200, {
      analysis,
      provider: 'groq',
    });
  } catch (error) {
    return sendJson(res, 500, {
      error:
        error?.response?.data?.error?.message ||
        error instanceof Error
          ? error.message
          : 'Unknown AI breakdown error.',
    });
  }
};
