import { Search, BookText, Clock, Calendar, Volume2, Filter } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { AnimatedPage } from '../components/AnimatedPage';
import { useLanguage } from '../contexts/LanguageContext';
import { CustomDropdown } from '../components/CustomDropdown';
import { Tooltip } from '../components/Tooltip';
import { Pagination } from '../components/Pagination';
import { motion, AnimatePresence } from 'motion/react';

type TopicType = 'all' | 'technology' | 'culture' | 'business' | 'daily-life' | 'travel' | 'science';
type LevelType = 'all' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type SortType = 'newest' | 'oldest' | 'popular' | 'shortest' | 'longest';
type LanguageType = 'english' | 'japanese' | 'vietnamese';

interface ReadingArticle {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  level: string;
  wordCount: number;
  readTime: number;
  publishDate: string;
  language: LanguageType;
  hasAudio: boolean;
}

const READING_PER_PAGE = 9;
const READING_STORAGE_KEY = 'openlang-reading-state';

const articleGridVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

const articleCardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

type ReadingPersistedState = {
  page: number;
  topic: TopicType;
  level: LevelType;
  sortBy: SortType;
  search: string;
};

function loadReadingState(): ReadingPersistedState {
  try {
    const raw = localStorage.getItem(READING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { page: 1, topic: 'all', level: 'all', sortBy: 'newest', search: '' };
}

export function ReadingPage() {
  const navigate = useNavigate();
  const { learningLanguages } = useLanguage();

  const persisted = loadReadingState();
  const [searchQuery, setSearchQuery] = useState(persisted.search);
  const [selectedTopic, setSelectedTopic] = useState<TopicType>(persisted.topic);
  const [selectedLevel, setSelectedLevel] = useState<LevelType>(persisted.level);
  const [sortBy, setSortBy] = useState<SortType>(persisted.sortBy);
  const [currentPage, setCurrentPage] = useState(persisted.page);

  const prevFiltersRef = useRef({ topic: persisted.topic, level: persisted.level, sortBy: persisted.sortBy, search: persisted.search });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(READING_STORAGE_KEY, JSON.stringify({
      page: currentPage, topic: selectedTopic, level: selectedLevel, sortBy, search: searchQuery,
    }));
  }, [currentPage, selectedTopic, selectedLevel, sortBy, searchQuery]);

  // Reset page to 1 when filters/search change
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      selectedTopic !== prev.topic ||
      selectedLevel !== prev.level ||
      sortBy !== prev.sortBy ||
      searchQuery !== prev.search
    ) {
      setCurrentPage(1);
      prevFiltersRef.current = { topic: selectedTopic, level: selectedLevel, sortBy, search: searchQuery };
    }
  }, [selectedTopic, selectedLevel, sortBy, searchQuery]);

  // Dropdown options
  const topicOptions = [
    { value: 'all', label: 'Tất Cả Chủ Đề' },
    { value: 'technology', label: 'Công Nghệ' },
    { value: 'culture', label: 'Văn Hóa' },
    { value: 'business', label: 'Kinh Doanh' },
    { value: 'daily-life', label: 'Đời Sống' },
    { value: 'travel', label: 'Du Lịch' },
    { value: 'science', label: 'Khoa Học' },
  ];

  const levelOptionGroups = [
    { 
      groupLabel: 'Tiếng Nhật',
      options: [
        { value: 'all', label: 'Tất Cả Trình Độ' },
        { value: 'N5', label: 'N5 - Sơ Cấp' },
        { value: 'N4', label: 'N4 - Cơ Bản' },
        { value: 'N3', label: 'N3 - Trung Cấp' },
        { value: 'N2', label: 'N2 - Trung Cao' },
        { value: 'N1', label: 'N1 - Cao Cấp' },
      ]
    },
    {
      groupLabel: 'Tiếng Anh',
      options: [
        { value: 'A1', label: 'A1 - Beginner' },
        { value: 'A2', label: 'A2 - Elementary' },
        { value: 'B1', label: 'B1 - Intermediate' },
        { value: 'B2', label: 'B2 - Upper Intermediate' },
        { value: 'C1', label: 'C1 - Advanced' },
        { value: 'C2', label: 'C2 - Proficient' },
      ]
    }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Mới Nhất' },
    { value: 'oldest', label: 'Cũ Nhất' },
    { value: 'popular', label: 'Phổ Biến' },
    { value: 'shortest', label: 'Ngắn Nhất' },
    { value: 'longest', label: 'Dài Nhất' },
  ];

  // Sample articles data
  const articles: ReadingArticle[] = [
    {
      id: '1',
      title: '日本の四季と文化',
      description: '日本には春夏秋冬の四季があり、それぞれの季節に独特な文化や行事があります。桜の花見、夏祭り、紅葉狩り、雪まつりなど...',
      topic: 'Văn Hóa',
      difficulty: 'Easy',
      level: 'N5',
      wordCount: 450,
      readTime: 5,
      publishDate: '2026-03-20',
      language: 'japanese',
      hasAudio: true,
    },
    {
      id: '2',
      title: 'The Future of Artificial Intelligence',
      description: 'Artificial Intelligence is rapidly transforming our world. From self-driving cars to medical diagnostics, AI is making remarkable strides...',
      topic: 'Công Nghệ',
      difficulty: 'Hard',
      level: 'C1',
      wordCount: 1200,
      readTime: 12,
      publishDate: '2026-03-22',
      language: 'english',
      hasAudio: true,
    },
    {
      id: '3',
      title: '東京のおすすめカフェ',
      description: '東京には素敵なカフェがたくさんあります。渋谷、原宿、表参道エリアの人気カフェを紹介します。美味しいコーヒーと...',
      topic: 'Du Lịch',
      difficulty: 'Easy',
      level: 'N4',
      wordCount: 380,
      readTime: 4,
      publishDate: '2026-03-18',
      language: 'japanese',
      hasAudio: false,
    },
    {
      id: '4',
      title: 'Sustainable Business Practices',
      description: 'Modern companies are adopting sustainable practices to reduce environmental impact. Learn about green initiatives and corporate responsibility...',
      topic: 'Kinh Doanh',
      difficulty: 'Medium',
      level: 'B2',
      wordCount: 850,
      readTime: 9,
      publishDate: '2026-03-15',
      language: 'english',
      hasAudio: true,
    },
    {
      id: '5',
      title: '健康的な生活習慣',
      description: '健康を維持するためには、バランスの取れた食事、適度な運動、十分な睡眠が大切です。毎日の小さな習慣が...',
      topic: 'Đời Sống',
      difficulty: 'Medium',
      level: 'N3',
      wordCount: 620,
      readTime: 7,
      publishDate: '2026-03-12',
      language: 'japanese',
      hasAudio: true,
    },
    {
      id: '6',
      title: 'Climate Change and Global Warming',
      description: 'Understanding the science behind climate change is crucial for our future. This article explores causes, effects, and potential solutions...',
      topic: 'Khoa Học',
      difficulty: 'Hard',
      level: 'C2',
      wordCount: 1500,
      readTime: 15,
      publishDate: '2026-03-10',
      language: 'english',
      hasAudio: false,
    },
    {
      id: '7',
      title: '日本のビジネスマナー',
      description: '日本の会社で働く際に知っておくべきビジネスマナーについて解説します。名刺交換、会議の進め方、敬語の使い方...',
      topic: 'Kinh Doanh',
      difficulty: 'Hard',
      level: 'N2',
      wordCount: 980,
      readTime: 10,
      publishDate: '2026-03-08',
      language: 'japanese',
      hasAudio: true,
    },
    {
      id: '8',
      title: 'Digital Marketing Trends 2026',
      description: 'Stay ahead of the curve with the latest digital marketing strategies. From social media to content marketing, discover what works...',
      topic: 'Công Nghệ',
      difficulty: 'Medium',
      level: 'B1',
      wordCount: 720,
      readTime: 8,
      publishDate: '2026-03-05',
      language: 'english',
      hasAudio: true,
    },
    {
      id: '9',
      title: '京都の歴史と観光',
      description: '古都京都の魅力を紹介します。金閣寺、清水寺、伏見稲荷大社など、必見の観光スポットと歴史的背景について...',
      topic: 'Du Lịch',
      difficulty: 'Medium',
      level: 'N3',
      wordCount: 550,
      readTime: 6,
      publishDate: '2026-03-01',
      language: 'japanese',
      hasAudio: false,
    },
  ];

  // Filter articles based on selected filters
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || article.topic === getTopicLabel(selectedTopic);
    const matchesLevel = selectedLevel === 'all' || article.level === selectedLevel;
    const matchesLanguage = !learningLanguages || learningLanguages.length === 0 || 
                            (learningLanguages as string[]).includes(article.language);
    
    return matchesSearch && matchesTopic && matchesLevel && matchesLanguage;
  });

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      case 'oldest':
        return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
      case 'shortest':
        return a.wordCount - b.wordCount;
      case 'longest':
        return b.wordCount - a.wordCount;
      case 'popular':
      default:
        return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedArticles.length / READING_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedArticles = sortedArticles.slice((safePage - 1) * READING_PER_PAGE, safePage * READING_PER_PAGE);

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function getTopicLabel(topic: TopicType): string {
    const labels: Record<TopicType, string> = {
      'all': 'Tất Cả',
      'technology': 'Công Nghệ',
      'culture': 'Văn Hóa',
      'business': 'Kinh Doanh',
      'daily-life': 'Đời Sống',
      'travel': 'Du Lịch',
      'science': 'Khoa Học',
    };
    return labels[topic];
  }

  function getDifficultyColor(difficulty: 'Easy' | 'Medium' | 'Hard') {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'Medium':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'Hard':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Bài Đọc</h1>
          <p className="text-gray-600 dark:text-gray-400">Nâng cao kỹ năng ngôn ngữ qua các bài đọc đa dạng</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="lg:col-span-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm bài đọc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Topic Dropdown */}
            <CustomDropdown
              value={selectedTopic}
              onChange={(value) => setSelectedTopic(value as TopicType)}
              options={topicOptions}
              placeholder="Chọn chủ đề"
            />

            {/* Level Dropdown */}
            <CustomDropdown
              value={selectedLevel}
              onChange={(value) => setSelectedLevel(value as LevelType)}
              optionGroups={levelOptionGroups}
              placeholder="Chọn trình độ"
            />

            {/* Sort Dropdown */}
            <CustomDropdown
              value={sortBy}
              onChange={(value) => setSortBy(value as SortType)}
              options={sortOptions}
              placeholder="Sắp xếp"
            />
          </div>

          {/* Active Filters Display */}
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Hiển thị <span className="font-bold text-purple-700 dark:text-purple-300">{sortedArticles.length}</span> bài đọc
            </span>
          </div>
        </div>

        {/* Articles Grid */}
        {sortedArticles.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedTopic}-${selectedLevel}-${sortBy}-${searchQuery}-${safePage}`}
                variants={articleGridVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {pagedArticles.map((article) => (
                  <motion.div
                    key={article.id}
                    variants={articleCardVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/reading/${article.id}`)}
                    className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
                  >
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <Tooltip content="Chủ đề bài viết">
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                          {article.topic}
                        </span>
                      </Tooltip>
                      <Tooltip content="Độ khó">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(article.difficulty)}`}>
                          {article.difficulty}
                        </span>
                      </Tooltip>
                      {article.hasAudio && (
                        <Tooltip content="Có audio phát âm">
                          <div className="p-1.5 bg-purple-50 dark:bg-purple-950 rounded-full">
                            <Volume2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                        </Tooltip>
                      )}
                      <Tooltip content="Trình độ">
                        <span className="ml-auto px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-full">
                          {article.level}
                        </span>
                      </Tooltip>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                      style={{ fontFamily: article.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif" }}
                    >
                      {article.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2"
                      style={{ fontFamily: article.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif" }}
                    >
                      {article.description}
                    </p>

                    {/* Meta Information */}
                    <div className="flex items-center gap-4 pt-4 border-t border-purple-100 dark:border-purple-800 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <BookText className="w-4 h-4" />
                        <span>{article.wordCount} từ</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{article.readTime} phút</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(article.publishDate)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={sortedArticles.length}
              itemsPerPage={READING_PER_PAGE}
              itemLabel="bài đọc"
              onPageChange={handlePageChange}
            />
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800">
            <div className="flex justify-center mb-4">
              <div className="p-6 bg-purple-100 dark:bg-purple-900 rounded-full">
                <BookText className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy bài đọc</h3>
            <p className="text-gray-500 dark:text-gray-400">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác</p>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
    </AnimatedPage>
  );
}
