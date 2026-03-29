const { createSupabaseAdminClient } = require('./_lib/supabase');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

const TABLE_NAME = 'flashcard_decks';
const BASE_DECK_SELECT =
  'id, name, language, icon, description, cover_image, is_favorite, created_at, updated_at, flashcards(count)';
const ENHANCED_DECK_SELECT =
  'id, name, language, icon, description, cover_image, is_favorite, difficulty_rating, created_at, updated_at, flashcards(count)';

async function selectDecks(supabase) {
  const preferred = await supabase
    .from(TABLE_NAME)
    .select(ENHANCED_DECK_SELECT)
    .order('created_at', { ascending: false });

  if (!preferred.error) {
    return {
      data: preferred.data || [],
      supportsDifficultyRating: true,
    };
  }

  if (!preferred.error.message?.includes('difficulty_rating')) {
    return {
      error: preferred.error,
      data: null,
      supportsDifficultyRating: false,
    };
  }

  const fallback = await supabase
    .from(TABLE_NAME)
    .select(BASE_DECK_SELECT)
    .order('created_at', { ascending: false });

  return {
    data: fallback.data || [],
    error: fallback.error,
    supportsDifficultyRating: false,
  };
}

function mapDeckResponse(deck) {
  return {
    ...deck,
    difficulty_rating: deck.difficulty_rating ?? null,
    card_count: deck.flashcards?.[0]?.count || 0,
  };
}

async function insertDeck(supabase, payload) {
  const insertPayload = {
    name: payload.name,
    language: payload.language,
    icon: payload.icon || '📘',
    description: payload.description || null,
    cover_image: payload.coverImage || null,
    is_favorite: Boolean(payload.isFavorite),
    difficulty_rating: payload.difficultyRating ?? null,
  };

  let result = await supabase
    .from(TABLE_NAME)
    .insert(insertPayload)
    .select('*')
    .single();

  if (!result.error || !result.error.message?.includes('difficulty_rating')) {
    return result;
  }

  delete insertPayload.difficulty_rating;

  result = await supabase
    .from(TABLE_NAME)
    .insert(insertPayload)
    .select('*')
    .single();

  return result;
}

async function updateDeck(supabase, payload) {
  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.language !== undefined) updatePayload.language = payload.language;
  if (payload.icon !== undefined) updatePayload.icon = payload.icon;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.coverImage !== undefined) updatePayload.cover_image = payload.coverImage;
  if (payload.isFavorite !== undefined) updatePayload.is_favorite = Boolean(payload.isFavorite);
  if (payload.difficultyRating !== undefined) {
    updatePayload.difficulty_rating = payload.difficultyRating;
  }

  let result = await supabase
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq('id', payload.id)
    .select('*')
    .single();

  if (!result.error || !result.error.message?.includes('difficulty_rating')) {
    return result;
  }

  delete updatePayload.difficulty_rating;

  result = await supabase
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq('id', payload.id)
    .select('*')
    .single();

  return result;
}

function validateDeckPayload(payload, { requireId = false } = {}) {
  if (requireId && !payload.id) {
    return 'Missing deck id.';
  }

  if (!requireId && !payload.name) {
    return 'Missing deck name.';
  }

  if (!requireId && !payload.language) {
    return 'Missing deck language.';
  }

  return null;
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
      const { data, error } = await selectDecks(supabase);

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      const decks = (data || []).map(mapDeckResponse);

      return sendJson(res, 200, { decks });
    }

    const payload = await readJsonBody(req);

    if (req.method === 'POST') {
      const validationError = validateDeckPayload(payload);
      if (validationError) {
        return sendJson(res, 400, { error: validationError });
      }

      const { data, error } = await insertDeck(supabase, payload);

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      return sendJson(res, 201, { deck: data });
    }

    if (req.method === 'PUT') {
      const validationError = validateDeckPayload(payload, { requireId: true });
      if (validationError) {
        return sendJson(res, 400, { error: validationError });
      }

      const { data, error } = await updateDeck(supabase, payload);

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      return sendJson(res, 200, { deck: data });
    }

    const deckId = payload.id || req.query?.id;

    if (!deckId) {
      return sendJson(res, 400, { error: 'Missing deck id.' });
    }

    const { error: cardsError } = await supabase
      .from('flashcards')
      .delete()
      .eq('deck_id', deckId);

    if (cardsError) {
      return sendJson(res, 500, { error: cardsError.message });
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', deckId);

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 200, { success: true, deletedId: deckId });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error.',
    });
  }
};
