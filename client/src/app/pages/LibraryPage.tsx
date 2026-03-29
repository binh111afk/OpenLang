import { Search, Plus, MoreVertical, Star, TrendingUp, Users, BookOpen, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { AnimatedPage } from '../components/AnimatedPage';
import { CreateDeckModal, DeckData } from '../components/CreateDeckModal';
import { Pagination } from '../components/Pagination';
import { motion, AnimatePresence } from 'motion/react';
import vocabularySeed from '@/data/vocabulary.json';
import { createSupabaseBrowserClient } from '@/utils/supabase/client';
import { buildApiUrl } from '@/utils/api';

type FilterType = 'all' | 'english' | 'japanese' | 'favorites';

interface Deck {
  id: string;
  name: string;
  wordCount: number;
  progress: number;
  language: 'english' | 'japanese';
  isFavorite: boolean;
  coverImage?: string;
  difficultyRating?: number | null;
  source?: 'local' | 'supabase' | 'api';
  category?: string;
}

interface ApiDeckResponse {
  id: string;
  name: string;
  language: 'english' | 'japanese';
  description?: string | null;
  cover_image?: string | null;
  is_favorite?: boolean;
  difficulty_rating?: number | null;
  card_count?: number;
}

interface VocabularyDetails {
  definition_vi: string;
  example_en: string;
  example_vi: string;
  synonyms: string[];
}

interface VocabularyItem {
  word: string;
  category: string;
  level: string;
  ipa: string;
  details: VocabularyDetails;
}

const CARDS_PER_PAGE = 6;
const STORAGE_KEY = 'openlang-library-state';

function loadPersistedState(): { page: number; filter: FilterType; search: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { page: 1, filter: 'all', search: '' };
}

function useSupabaseVocabulary() {
  const [vocabularies, setVocabularies] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchVocabulary() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('vocabulary')
          .select('word, category, level, ipa, details')
          .order('word', { ascending: true });

        if (!isMounted) {
          return;
        }

        if (error) {
          setError(error.message);
          setVocabularies([]);
          return;
        }

        setVocabularies((data as VocabularyItem[]) ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setError(
          error instanceof Error ? error.message : 'Failed to fetch vocabulary.',
        );
        setVocabularies([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchVocabulary();

    return () => {
      isMounted = false;
    };
  }, []);

  return { vocabularies, loading, error };
}

function getSupabaseDeckMeta(category: string) {
  switch (category.toLowerCase()) {
    case 'animals':
      return {
        name: 'Động Vật',
        coverImage:
          'https://images.unsplash.com/photo-1474511320723-9a56873867b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      };
    case 'tech':
      return {
        name: 'Công Nghệ',
        coverImage:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      };
    case 'psychology':
      return {
        name: 'Tâm Lý Học',
        coverImage:
          'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      };
    case 'student life':
      return {
        name: 'Đời Sống Sinh Viên',
        coverImage:
          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      };
    case 'law':
      return {
        name: 'Luật',
        coverImage:
          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      };
    case 'gaming':
      return {
        name: 'Gaming',
        coverImage:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      };
    default:
      return {
        name: category,
        coverImage:
          'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      };
  }
}

// ── Draggable horizontal carousel ────────────────────────────────────────
function DraggableCarousel({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [dragging, setDragging] = useState(false);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll, children]);

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    setDragging(true);
    startX.current = e.pageX - (trackRef.current?.offsetLeft ?? 0);
    scrollLeft.current = trackRef.current?.scrollLeft ?? 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  };
  const stopDrag = () => { isDragging.current = false; setDragging(false); };

  const scrollBy = (dir: 'left' | 'right') => {
    trackRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
            onClick={() => scrollBy('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 shadow-lg flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Right arrow */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            onClick={() => scrollBy('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 shadow-lg flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Fade edges */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background dark:from-gray-950 to-transparent pointer-events-none z-[5]" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background dark:from-gray-950 to-transparent pointer-events-none z-[5]" />
      )}

      {/* Scrollable track */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        className={`flex gap-5 overflow-x-auto pb-3 scroll-smooth select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Deck card 3-dot dropdown menu ─────────────────────────────────────────
interface DeckMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

function DeckMenu({ onEdit, onDelete }: DeckMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 bg-black/30 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
      >
        <MoreVertical className="w-4 h-4 text-white" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-gray-900 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-xl shadow-purple-100/60 dark:shadow-purple-900/60 overflow-hidden z-50"
          >
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              <Pencil className="w-4 h-4 text-purple-500" />
              Sửa bộ thẻ
            </button>
            <div className="h-px bg-purple-100 dark:bg-purple-800 mx-3" />
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Xóa bộ thẻ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Delete confirm dialog ─────────────────────────────────────────────────
interface DeleteConfirmProps {
  deckName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ deckName, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl border-2 border-red-200 dark:border-red-800 shadow-2xl p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-2xl">
            <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Xóa bộ thẻ?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Bạn có chắc muốn xóa{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">"{deckName}"</span>?{' '}
          Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
          >
            Xóa
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export function LibraryPage() {
  const persisted = loadPersistedState();
  const [activeFilter, setActiveFilter] = useState<FilterType>(persisted.filter);
  const [searchQuery, setSearchQuery] = useState(persisted.search);
  const [currentPage, setCurrentPage] = useState(persisted.page);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);
  const { learningLanguages } = useLanguage();
  const navigate = useNavigate();
  const prevFilterRef = useRef(persisted.filter);
  const prevSearchRef = useRef(persisted.search);
  const {
    vocabularies,
    loading: vocabularyLoading,
    error: vocabularyError,
  } = useSupabaseVocabulary();

  const seedDecks: Deck[] = [
    {
      id: 'openlang-academic',
      name: 'OpenLang Tech, Mindset & Campus', difficultyRating: 4,
      wordCount: vocabularySeed.length, progress: 12, language: 'english', isFavorite: true, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    },
    {
      id: 'fruits', difficultyRating: 2,
      name: 'Trái Cây', wordCount: 8, progress: 0, language: 'english', isFavorite: false, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1623815242959-fb20354f9b8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHJlZCUyMGFwcGxlJTIwZnJ1aXR8ZW58MXx8fHwxNzc0NjY1MTAzfDA&ixlib=rb-4.1.0&q=80&w=400',
    },
    {
      id: '1', difficultyRating: 3,
      name: 'JLPT N5 Kanji Cơ Bản', wordCount: 80, progress: 65, language: 'japanese', isFavorite: true, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1720702214757-c57fb7ba2b93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMGthbmppJTIwY2FsbGlncmFwaHklMjBwYXBlcnxlbnwxfHx8fDE3NzQ2NjU0NzV8MA&ixlib=rb-4.1.0&q=80&w=400',
    },
    {
      id: '2', difficultyRating: 2,
      name: 'Tiếng Anh Giao Tiếp', wordCount: 150, progress: 42, language: 'english', isFavorite: false, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1673515336677-ef1cf9e20ea1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdsaXNoJTIwc3BlYWtpbmclMjBwcmFjdGljZSUyMGNvbW11bmljYXRpb258ZW58MXx8fHwxNzc0NjY1NDgyfDA&ixlib=rb-4.1.0&q=80&w=400',
    },
    {
      id: '3', difficultyRating: 3,
      name: 'JLPT N4 Từ Vựng', wordCount: 120, progress: 28, language: 'japanese', isFavorite: true, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1555111359-851254288029?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHZvY2FidWxhcnklMjBzdHVkeSUyMGRlc2t8ZW58MXx8fHwxNzc0NjY1NDc2fDA&ixlib=rb-4.1.0&q=80&w=400',
    },
    {
      id: '4', difficultyRating: 4,
      name: 'English Business Vocabulary', wordCount: 200, progress: 15, language: 'english', isFavorite: false, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1750768145390-f0ad18d3e65b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGVuZ2xpc2glMjBvZmZpY2UlMjBtZWV0aW5nfGVufDF8fHx8MTc3NDY2NTQ3N3ww&ixlib=rb-4.1.0&q=80&w=400',
    },
    {
      id: '5', difficultyRating: 4,
      name: 'Động Từ Tiếng Nhật Thường Gặp', wordCount: 95, progress: 80, language: 'japanese', isFavorite: false, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1698510273393-a6302f3c90e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHZlcmIlMjB3cml0aW5nJTIwYnJ1c2h8ZW58MXx8fHwxNzc0NjY1NDc4fDA&ixlib=rb-4.1.0&q=80&w=400',
    },
    {
      id: '6', difficultyRating: 5,
      name: 'IELTS Essential Words', wordCount: 250, progress: 35, language: 'english', isFavorite: true, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJRUxUUyUyMGV4YW0lMjBzdHVkeSUyMGJvb2tzfGVufDF8fHx8MTc3NDY2NTQ3OHww&ixlib=rb-4.1.0&q=80&w=400',
    },
    {
      id: '7', difficultyRating: 2,
      name: 'Từ Vựng Nhật Bản N5 Cơ Bản', wordCount: 100, progress: 50, language: 'japanese', isFavorite: false, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1548893792-14b7f9c8b794?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    },
    {
      id: '8', difficultyRating: 4,
      name: 'English Idioms & Phrases', wordCount: 180, progress: 22, language: 'english', isFavorite: false, source: 'local',
      coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    },
  ];
  const [myDecks, setMyDecks] = useState<Deck[]>(seedDecks);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchCustomDecks() {
      setApiLoading(true);

      try {
        const response = await fetch(buildApiUrl('/api/library'));
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Không thể tải bộ thẻ từ Supabase.');
        }

        if (!isMounted) {
          return;
        }

        const remoteDecks: Deck[] = ((payload.decks || []) as ApiDeckResponse[]).map((deck) => ({
          id: deck.id,
          name: deck.name,
          wordCount: deck.card_count || 0,
          progress: 0,
          language: deck.language,
          isFavorite: Boolean(deck.is_favorite),
          coverImage: deck.cover_image || undefined,
          difficultyRating: deck.difficulty_rating ?? null,
          source: 'api',
        }));

        setMyDecks([...seedDecks, ...remoteDecks]);
      } catch {
        if (isMounted) {
          setMyDecks(seedDecks);
        }
      } finally {
        if (isMounted) {
          setApiLoading(false);
        }
      }
    }

    void fetchCustomDecks();

    return () => {
      isMounted = false;
    };
  }, []);

  const communityDecks = [
    { id: 'c1', name: 'JLPT N3 Vocabulary Master', wordCount: 180, users: 1250, language: 'japanese', trending: true },
    { id: 'c2', name: 'Common English Phrases', wordCount: 100, users: 2340, language: 'english', trending: true },
    { id: 'c3', name: 'Kanji for Daily Life', wordCount: 150, users: 890, language: 'japanese', trending: false },
    { id: 'c4', name: 'TOEIC 600 Vocabulary', wordCount: 200, users: 1580, language: 'english', trending: true },
    { id: 'c5', name: 'Japanese Conversation N4', wordCount: 130, users: 720, language: 'japanese', trending: false },
    { id: 'c6', name: 'Business English Essentials', wordCount: 160, users: 3100, language: 'english', trending: true },
  ];

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ page: currentPage, filter: activeFilter, search: searchQuery }));
  }, [currentPage, activeFilter, searchQuery]);

  // Reset page when filter or search changes
  useEffect(() => {
    if (activeFilter !== prevFilterRef.current || searchQuery !== prevSearchRef.current) {
      setCurrentPage(1);
      prevFilterRef.current = activeFilter;
      prevSearchRef.current = searchQuery;
    }
  }, [activeFilter, searchQuery]);

  const supabaseDecks: Deck[] = Object.entries(
    vocabularies.reduce<Record<string, VocabularyItem[]>>((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {}),
  ).map(([category, items]) => {
    const meta = getSupabaseDeckMeta(category);
    return {
      id: `supabase--${encodeURIComponent(category)}`,
      name: meta.name,
      wordCount: items.length,
      progress: 0,
      language: 'english',
      isFavorite: false,
      difficultyRating: null,
      source: 'supabase',
      category,
      coverImage: meta.coverImage,
    };
  });

  const allDecks = [...supabaseDecks, ...myDecks];

  const filters = [
    { value: 'all' as const, label: 'Tất Cả', count: allDecks.filter(d => learningLanguages.includes(d.language)).length },
    ...(learningLanguages.includes('english') ? [{ value: 'english' as const, label: 'Tiếng Anh', count: allDecks.filter(d => d.language === 'english').length }] : []),
    ...(learningLanguages.includes('japanese') ? [{ value: 'japanese' as const, label: 'Tiếng Nhật', count: allDecks.filter(d => d.language === 'japanese').length }] : []),
    { value: 'favorites' as const, label: 'Yêu Thích', count: allDecks.filter(d => d.isFavorite && learningLanguages.includes(d.language)).length },
  ];

  const filteredDecks = allDecks.filter((deck) => {
    if (!learningLanguages.includes(deck.language)) return false;
    const matchesFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'favorites' ? deck.isFavorite :
      deck.language === activeFilter;
    const matchesSearch = deck.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDecks.length / CARDS_PER_PAGE));
  // Clamp current page if filter/search reduces total
  const safePage = Math.min(currentPage, totalPages);
  const pagedDecks = filteredDecks.slice((safePage - 1) * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE);

  const filteredCommunity = communityDecks.filter(d => learningLanguages.includes(d.language as 'english' | 'japanese'));

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Thư Viện Của Tôi</h1>
          <p className="text-gray-600 dark:text-gray-400">Quản lý và học tập với các bộ thẻ của bạn</p>
          {apiLoading ? (
            <p className="text-sm text-purple-500 dark:text-purple-400">Đang đồng bộ bộ thẻ từ Supabase...</p>
          ) : null}
        </div>

        {/* Search Bar & Add Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm bộ thẻ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-purple-200 dark:border-purple-800 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none transition-colors bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <button
            className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-lg shadow-purple-200 dark:shadow-purple-900 hover:shadow-xl transition-all flex items-center justify-center gap-2 font-semibold whitespace-nowrap"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Thêm Bộ Thẻ Mới
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeFilter === filter.value
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950'
              }`}
            >
              {filter.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeFilter === filter.value
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Deck Grid */}
        {filteredDecks.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeFilter}-${searchQuery}-${safePage}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {pagedDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 overflow-hidden hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all group cursor-pointer flex flex-col"
                  >
                    {/* Cover Image */}
                    <div className="relative h-40 overflow-hidden flex-none">
                      {deck.coverImage ? (
                        <img
                          src={deck.coverImage}
                          alt={deck.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 via-violet-50 to-white px-6 text-center dark:from-purple-950 dark:via-violet-950 dark:to-gray-900">
                          <div>
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-gray-900/80">
                              <BookOpen className="h-7 w-7 text-purple-600 dark:text-purple-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {deck.name}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm ${
                          deck.language === 'japanese' ? 'bg-purple-600/80' : 'bg-violet-600/80'
                        }`}>
                          {deck.language === 'japanese' ? '日本語' : 'English'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {deck.isFavorite && (
                            <div className="p-1.5 bg-black/30 backdrop-blur-sm rounded-full">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            </div>
                          )}
                          {deck.source !== 'supabase' ? (
                            <DeckMenu
                              onEdit={() => navigate('/decks/add-cards', {
                                state: { deckName: deck.name, language: deck.language, deckCoverImage: deck.coverImage, deckId: deck.id, deckRating: deck.difficultyRating, mode: 'edit' }
                              })}
                              onDelete={() => setDeletingDeck(deck)}
                            />
                          ) : null}
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-white drop-shadow-md line-clamp-1 text-base">{deck.name}</h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{deck.wordCount} từ vựng</p>
                      {deck.difficultyRating ? (
                        <div className="flex items-center gap-2 text-sm text-amber-500">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= deck.difficultyRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            {deck.difficultyRating}/5
                          </span>
                        </div>
                      ) : null}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Tiến độ</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">{deck.progress}%</span>
                        </div>
                        <div className="w-full bg-purple-100 dark:bg-purple-900 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              deck.language === 'japanese'
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                : 'bg-gradient-to-r from-violet-500 to-violet-600'
                            }`}
                            style={{ width: `${deck.progress}%` }}
                          />
                        </div>
                      </div>
                      <button
                        className="w-full mt-auto py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-600 hover:text-white transition-all text-sm"
                        onClick={() => navigate(`/library/${deck.id}/study`)}
                      >
                        Tiếp Tục Học
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination + info */}
            <div className="flex flex-col items-center gap-3">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filteredDecks.length}
                itemsPerPage={CARDS_PER_PAGE}
                itemLabel="bộ thẻ"
                onPageChange={(p) => {
                  setCurrentPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800">
            <div className="flex justify-center mb-4">
              <div className="p-6 bg-purple-100 dark:bg-purple-900 rounded-full">
                <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy bộ thẻ</h3>
            <p className="text-gray-500 dark:text-gray-400">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác</p>
          </div>
        )}

        {/* Community Recommendations */}
        <div className="space-y-6 pt-8 border-t-2 border-purple-100 dark:border-purple-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gợi Ý Cho Bạn</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Kéo trái/phải hoặc dùng mũi tên để xem thêm
              </p>
            </div>
            <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm hover:underline">
              Xem Tất Cả →
            </button>
          </div>

          <DraggableCarousel>
            {filteredCommunity.map((deck) => (
              <div
                key={deck.id}
                className="flex-none w-72 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                      <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    {deck.trending && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                        <TrendingUp className="w-3 h-3" />
                        HOT
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">{deck.name}</h3>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{deck.wordCount} từ</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{deck.users.toLocaleString()} người</span>
                  </div>
                </div>

                <button className="w-full py-3 rounded-2xl bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all">
                  Thêm Vào Thư Viện
                </button>
              </div>
            ))}
          </DraggableCarousel>
        </div>

        <div className="h-8" />
      </div>

      <CreateDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateDeck={async (deckData: DeckData) => {
          try {
            const response = await fetch(buildApiUrl('/api/library'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: deckData.name,
                language: deckData.language,
                coverImage: deckData.coverImage,
                difficultyRating: deckData.rating,
              }),
            });
            const payload = await response.json();

            if (!response.ok) {
              throw new Error(payload.error || 'Không thể tạo bộ thẻ mới.');
            }

            const createdDeck = payload.deck;
            const newDeck: Deck = {
              id: createdDeck.id,
              name: createdDeck.name,
              wordCount: 0,
              progress: 0,
              language: createdDeck.language,
              isFavorite: Boolean(createdDeck.is_favorite),
              source: 'api',
              coverImage: createdDeck.cover_image || deckData.coverImage,
              difficultyRating: createdDeck.difficulty_rating ?? deckData.rating,
            };

            setMyDecks((prev) => [...prev, newDeck]);
            return {
              id: newDeck.id,
              coverImage: newDeck.coverImage,
            };
          } catch (error) {
            alert(
              error instanceof Error ? error.message : 'Không thể tạo bộ thẻ mới.',
            );
            return null;
          }
        }}
      />

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {deletingDeck && (
          <DeleteConfirmDialog
            deckName={deletingDeck.name}
            onConfirm={async () => {
              try {
                if (deletingDeck.source === 'api') {
                  const response = await fetch(`${buildApiUrl('/api/library')}?id=${encodeURIComponent(deletingDeck.id)}`, {
                    method: 'DELETE',
                  });
                  const payload = await response.json();

                  if (!response.ok) {
                    throw new Error(payload.error || 'Không thể xóa bộ thẻ.');
                  }
                }

                setMyDecks(prev => prev.filter(d => d.id !== deletingDeck.id));
                setDeletingDeck(null);
              } catch (error) {
                alert(error instanceof Error ? error.message : 'Không thể xóa bộ thẻ.');
              }
            }}
            onCancel={() => setDeletingDeck(null)}
          />
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
