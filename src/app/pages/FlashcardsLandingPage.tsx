import { Layers, Play, TrendingUp, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { AnimatedPage } from '../components/AnimatedPage';
import { useLanguage } from '../contexts/LanguageContext';
import { Pagination } from '../components/Pagination';
import { motion, AnimatePresence } from 'motion/react';

const FLASHCARDS_PER_PAGE = 6;
const FLASHCARDS_STORAGE_KEY = 'openlang-flashcards-state';

function loadFlashcardsState(): { page: number } {
  try {
    const raw = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { page: 1 };
}

export function FlashcardsLandingPage() {
  const navigate = useNavigate();
  const { learningLanguages } = useLanguage();

  const persisted = loadFlashcardsState();
  const [currentPage, setCurrentPage] = useState(persisted.page);

  const allSessions = [
    { id: 1,  name: 'JLPT N5 Kanji Cơ Bản',              cardsTotal: 80,  cardsNew: 12, cardsReview: 15, language: 'japanese', color: 'from-purple-500 to-purple-600' },
    { id: 2,  name: 'Tiếng Anh Giao Tiếp',                cardsTotal: 150, cardsNew: 8,  cardsReview: 22, language: 'english',  color: 'from-violet-500 to-violet-600' },
    { id: 3,  name: 'JLPT N4 Từ Vựng',                    cardsTotal: 120, cardsNew: 15, cardsReview: 10, language: 'japanese', color: 'from-purple-600 to-purple-700' },
    { id: 4,  name: 'English Business Vocabulary',         cardsTotal: 200, cardsNew: 20, cardsReview: 18, language: 'english',  color: 'from-violet-600 to-violet-700' },
    { id: 5,  name: 'Động Từ Tiếng Nhật Thường Gặp',      cardsTotal: 95,  cardsNew: 10, cardsReview: 8,  language: 'japanese', color: 'from-purple-400 to-purple-600' },
    { id: 6,  name: 'IELTS Essential Words',               cardsTotal: 250, cardsNew: 25, cardsReview: 30, language: 'english',  color: 'from-violet-400 to-violet-600' },
    { id: 7,  name: 'JLPT N3 Văn Phạm',                   cardsTotal: 110, cardsNew: 14, cardsReview: 12, language: 'japanese', color: 'from-purple-500 to-violet-600' },
    { id: 8,  name: 'English Idioms & Phrases',            cardsTotal: 180, cardsNew: 18, cardsReview: 20, language: 'english',  color: 'from-violet-500 to-purple-600' },
    { id: 9,  name: 'Kanji N2 Nâng Cao',                  cardsTotal: 160, cardsNew: 16, cardsReview: 14, language: 'japanese', color: 'from-purple-600 to-violet-700' },
    { id: 10, name: 'TOEIC 600 Vocabulary',               cardsTotal: 300, cardsNew: 30, cardsReview: 35, language: 'english',  color: 'from-violet-600 to-purple-700' },
  ];

  const sessions = allSessions.filter(s => learningLanguages.includes(s.language as 'english' | 'japanese'));

  // Persist page to localStorage
  useEffect(() => {
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify({ page: currentPage }));
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(sessions.length / FLASHCARDS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedSessions = sessions.slice((safePage - 1) * FLASHCARDS_PER_PAGE, safePage * FLASHCARDS_PER_PAGE);

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-400">Luyện tập với thẻ ghi nhớ hiệu quả</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tổng Số Thẻ</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">350</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thẻ Cần Ôn</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">47</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Đã Thành Thạo</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">243</p>
              </div>
            </div>
          </div>
        </div>

        {/* Study Sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Phiên Học Của Bạn</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Chọn một bộ thẻ để bắt đầu học
                {sessions.length > FLASHCARDS_PER_PAGE && (
                  <span className="ml-2 text-purple-600 dark:text-purple-400 font-semibold">
                    · Trang {safePage}/{totalPages}
                  </span>
                )}
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo Phiên Mới</span>
            </button>
          </div>

          {sessions.length > 0 ? (
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={safePage}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {pagedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                    >
                      <div className="flex items-start gap-4 mb-6">
                        <div className={`p-4 bg-gradient-to-br ${session.color} rounded-2xl`}>
                          <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            {session.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {session.cardsTotal} thẻ · {session.language === 'japanese' ? '日本語' : 'English'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-xl">
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{session.cardsNew}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Thẻ Mới</p>
                        </div>
                        <div className="text-center p-3 bg-violet-50 dark:bg-violet-950 rounded-xl">
                          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{session.cardsReview}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cần Ôn</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-xl">
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{session.cardsTotal}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tổng</p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/flashcards/study')}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5 fill-white" />
                        Bắt Đầu Học
                      </button>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={sessions.length}
                itemsPerPage={FLASHCARDS_PER_PAGE}
                itemLabel="phiên học"
                onPageChange={handlePageChange}
              />
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800">
              <div className="flex justify-center mb-4">
                <div className="p-6 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Layers className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Chưa có phiên học nào</h3>
              <p className="text-gray-500 dark:text-gray-400">Hãy chọn ngôn ngữ học trong phần Cài Đặt</p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">💡 Mẹo Học Hiệu Quả</h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Học ít nhất 15-20 thẻ mỗi ngày để duy trì tiến độ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Sử dụng phím tắt 1, 2, 3, 4 để đánh giá nhanh độ ghi nhớ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Ôn tập thường xuyên các thẻ "Khó" để cải thiện khả năng ghi nhớ</span>
            </li>
          </ul>
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
    </AnimatedPage>
  );
}
