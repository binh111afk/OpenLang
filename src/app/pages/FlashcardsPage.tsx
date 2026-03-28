import { X, Volume2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';

interface FlashCard {
  id: number;
  language: 'english' | 'japanese';
  front: {
    word: string;
    furigana?: string;
  };
  back: {
    meaning: string;
    example: string;
    exampleTranslation: string;
  };
}

export function FlashcardsPage() {
  const navigate = useNavigate();
  const { learningLanguages } = useLanguage();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<number[]>([]);

  const allFlashcards: FlashCard[] = [
    // Japanese flashcards
    {
      id: 1,
      language: 'japanese',
      front: { word: '勉強', furigana: 'べんきょう' },
      back: {
        meaning: 'Học tập',
        example: '毎日勉強します',
        exampleTranslation: 'Tôi học mỗi ngày'
      }
    },
    {
      id: 2,
      language: 'japanese',
      front: { word: '学校', furigana: 'がっこう' },
      back: {
        meaning: 'Trường học',
        example: '学校へ行きます',
        exampleTranslation: 'Tôi đi đến trường'
      }
    },
    {
      id: 3,
      language: 'japanese',
      front: { word: '先生', furigana: 'せんせい' },
      back: {
        meaning: 'Giáo viên',
        example: '山田先生です',
        exampleTranslation: 'Đây là giáo viên Yamada'
      }
    },
    {
      id: 4,
      language: 'japanese',
      front: { word: '友達', furigana: 'ともだち' },
      back: {
        meaning: 'Bạn bè',
        example: '友達と遊びます',
        exampleTranslation: 'Tôi chơi với bạn bè'
      }
    },
    {
      id: 5,
      language: 'japanese',
      front: { word: '時間', furigana: 'じかん' },
      back: {
        meaning: 'Thời gian',
        example: '時間がありません',
        exampleTranslation: 'Không có thời gian'
      }
    },
    // English flashcards
    {
      id: 6,
      language: 'english',
      front: { word: 'Beautiful' },
      back: {
        meaning: 'Đẹp',
        example: 'The sunset is beautiful.',
        exampleTranslation: 'Hoàng hôn thật đẹp.'
      }
    },
    {
      id: 7,
      language: 'english',
      front: { word: 'Knowledge' },
      back: {
        meaning: 'Kiến thức',
        example: 'Knowledge is power.',
        exampleTranslation: 'Kiến thức là sức mạnh.'
      }
    },
    {
      id: 8,
      language: 'english',
      front: { word: 'Adventure' },
      back: {
        meaning: 'Phiêu lưu',
        example: 'Life is an adventure.',
        exampleTranslation: 'Cuộc sống là một cuộc phiêu lưu.'
      }
    },
    {
      id: 9,
      language: 'english',
      front: { word: 'Friendship' },
      back: {
        meaning: 'Tình bạn',
        example: 'Friendship is important.',
        exampleTranslation: 'Tình bạn rất quan trọng.'
      }
    },
    {
      id: 10,
      language: 'english',
      front: { word: 'Success' },
      back: {
        meaning: 'Thành công',
        example: 'Success requires hard work.',
        exampleTranslation: 'Thành công đòi hỏi sự chăm chỉ.'
      }
    },
  ];

  // Filter flashcards based on learning languages
  const flashcards = allFlashcards.filter(card => 
    learningLanguages.includes(card.language as 'english' | 'japanese')
  );

  const currentCard = flashcards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / flashcards.length) * 100;

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = (difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    // Mark card as completed
    if (!completedCards.includes(currentCard.id)) {
      setCompletedCards([...completedCards, currentCard.id]);
    }

    // Move to next card
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      // Session completed
      alert('🎉 Hoàn thành phiên học! Bạn đã học xong tất cả các thẻ.');
      navigate('/');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isFlipped) return;

      switch(e.key) {
        case '1':
          handleResponse('again');
          break;
        case '2':
          handleResponse('hard');
          break;
        case '3':
          handleResponse('good');
          break;
        case '4':
          handleResponse('easy');
          break;
        case ' ':
          e.preventDefault();
          setIsFlipped(!isFlipped);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, currentCardIndex]);

  const responseButtons = [
    {
      label: 'Lặp Lại',
      key: '1',
      action: 'again' as const,
      color: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
      textColor: 'text-gray-600'
    },
    {
      label: 'Khó',
      key: '2',
      action: 'hard' as const,
      color: 'bg-purple-200 hover:bg-purple-300 text-purple-700',
      textColor: 'text-purple-600'
    },
    {
      label: 'Tốt',
      key: '3',
      action: 'good' as const,
      color: 'bg-purple-500 hover:bg-purple-600 text-white',
      textColor: 'text-purple-600'
    },
    {
      label: 'Dễ',
      key: '4',
      action: 'easy' as const,
      color: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white',
      textColor: 'text-violet-600'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F3FF' }}>
      {/* Header with Progress Bar */}
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => navigate('/flashcards')}
                className="p-2 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Tiến độ học tập</span>
                  <span className="font-bold text-purple-700">
                    {currentCardIndex + 1} / {flashcards.length}
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-2xl">
          {/* Flashcard */}
          <div className="perspective-1000" style={{ perspective: '1000px' }}>
            <motion.div
              className="relative w-full cursor-pointer"
              style={{ 
                transformStyle: 'preserve-3d',
                minHeight: '400px'
              }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              onClick={handleCardClick}
            >
              {/* Front of Card */}
              <motion.div
                className="absolute inset-0 bg-white rounded-[24px] shadow-2xl shadow-purple-200 p-12 flex flex-col items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <div className="text-center space-y-6">
                  <div>
                    {currentCard.front.furigana && (
                      <ruby className="block mb-3">
                        <span className="text-2xl text-purple-600 font-medium" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                          {currentCard.front.furigana}
                        </span>
                      </ruby>
                    )}
                    <p 
                      className="text-8xl font-bold text-gray-800"
                      style={{ fontFamily: currentCard.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif" }}
                    >
                      {currentCard.front.word}
                    </p>
                  </div>

                  <button 
                    className="p-4 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Play audio functionality would go here
                    }}
                  >
                    <Volume2 className="w-8 h-8 text-purple-600" />
                  </button>
                </div>

                <div className="absolute bottom-8 text-sm text-gray-400">
                  Nhấn vào thẻ hoặc nhấn Space để lật
                </div>
              </motion.div>

              {/* Back of Card */}
              <motion.div
                className="absolute inset-0 bg-white rounded-[24px] shadow-2xl shadow-purple-200 p-12 flex flex-col items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  rotateY: 180
                }}
              >
                <div className="text-center space-y-8 w-full">
                  <div className="space-y-4">
                    <div className="inline-block px-6 py-2 bg-purple-100 rounded-full">
                      <p className="text-sm text-purple-700 font-semibold">NGHĨA</p>
                    </div>
                    <p className="text-5xl font-bold text-gray-800">
                      {currentCard.back.meaning}
                    </p>
                  </div>

                  <div className="pt-6 border-t-2 border-purple-100 space-y-3">
                    <p className="text-sm text-gray-500 font-semibold uppercase">Ví dụ</p>
                    <p 
                      className="text-2xl text-gray-700 font-medium"
                      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                    >
                      {currentCard.back.example}
                    </p>
                    <p className="text-lg text-gray-500 italic">
                      {currentCard.back.exampleTranslation}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Response Buttons */}
      <div className="p-6 lg:p-8 bg-white border-t-2 border-purple-100">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isFlipped ? 1 : 0.3, 
              y: isFlipped ? 0 : 20 
            }}
            transition={{ duration: 0.3 }}
          >
            {responseButtons.map((button) => (
              <button
                key={button.key}
                onClick={() => handleResponse(button.action)}
                disabled={!isFlipped}
                className={`
                  ${button.color}
                  py-4 px-6 rounded-2xl font-semibold transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg hover:shadow-xl transform hover:scale-105
                  flex flex-col items-center gap-2
                `}
              >
                <span className="text-lg">{button.label}</span>
                <span className={`text-xs font-mono ${button.textColor} opacity-70`}>
                  Phím {button.key}
                </span>
              </button>
            ))}
          </motion.div>

          {!isFlipped && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-gray-500 mt-4"
            >
              Lật thẻ để xem đáp án và chọn mức độ ghi nhớ
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}