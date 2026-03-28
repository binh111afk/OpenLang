import { Clock, BookCheck, Target, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useId } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AnimatedPage } from '../components/AnimatedPage';

export function StatisticsPage() {
  const { learningLanguages } = useLanguage();
  const gradientId = useId().replace(/:/g, '-');

  // Overview Stats
  const overviewStats = [
    {
      label: 'Tổng Thời Gian Học',
      value: '24.5 giờ',
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      change: '+2.5h tuần này'
    },
    {
      label: 'Số Từ Đã Thuộc',
      value: '243',
      icon: BookCheck,
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-100',
      change: '+18 từ mới'
    },
    {
      label: 'Độ Chính Xác',
      value: '87%',
      icon: Target,
      color: 'from-purple-600 to-purple-700',
      bgColor: 'bg-purple-100',
      change: '+5% so với tuần trước'
    },
  ];

  // Weekly Activity Data
  const weeklyData = [
    { day: 'T2', minutes: 45 },
    { day: 'T3', minutes: 30 },
    { day: 'T4', minutes: 60 },
    { day: 'T5', minutes: 25 },
    { day: 'T6', minutes: 55 },
    { day: 'T7', minutes: 40 },
    { day: 'CN', minutes: 70 },
  ];

  // Knowledge Mastery Data (Pie Chart)
  const masteryData = [
    { name: 'Mới', value: 85, color: '#ddd6fe' },
    { name: 'Đang học', value: 120, color: '#a78bfa' },
    { name: 'Đã thuộc', value: 243, color: '#6d28d9' },
  ];

  // Heatmap Data (simplified for 12 weeks)
  const generateHeatmapData = () => {
    const weeks = 12;
    const days = 7;
    const data = [];
    
    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < days; day++) {
        const intensity = Math.floor(Math.random() * 5); // 0-4 intensity levels
        data.push({
          week,
          day,
          intensity,
          date: new Date(2026, 0, week * 7 + day + 1).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
        });
      }
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Words to Review
  const wordsToReview = learningLanguages.includes('japanese') 
    ? [
        { word: '曖昧', reading: 'あいまい', meaning: 'Mơ hồ, không rõ ràng', mistakes: 8, language: 'japanese' },
        { word: '適切', reading: 'てきせつ', meaning: 'Thích hợp, phù hợp', mistakes: 6, language: 'japanese' },
        { word: '複雑', reading: 'ふくざつ', meaning: 'Phức tạp', mistakes: 5, language: 'japanese' },
        { word: '努力', reading: 'どりょく', meaning: 'Nỗ lực, cố gắng', mistakes: 4, language: 'japanese' },
        { word: '失敗', reading: 'しっぱい', meaning: 'Thất bại', mistakes: 4, language: 'japanese' },
      ]
    : [
        { word: 'Ambiguous', meaning: 'Mơ hồ, không rõ ràng', mistakes: 8, language: 'english' },
        { word: 'Meticulous', meaning: 'Tỉ mỉ, cẩn thận', mistakes: 6, language: 'english' },
        { word: 'Perseverance', meaning: 'Sự kiên trì', mistakes: 5, language: 'english' },
        { word: 'Eloquent', meaning: 'Hùng biện, lưu loát', mistakes: 4, language: 'english' },
        { word: 'Resilient', meaning: 'Kiên cường, bền bỉ', mistakes: 4, language: 'english' },
      ];

  const getHeatmapColor = (intensity: number) => {
    const colors = ['#f3f4f6', '#ddd6fe', '#c4b5fd', '#a78bfa', '#7c3aed'];
    return colors[intensity] || colors[0];
  };

  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Thống Kê Học Tập</h1>
          <p className="text-gray-600 dark:text-gray-400">Theo dõi tiến độ và hiệu quả học tập của bạn</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {overviewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 bg-gradient-to-br ${stat.color} rounded-2xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>{stat.change}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Learning Heatmap */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-2xl">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tần Suất Học Tập</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">12 tuần gần đây</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-flex gap-2">
              {/* Day Labels */}
              <div className="flex flex-col gap-1 justify-around py-1">
                {dayLabels.map((day) => (
                  <div key={day} className="h-4 flex items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-6">{day}</span>
                  </div>
                ))}
              </div>

              {/* Heatmap Grid */}
              <div className="flex gap-1">
                {Array.from({ length: 12 }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const dataPoint = heatmapData.find(d => d.week === weekIndex && d.day === dayIndex);
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className="w-4 h-4 rounded transition-all hover:ring-2 hover:ring-purple-400 cursor-pointer"
                          style={{ backgroundColor: getHeatmapColor(dataPoint?.intensity || 0) }}
                          title={dataPoint?.date}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Ít</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getHeatmapColor(level) }}
                />
              ))}
              <span>Nhiều</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Knowledge Mastery Pie Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Mức Độ Thành Thạo</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phân bổ kiến thức từ vựng</p>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={masteryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {masteryData.map((entry, index) => (
                    <Cell key={`cell-mastery-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-4 mt-4">
              {masteryData.map((item) => (
                <div key={item.name} className="text-center">
                  <div
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.name}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Activity Bar Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Hoạt Động Tuần Này</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Thời gian học mỗi ngày (phút)</p>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                <XAxis
                  dataKey="day"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #e9d5ff',
                    borderRadius: '12px',
                    padding: '8px 12px'
                  }}
                />
                <Bar
                  dataKey="minutes"
                  fill={`url(#${gradientId})`}
                  radius={[12, 12, 0, 0]}
                />
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Trung bình</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {Math.round(weeklyData.reduce((sum, d) => sum + d.minutes, 0) / weeklyData.length)} phút/ngày
              </p>
            </div>
          </div>
        </div>

        {/* Words to Review */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Từ Vựng Cần Chú Ý</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Những từ bạn thường xuyên trả lời sai</p>
            </div>
          </div>

          <div className="space-y-3">
            {wordsToReview.map((word, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-sm font-bold text-purple-700 dark:text-purple-300 flex-shrink-0">
                  {index + 1}
                </div>

                <div className="flex-1">
                  {'reading' in word ? (
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                          {word.word}
                        </span>
                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                          {word.reading}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{word.meaning}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{word.word}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{word.meaning}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sai</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{word.mistakes}x</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors opacity-0 group-hover:opacity-100">
                    Ôn Lại
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
    </AnimatedPage>
  );
}