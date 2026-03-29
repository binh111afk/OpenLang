const axios = require('axios');

const { createSupabaseAdminClient } = require('./_lib/supabase');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

const PIXABAY_API_KEY =
  process.env.PIXABAY_API_KEY || process.env.VITE_PIXABAY_API_KEY;

function buildSearchQuery(card) {
  return [card.front_word, card.back_meaning, 'illustration']
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function fetchPixabayImage(card) {
  if (!PIXABAY_API_KEY) {
    throw new Error('Missing PIXABAY_API_KEY or VITE_PIXABAY_API_KEY.');
  }

  const response = await axios.get('https://pixabay.com/api/', {
    timeout: 15000,
    params: {
      key: PIXABAY_API_KEY,
      q: buildSearchQuery(card),
      image_type: 'photo',
      safesearch: 'true',
      per_page: 5,
      order: 'popular',
      orientation: 'horizontal',
    },
  });

  const hits = Array.isArray(response.data?.hits) ? response.data.hits : [];
  const bestHit = hits.find((hit) => hit.webformatURL || hit.largeImageURL);

  if (!bestHit) {
    return null;
  }

  return bestHit.webformatURL || bestHit.largeImageURL || null;
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
    const deckId = payload.deckId;

    if (!deckId) {
      return sendJson(res, 400, { error: 'Missing deckId.' });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('flashcards')
      .select('id, front_word, back_meaning, image_url')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    const cards = data || [];
    const results = [];

    for (const card of cards) {
      if (card.image_url) {
        results.push({
          id: card.id,
          word: card.front_word,
          imageUrl: card.image_url,
          status: 'skipped_existing',
        });
        continue;
      }

      try {
        const imageUrl = await fetchPixabayImage(card);

        if (!imageUrl) {
          results.push({
            id: card.id,
            word: card.front_word,
            status: 'no_image',
          });
          continue;
        }

        const { error: updateError } = await supabase
          .from('flashcards')
          .update({
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', card.id);

        if (updateError) {
          results.push({
            id: card.id,
            word: card.front_word,
            status: 'error',
            error: updateError.message,
          });
          continue;
        }

        results.push({
          id: card.id,
          word: card.front_word,
          imageUrl,
          status: 'updated',
        });
      } catch (imageError) {
        results.push({
          id: card.id,
          word: card.front_word,
          status: 'error',
          error:
            imageError instanceof Error ? imageError.message : 'Unknown image error.',
        });
      }
    }

    return sendJson(res, 200, { results });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error.',
    });
  }
};
