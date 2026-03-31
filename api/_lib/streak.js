const { addDays, diffDays } = require('./datetime');

const FREEZE_COST_XP = 120;

function normalizeProfile(profile, userId) {
  return {
    id: userId,
    total_xp: Number(profile?.total_xp || 0),
    total_words_mastered: Number(profile?.total_words_mastered || 0),
    current_streak: Number(profile?.current_streak || 0),
    longest_streak: Number(profile?.longest_streak || 0),
    streak_freeze_count: Number(profile?.streak_freeze_count || 0),
    last_study_date: profile?.last_study_date || null,
    last_streak_popup_date: profile?.last_streak_popup_date || null,
  };
}

function computeStreakCheckin(profile, todayIso) {
  const current = normalizeProfile(profile, profile?.id || '');
  const previousDate = current.last_study_date;

  if (previousDate === todayIso) {
    return {
      nextProfile: current,
      changed: false,
      usedFreeze: false,
      streakDelta: 0,
      reset: false,
    };
  }

  let nextStreak = 1;
  let usedFreeze = false;
  let reset = false;

  if (previousDate) {
    const gapDays = diffDays(previousDate, todayIso);

    if (gapDays === 1) {
      nextStreak = Math.max(1, current.current_streak + 1);
    } else if (gapDays === 2 && current.streak_freeze_count > 0) {
      nextStreak = Math.max(1, current.current_streak + 1);
      usedFreeze = true;
    } else if (gapDays > 1) {
      nextStreak = 1;
      reset = true;
    }
  }

  const nextLongest = Math.max(current.longest_streak, nextStreak);
  const nextFreezeCount = usedFreeze
    ? Math.max(0, current.streak_freeze_count - 1)
    : current.streak_freeze_count;

  return {
    nextProfile: {
      ...current,
      current_streak: nextStreak,
      longest_streak: nextLongest,
      streak_freeze_count: nextFreezeCount,
      last_study_date: todayIso,
      last_streak_popup_date: null,
    },
    changed: true,
    usedFreeze,
    streakDelta: Math.max(0, nextStreak - current.current_streak),
    reset,
  };
}

function purchaseFreeze(profile, quantity) {
  const count = Math.max(1, Math.round(Number(quantity) || 1));
  const normalized = normalizeProfile(profile, profile?.id || '');
  const totalCost = count * FREEZE_COST_XP;

  if (normalized.total_xp < totalCost) {
    return {
      ok: false,
      error: 'Not enough XP to buy streak freeze.',
      totalCost,
      currentXp: normalized.total_xp,
    };
  }

  return {
    ok: true,
    totalCost,
    nextProfile: {
      ...normalized,
      total_xp: normalized.total_xp - totalCost,
      streak_freeze_count: normalized.streak_freeze_count + count,
    },
  };
}

function shouldShowStreakPopup(profile, todayIso) {
  const normalized = normalizeProfile(profile, profile?.id || '');
  return (
    normalized.current_streak > 0 &&
    normalized.last_study_date === todayIso &&
    normalized.last_streak_popup_date !== todayIso
  );
}

function getYesterday(todayIso) {
  return addDays(todayIso, -1);
}

module.exports = {
  FREEZE_COST_XP,
  computeStreakCheckin,
  normalizeProfile,
  purchaseFreeze,
  shouldShowStreakPopup,
  getYesterday,
};
