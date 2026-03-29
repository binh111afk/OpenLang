import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, CheckCircle, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import vocabularySeed from '@/data/vocabulary.json';
import { createSupabaseBrowserClient } from '@/utils/supabase/client';
import { fetchJson } from '@/utils/api';
import { saveDeckProgress } from '@/utils/progress';
import LearningFlow from '../components/LearningFlow';
import { PronounceButton } from '../components/PronounceButton';
import { useUser } from '../contexts/UserContext';

interface VocabularyCard {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
  furigana?: string; // e.g. "べんきょう" for 勉強
  language: 'english' | 'japanese';
  image?: string;
}

interface DeckConfig {
  id: string;
  name: string;
  emoji?: string;
  language: 'english' | 'japanese';
  cards: VocabularyCard[];
}

interface ApiDeckPayload {
  id: string;
  name: string;
  language: 'english' | 'japanese';
}

interface ApiFlashcardPayload {
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
  createdAt?: string;
  updatedAt?: string;
}

interface SeedVocabularyItem {
  word: string;
  category: string;
  level: string;
  ipa: string;
  details: {
    definition_vi: string;
    example_en: string;
    example_vi: string;
    synonyms: string[];
    image_url?: string;
    image_large_url?: string;
  };
}

interface SupabaseVocabularyItem {
  word: string;
  category: string;
  level: string;
  ipa: string;
  details: {
    definition_vi: string;
    example_en: string;
    example_vi: string;
    synonyms: string[];
    image_url?: string;
    image_large_url?: string;
  };
}

// ── Highlight the keyword inside example sentence ──────────────────────────
function HighlightedExample({ text, keyword }: { text: string; keyword: string }) {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const idx = lowerText.indexOf(lowerKeyword);
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="text-purple-600 dark:text-purple-400 not-italic">{text.slice(idx, idx + keyword.length)}</strong>
      {text.slice(idx + keyword.length)}
    </>
  );
}

// ── Progress bar with shimmer when near 100% ───────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  const isNearEnd = progress >= 87.5; // last card
  return (
    <div className="w-full bg-purple-100 dark:bg-purple-900/60 rounded-full h-3 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`h-full rounded-full relative overflow-hidden ${
          isNearEnd
            ? 'bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-500'
            : 'bg-gradient-to-r from-purple-500 to-violet-500'
        }`}
      >
        {isNearEnd && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
          />
        )}
      </motion.div>
    </div>
  );
}

// ── Keyboard hint badge ────────────────────────────────────────────────────
function KbdHint({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/25 border border-white/35 text-white/90 text-[11px] font-mono leading-none backdrop-blur-sm">
      {children}
    </kbd>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────
const FRUITS_DECK: DeckConfig = {
  id: 'fruits',
  name: 'Trái Cây',
  emoji: '🍎',
  language: 'english',
  cards: [
    {
      id: 'f1', word: 'Apple', pronunciation: '/ˈæp.əl/', meaning: 'Quả táo',
      example: 'An apple a day keeps the doctor away.',
      exampleTranslation: 'Mỗi ngày một quả táo giúp bạn tránh xa bác sĩ.',
      language: 'english',
      image: 'https://images.unsplash.com/photo-1623815242959-fb20354f9b8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHJlZCUyMGFwcGxlJTIwZnJ1aXR8ZW58MXx8fHwxNzc0NjY1MTAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'f2', word: 'Banana', pronunciation: '/bəˈnɑː.nə/', meaning: 'Quả chuối',
      example: 'Bananas are rich in potassium.',
      exampleTranslation: 'Chuối rất giàu kali.',
      language: 'english',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5ZWxsb3clMjBiYW5hbmElMjBmcnVpdHxlbnwxfHx8fDE3NzQ1ODEzODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'f3', word: 'Orange', pronunciation: '/ˈɒr.ɪndʒ/', meaning: 'Quả cam',
      example: 'I drink orange juice every morning.',
      exampleTranslation: 'Tôi uống nước cam mỗi buổi sáng.',
      language: 'english',
      image: 'https://images.unsplash.com/photo-1634781326658-8734696bb6d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjBjaXRydXMlMjBmcnVpdHxlbnwxfHx8fDE3NzQ2NDQ5MzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'f4', word: 'Mango', pronunciation: '/ˈmæŋ.ɡoʊ/', meaning: 'Quả xoài',
      example: 'Mango is the king of tropical fruits.',
      exampleTranslation: 'Xoài được mệnh danh là vua của các loại trái cây nhiệt đới.',
      language: 'english',
      image: 'https://images.unsplash.com/photo-1734163075572-8948e799e42c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMG1hbmdvJTIwZnJ1aXR8ZW58MXx8fHwxNzc0NTkzMzYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'f5', word: 'Strawberry', pronunciation: '/ˈstrɔː.bər.i/', meaning: 'Quả dâu tây',
      example: 'Strawberries are sweet and red.',
      exampleTranslation: 'Dâu tây có vị ngọt và màu đỏ.',
      language: 'english',
      image: 'https://images.unsplash.com/photo-1710528184650-fc75ae862c13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHN0cmF3YmVycnklMjByZWR8ZW58MXx8fHwxNzc0NjY1MTA0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'f6', word: 'Grape', pronunciation: '/ɡreɪp/', meaning: 'Quả nho',
      example: 'Grapes are used to make wine.',
      exampleTranslation: 'Nho được dùng để làm rượu vang.',
      language: 'english',
      image: 'https://images.unsplash.com/photo-1599678695930-bfd6ad507037?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBncmFwZSUyMGNsdXN0ZXJ8ZW58MXx8fHwxNzc0NjY1MTA0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'f7', word: 'Watermelon', pronunciation: '/ˈwɔː.tə.mel.ən/', meaning: 'Quả dưa hấu',
      example: 'Watermelon is perfect for summer.',
      exampleTranslation: 'Dưa hấu là thứ hoàn hảo cho mùa hè.',
      language: 'english',
      image: 'https://images.unsplash.com/photo-1719317007092-7b2931aa36b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcm1lbG9uJTIwc2xpY2VkJTIwcmVkfGVufDF8fHx8MTc3NDYzOTgwNXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'f8', word: 'Pineapple', pronunciation: '/ˈpaɪn.æp.əl/', meaning: 'Quả dứa / thơm',
      example: 'Pineapple is sweet and tangy.',
      exampleTranslation: 'Dứa có vị ngọt và chua nhẹ.',
      language: 'english',
      image: 'https://images.unsplash.com/photo-1472352255192-75fb1f6b329c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5lYXBwbGUlMjB0cm9waWNhbCUyMGZydWl0fGVufDF8fHx8MTc3NDU1MzUyMXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ],
};

const DEFAULT_DECK: DeckConfig = {
  id: '1',
  name: 'JLPT N5 Kanji Cơ Bản',
  language: 'japanese',
  cards: [
    { id: '1', word: '勉強', furigana: 'べんきょう', pronunciation: 'べんきょう (benkyou)', meaning: 'Học tập', example: '毎日勉強します。', exampleTranslation: 'Tôi học tập mỗi ngày.', language: 'japanese' },
    { id: '2', word: '学校', furigana: 'がっこう', pronunciation: 'がっこう (gakkou)', meaning: 'Trường học', example: '学校へ行きます。', exampleTranslation: 'Tôi đi đến trường.', language: 'japanese' },
    { id: '3', word: '先生', furigana: 'せんせい', pronunciation: 'せんせい (sensei)', meaning: 'Giáo viên', example: '山田先生はやさしいです。', exampleTranslation: 'Giáo viên Yamada rất tốt bụng.', language: 'japanese' },
    { id: '4', word: '友達', furigana: 'ともだち', pronunciation: 'ともだち (tomodachi)', meaning: 'Bạn bè', example: '友達と公園で遊びます。', exampleTranslation: 'Tôi chơi ở công viên cùng bạn bè.', language: 'japanese' },
    { id: '5', word: '食べる', furigana: 'たべる', pronunciation: 'たべる (taberu)', meaning: 'Ăn', example: 'ご飯を食べます。', exampleTranslation: 'Tôi ăn cơm.', language: 'japanese' },
    { id: '6', word: '飲む', furigana: 'のむ', pronunciation: 'のむ (nomu)', meaning: 'Uống', example: '水を飲みます。', exampleTranslation: 'Tôi uống nước.', language: 'japanese' },
  ],
};

const OPENLANG_ACADEMIC_DECK: DeckConfig = {
  id: 'openlang-academic',
  name: 'OpenLang Tech, Mindset & Campus',
  emoji: '🧠',
  language: 'english',
  cards: (vocabularySeed as SeedVocabularyItem[]).map((item, index) => ({
    id: `openlang-${index + 1}`,
    word: item.word,
    pronunciation: item.ipa,
    meaning: item.details.definition_vi,
    example: item.details.example_en,
    exampleTranslation: item.details.example_vi,
    language: 'english',
    image: item.details.image_url || item.details.image_large_url,
  })),
};

function getDeckById(id: string): DeckConfig {
  if (id === 'fruits') return FRUITS_DECK;
  if (id === 'openlang-academic') return OPENLANG_ACADEMIC_DECK;
  return { ...DEFAULT_DECK, id };
}

function decodeSupabaseCategory(deckId: string) {
  if (!deckId.startsWith('supabase--')) {
    return null;
  }

  try {
    return decodeURIComponent(deckId.replace('supabase--', ''));
  } catch {
    return null;
  }
}

const BUILT_IN_DECK_IDS = new Set([
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  'fruits',
  'openlang-academic',
]);

// ── Main component ─────────────────────────────────────────────────────────
export function StudyPage() {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const { isLoggedIn, getAccessToken } = useUser();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [supabaseDeck, setSupabaseDeck] = useState<DeckConfig | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [customDeck, setCustomDeck] = useState<DeckConfig | null>(null);
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const lastSavedProgressRef = useRef<string>('');
  const supabaseCategory = decodeSupabaseCategory(deckId || '');
  const shouldLoadCustomDeck = Boolean(
    deckId &&
      !supabaseCategory &&
      !BUILT_IN_DECK_IDS.has(deckId),
  );

  useEffect(() => {
    setCurrentCardIndex(0);
  }, [deckId]);

  useEffect(() => {
    let isMounted = true;

    async function loadSupabaseDeck() {
      if (!supabaseCategory) {
        setSupabaseDeck(null);
        setSupabaseError(null);
        setSupabaseLoading(false);
        return;
      }

      setSupabaseLoading(true);
      setSupabaseError(null);

      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('vocabulary')
          .select('word, category, level, ipa, details')
          .eq('category', supabaseCategory)
          .order('word', { ascending: true });

        if (!isMounted) {
          return;
        }

        if (error) {
          setSupabaseError(error.message);
          setSupabaseDeck(null);
          return;
        }

        const items = (data as SupabaseVocabularyItem[]) ?? [];
        setSupabaseDeck({
          id: deckId || 'supabase',
          name: supabaseCategory === 'Animals' ? 'Động Vật' : supabaseCategory,
          emoji: supabaseCategory === 'Animals' ? '🐾' : '📘',
          language: 'english',
          cards: items.map((item, index) => ({
            id: `${supabaseCategory}-${index + 1}`,
            word: item.word,
            pronunciation: item.ipa,
            meaning: item.details.definition_vi,
            example: item.details.example_en,
            exampleTranslation: item.details.example_vi,
            language: 'english',
            image: item.details.image_url || item.details.image_large_url,
          })),
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSupabaseError(
          error instanceof Error ? error.message : 'Failed to load deck.',
        );
        setSupabaseDeck(null);
      } finally {
        if (isMounted) {
          setSupabaseLoading(false);
        }
      }
    }

    void loadSupabaseDeck();

    return () => {
      isMounted = false;
    };
  }, [deckId, supabaseCategory]);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomDeck() {
      if (!shouldLoadCustomDeck || !deckId) {
        setCustomDeck(null);
        return;
      }

      setSupabaseLoading(true);
      setSupabaseError(null);

      try {
        const [deckPayload, cardsPayload] = await Promise.all([
          fetchJson<{ decks?: ApiDeckPayload[] }>('/api/library'),
          fetchJson<{ cards?: ApiFlashcardPayload[] }>(`/api/flashcards?deckId=${encodeURIComponent(deckId)}`),
        ]);

        if (!isMounted) {
          return;
        }

        const deckMeta = ((deckPayload.decks || []) as ApiDeckPayload[]).find(
          (deck) => deck.id === deckId,
        );

        setCustomDeck({
          id: deckId,
          name: deckMeta?.name || 'Bộ thẻ của bạn',
          language: deckMeta?.language || 'english',
          cards: ((cardsPayload.cards || []) as ApiFlashcardPayload[])
            .sort((a, b) => {
              const currentTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
              const nextTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
              return nextTime - currentTime;
            })
            .map((card) => ({
            id: card.id,
            word: card.front.word,
            furigana: card.front.furigana,
            pronunciation: card.front.furigana || '',
            meaning: card.back.meaning,
            example: card.back.example || '',
            exampleTranslation: card.back.exampleTranslation || '',
            language: (deckMeta?.language || 'english') as 'english' | 'japanese',
            image: card.imageUrl,
          })),
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSupabaseError(
          error instanceof Error ? error.message : 'Failed to load custom deck.',
        );
        setCustomDeck(null);
      } finally {
        if (isMounted) {
          setSupabaseLoading(false);
        }
      }
    }

    void loadCustomDeck();

    return () => {
      isMounted = false;
    };
  }, [deckId, shouldLoadCustomDeck]);

  const deckData = customDeck ?? supabaseDeck ?? getDeckById(deckId || '1');
  const activeDeckId = deckId || '1';
  const currentCard = deckData.cards[currentCardIndex] ?? deckData.cards[0];
  const progress = ((currentCardIndex + 1) / deckData.cards.length) * 100;
  const isLastCard = currentCardIndex === deckData.cards.length - 1;
  const isFruitsDeck = deckId === 'fruits';

  const handleNext = useCallback(() => {
    if (isLastCard) {
      if (supabaseCategory) {
        navigate('/library');
      } else {
        navigate(`/library/${deckId}/quiz`);
      }
    }
    else setCurrentCardIndex((p) => p + 1);
  }, [isLastCard, navigate, deckId, supabaseCategory]);

  const handlePrevious = useCallback(() => {
    if (currentCardIndex > 0) setCurrentCardIndex((p) => p - 1);
  }, [currentCardIndex]);

  const triggerKeyboardPress = useCallback(() => {
    setKeyboardPressed(true);
    window.setTimeout(() => setKeyboardPressed(false), 130);
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentCard) {
      return;
    }

    const handler = (e: KeyboardEvent) => {
      // Ignore if focus is inside an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        triggerKeyboardPress();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentCard, handleNext, handlePrevious, triggerKeyboardPress]);

  useEffect(() => {
    let isMounted = true;

    async function persistProgress() {
      if (!isLoggedIn || !deckData.cards.length) {
        return;
      }

      const token = await getAccessToken();
      if (!token || !isMounted) {
        return;
      }

      const roundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
      const saveKey = `${activeDeckId}:${currentCardIndex}:${roundedProgress}:${deckData.cards.length}`;

      if (lastSavedProgressRef.current === saveKey) {
        return;
      }

      lastSavedProgressRef.current = saveKey;

      try {
        await saveDeckProgress(token, {
          deckId: activeDeckId,
          progress: roundedProgress,
          currentIndex: currentCardIndex,
          totalCards: deckData.cards.length,
        });
      } catch {
        // Ignore transient save errors and keep studying flow smooth.
      }
    }

    void persistProgress();

    return () => {
      isMounted = false;
    };
  }, [
    activeDeckId,
    currentCardIndex,
    deckData.cards.length,
    getAccessToken,
    isLoggedIn,
    progress,
  ]);

  if (supabaseLoading) {
    return (
      <div className="min-h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-purple-200 dark:border-purple-800 px-8 py-6 text-gray-600 dark:text-gray-300">
          Đang tải bộ thẻ từ Supabase...
        </div>
      </div>
    );
  }

  if (supabaseError) {
    return (
      <div className="min-h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 p-6">
        <div className="max-w-lg bg-white dark:bg-gray-900 rounded-3xl border border-red-200 dark:border-red-800 px-8 py-6 text-center space-y-4">
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">Không thể tải bộ thẻ Supabase</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{supabaseError}</p>
          <button
            onClick={() => navigate('/library')}
            className="px-5 py-3 rounded-2xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
          >
            Quay về Thư Viện
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard || !deckData.cards.length) {
    return (
      <div className="min-h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 p-6">
        <div className="max-w-lg bg-white dark:bg-gray-900 rounded-3xl border border-purple-200 dark:border-purple-800 px-8 py-6 text-center space-y-4">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Bộ thẻ này chưa có từ vựng</p>
          <button
            onClick={() => navigate('/library')}
            className="px-5 py-3 rounded-2xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
          >
            Quay về Thư Viện
          </button>
        </div>
      </div>
    );
  }

  const smartFlowVocabList = deckData.cards.map((card) => ({
    word: card.word,
    category: deckData.name,
    level: 'Mixed',
    ipa: card.pronunciation,
    details: {
      definition_vi: card.meaning,
      example_en: card.example || '',
      example_vi: card.exampleTranslation || '',
      synonyms: [],
      image_url: card.image,
    },
  }));

  const useSmartFlow = deckData.language === 'english';

  if (useSmartFlow) {
    return (
      <div className="min-h-full w-full flex flex-col bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 overflow-hidden">
        <div className="w-full max-w-[1000px] mx-auto flex-1 px-5 lg:px-6 py-5 lg:py-6 space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/library')}
              className="flex-none p-2.5 rounded-2xl bg-white dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {deckData.emoji ? (
                  <span className="text-lg leading-none">{deckData.emoji}</span>
                ) : null}
                <h1 className="font-bold text-gray-800 dark:text-gray-100 truncate">
                  {deckData.name}
                </h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Smart learning flow: học theo thẻ, mini quiz mỗi 5 từ, final test cuối buổi.
              </p>
            </div>
          </div>

          <LearningFlow vocabList={smartFlowVocabList} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full flex flex-col bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 overflow-hidden">
      <div className="w-full max-w-[1000px] mx-auto flex-1 min-h-0 flex flex-col px-5 lg:px-6 py-5 lg:py-6 gap-5 lg:gap-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-none w-full pt-1">
        <div className="w-full flex items-center gap-3">
          <button
            onClick={() => navigate('/library')}
            className="flex-none p-2.5 rounded-2xl bg-white dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {deckData.emoji && <span className="text-lg leading-none">{deckData.emoji}</span>}
              <h1 className="font-bold text-gray-800 dark:text-gray-100 truncate">{deckData.name}</h1>
              <span className="flex-none text-xs text-gray-500 dark:text-gray-400 ml-auto tabular-nums">
                {currentCardIndex + 1} / {deckData.cards.length}
              </span>
            </div>
            <ProgressBar progress={progress} />
          </div>

          {/* Hotkey hint toggle */}
          <button
            onClick={() => setShowHotkeys((v) => !v)}
            title="Phím tắt"
            className={`flex-none p-2.5 rounded-2xl border-2 transition-all ${
              showHotkeys
                ? 'bg-purple-100 dark:bg-purple-900 border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400'
                : 'bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 text-gray-400 hover:border-purple-300'
            }`}
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>

        {/* Hotkey panel */}
        <AnimatePresence>
          {showHotkeys && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="w-full mt-3 flex flex-wrap gap-3 px-2 py-2.5 rounded-2xl bg-purple-600/10 dark:bg-purple-800/20 border border-purple-200 dark:border-purple-800 text-xs text-gray-600 dark:text-gray-400">
                {[
                  { keys: ['Space'], desc: 'Phát âm từ' },
                  { keys: ['←'], desc: 'Trở lại' },
                  { keys: ['→', 'Enter'], desc: 'Tiếp tục' },
                ].map((h) => (
                  <div key={h.desc} className="flex items-center gap-1.5">
                    {h.keys.map((k) => (
                      <kbd key={k} className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 font-mono text-purple-700 dark:text-purple-300 text-xs shadow-sm">
                        {k}
                      </kbd>
                    ))}
                    <span>{h.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Card Area ──────────────────────────────────────────────────── */}
      <div className="flex-1 w-full flex items-center justify-center py-1 min-h-0">
        <div className="w-full h-full flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 28, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -28, scale: 0.985 }}
              transition={{ duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-full bg-white/95 dark:bg-gray-900/95 rounded-3xl border border-purple-200/80 dark:border-purple-800 shadow-[0_26px_72px_-42px_rgba(88,28,135,0.45)] overflow-hidden min-h-[58vh] sm:min-h-[62vh] lg:min-h-[66vh] max-h-[74vh]"
            >
              {isFruitsDeck && currentCard.image ? (
                /* ── Fruits: 40/60 image + content ── */
                <div className="h-full min-h-[inherit] p-6 sm:p-7 lg:p-8 flex flex-col gap-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
                    {/* Image */}
                    <div className="lg:w-[45%] lg:flex-none">
                      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-50 shadow-sm ring-1 ring-purple-200/70 dark:bg-slate-900 dark:ring-purple-800/80">
                        <img
                          src={currentCard.image}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-xl"
                        />
                        <div className="absolute inset-0 bg-white/18 dark:bg-gray-900/18" />
                        <div className="relative z-[1] flex h-full w-full items-center justify-center p-4 sm:p-5">
                          <img
                            src={currentCard.image}
                            alt={currentCard.word}
                            className="h-full w-full rounded-[20px] object-contain shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-center gap-5 p-2 sm:p-4 lg:p-8">
                    {/* Word + audio */}
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-5xl font-black leading-tight text-purple-800 dark:text-purple-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {currentCard.word}
                      </h3>
                      <PronounceButton
                        text={currentCard.word}
                        lang={deckData.language === 'japanese' ? 'ja-JP' : 'en-US'}
                        label="Phát âm từ"
                      />
                    </div>

                    {/* Pronunciation */}
                    <p className="text-purple-500 dark:text-purple-300 font-semibold tracking-wide text-lg" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                      {currentCard.pronunciation}
                    </p>

                    <div className="w-10 h-0.5 bg-purple-500 rounded-full" />

                    {/* Meaning */}
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/90 px-5 py-4 text-center dark:border-purple-900 dark:bg-purple-950/60">
                      <p className="text-[1.9rem] leading-tight font-bold text-gray-800 dark:text-gray-100">
                        {currentCard.meaning}
                      </p>
                    </div>
                    </div>
                  </div>

                  {/* Example */}
                  {currentCard.example && (
                    <>
                      <div className="mx-auto mt-2 w-[72%] border-t border-purple-100 dark:border-purple-900/70" />
                      <div className="mx-auto mt-3 w-[80%] rounded-2xl bg-purple-50/50 px-6 py-5 text-center dark:bg-purple-950/25">
                        <div className="mb-1.5 flex items-center justify-center gap-2">
                          <p className="text-sm font-semibold text-purple-500 dark:text-purple-400 tracking-wide">Ví dụ</p>
                          <PronounceButton
                            text={currentCard.example!}
                            lang={deckData.language === 'japanese' ? 'ja-JP' : 'en-US'}
                            label="Phát âm câu ví dụ"
                            className="p-1.5 rounded-lg"
                          />
                        </div>
                        <p className="text-lg font-semibold italic leading-7 text-gray-700 dark:text-gray-200">
                          <HighlightedExample text={currentCard.example} keyword={currentCard.word} />
                        </p>
                        {currentCard.exampleTranslation && (
                          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {currentCard.exampleTranslation}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ── Regular / Japanese: compact centered ── */
                <div className="h-full min-h-[inherit] p-8 sm:p-10 flex flex-col items-center justify-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-sm">
                    {currentCardIndex + 1}
                  </div>

                  {/* Word + furigana + audio */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      {currentCard.furigana && (
                        <p className="text-sm text-purple-400 dark:text-purple-400 mb-1 tracking-widest" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                          {currentCard.furigana}
                        </p>
                      )}
                      <h3
                        className="font-bold text-gray-800 dark:text-gray-100 leading-[1.6]"
                        style={{
                          fontFamily: currentCard.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif",
                          fontSize: currentCard.language === 'japanese' ? '3.5rem' : '3rem',
                        }}
                      >
                        {currentCard.word}
                      </h3>
                    </div>
                    <PronounceButton
                      text={currentCard.word}
                      lang={deckData.language === 'japanese' ? 'ja-JP' : 'en-US'}
                      label="Phát âm từ"
                    />
                  </div>

                  {/* Pronunciation */}
                  <p className="text-lg text-purple-600 dark:text-purple-300 font-semibold text-center tracking-wide" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                    {currentCard.pronunciation}
                  </p>

                  <div className="w-14 h-0.5 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full" />

                  {/* Meaning */}
                  <div className="w-full px-5 py-3.5 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-2xl">
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center">{currentCard.meaning}</p>
                  </div>

                  {/* Example */}
                  {currentCard.example && (
                    <div className="w-full px-5 py-3.5 bg-purple-50/80 dark:bg-purple-900/30 rounded-2xl border border-purple-200 dark:border-purple-700">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider">Ví dụ</p>
                        <PronounceButton
                          text={currentCard.example!}
                          lang={deckData.language === 'japanese' ? 'ja-JP' : 'en-US'}
                          label="Phát âm câu ví dụ"
                          className="p-1.5 rounded-lg"
                        />
                      </div>
                      <p className="text-base text-gray-700 dark:text-gray-200 italic text-center leading-relaxed"
                        style={{ fontFamily: currentCard.language === 'japanese' ? "'Noto Sans JP', sans-serif" : 'inherit' }}>
                        <HighlightedExample text={currentCard.example} keyword={currentCard.word} />
                      </p>
                      {currentCard.exampleTranslation && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center leading-relaxed">
                          {currentCard.exampleTranslation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex-none w-full pb-1 pt-1">
        <div className="w-full space-y-3">
          {/* Dots */}
          <div className="flex justify-center gap-1.5 flex-wrap pt-0.5">
            {deckData.cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCardIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentCardIndex
                    ? 'w-8 bg-gradient-to-r from-purple-500 to-violet-500'
                    : index < currentCardIndex
                    ? 'w-1.5 bg-purple-300 dark:bg-purple-700'
                    : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
              className={`h-12 w-12 rounded-2xl border transition-all flex items-center justify-center ${
                currentCardIndex === 0
                  ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'
                  : 'border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 hover:shadow-sm active:scale-95'
              }`}
              title="Trở lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className={`flex-1 h-14 sm:h-[58px] px-6 rounded-2xl text-white font-extrabold text-base transition-all flex items-center justify-center gap-2.5 group hover:brightness-110 active:scale-95 ${
                isLastCard
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-200/60 dark:shadow-green-900/40 hover:shadow-xl'
                  : 'bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg shadow-purple-200/60 dark:shadow-purple-900/40 hover:shadow-xl'
              } ${keyboardPressed ? 'scale-95' : ''}`}
            >
              {isLastCard ? (
                <>
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Bắt Đầu Kiểm Tra</span>
                  <KbdHint>Enter</KbdHint>
                </>
              ) : (
                <>
                  <span>Tiếp Tục</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  <KbdHint>Enter</KbdHint>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
