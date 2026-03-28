import { Target } from 'lucide-react';

interface DailyGoalCardProps {
  current: number;
  goal: number;
}

export function DailyGoalCard({ current, goal }: DailyGoalCardProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Mục Tiêu Hàng Ngày</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Duy trì chuỗi học tập!</p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-2xl">
          <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="54"
              stroke="#f3e8ff"
              strokeWidth="10"
              fill="none"
              className="dark:stroke-purple-900"
            />
            <circle
              cx="64"
              cy="64"
              r="54"
              stroke="url(#gradient)"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#5b21b6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{current}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/ {goal}</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-2xl p-4 text-center">
        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
          {goal - current > 0 
            ? `Còn ${goal - current} từ nữa để đạt mục tiêu!` 
            : '🎉 Đã hoàn thành mục tiêu!'}
        </p>
      </div>
    </div>
  );
}