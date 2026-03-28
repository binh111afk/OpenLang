import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  language: 'english' | 'japanese';
  level: string;
  source: 'reading' | 'translation' | 'manual' | 'flashcard';
  memoryStrength: number; // 0-100
  inDecks: string[]; // deck IDs
  addedDate: string;
  lastReviewed?: string;
  furigana?: string; // For Japanese words
  examples?: string[];
  notes?: string;
}

interface VocabularyContextType {
  vocabularyList: VocabularyWord[];
  addWord: (word: Omit<VocabularyWord, 'id' | 'addedDate'>) => void;
  removeWord: (id: string) => void;
  removeWords: (ids: string[]) => void;
  updateWord: (id: string, updates: Partial<VocabularyWord>) => void;
  addWordsToDecks: (wordIds: string[], deckIds: string[]) => void;
  getWordByText: (text: string) => VocabularyWord | undefined;
  getTotalWords: () => number;
  getMasteredWords: () => number;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

// Sample initial data
const initialVocabulary: VocabularyWord[] = [
  {
    id: '1',
    word: '勉強',
    furigana: 'べんきょう',
    meaning: 'học tập, nghiên cứu',
    phonetic: 'benkyō',
    language: 'japanese',
    level: 'N5',
    source: 'reading',
    memoryStrength: 75,
    inDecks: ['deck-1'],
    addedDate: '2026-03-20T10:00:00Z',
    lastReviewed: '2026-03-25T15:30:00Z',
  },
  {
    id: '2',
    word: '桜',
    furigana: 'さくら',
    meaning: 'hoa anh đào',
    phonetic: 'sakura',
    language: 'japanese',
    level: 'N4',
    source: 'reading',
    memoryStrength: 90,
    inDecks: [],
    addedDate: '2026-03-18T14:20:00Z',
    lastReviewed: '2026-03-26T09:15:00Z',
  },
  {
    id: '3',
    word: '文化',
    furigana: 'ぶんか',
    meaning: 'văn hóa',
    phonetic: 'bunka',
    language: 'japanese',
    level: 'N3',
    source: 'reading',
    memoryStrength: 45,
    inDecks: ['deck-1'],
    addedDate: '2026-03-15T09:30:00Z',
  },
  {
    id: '4',
    word: 'algorithm',
    meaning: 'thuật toán',
    phonetic: '/ˈælɡərɪðəm/',
    language: 'english',
    level: 'C1',
    source: 'translation',
    memoryStrength: 85,
    inDecks: ['deck-2'],
    addedDate: '2026-03-22T11:45:00Z',
    lastReviewed: '2026-03-27T08:00:00Z',
  },
  {
    id: '5',
    word: 'unprecedented',
    meaning: 'chưa từng có tiền lệ',
    phonetic: '/ʌnˈpresɪdentɪd/',
    language: 'english',
    level: 'C2',
    source: 'reading',
    memoryStrength: 30,
    inDecks: [],
    addedDate: '2026-03-21T16:00:00Z',
  },
  {
    id: '6',
    word: '花見',
    furigana: 'はなみ',
    meaning: 'ngắm hoa anh đào',
    phonetic: 'hanami',
    language: 'japanese',
    level: 'N4',
    source: 'reading',
    memoryStrength: 60,
    inDecks: [],
    addedDate: '2026-03-19T13:20:00Z',
  },
  {
    id: '7',
    word: 'transforming',
    meaning: 'chuyển đổi, biến đổi',
    phonetic: '/trænsˈfɔːrmɪŋ/',
    language: 'english',
    level: 'B2',
    source: 'translation',
    memoryStrength: 70,
    inDecks: ['deck-2'],
    addedDate: '2026-03-17T10:15:00Z',
    lastReviewed: '2026-03-24T14:30:00Z',
  },
  {
    id: '8',
    word: '伝統',
    furigana: 'でんとう',
    meaning: 'truyền thống',
    phonetic: 'dentō',
    language: 'japanese',
    level: 'N3',
    source: 'manual',
    memoryStrength: 55,
    inDecks: ['deck-1'],
    addedDate: '2026-03-16T08:00:00Z',
  },
  {
    id: '9',
    word: 'ethical',
    meaning: 'thuộc về đạo đức',
    phonetic: '/ˈeθɪkl/',
    language: 'english',
    level: 'B2',
    source: 'reading',
    memoryStrength: 40,
    inDecks: [],
    addedDate: '2026-03-14T12:30:00Z',
  },
  {
    id: '10',
    word: '季節',
    furigana: 'きせつ',
    meaning: 'mùa, thời vụ',
    phonetic: 'kisetsu',
    language: 'japanese',
    level: 'N4',
    source: 'reading',
    memoryStrength: 80,
    inDecks: ['deck-1'],
    addedDate: '2026-03-13T15:45:00Z',
    lastReviewed: '2026-03-26T10:20:00Z',
  },
  {
    id: '11',
    word: 'revolutionizing',
    meaning: 'cách mạng hóa',
    phonetic: '/ˌrevəˈluːʃənaɪzɪŋ/',
    language: 'english',
    level: 'C1',
    source: 'translation',
    memoryStrength: 25,
    inDecks: [],
    addedDate: '2026-03-12T09:00:00Z',
  },
  {
    id: '12',
    word: '自然',
    furigana: 'しぜん',
    meaning: 'tự nhiên, thiên nhiên',
    phonetic: 'shizen',
    language: 'japanese',
    level: 'N3',
    source: 'reading',
    memoryStrength: 95,
    inDecks: ['deck-1'],
    addedDate: '2026-03-11T14:10:00Z',
    lastReviewed: '2026-03-27T07:30:00Z',
  },
];

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const [vocabularyList, setVocabularyList] = useState<VocabularyWord[]>(() => {
    const saved = localStorage.getItem('openlang_vocabulary');
    return saved ? JSON.parse(saved) : initialVocabulary;
  });

  // Save to localStorage whenever vocabulary changes
  useEffect(() => {
    localStorage.setItem('openlang_vocabulary', JSON.stringify(vocabularyList));
  }, [vocabularyList]);

  const addWord = (word: Omit<VocabularyWord, 'id' | 'addedDate'>) => {
    const newWord: VocabularyWord = {
      ...word,
      id: `word-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      addedDate: new Date().toISOString(),
    };
    setVocabularyList((prev) => [newWord, ...prev]);
  };

  const removeWord = (id: string) => {
    setVocabularyList((prev) => prev.filter((w) => w.id !== id));
  };

  const removeWords = (ids: string[]) => {
    setVocabularyList((prev) => prev.filter((w) => !ids.includes(w.id)));
  };

  const updateWord = (id: string, updates: Partial<VocabularyWord>) => {
    setVocabularyList((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const addWordsToDecks = (wordIds: string[], deckIds: string[]) => {
    setVocabularyList((prev) =>
      prev.map((w) => {
        if (wordIds.includes(w.id)) {
          const newDecks = [...new Set([...w.inDecks, ...deckIds])];
          return { ...w, inDecks: newDecks };
        }
        return w;
      })
    );
  };

  const getWordByText = (text: string) => {
    return vocabularyList.find((w) => w.word.toLowerCase() === text.toLowerCase());
  };

  const getTotalWords = () => {
    return vocabularyList.length;
  };

  const getMasteredWords = () => {
    return vocabularyList.filter((w) => w.memoryStrength >= 80).length;
  };

  return (
    <VocabularyContext.Provider
      value={{
        vocabularyList,
        addWord,
        removeWord,
        removeWords,
        updateWord,
        addWordsToDecks,
        getWordByText,
        getTotalWords,
        getMasteredWords,
      }}
    >
      {children}
    </VocabularyContext.Provider>
  );
}

export function useVocabulary() {
  const context = useContext(VocabularyContext);
  if (!context) {
    throw new Error('useVocabulary must be used within VocabularyProvider');
  }
  return context;
}
