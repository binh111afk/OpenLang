import { X, Mic, Image as ImageIcon, Sparkles, Plus, Trash2, Pencil, Save } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

interface Card {
  id: string;
  front: string;
  furigana?: string;
  back: string;
  example: string;
  imageUrl?: string;
}

interface LocationState {
  deckName: string;
  language: 'english' | 'japanese';
  deckIcon: string;
  deckId?: string;
  mode?: 'edit' | 'add';
}

export function AddCardsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const isEditMode = state?.mode === 'edit';

  // Form states
  const [front, setFront] = useState('');
  const [furigana, setFurigana] = useState('');
  const [back, setBack] = useState('');
  const [example, setExample] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Edit mode: editing an existing card in the list
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);

  // Focus on front input when component mounts
  useEffect(() => {
    frontInputRef.current?.focus();
  }, []);

  // If no state, redirect to library
  useEffect(() => {
    if (!state?.deckName) {
      navigate('/library');
    }
  }, [state, navigate]);

  const isJapanese = state?.language === 'japanese';

  // Mock AI suggestion
  const handleAiSuggestion = () => {
    if (!front.trim()) {
      alert('Vui lòng nhập từ vựng trước!');
      return;
    }
    setIsAiLoading(true);
    setTimeout(() => {
      if (isJapanese) {
        if (front === '勉強') {
          setFurigana('べんきょう');
          setBack('Học tập, nghiên cứu');
          setExample('私は毎日日本語を勉強します。(Tôi học tiếng Nhật mỗi ngày.)');
        } else {
          setFurigana('れい');
          setBack('Ví dụ, mẫu');
          setExample('これは例です。(Đây là một ví dụ.)');
        }
      } else {
        if (front.toLowerCase() === 'study') {
          setBack('Học tập, nghiên cứu');
          setExample('I study English every day. (Tôi học tiếng Anh mỗi ngày.)');
        } else {
          setBack('Ví dụ nghĩa');
          setExample('This is an example sentence.');
        }
      }
      setIsAiLoading(false);
    }, 1500);
  };

  const clearForm = () => {
    setFront(''); setFurigana(''); setBack(''); setExample('');
    setEditingCardId(null);
    frontInputRef.current?.focus();
  };

  const handleAddCard = () => {
    if (!front.trim() || !back.trim()) {
      alert('Vui lòng nhập ít nhất Từ vựng và Nghĩa!');
      return;
    }

    if (editingCardId) {
      // Update existing card
      setCards(prev => prev.map(c => c.id === editingCardId
        ? { ...c, front: front.trim(), furigana: isJapanese ? furigana.trim() : undefined, back: back.trim(), example: example.trim() }
        : c
      ));
    } else {
      // Add new card
      const newCard: Card = {
        id: Date.now().toString(),
        front: front.trim(),
        furigana: isJapanese ? furigana.trim() : undefined,
        back: back.trim(),
        example: example.trim(),
      };
      setCards([newCard, ...cards]);
    }

    clearForm();
  };

  const handleEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setFront(card.front);
    setFurigana(card.furigana ?? '');
    setBack(card.back);
    setExample(card.example);
    frontInputRef.current?.focus();
  };

  const handleDeleteCard = (id: string) => {
    if (editingCardId === id) clearForm();
    setCards(cards.filter(card => card.id !== id));
  };

  const handleFinish = () => {
    if (cards.length === 0) {
      alert('Vui lòng thêm ít nhất một thẻ!');
      return;
    }
    alert(`Đã lưu ${cards.length} thẻ vào bộ "${state.deckName}"!`);
    navigate('/library');
  };

  const handleCancel = () => {
    if (cards.length > 0) {
      const confirmLeave = window.confirm('Bạn có chắc muốn thoát? Các thẻ chưa lưu sẽ bị mất.');
      if (!confirmLeave) return;
    }
    navigate('/library');
  };

  if (!state) return null;

  const headerTitle = isEditMode
    ? `Sửa bộ thẻ: `
    : `Đang thêm vào: `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b-2 border-purple-200 dark:border-purple-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-950 rounded-xl transition-colors"
              title="Hủy và quay lại"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{state.deckIcon}</span>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {headerTitle}
                  <span className="text-purple-600 dark:text-purple-400">{state.deckName}</span>
                </h1>
                {isEditMode && (
                  <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
                    Chế độ sửa
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-10">
                {cards.length} thẻ {isEditMode ? 'đã chỉnh sửa' : 'đã thêm'}
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold rounded-2xl transition-all shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEditMode ? 'Lưu Thay Đổi' : 'Hoàn Thành'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form Input (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-lg space-y-6">
              {/* Editing badge */}
              <AnimatePresence>
                {editingCardId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl"
                  >
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
                      <Pencil className="w-4 h-4" />
                      Đang sửa thẻ...
                    </div>
                    <button onClick={clearForm} className="text-xs text-amber-600 dark:text-amber-500 hover:underline">
                      Hủy sửa
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Front Side */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    Mặt Trước
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-purple-100 dark:hover:bg-purple-950 rounded-xl transition-colors"
                      title="Thu âm"
                    >
                      <Mic className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-purple-100 dark:hover:bg-purple-950 rounded-xl transition-colors"
                      title="Thêm hình ảnh"
                    >
                      <ImageIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {isJapanese && (
                  <input
                    type="text"
                    value={furigana}
                    onChange={(e) => setFurigana(e.target.value)}
                    placeholder="ふりがな (Furigana)"
                    className="w-full px-4 py-2 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-xl text-sm text-purple-600 dark:text-purple-400 placeholder-purple-400 dark:placeholder-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  />
                )}

                <input
                  ref={frontInputRef}
                  type="text"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder={isJapanese ? "Từ vựng (Kanji) - VD: 勉強" : "Từ vựng - VD: Study"}
                  className="w-full px-6 py-4 bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 rounded-2xl text-2xl font-bold text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-center"
                  style={{ fontFamily: isJapanese ? "'Noto Sans JP', sans-serif" : undefined }}
                />
              </div>

              <div className="border-t-2 border-purple-100 dark:border-purple-900" />

              {/* Back Side */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  Mặt Sau
                </h3>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Nghĩa tiếng Việt - VD: Học tập"
                  className="w-full px-6 py-4 bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 rounded-2xl text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                  rows={2}
                />
                <textarea
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder="Câu ví dụ (tùy chọn)"
                  className="w-full px-6 py-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-2xl text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* AI Suggestion Button */}
              <button
                onClick={handleAiSuggestion}
                disabled={isAiLoading || !front.trim()}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {isAiLoading ? 'AI đang gợi ý...' : 'Gợi ý bởi AI ✨'}
              </button>

              {/* Add / Save Card Button */}
              <button
                onClick={handleAddCard}
                className={`w-full py-4 text-white font-bold text-lg rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                  editingCardId
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600'
                }`}
              >
                {editingCardId ? (
                  <><Save className="w-6 h-6" /> Lưu Thay Đổi Thẻ</>
                ) : (
                  <><Plus className="w-6 h-6" /> Thêm Thẻ Tiếp Theo</>
                )}
              </button>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-950 dark:to-violet-950 rounded-2xl border border-purple-200 dark:border-purple-800 p-4">
              <p className="text-sm text-purple-800 dark:text-purple-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Mẹo:</strong> Nhấn vào biểu tượng <Pencil className="w-3 h-3 inline" /> trên thẻ để chỉnh sửa nhanh nội dung thẻ đó.
                </span>
              </p>
            </div>
          </div>

          {/* Right: Preview List (2 columns) */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Danh Sách Thẻ
                </h3>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full text-sm font-bold">
                  {cards.length} thẻ
                </span>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                  {cards.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800 p-8 text-center"
                    >
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-purple-100 dark:bg-purple-950 rounded-full">
                          <Plus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Các thẻ bạn thêm sẽ<br />xuất hiện ở đây
                      </p>
                    </motion.div>
                  ) : (
                    cards.map((card) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        layout
                        className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-4 shadow-sm hover:shadow-md transition-all group ${
                          editingCardId === card.id
                            ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-200 dark:ring-amber-900'
                            : 'border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2 min-w-0">
                            <div>
                              {card.furigana && (
                                <div className="text-xs text-purple-600 dark:text-purple-400" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                                  {card.furigana}
                                </div>
                              )}
                              <div
                                className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate"
                                style={{ fontFamily: isJapanese ? "'Noto Sans JP', sans-serif" : undefined }}
                              >
                                {card.front}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{card.back}</div>
                            {card.example && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 italic line-clamp-1">{card.example}</div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditCard(card)}
                              className="p-2 hover:bg-amber-100 dark:hover:bg-amber-950 rounded-xl transition-colors"
                              title="Sửa thẻ"
                            >
                              <Pencil className="w-4 h-4 text-amber-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-950 rounded-xl transition-colors"
                              title="Xóa thẻ"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}