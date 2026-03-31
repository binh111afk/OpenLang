import { WordsLearnedCard, StreakCard, DailyGoalCard } from '../components/StatsCards';
import { VocabularyCard } from '../components/VocabularyCard';
import { AnimatedPage } from '../components/AnimatedPage';
import { Play, TrendingUp, BookOpen, LogIn } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { AuthModal } from '../components/AuthModal';
import { acknowledgeStreakPopup, fetchDashboardSummary, type DashboardSummary } from '@/utils/dashboard';
import { StreakGainPopup } from '../components/StreakGainPopup';

export function HomePage() {
  const { learningLanguages } = useLanguage();
  const { user, isLoggedIn, getAccessToken } = useUser();
  const [authOpen, setAuthOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [popupDelta, setPopupDelta] = useState(0);
  const [popupPending, setPopupPending] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!isLoggedIn) {
        if (mounted) {
          setDashboard(null);
        }
        return;
      }

      const token = await getAccessToken();
      if (!token || !mounted) {
        return;
      }

      try {
        const summary = await fetchDashboardSummary(token);
        if (!mounted) {
          return;
        }

        setDashboard(summary);

        if (summary.popup?.show) {
          setPopupDelta(Math.max(1, Number(summary.popup.streakDelta || 1)));
          setPopupPending(Boolean(summary.popup.pending));
          setShowStreakPopup(true);
        }
      } catch {
        if (mounted) {
          setDashboard(null);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [getAccessToken, isLoggedIn]);

  const weeklyGain = useMemo(() => {
    if (!dashboard?.heatmap?.length) {
      return 0;
    }
    return dashboard.heatmap.reduce((sum, day) => sum + Number(day.wordsReviewed || 0), 0);
  }, [dashboard]);

  const closeStreakPopup = async () => {
    setShowStreakPopup(false);

    if (!isLoggedIn) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      return;
    }

    try {
      await acknowledgeStreakPopup(token);
    } catch {
      // no-op
    }
  };

  // Get first name for greeting
  const firstName = user ? (user.name.split(' ').pop() || user.name) : '';

  const japaneseVocab = [
    {
      word: '勉強',
      pronunciation: 'べんきょう',
      meaning: 'Học tập',
      example: '毎日勉強します (Tôi học mỗi ngày)',
      language: 'japanese' as const
    },
    {
      word: '学校',
      pronunciation: 'がっこう',
      meaning: 'Trường học',
      example: '学校へ行きます (Tôi đi đến trường)',
      language: 'japanese' as const
    },
    {
      word: '先生',
      pronunciation: 'せんせい',
      meaning: 'Giáo viên',
      example: '山田先生です (Đây là giáo viên Yamada)',
      language: 'japanese' as const
    },
  ];

  const englishVocab = [
    {
      word: 'Accomplish',
      pronunciation: 'əˈkɑːmplɪʃ',
      meaning: 'Hoàn thành, đạt được',
      example: 'I want to accomplish my goals this year.',
      level: 'Trung Cấp',
      language: 'english' as const
    },
    {
      word: 'Enthusiastic',
      pronunciation: 'ɪnˌθuːziˈæstɪk',
      meaning: 'Nhiệt tình, hăng hái',
      example: 'She is enthusiastic about learning new languages.',
      level: 'Trung Cấp',
      language: 'english' as const
    },
    {
      word: 'Perspective',
      pronunciation: 'pərˈspektɪv',
      meaning: 'Quan điểm, góc nhìn',
      example: 'Everyone has a different perspective on life.',
      level: 'Trung Cấp',
      language: 'english' as const
    },
  ];

  const allVocab = [
    ...(learningLanguages.includes('japanese') ? japaneseVocab : []),
    ...(learningLanguages.includes('english') ? englishVocab : []),
  ];

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          {isLoggedIn && user ? (
            <>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                Chào mừng trở lại, <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{firstName}</span>!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Hãy tiếp tục hành trình học ngoại ngữ của bạn ngày hôm nay.</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                Chào mừng đến với <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">OpenLang</span>!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Nền tảng học ngôn ngữ hiệu quả — tiếng Anh & tiếng Nhật.</p>
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all text-sm"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập để lưu tiến độ
              </button>
            </>
          )}
        </div>

        {/* Stats & Daily Goal Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WordsLearnedCard
            totalWords={dashboard?.totalWordsMastered ?? 0}
            weeklyGain={weeklyGain}
          />
          <StreakCard
            currentStreak={dashboard?.streak.current ?? 0}
            longestStreak={dashboard?.streak.longest ?? 0}
            heatmap={dashboard?.heatmap ?? []}
          />
          <DailyGoalCard
            current={dashboard?.dailyGoal.current ?? 0}
            goal={dashboard?.dailyGoal.goal ?? (user?.goal ?? 15)}
          />
        </div>

        {isLoggedIn && (
          <div className="rounded-2xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-purple-800 dark:bg-gray-900 dark:text-gray-200">
            <span className="font-semibold text-purple-600 dark:text-purple-400">Hôm nay cần ôn:</span>{' '}
            {dashboard?.dueTodayCount ?? 0} từ ·
            <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
              Mục tiêu: {dashboard?.dailyGoal.progressPercent ?? 0}%
            </span>
          </div>
        )}

        {/* Start Learning Button */}
        <button className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 text-white py-6 px-8 rounded-3xl shadow-lg shadow-purple-300 dark:shadow-purple-900 hover:shadow-xl hover:shadow-purple-400 dark:hover:shadow-purple-800 transition-all duration-300 flex items-center justify-center gap-4 group">
          <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold">Bắt Đầu Học Ngay</span>
        </button>

        {/* Vocabulary Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Từ Vựng Hôm Nay</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Thành thạo những từ này để nâng cấp</p>
            </div>
            <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm hover:underline">
              Xem Tất Cả →
            </button>
          </div>

          {allVocab.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allVocab.map((vocab, idx) => (
                <VocabularyCard
                  key={idx}
                  word={vocab.word}
                  pronunciation={vocab.pronunciation}
                  meaning={vocab.meaning}
                  example={vocab.example}
                  level={'level' in vocab ? vocab.level : undefined}
                  language={vocab.language}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800">
              <p className="text-gray-500 dark:text-gray-400">Vui lòng chọn ngôn ngữ học trong phần Cài Đặt</p>
            </div>
          )}
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <StreakGainPopup
        isOpen={showStreakPopup}
        streakDelta={popupDelta}
        pending={popupPending}
        currentStreak={dashboard?.streak.current ?? 0}
        onClose={() => {
          void closeStreakPopup();
        }}
      />
    </AnimatedPage>
  );
}