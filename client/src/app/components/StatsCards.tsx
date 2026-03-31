import { useId } from 'react';
import { Check, Trophy, Flame } from 'lucide-react';

interface HeatmapDay {
  date: string;
  studied: boolean;
}

// ─── Shared: decorative background pattern ────────────────────────────────
function CardPattern({ variant = 'circles', uid }: { variant?: 'circles' | 'dots' | 'lines'; uid: string }) {
  if (variant === 'dots') {
    const patternId = `dots-pattern-${uid}`;
    return (
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#7c3aed" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    );
  }
  if (variant === 'lines') {
    const patternId = `lines-pattern-${uid}`;
    return (
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="20" x2="20" y2="0" stroke="#7c3aed" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    );
  }
  // circles (default)
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.055] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90%" cy="10%" r="55" fill="none" stroke="#7c3aed" strokeWidth="18" />
      <circle cx="15%" cy="85%" r="38" fill="none" stroke="#7c3aed" strokeWidth="12" />
      <circle cx="75%" cy="75%" r="22" fill="none" stroke="#5b21b6" strokeWidth="8" />
    </svg>
  );
}

// ─── 1. Words Learned Card (Sparkline) ───────────────────────────────────
const SPARKLINE_DATA = [120, 145, 138, 162, 178, 195, 210, 224, 218, 243];

function Sparkline({ data, uid }: { data: number[]; uid: string }) {
  const areaId = `spark-area-${uid}`;
  const lineId = `spark-line-${uid}`;
  const w = 160, h = 44;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const areaPath = `M${pts[0]} L${pts.join(' L')} L${w},${h} L0,${h} Z`;
  const [lx, ly] = pts[pts.length - 1].split(',').map(Number);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 44 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${areaId})`} />
      <polyline points={polyline} fill="none" stroke={`url(#${lineId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill="#7c3aed" />
      <circle cx={lx} cy={ly} r="7" fill="#7c3aed" fillOpacity="0.2" />
    </svg>
  );
}

export function WordsLearnedCard({ totalWords = 243, weeklyGain = 0 }: { totalWords?: number; weeklyGain?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <CardPattern variant="circles" uid={uid} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-1">Từ Đã Học</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold text-gray-800 dark:text-gray-100 leading-none">{totalWords}</p>
              <span className="text-xs font-semibold text-emerald-500 mb-1">↑ +{Math.max(0, weeklyGain)} tuần này</span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg shadow-purple-200 dark:shadow-purple-900 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <div className="w-full h-px bg-purple-100 dark:bg-purple-800/50 mb-3" />

        <div className="mb-2">
          <Sparkline data={SPARKLINE_DATA} uid={uid} />
        </div>

        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600">
          <span>10 tuần trước</span>
          <span>Hôm nay</span>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Streak Card (Week dots) ──────────────────────────────────────────
const WEEK_DAYS = [
  { short: 'T2', done: true },
  { short: 'T3', done: true },
  { short: 'T4', done: true },
  { short: 'T5', done: false },
  { short: 'T6', done: false },
  { short: 'T7', done: false },
  { short: 'CN', done: false },
];

export function StreakCard({
  currentStreak = 0,
  longestStreak = 0,
  heatmap = [],
}: {
  currentStreak?: number;
  longestStreak?: number;
  heatmap?: HeatmapDay[];
}) {
  const uid = useId().replace(/:/g, '');
  const weekDays = heatmap.length === 7
    ? heatmap.map((day, index) => ({
        short: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index],
        done: Boolean(day.studied),
      }))
    : WEEK_DAYS;

  const weeklyCount = weekDays.filter((day) => day.done).length;

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <CardPattern variant="dots" uid={uid} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-1">Chuỗi Học Tập</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold text-gray-800 dark:text-gray-100 leading-none">{currentStreak}</p>
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-0.5">ngày</span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-200 dark:shadow-violet-900 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="w-full h-px bg-purple-100 dark:bg-purple-800/50 mb-4" />

        <div className="flex items-end justify-between gap-1">
          {weekDays.map((day) => (
            <div key={day.short} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  day.done
                    ? 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-md shadow-purple-200 dark:shadow-purple-900 scale-105'
                    : 'bg-purple-50 dark:bg-purple-950 border-2 border-dashed border-purple-200 dark:border-purple-800'
                }`}
              >
                {day.done ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-200 dark:bg-purple-800 block" />
                )}
              </div>
              <span className={`text-xs font-semibold ${day.done ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-600'}`}>
                {day.short}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <span className="text-purple-600 dark:text-purple-400 font-semibold">{weeklyCount}/7</span> ngày tuần này · Kỷ lục:{' '}
            <span className="text-purple-600 dark:text-purple-400 font-semibold">{longestStreak} ngày</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 3. Daily Goal Card (Ring + EXP + Trophy) ────────────────────────────
export function DailyGoalCard({ current, goal }: { current: number; goal: number }) {
  const uid = useId().replace(/:/g, '');
  const ringGradId = `ring-grad-${uid}`;

  const percentage = Math.min((current / goal) * 100, 100);
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const EXP_CURRENT = 120;
  const EXP_GOAL = 200;
  const expPercent = Math.round((EXP_CURRENT / EXP_GOAL) * 100);

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <CardPattern variant="lines" uid={uid} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-1">Mục Tiêu Hôm Nay</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Duy trì chuỗi học tập!</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-amber-900 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="w-full h-px bg-purple-100 dark:bg-purple-800/50 mb-4" />

        <div className="flex items-center gap-5">
          {/* Ring chart */}
          <div className="relative flex-none w-[108px] h-[108px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
              <defs>
                <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
              <circle cx="54" cy="54" r={r} fill="none" stroke="#f3e8ff" strokeWidth="10" className="dark:stroke-purple-900/60" />
              <circle
                cx="54" cy="54" r={r}
                fill="none"
                stroke={`url(#${ringGradId})`}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-none">{current}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">/ {goal}</span>
            </div>
          </div>

          {/* Right: percent + EXP */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 leading-none">{Math.round(percentage)}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">hoàn thành</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">⚡ EXP</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{EXP_CURRENT} / {EXP_GOAL}</span>
              </div>
              <div className="w-full h-2 bg-amber-100 dark:bg-amber-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-2xl px-4 py-2.5 text-center">
          <p className="text-xs font-semibold text-purple-800 dark:text-purple-200">
            {goal - current > 0
              ? `Còn ${goal - current} từ nữa để đạt mục tiêu! 💪`
              : '🎉 Đã hoàn thành mục tiêu hôm nay!'}
          </p>
        </div>
      </div>
    </div>
  );
}
