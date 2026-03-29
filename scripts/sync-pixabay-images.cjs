const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');
const axios = require('axios');

loadEnvFiles();

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const PIXABAY_API_KEY =
  process.env.PIXABAY_API_KEY || process.env.VITE_PIXABAY_API_KEY;
const PEXELS_API_KEY =
  process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY;

const TABLE_NAME = process.env.SUPABASE_VOCAB_TABLE || 'vocabulary';
const CONCURRENCY = Number(process.env.PIXABAY_CONCURRENCY || 2);
const DELAY_MS = Number(process.env.PIXABAY_DELAY_MS || 450);
const REQUEST_TIMEOUT_MS = Number(process.env.PIXABAY_TIMEOUT_MS || 15000);
const BATCH_SIZE = Number(process.env.SUPABASE_FETCH_BATCH_SIZE || 1000);
const ONLY_MISSING_IMAGES = String(
  process.env.ONLY_MISSING_IMAGES || 'true',
).toLowerCase() !== 'false';

function loadEnvFiles() {
  const envFiles = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'client/.env'),
    path.resolve(process.cwd(), 'client/.env.local'),
  ];

  for (const filePath of envFiles) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureConfig() {
  const missing = [];

  if (!SUPABASE_URL) missing.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY');
  }
  if (!PIXABAY_API_KEY && !PEXELS_API_KEY) {
    missing.push(
      'PIXABAY_API_KEY/VITE_PIXABAY_API_KEY or PEXELS_API_KEY/VITE_PEXELS_API_KEY',
    );
  }

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

function buildSearchQuery(item) {
  return [item.word, item.category, 'illustration']
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function fetchPixabayImage(item) {
  const query = buildSearchQuery(item);

  const response = await axios.get('https://pixabay.com/api/', {
    timeout: REQUEST_TIMEOUT_MS,
    params: {
      key: PIXABAY_API_KEY,
      q: query,
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

  return {
    provider: 'pixabay',
    query,
    imageUrl: bestHit.webformatURL || bestHit.largeImageURL || null,
    imageLargeUrl: bestHit.largeImageURL || bestHit.webformatURL || null,
    previewUrl: bestHit.previewURL || null,
    width: bestHit.webformatWidth || bestHit.imageWidth || null,
    height: bestHit.webformatHeight || bestHit.imageHeight || null,
    sourcePage: bestHit.pageURL || null,
  };
}

async function fetchPexelsImage(item) {
  const query = buildSearchQuery(item);

  const response = await axios.get('https://api.pexels.com/v1/search', {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Authorization: PEXELS_API_KEY,
    },
    params: {
      query,
      per_page: 5,
      orientation: 'landscape',
    },
  });

  const photos = Array.isArray(response.data?.photos) ? response.data.photos : [];
  const bestPhoto = photos.find((photo) => photo?.src?.medium || photo?.src?.large);

  if (!bestPhoto) {
    return null;
  }

  return {
    provider: 'pexels',
    query,
    imageUrl: bestPhoto.src.medium || bestPhoto.src.large || null,
    imageLargeUrl: bestPhoto.src.large || bestPhoto.src.original || bestPhoto.src.medium || null,
    previewUrl: bestPhoto.src.small || bestPhoto.src.medium || null,
    width: bestPhoto.width || null,
    height: bestPhoto.height || null,
    sourcePage: bestPhoto.url || null,
  };
}

async function fetchIllustrationImage(item) {
  if (PIXABAY_API_KEY) {
    return fetchPixabayImage(item);
  }

  if (PEXELS_API_KEY) {
    return fetchPexelsImage(item);
  }

  throw new Error('No supported image API key found.');
}

async function fetchVocabularyRows(supabase) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, word, category, details')
      .order('word', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Supabase fetch failed: ${error.message}`);
    }

    if (!data?.length) {
      break;
    }

    rows.push(...data);

    if (data.length < BATCH_SIZE) {
      break;
    }

    from += BATCH_SIZE;
  }

  return rows;
}

async function updateVocabularyImage(supabase, row, imageData) {
  const mergedDetails = {
    ...(row.details || {}),
    image_url: imageData.imageUrl,
    image_large_url: imageData.imageLargeUrl,
    image_preview_url: imageData.previewUrl,
    image_source: imageData.provider || (PIXABAY_API_KEY ? 'pixabay' : 'pexels'),
    image_source_page: imageData.sourcePage,
    image_query: imageData.query,
  };

  let updateQuery = supabase
    .from(TABLE_NAME)
    .update({ details: mergedDetails })
    .eq('word', row.word);

  if (row.category) {
    updateQuery = updateQuery.eq('category', row.category);
  }

  const { error: updateError } = await updateQuery;

  if (updateError) {
    throw new Error(`Supabase update failed: ${updateError.message}`);
  }

  return {
    status: 'updated',
    word: row.word,
    category: row.category || null,
    imageUrl: imageData.imageUrl,
  };
}

async function processWord(supabase, row, index) {
  await sleep(index * DELAY_MS);

  try {
    if (
      ONLY_MISSING_IMAGES &&
      (row.details?.image_url || row.details?.image_large_url)
    ) {
      return {
        status: 'skipped_existing',
        word: row.word,
        category: row.category || null,
      };
    }

    const imageData = await fetchIllustrationImage(row);

    if (!imageData?.imageUrl) {
      return {
        status: 'no_image',
        word: row.word,
        category: row.category || null,
      };
    }

    return await updateVocabularyImage(supabase, row, imageData);
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unknown error';

    return {
      status: 'error',
      word: row.word,
      category: row.category || null,
      error: message,
    };
  }
}

async function main() {
  ensureConfig();

  const [{ default: pLimit }, { createClient }] = await Promise.all([
    import('p-limit'),
    import('@supabase/supabase-js'),
  ]);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const vocabularyItems = await fetchVocabularyRows(supabase);
  const limit = pLimit(CONCURRENCY);

  const providerName = PIXABAY_API_KEY ? 'Pixabay' : PEXELS_API_KEY ? 'Pexels' : 'Unknown';
  console.log(`Starting ${providerName} sync for ${vocabularyItems.length} words...`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Concurrency: ${CONCURRENCY}, delay: ${DELAY_MS}ms`);
  console.log(`Only missing images: ${ONLY_MISSING_IMAGES}`);

  const results = await Promise.all(
    vocabularyItems.map((row, index) =>
      limit(() => processWord(supabase, row, index)),
    ),
  );

  const summary = results.reduce(
    (acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    },
    {},
  );

  for (const result of results) {
    if (result.status === 'updated') {
      console.log(`[updated] ${result.word} -> ${result.imageUrl}`);
      continue;
    }

    if (result.status === 'no_image') {
      console.warn(`[no_image] ${result.word}`);
      continue;
    }

    if (result.status === 'skipped_existing') {
      console.log(`[skipped_existing] ${result.word}`);
      continue;
    }

    console.error(`[error] ${result.word}: ${result.error}`);
  }

  console.log('\nSummary:', summary);
}

main().catch((error) => {
  console.error('Pixabay sync failed.');
  console.error(error.message || error);
  process.exitCode = 1;
});
