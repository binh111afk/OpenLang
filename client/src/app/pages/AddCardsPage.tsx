import { X, Mic, Sparkles, Plus, Trash2, Pencil, Save, Image as ImageIcon, LoaderCircle, Star } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { fetchJson } from '@/utils/api';

interface Card {
  id: string;
  front: string;
  furigana?: string;
  back: string;
  example: string;
  exampleTranslation: string;
  imageUrl?: string;
  persisted?: boolean;
}

interface FlashcardApiItem {
  id: string;
  front: {
    word: string;
    furigana?: string;
  };
  back: {
    meaning: string;
    example: string;
    exampleTranslation: string;
  };
  imageUrl?: string;
}

interface LocationState {
  deckName: string;
  language: 'english' | 'japanese';
  deckCoverImage?: string;
  deckRating?: number;
  deckId?: string;
  mode?: 'edit' | 'add';
}

export function AddCardsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const isEditMode = state?.mode === 'edit';

  const [front, setFront] = useState('');
  const [furigana, setFurigana] = useState('');
  const [back, setBack] = useState('');
  const [example, setExample] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [persistedCardIds, setPersistedCardIds] = useState<string[]>([]);

  const frontInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    frontInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!state?.deckName || !state?.deckId) {
      navigate('/library');
    }
  }, [state, navigate]);

  useEffect(() => {
    let isMounted = true;

    async function loadExistingCards() {
      if (!isEditMode || !state?.deckId) {
        return;
      }

      setIsPageLoading(true);

      try {
        const payload = await fetchJson<{ cards?: FlashcardApiItem[] }>(
          `/api/flashcards?deckId=${encodeURIComponent(state.deckId)}`,
        );

        if (!isMounted) {
          return;
        }

        const loadedCards: Card[] = ((payload.cards || []) as FlashcardApiItem[]).map((card) => ({
          id: card.id,
          front: card.front.word,
          furigana: card.front.furigana || '',
          back: card.back.meaning,
          example: card.back.example || '',
          exampleTranslation: card.back.exampleTranslation || '',
          imageUrl: card.imageUrl,
          persisted: true,
        }));

        setCards(loadedCards);
        setPersistedCardIds(loadedCards.map((card) => card.id));
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Không thể tải danh sách thẻ.');
      } finally {
        if (isMounted) {
          setIsPageLoading(false);
        }
      }
    }

    void loadExistingCards();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, state?.deckId]);

  const isJapanese = state?.language === 'japanese';

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
          setExample('毎日日本語を勉強します。');
          setExampleTranslation('Tôi học tiếng Nhật mỗi ngày.');
        } else {
          setFurigana('れい');
          setBack('Ví dụ, mẫu');
          setExample('これは例です。');
          setExampleTranslation('Đây là một ví dụ.');
        }
      } else {
        if (front.toLowerCase() === 'study') {
          setBack('Học tập, nghiên cứu');
          setExample('I study English every day.');
          setExampleTranslation('Tôi học tiếng Anh mỗi ngày.');
        } else {
          setBack('Ví dụ nghĩa');
          setExample('This is an example sentence.');
          setExampleTranslation('Đây là một câu ví dụ.');
        }
      }

      setIsAiLoading(false);
    }, 1200);
  };

  const clearForm = () => {
    setFront('');
    setFurigana('');
    setBack('');
    setExample('');
    setExampleTranslation('');
    setEditingCardId(null);
    frontInputRef.current?.focus();
  };

  const handleAddCard = () => {
    if (!front.trim() || !back.trim()) {
      alert('Vui lòng nhập ít nhất Từ vựng và Nghĩa.');
      return;
    }

    if (editingCardId) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === editingCardId
            ? {
                ...card,
                front: front.trim(),
                furigana: isJapanese ? furigana.trim() : undefined,
                back: back.trim(),
                example: example.trim(),
                exampleTranslation: exampleTranslation.trim(),
              }
            : card,
        ),
      );
    } else {
      const newCard: Card = {
        id: Date.now().toString(),
        front: front.trim(),
        furigana: isJapanese ? furigana.trim() : undefined,
        back: back.trim(),
        example: example.trim(),
        exampleTranslation: exampleTranslation.trim(),
        persisted: false,
      };

      setCards((prev) => [newCard, ...prev]);
    }

    clearForm();
  };

  const handleEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setFront(card.front);
    setFurigana(card.furigana ?? '');
    setBack(card.back);
    setExample(card.example);
    setExampleTranslation(card.exampleTranslation || '');
    frontInputRef.current?.focus();
  };

  const handleDeleteCard = (id: string) => {
    if (editingCardId === id) {
      clearForm();
    }

    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const syncCardsToSupabase = async () => {
    if (!state?.deckId) {
      throw new Error('Thiếu deckId để lưu thẻ.');
    }

    const currentPersistedIds = cards.filter((card) => card.persisted).map((card) => card.id);
    const deletedIds = persistedCardIds.filter((id) => !currentPersistedIds.includes(id));

    for (const card of cards) {
      const payload = {
        deckId: state.deckId,
        language: state.language,
        frontWord: card.front,
        frontFurigana: isJapanese ? card.furigana || null : null,
        backMeaning: card.back,
        example: card.example || null,
        exampleTranslation: card.exampleTranslation || null,
        imageUrl: card.imageUrl || null,
      };

      await fetchJson<{ card: FlashcardApiItem }>('/api/flashcards', {
        method: card.persisted ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(card.persisted ? { id: card.id, ...payload } : payload),
      });
    }

    for (const deletedId of deletedIds) {
      await fetchJson<{ success: boolean }>('/api/flashcards', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deletedId }),
      });
    }
  };

  const enrichImagesFromPixabay = async () => {
    if (!state?.deckId) {
      return;
    }

    await fetchJson<{ results: unknown[] }>('/api/flashcard-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deckId: state.deckId }),
    });
  };

  const handleFinish = async () => {
    if (cards.length === 0) {
      alert('Vui lòng thêm ít nhất một thẻ.');
      return;
    }

    setIsSaving(true);

    try {
      await syncCardsToSupabase();
      await enrichImagesFromPixabay();
      alert(`Đã lưu ${cards.length} thẻ vào bộ "${state.deckName}" và cập nhật ảnh minh họa.`);
      navigate('/library');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể lưu bộ thẻ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (cards.length > 0) {
      const confirmLeave = window.confirm('Bạn có chắc muốn thoát? Các thay đổi chưa lưu có thể bị mất.');
      if (!confirmLeave) {
        return;
      }
    }

    navigate('/library');
  };

  if (!state) {
    return null;
  }

  const headerTitle = isEditMode ? 'Sửa bộ thẻ:' : 'Đang thêm vào:';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950">
      <div className="sticky top-0 z-10 border-b-2 border-purple-200 bg-white shadow-sm dark:border-purple-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="rounded-xl p-2 transition-colors hover:bg-purple-100 dark:hover:bg-purple-950"
              title="Hủy và quay lại"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl border border-purple-200 bg-purple-50 shadow-sm dark:border-purple-800 dark:bg-purple-950">
                  {state.deckCoverImage ? (
                    <img src={state.deckCoverImage} alt={state.deckName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-purple-500 dark:text-purple-300" />
                    </div>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {headerTitle} <span className="text-purple-600 dark:text-purple-400">{state.deckName}</span>
                </h1>
                {typeof state.deckRating === 'number' ? (
                  <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-500 dark:bg-amber-950/50">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= state.deckRating!
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
                {isEditMode ? (
                  <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    Chế độ sửa
                  </span>
                ) : null}
              </div>
              <p className="ml-14 text-sm text-gray-500 dark:text-gray-400">
                {cards.length} thẻ {isEditMode ? 'đang có trong bộ' : 'đã thêm vào danh sách chờ lưu'}
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Đang lưu vào Supabase...' : isEditMode ? 'Lưu Thay Đổi' : 'Hoàn Thành'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="space-y-6 rounded-3xl border-2 border-purple-200 bg-white p-8 shadow-lg dark:border-purple-800 dark:bg-gray-900">
              <AnimatePresence>
                {editingCardId ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/50"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                      <Pencil className="h-4 w-4" />
                      Đang sửa thẻ...
                    </div>
                    <button onClick={clearForm} className="text-xs text-amber-600 hover:underline dark:text-amber-500">
                      Hủy sửa
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                    Thông tin từ vựng
                  </h3>
                  <button
                    className="rounded-xl p-2 transition-colors hover:bg-purple-100 dark:hover:bg-purple-950"
                    title="Thu âm"
                    type="button"
                  >
                    <Mic className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {isJapanese ? (
                  <input
                    type="text"
                    value={furigana}
                    onChange={(event) => setFurigana(event.target.value)}
                    placeholder="Furigana - VD: べんきょう"
                    className="w-full rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm text-purple-600 placeholder-purple-400 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400 dark:placeholder-purple-600"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  />
                ) : null}

                <input
                  ref={frontInputRef}
                  type="text"
                  value={front}
                  onChange={(event) => setFront(event.target.value)}
                  placeholder={isJapanese ? 'Từ vựng (Kanji)' : 'Từ vựng tiếng Anh'}
                  className="w-full rounded-2xl border-2 border-purple-200 bg-purple-50 px-6 py-4 text-center text-2xl font-bold text-gray-800 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-gray-100 dark:placeholder-gray-500"
                  style={{ fontFamily: isJapanese ? "'Noto Sans JP', sans-serif" : undefined }}
                />
              </div>

              <div className="border-t-2 border-purple-100 dark:border-purple-900" />

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                  Phần nghĩa và ví dụ
                </h3>

                <textarea
                  value={back}
                  onChange={(event) => setBack(event.target.value)}
                  placeholder="Nghĩa / định nghĩa"
                  className="w-full resize-none rounded-2xl border-2 border-purple-200 bg-purple-50 px-6 py-4 text-lg text-gray-800 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-gray-100 dark:placeholder-gray-500"
                  rows={2}
                />

                <textarea
                  value={example}
                  onChange={(event) => setExample(event.target.value)}
                  placeholder="Ví dụ tiếng Anh / tiếng Nhật"
                  className="w-full resize-none rounded-2xl border border-purple-200 bg-purple-50 px-6 py-4 text-sm text-gray-700 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-gray-300 dark:placeholder-gray-500"
                  rows={3}
                />

                <textarea
                  value={exampleTranslation}
                  onChange={(event) => setExampleTranslation(event.target.value)}
                  placeholder="Dịch câu ví dụ sang tiếng Việt"
                  className="w-full resize-none rounded-2xl border border-purple-200 bg-white px-6 py-4 text-sm text-gray-700 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-purple-800 dark:bg-gray-950 dark:text-gray-300 dark:placeholder-gray-500"
                  rows={2}
                />
              </div>

              <button
                onClick={handleAiSuggestion}
                disabled={isAiLoading || !front.trim()}
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700"
              >
                <Sparkles className="h-5 w-5" />
                {isAiLoading ? 'AI đang gợi ý...' : 'Gợi ý bởi AI ✨'}
              </button>

              <button
                onClick={handleAddCard}
                type="button"
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl ${
                  editingCardId
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600'
                }`}
              >
                {editingCardId ? (
                  <>
                    <Save className="h-6 w-6" />
                    Lưu thay đổi thẻ
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6" />
                    Thêm thẻ tiếp theo
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-100 to-violet-100 p-4 dark:border-purple-800 dark:from-purple-950 dark:to-violet-950">
              <p className="flex items-start gap-2 text-sm text-purple-800 dark:text-purple-300">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Mẹo:</strong> Khi bạn bấm hoàn thành, OpenLang sẽ lưu toàn bộ thẻ vào Supabase trước, sau đó tự gọi Pixabay để lấy ảnh minh họa cho từng từ.
                </span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Danh Sách Thẻ</h3>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {cards.length} thẻ
                </span>
              </div>

              <div className="max-h-[calc(100vh-200px)] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700">
                <AnimatePresence mode="popLayout">
                  {isPageLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl border-2 border-dashed border-purple-200 bg-white p-8 text-center dark:border-purple-800 dark:bg-gray-900"
                    >
                      <LoaderCircle className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải thẻ hiện có...</p>
                    </motion.div>
                  ) : cards.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl border-2 border-dashed border-purple-200 bg-white p-8 text-center dark:border-purple-800 dark:bg-gray-900"
                    >
                      <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-purple-100 p-4 dark:bg-purple-950">
                          <Plus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Các thẻ bạn thêm sẽ
                        <br />
                        xuất hiện ở đây
                      </p>
                    </motion.div>
                  ) : (
                    cards.map((card) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        layout
                        className={`group rounded-2xl border-2 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-gray-900 ${
                          editingCardId === card.id
                            ? 'border-amber-400 ring-2 ring-amber-200 dark:border-amber-600 dark:ring-amber-900'
                            : 'border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div>
                              {card.furigana ? (
                                <div className="text-xs text-purple-600 dark:text-purple-400" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                                  {card.furigana}
                                </div>
                              ) : null}
                              <div
                                className="truncate text-lg font-bold text-gray-800 dark:text-gray-100"
                                style={{ fontFamily: isJapanese ? "'Noto Sans JP', sans-serif" : undefined }}
                              >
                                {card.front}
                              </div>
                            </div>
                            <div className="truncate text-sm text-gray-700 dark:text-gray-300">{card.back}</div>
                            {card.example ? (
                              <div className="line-clamp-1 text-xs italic text-gray-500 dark:text-gray-500">{card.example}</div>
                            ) : null}
                            {card.exampleTranslation ? (
                              <div className="line-clamp-1 text-xs text-slate-400 dark:text-slate-500">{card.exampleTranslation}</div>
                            ) : null}
                          </div>

                          <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleEditCard(card)}
                              className="rounded-xl p-2 transition-colors hover:bg-amber-100 dark:hover:bg-amber-950"
                              title="Sửa thẻ"
                              type="button"
                            >
                              <Pencil className="h-4 w-4 text-amber-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="rounded-xl p-2 transition-colors hover:bg-red-100 dark:hover:bg-red-950"
                              title="Xóa thẻ"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
