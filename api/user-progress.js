const { createSupabaseAdminClient } = require('./_lib/supabase');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

const TABLE_NAME = 'user_deck_progress';

function readBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== 'string') {
    return null;
  }

  const [type, token] = header.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

async function getAuthenticatedUser(supabase, req) {
  const token = readBearerToken(req);

  if (!token) {
    return { user: null, error: 'Missing bearer token.' };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: 'Invalid or expired auth token.' };
  }

  return { user: data.user, error: null };
}

function toRow(row) {
  return {
    deckId: row.deck_id,
    progress: Number(row.progress || 0),
    currentIndex: Number(row.current_index || 0),
    totalCards: Number(row.total_cards || 0),
    updatedAt: row.updated_at,
  };
}

module.exports = async (req, res) => {
  if (withCors(req, res)) {
    return;
  }

  if (!['GET', 'PUT'].includes(req.method)) {
    return allowMethods(res, ['GET', 'PUT', 'OPTIONS']);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase, req);

    if (authError || !user) {
      return sendJson(res, 401, { error: authError || 'Unauthorized.' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('deck_id, progress, current_index, total_cards, updated_at')
        .eq('user_id', user.id);

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      return sendJson(res, 200, {
        progress: (data || []).map(toRow),
      });
    }

    const payload = await readJsonBody(req);

    if (!payload.deckId) {
      return sendJson(res, 400, { error: 'Missing deckId.' });
    }

    const progress = Math.max(0, Math.min(100, Math.round(Number(payload.progress) || 0)));
    const currentIndex = Math.max(0, Math.round(Number(payload.currentIndex) || 0));
    const totalCards = Math.max(0, Math.round(Number(payload.totalCards) || 0));

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(
        {
          user_id: user.id,
          deck_id: String(payload.deckId),
          progress,
          current_index: currentIndex,
          total_cards: totalCards,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,deck_id',
        },
      )
      .select('deck_id, progress, current_index, total_cards, updated_at')
      .single();

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 200, {
      entry: toRow(data),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error.',
    });
  }
};
