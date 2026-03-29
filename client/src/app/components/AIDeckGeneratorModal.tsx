import { AnimatePresence, motion } from 'motion/react';
import { LoaderCircle, Sparkles, Wand2, X } from 'lucide-react';
import { useState } from 'react';

interface AIDeckGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (payload: {
    topic: string;
    language: 'english' | 'japanese';
    cardCount: number;
    difficultyRating: number;
  }) => Promise<void>;
  defaultLanguage?: 'english' | 'japanese';
}

export function AIDeckGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  defaultLanguage = 'english',
}: AIDeckGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<'english' | 'japanese'>(defaultLanguage);
  const [cardCount, setCardCount] = useState(8);
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClose = () => {
    if (isGenerating) {
      return;
    }
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!topic.trim()) {
      alert('Vui lòng nhập chủ đề để AI tạo bộ thẻ.');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate({
        topic: topic.trim(),
        language,
        cardCount,
        difficultyRating,
      });
      setTopic('');
      setLanguage(defaultLanguage);
      setCardCount(8);
      setDifficultyRating(3);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-purple-100 p-6 dark:border-purple-900">
              <div>
                <div className="mb-2 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <div className="rounded-2xl bg-purple-100 p-2 dark:bg-purple-950">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-[0.22em]">AI Deck Builder</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tạo bộ thẻ bằng Gemini
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Nhập chủ đề, AI sẽ tạo sẵn bộ thẻ, ví dụ và dịch nghĩa cho bạn.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-xl p-2 transition hover:bg-purple-50 dark:hover:bg-purple-950"
                type="button"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Chủ đề bộ thẻ
                </label>
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="VD: Động vật biển, cụm từ IELTS Speaking, Kanji N5 chủ đề trường học"
                  className="w-full rounded-2xl border-2 border-purple-200 bg-purple-50 px-4 py-3 text-gray-800 outline-none transition focus:border-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Ngôn ngữ học
                  </label>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as 'english' | 'japanese')}
                    className="w-full rounded-2xl border-2 border-purple-200 bg-purple-50 px-4 py-3 text-gray-800 outline-none transition focus:border-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-white"
                  >
                    <option value="english">Tiếng Anh</option>
                    <option value="japanese">Tiếng Nhật</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Số lượng thẻ
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={cardCount}
                    onChange={(event) => setCardCount(Number(event.target.value) || 8)}
                    className="w-full rounded-2xl border-2 border-purple-200 bg-purple-50 px-4 py-3 text-gray-800 outline-none transition focus:border-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Độ khó mong muốn
                </label>
                <div className="flex gap-2 rounded-2xl border-2 border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDifficultyRating(star)}
                      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                        star === difficultyRating
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-purple-600 hover:bg-purple-100 dark:bg-gray-900 dark:text-purple-300 dark:hover:bg-purple-900'
                      }`}
                    >
                      {star} sao
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 p-4 text-sm text-gray-600 dark:border-purple-800 dark:from-purple-950 dark:to-violet-950 dark:text-gray-300">
                AI sẽ tạo:
                <ul className="mt-2 space-y-1">
                  <li>- tên bộ thẻ</li>
                  <li>- danh sách từ vựng phù hợp theo chủ đề</li>
                  <li>- ví dụ và bản dịch tiếng Việt</li>
                  <li>- ảnh minh họa Pixabay sau khi lưu</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isGenerating}
                  className="flex-1 rounded-2xl bg-gray-100 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {isGenerating ? 'AI đang tạo...' : 'Tạo bộ thẻ bằng AI'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
