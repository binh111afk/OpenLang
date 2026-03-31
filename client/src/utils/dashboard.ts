import { fetchJson } from './api';

export interface HeatmapDay {
  date: string;
  xpGained: number;
  wordsReviewed: number;
  studied: boolean;
}

export interface DashboardSummary {
  heatmap: HeatmapDay[];
  dueTodayCount: number;
  dailyGoal: {
    current: number;
    goal: number;
    progressPercent: number;
  };
  streak: {
    current: number;
    longest: number;
    freezeCount: number;
    lastStudyDate: string | null;
  };
  totalWordsMastered: number;
  popup: {
    show: boolean;
    streakDelta: number;
    pending?: boolean;
  };
  timezone: string;
  today: string;
}

function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    'Content-Type': 'application/json',
  };
}

export async function fetchDashboardSummary(token: string) {
  return fetchJson<DashboardSummary>('/api/srs-review?mode=dashboard', {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
  });
}

export async function acknowledgeStreakPopup(token: string) {
  return fetchJson<{ ok: boolean }>('/api/srs-review', {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ action: 'ack_popup' }),
  });
}

export async function purchaseStreakFreeze(token: string, quantity = 1) {
  return fetchJson<{
    ok: boolean;
    freezeCount: number;
    totalXp: number;
    costXp: number;
    currentRank: string;
  }>('/api/srs-review', {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ action: 'purchase_freeze', quantity }),
  });
}

export async function manualStreakCheckin(token: string) {
  return fetchJson<{
    ok: boolean;
    alreadyCheckedIn: boolean;
    streak: {
      current: number;
      longest: number;
      freezeCount: number;
      usedFreeze: boolean;
      reset: boolean;
    };
    popup: {
      show: boolean;
      streakDelta: number;
    };
  }>('/api/srs-review', {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify({ action: 'manual_checkin' }),
  });
}
