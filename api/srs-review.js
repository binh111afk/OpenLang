const { createSupabaseAdminClient } = require('./_lib/supabase');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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

function rankFromXp(totalXp) {
  if (totalXp >= 2500) return 'Diamond';
  if (totalXp >= 1200) return 'Platinum';
  if (totalXp >= 500) return 'Gold';
  if (totalXp >= 100) return 'Silver';
  return 'Bronze';
}

function calculateSrsUpdate(current, quality) {
  const now = new Date();
  const currentEase = Number(current?.ease_factor ?? 2.5);
  const currentInterval = Number(current?.interval_days ?? 1);
  const currentReviewCount = Number(current?.review_count ?? 0);
  const currentCorrectStreak = Number(current?.correct_streak ?? 0);
  const currentLapseCount = Number(current?.lapse_count ?? 0);

  let easeFactor = currentEase;
  let intervalDays = currentInterval;
  let status = 'learning';
  let correctStreak = currentCorrectStreak;
  let lapseCount = currentLapseCount;

  if (quality < 3) {
    intervalDays = 1;
    easeFactor = clamp(currentEase - 0.2, MIN_EASE, MAX_EASE);
    correctStreak = 0;
    lapseCount += 1;
    status = 'learning';
  } else {
    const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    easeFactor = clamp(currentEase + delta, MIN_EASE, MAX_EASE);

    if (currentReviewCount <= 0) {
      intervalDays = 1;
    } else if (currentReviewCount === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(1, Math.round(currentInterval * easeFactor));
    }

    correctStreak += 1;
    status = intervalDays >= 21 ? 'mastered' : 'learning';
  }

  const nextReview = new Date(now);
  nextReview.setUTCDate(nextReview.getUTCDate() + intervalDays);

  return {
    interval_days: intervalDays,
    ease_factor: easeFactor,
    status,
    review_count: currentReviewCount + 1,
    correct_streak: correctStreak,
    lapse_count: lapseCount,
    last_reviewed_at: now.toISOString(),
    next_review: nextReview.toISOString(),
    updated_at: now.toISOString(),
  };
}

function xpFromQuality(quality) {
  if (quality <= 1) return 2;
  if (quality === 2) return 5;
  if (quality === 3) return 10;
  if (quality === 4) return 14;
  return 18;
}

module.exports = async (req, res) => {
  if (withCors(req, res)) {
    return;
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return allowMethods(res, ['GET', 'POST', 'OPTIONS']);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase, req);

    if (authError || !user) {
      return sendJson(res, 401, { error: authError || 'Unauthorized.' });
    }

    if (req.method === 'GET') {
      const limit = Math.max(1, Math.min(100, Number(req.query?.limit) || 20));

      const { data, error } = await supabase
        .from('user_progress')
        .select('vocabulary_id, next_review, interval_days, ease_factor, status, review_count')
        .eq('user_id', user.id)
        .lte('next_review', new Date().toISOString())
        .order('next_review', { ascending: true })
        .limit(limit);

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      return sendJson(res, 200, {
        reviews: data || [],
      });
    }

    const payload = await readJsonBody(req);
    const vocabularyId = payload.vocabularyId;
    const quality = Math.max(0, Math.min(5, Math.round(Number(payload.quality))));

    if (!vocabularyId) {
      return sendJson(res, 400, { error: 'Missing vocabularyId.' });
    }

    if (!Number.isFinite(Number(payload.quality))) {
      return sendJson(res, 400, { error: 'Missing or invalid quality (0..5).' });
    }

    const { data: currentProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('vocabulary_id', vocabularyId)
      .maybeSingle();

    if (progressError) {
      return sendJson(res, 500, { error: progressError.message });
    }

    const computed = calculateSrsUpdate(currentProgress || null, quality);
    const previousStatus = currentProgress?.status || 'new';

    const { data: savedProgress, error: saveProgressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          vocabulary_id: vocabularyId,
          ...computed,
          created_at: currentProgress?.created_at || new Date().toISOString(),
        },
        { onConflict: 'user_id,vocabulary_id' },
      )
      .select('*')
      .single();

    if (saveProgressError) {
      return sendJson(res, 500, { error: saveProgressError.message });
    }

    const xpGained = xpFromQuality(quality);
    const newlyMastered = previousStatus !== 'mastered' && computed.status === 'mastered' ? 1 : 0;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, total_xp, total_words_mastered')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return sendJson(res, 500, { error: profileError.message });
    }

    const nextTotalXp = Number(profile?.total_xp || 0) + xpGained;
    const nextMastered = Number(profile?.total_words_mastered || 0) + newlyMastered;
    const nextRank = rankFromXp(nextTotalXp);

    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          total_xp: nextTotalXp,
          total_words_mastered: nextMastered,
          current_rank: nextRank,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    if (profileUpsertError) {
      return sendJson(res, 500, { error: profileUpsertError.message });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: todayStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('id, xp_gained, words_reviewed, words_mastered, study_minutes, created_at')
      .eq('user_id', user.id)
      .eq('study_date', today)
      .maybeSingle();

    if (statsError) {
      return sendJson(res, 500, { error: statsError.message });
    }

    const { error: statsUpsertError } = await supabase
      .from('daily_stats')
      .upsert(
        {
          user_id: user.id,
          study_date: today,
          xp_gained: Number(todayStats?.xp_gained || 0) + xpGained,
          words_reviewed: Number(todayStats?.words_reviewed || 0) + 1,
          words_mastered: Number(todayStats?.words_mastered || 0) + newlyMastered,
          study_minutes: Number(todayStats?.study_minutes || 0),
          updated_at: new Date().toISOString(),
          created_at: todayStats?.created_at || new Date().toISOString(),
        },
        { onConflict: 'user_id,study_date' },
      );

    if (statsUpsertError) {
      return sendJson(res, 500, { error: statsUpsertError.message });
    }

    return sendJson(res, 200, {
      progress: savedProgress,
      reward: {
        xpGained,
        totalXp: nextTotalXp,
        currentRank: nextRank,
      },
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
