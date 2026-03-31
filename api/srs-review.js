const { createSupabaseAdminClient } = require('./_lib/supabase');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');
const { addDays, endOfLocalDayUtcISO, getLocalDateISO, getRecentDateRange, resolveTimeZone } = require('./_lib/datetime');
const {
  FREEZE_COST_XP,
  computeStreakCheckin,
  normalizeProfile,
  purchaseFreeze,
  shouldShowStreakPopup,
} = require('./_lib/streak');

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readAction(req, payload) {
  const rawQueryAction = Array.isArray(req.query?.action) ? req.query?.action[0] : req.query?.action;
  const rawPayloadAction = payload?.action;
  return String(rawPayloadAction || rawQueryAction || '').trim().toLowerCase();
}

function readMode(req) {
  const raw = Array.isArray(req.query?.mode) ? req.query?.mode[0] : req.query?.mode;
  return String(raw || '').trim().toLowerCase();
}

function readTimezone(req) {
  const raw = req.headers?.['x-timezone'] || req.headers?.['X-Timezone'];
  return resolveTimeZone(Array.isArray(raw) ? raw[0] : raw);
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

async function getProfileForUser(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, goal, total_xp, total_words_mastered, current_rank, current_streak, longest_streak, streak_freeze_count, last_study_date, last_streak_popup_date')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error };
  }

  return { profile: data || null, error: null };
}

async function upsertProfile(supabase, profilePatch) {
  return supabase
    .from('profiles')
    .upsert(
      {
        ...profilePatch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
}

async function getDashboardSummary({ supabase, userId, timeZone }) {
  const now = new Date();
  const todayIso = getLocalDateISO(now, timeZone);
  const recentDates = getRecentDateRange(todayIso, 7);
  const firstDate = recentDates[0];
  const endOfTodayUtcIso = endOfLocalDayUtcISO(todayIso, timeZone);

  const [{ profile, error: profileError }, statsResult, dueResult] = await Promise.all([
    getProfileForUser(supabase, userId),
    supabase
      .from('daily_stats')
      .select('study_date, xp_gained, words_reviewed')
      .eq('user_id', userId)
      .gte('study_date', firstDate)
      .lte('study_date', todayIso),
    supabase
      .from('user_progress')
      .select('vocabulary_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'mastered')
      .lte('next_review', endOfTodayUtcIso),
  ]);

  if (profileError) {
    return { error: profileError };
  }

  if (statsResult.error) {
    return { error: statsResult.error };
  }

  if (dueResult.error) {
    return { error: dueResult.error };
  }

  const statsMap = new Map((statsResult.data || []).map((row) => [row.study_date, row]));
  const todayStats = statsMap.get(todayIso);
  const safeGoal = Math.max(1, Number(profile?.goal || 15));
  const reviewedToday = Number(todayStats?.words_reviewed || 0);
  const dailyGoalProgressPercent = Math.min(100, Math.round((reviewedToday / safeGoal) * 100));
  const dueTodayCount = Number(dueResult.count || 0);

  const heatmap = recentDates.map((date) => {
    const row = statsMap.get(date);
    const xpGained = Number(row?.xp_gained || 0);
    const wordsReviewed = Number(row?.words_reviewed || 0);
    return {
      date,
      xpGained,
      wordsReviewed,
      studied: xpGained > 0 || wordsReviewed > 0,
    };
  });

  const normalizedProfile = normalizeProfile(profile, userId);

  const yesterdayIso = addDays(todayIso, -1);
  const popupClaimedToday = shouldShowStreakPopup(normalizedProfile, todayIso);
  const popupPendingLogin =
    normalizedProfile.last_study_date === yesterdayIso &&
    normalizedProfile.last_streak_popup_date !== todayIso;

  return {
    error: null,
    summary: {
      heatmap,
      dueTodayCount,
      dailyGoal: {
        current: reviewedToday,
        goal: safeGoal,
        progressPercent: dailyGoalProgressPercent,
      },
      streak: {
        current: normalizedProfile.current_streak,
        longest: normalizedProfile.longest_streak,
        freezeCount: normalizedProfile.streak_freeze_count,
        lastStudyDate: normalizedProfile.last_study_date,
      },
      totalWordsMastered: normalizedProfile.total_words_mastered,
      popup: {
        show: popupClaimedToday || popupPendingLogin,
        streakDelta: 1,
        pending: popupPendingLogin,
      },
      timezone: timeZone,
      today: todayIso,
    },
  };
}

async function handlePurchaseFreeze({ supabase, userId, quantity }) {
  const { profile, error } = await getProfileForUser(supabase, userId);
  if (error) {
    return { status: 500, body: { error: error.message } };
  }

  const normalizedProfile = normalizeProfile(profile, userId);
  const result = purchaseFreeze(normalizedProfile, quantity);

  if (!result.ok) {
    return {
      status: 400,
      body: {
        error: result.error,
        costXp: result.totalCost,
        currentXp: result.currentXp,
      },
    };
  }

  const nextRank = rankFromXp(result.nextProfile.total_xp);
  const { error: saveError } = await upsertProfile(supabase, {
    id: userId,
    total_xp: result.nextProfile.total_xp,
    current_rank: nextRank,
    streak_freeze_count: result.nextProfile.streak_freeze_count,
  });

  if (saveError) {
    return { status: 500, body: { error: saveError.message } };
  }

  return {
    status: 200,
    body: {
      ok: true,
      freezeCount: result.nextProfile.streak_freeze_count,
      totalXp: result.nextProfile.total_xp,
      costXp: result.totalCost,
      currentRank: nextRank,
    },
  };
}

async function handleManualCheckin({ supabase, userId, timeZone }) {
  const todayIso = getLocalDateISO(new Date(), timeZone);
  const { profile, error: profileError } = await getProfileForUser(supabase, userId);

  if (profileError) {
    return { status: 500, body: { error: profileError.message } };
  }

  const normalized = normalizeProfile(profile, userId);
  const transition = computeStreakCheckin(normalized, todayIso);

  if (transition.changed) {
    const { error: profileUpsertError } = await upsertProfile(supabase, {
      id: userId,
      current_streak: transition.nextProfile.current_streak,
      longest_streak: transition.nextProfile.longest_streak,
      streak_freeze_count: transition.nextProfile.streak_freeze_count,
      last_study_date: transition.nextProfile.last_study_date,
      last_streak_popup_date: transition.nextProfile.last_streak_popup_date,
    });

    if (profileUpsertError) {
      return { status: 500, body: { error: profileUpsertError.message } };
    }
  }

  const { data: todayStats, error: statsError } = await supabase
    .from('daily_stats')
    .select('created_at, xp_gained, words_reviewed, words_mastered, study_minutes')
    .eq('user_id', userId)
    .eq('study_date', todayIso)
    .maybeSingle();

  if (statsError) {
    return { status: 500, body: { error: statsError.message } };
  }

  const { error: statsUpsertError } = await supabase
    .from('daily_stats')
    .upsert(
      {
        user_id: userId,
        study_date: todayIso,
        xp_gained: Number(todayStats?.xp_gained || 0),
        words_reviewed: Number(todayStats?.words_reviewed || 0),
        words_mastered: Number(todayStats?.words_mastered || 0),
        study_minutes: Number(todayStats?.study_minutes || 0),
        updated_at: new Date().toISOString(),
        created_at: todayStats?.created_at || new Date().toISOString(),
      },
      { onConflict: 'user_id,study_date' },
    );

  if (statsUpsertError) {
    return { status: 500, body: { error: statsUpsertError.message } };
  }

  return {
    status: 200,
    body: {
      ok: true,
      alreadyCheckedIn: !transition.changed,
      streak: {
        current: transition.nextProfile.current_streak,
        longest: transition.nextProfile.longest_streak,
        freezeCount: transition.nextProfile.streak_freeze_count,
        usedFreeze: transition.usedFreeze,
        reset: transition.reset,
      },
      popup: {
        show: transition.changed && transition.streakDelta > 0,
        streakDelta: transition.streakDelta,
      },
    },
  };
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

    const timeZone = readTimezone(req);

    if (req.method === 'GET') {
      const mode = readMode(req);

      if (mode === 'dashboard') {
        const { summary, error } = await getDashboardSummary({
          supabase,
          userId: user.id,
          timeZone,
        });

        if (error) {
          return sendJson(res, 500, { error: error.message });
        }

        return sendJson(res, 200, summary);
      }

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
    const action = readAction(req, payload);

    if (action === 'purchase_freeze') {
      const result = await handlePurchaseFreeze({
        supabase,
        userId: user.id,
        quantity: payload.quantity,
      });
      return sendJson(res, result.status, result.body);
    }

    if (action === 'manual_checkin') {
      const result = await handleManualCheckin({
        supabase,
        userId: user.id,
        timeZone,
      });
      return sendJson(res, result.status, result.body);
    }

    if (action === 'ack_popup') {
      const todayIso = getLocalDateISO(new Date(), timeZone);
      const { error: ackError } = await upsertProfile(supabase, {
        id: user.id,
        last_streak_popup_date: todayIso,
      });

      if (ackError) {
        return sendJson(res, 500, { error: ackError.message });
      }

      return sendJson(res, 200, { ok: true });
    }

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

    const { profile, error: profileError } = await getProfileForUser(supabase, user.id);

    if (profileError) {
      return sendJson(res, 500, { error: profileError.message });
    }

    const normalizedProfile = normalizeProfile(profile, user.id);

    const localToday = getLocalDateISO(new Date(), timeZone);

    const { data: todayStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('id, xp_gained, words_reviewed, words_mastered, study_minutes, created_at')
      .eq('user_id', user.id)
      .eq('study_date', localToday)
      .maybeSingle();

    if (statsError) {
      return sendJson(res, 500, { error: statsError.message });
    }

    const firstLessonToday = !todayStats || Number(todayStats.words_reviewed || 0) === 0;
    const streakTransition = firstLessonToday
      ? computeStreakCheckin(normalizedProfile, localToday)
      : {
          nextProfile: normalizedProfile,
          changed: false,
          usedFreeze: false,
          streakDelta: 0,
          reset: false,
        };

    const nextTotalXp = Number(streakTransition.nextProfile.total_xp || 0) + xpGained;
    const nextMastered = Number(streakTransition.nextProfile.total_words_mastered || 0) + newlyMastered;
    const nextRank = rankFromXp(nextTotalXp);

    const { error: profileUpsertError } = await upsertProfile(supabase, {
      id: user.id,
      total_xp: nextTotalXp,
      total_words_mastered: nextMastered,
      current_rank: nextRank,
      current_streak: streakTransition.nextProfile.current_streak,
      longest_streak: streakTransition.nextProfile.longest_streak,
      streak_freeze_count: streakTransition.nextProfile.streak_freeze_count,
      last_study_date: streakTransition.nextProfile.last_study_date,
      last_streak_popup_date: streakTransition.nextProfile.last_streak_popup_date,
    });

    if (profileUpsertError) {
      return sendJson(res, 500, { error: profileUpsertError.message });
    }

    const { error: statsUpsertError } = await supabase
      .from('daily_stats')
      .upsert(
        {
          user_id: user.id,
          study_date: localToday,
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
      streak: {
        current: streakTransition.nextProfile.current_streak,
        longest: streakTransition.nextProfile.longest_streak,
        freezeCount: streakTransition.nextProfile.streak_freeze_count,
        usedFreeze: streakTransition.usedFreeze,
        reset: streakTransition.reset,
      },
      popup: {
        show: streakTransition.changed && streakTransition.streakDelta > 0,
        streakDelta: streakTransition.streakDelta,
      },
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
