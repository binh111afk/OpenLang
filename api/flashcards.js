const { createSupabaseAdminClient } = require('./_lib/supabase');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

const TABLE_NAME = 'flashcards';

function validateCardPayload(payload, { requireId = false } = {}) {
  if (requireId && !payload.id) {
    return 'Missing card id.';
  }

  if (!requireId && !payload.deckId) {
    return 'Missing deckId.';
  }

  if (!requireId && !payload.frontWord) {
    return 'Missing frontWord.';
  }

  if (!requireId && !payload.backMeaning) {
    return 'Missing backMeaning.';
  }

  return null;
}

function toResponseShape(card) {
  return {
    id: card.id,
    deckId: card.deck_id,
    language: card.language,
    front: {
      word: card.front_word,
      furigana: card.front_furigana || undefined,
    },
    back: {
      meaning: card.back_meaning,
      example: card.example || '',
      exampleTranslation: card.example_translation || '',
    },
    imageUrl: card.image_url || undefined,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
  };
}

module.exports = async (req, res) => {
  if (withCors(req, res)) {
    return;
  }

  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return allowMethods(res, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
  }

  try {
    const supabase = createSupabaseAdminClient();

    if (req.method === 'GET') {
      const deckId = req.query?.deckId;

      let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

      if (deckId) {
        query = query.eq('deck_id', deckId);
      }

      const { data, error } = await query;

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      return sendJson(res, 200, {
        cards: (data || []).map(toResponseShape),
      });
    }

    const payload = await readJsonBody(req);

    if (req.method === 'POST') {
      const validationError = validateCardPayload(payload);
      if (validationError) {
        return sendJson(res, 400, { error: validationError });
      }

      const insertPayload = {
        deck_id: payload.deckId,
        language: payload.language || 'english',
        front_word: payload.frontWord,
        front_furigana: payload.frontFurigana || null,
        back_meaning: payload.backMeaning,
        example: payload.example || null,
        example_translation: payload.exampleTranslation || null,
        image_url: payload.imageUrl || null,
      };

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      return sendJson(res, 201, { card: toResponseShape(data) });
    }

    if (req.method === 'PUT') {
      const validationError = validateCardPayload(payload, { requireId: true });
      if (validationError) {
        return sendJson(res, 400, { error: validationError });
      }

      const updatePayload = {
        updated_at: new Date().toISOString(),
      };

      if (payload.deckId !== undefined) updatePayload.deck_id = payload.deckId;
      if (payload.language !== undefined) updatePayload.language = payload.language;
      if (payload.frontWord !== undefined) updatePayload.front_word = payload.frontWord;
      if (payload.frontFurigana !== undefined) updatePayload.front_furigana = payload.frontFurigana;
      if (payload.backMeaning !== undefined) updatePayload.back_meaning = payload.backMeaning;
      if (payload.example !== undefined) updatePayload.example = payload.example;
      if (payload.exampleTranslation !== undefined) updatePayload.example_translation = payload.exampleTranslation;
      if (payload.imageUrl !== undefined) updatePayload.image_url = payload.imageUrl;

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .eq('id', payload.id)
        .select('*')
        .single();

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      return sendJson(res, 200, { card: toResponseShape(data) });
    }

    const cardId = payload.id || req.query?.id;

    if (!cardId) {
      return sendJson(res, 400, { error: 'Missing card id.' });
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', cardId);

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 200, { success: true, deletedId: cardId });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error.',
    });
  }
};
