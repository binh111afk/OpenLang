import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, X, Eye, EyeOff, Settings, Volume2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useVocabulary } from '../contexts/VocabularyContext';

interface WordInfo {
  word: string;
  level: string;
  levelColor: string;
  meaning: string;
  phonetic?: string;
  inVocabulary: boolean;
  examples?: string[];
  furigana?: string;
  language: 'english' | 'japanese';
}

interface PopupPosition {
  top: number;
  left: number;
}

// Sample article data
const articleData: Record<string, any> = {
  '1': {
    title: '日本の四季と文化',
    language: 'japanese',
    content: `日本には春夏秋冬の四季があり、それぞれの季節に独特な文化や行事があります。

春には桜の花が咲き、人々は花見を楽しみます。桜の下でお弁当を食べたり、友達と話したりして、春の訪れを祝います。花見は日本人にとって大切な文化的イベントです。

夏には各地で祭りが開催されます。花火大会や盆踊りなど、夏の風物詩は日本の伝統文化を体験する絶好の機会です。浴衣を着て祭りに参加する人も多く、日本の夏の風景となっています。

秋は紅葉の季節です。山や公園の木々が美しい赤や黄色に染まり、多くの人が紅葉狩りに出かけます。また、秋は収穫の季節でもあり、新米や果物を楽しむことができます。

冬には雪が降り、スキーやスノーボードを楽しむ人が増えます。北海道の雪まつりは世界的に有名で、巨大な雪像を見に多くの観光客が訪れます。温泉に入って体を温めるのも、冬の楽しみの一つです。

このように、日本の四季はそれぞれ異なる魅力を持ち、季節ごとの文化や行事を通じて、人々は自然と共に生活しています。`,
    level: 'N5',
  },
  '2': {
    title: 'The Future of Artificial Intelligence',
    language: 'english',
    content: `Artificial Intelligence is rapidly transforming our world. From self-driving cars to medical diagnostics, AI is making remarkable strides in various fields.

Machine learning algorithms can now analyze vast amounts of data in seconds, identifying patterns that would take humans years to discover. This capability is revolutionizing industries from healthcare to finance, enabling unprecedented levels of efficiency and accuracy.

Deep learning, a subset of machine learning, has enabled computers to recognize images, understand speech, and even generate human-like text. These advances are powering virtual assistants, recommendation systems, and autonomous vehicles.

However, the rise of AI also raises important ethical questions. How do we ensure AI systems are fair and unbiased? What happens to jobs that can be automated? How do we protect privacy in an age of data-driven algorithms?

As we move forward, it's crucial that we develop AI responsibly. This means creating transparent systems, establishing clear regulations, and ensuring that the benefits of AI are distributed equitably across society.

The future of AI is not predetermined. It will be shaped by the choices we make today about how to develop and deploy these powerful technologies. By working together, we can harness AI's potential while minimizing its risks.`,
    level: 'C1',
  },
};

// Dictionary with sample vocabulary
const vocabularyDict: Record<string, WordInfo> = {
  '春': { word: '春', level: 'N5', levelColor: 'bg-green-500', meaning: 'mùa xuân', phonetic: 'haru', inVocabulary: false, language: 'japanese' },
  '夏': { word: '夏', level: 'N5', levelColor: 'bg-green-500', meaning: 'mùa hè', phonetic: 'natsu', inVocabulary: true, language: 'japanese' },
  '秋': { word: '秋', level: 'N5', levelColor: 'bg-green-500', meaning: 'mùa thu', phonetic: 'aki', inVocabulary: false, language: 'japanese' },
  '冬': { word: '冬', level: 'N5', levelColor: 'bg-green-500', meaning: 'mùa đông', phonetic: 'fuyu', inVocabulary: true, language: 'japanese' },
  '桜': { word: '桜', level: 'N4', levelColor: 'bg-blue-500', meaning: 'hoa anh đào', phonetic: 'sakura', inVocabulary: false, language: 'japanese' },
  '花': { word: '花', level: 'N5', levelColor: 'bg-green-500', meaning: 'hoa', phonetic: 'hana', inVocabulary: true, language: 'japanese' },
  '見': { word: '見', level: 'N5', levelColor: 'bg-green-500', meaning: 'xem, nhìn', phonetic: 'mi', inVocabulary: false, language: 'japanese' },
  '人': { word: '人', level: 'N5', levelColor: 'bg-green-500', meaning: 'người', phonetic: 'hito', inVocabulary: true, language: 'japanese' },
  '文': { word: '文', level: 'N4', levelColor: 'bg-blue-500', meaning: 'văn, chữ', phonetic: 'bun', inVocabulary: false, language: 'japanese' },
  '化': { word: '化', level: 'N3', levelColor: 'bg-yellow-500', meaning: 'hóa, biến đổi', phonetic: 'ka', inVocabulary: false, language: 'japanese' },
  '日': { word: '日', level: 'N5', levelColor: 'bg-green-500', meaning: 'ngày, mặt trời', phonetic: 'hi/nichi', inVocabulary: true, language: 'japanese' },
  '本': { word: '本', level: 'N5', levelColor: 'bg-green-500', meaning: 'sách, gốc', phonetic: 'hon', inVocabulary: true, language: 'japanese' },
  '伝': { word: '伝', level: 'N3', levelColor: 'bg-yellow-500', meaning: 'truyền', phonetic: 'den', inVocabulary: false, language: 'japanese' },
  '統': { word: '統', level: 'N3', levelColor: 'bg-yellow-500', meaning: 'thống', phonetic: 'tō', inVocabulary: false, language: 'japanese' },
  'artificial': { word: 'artificial', level: 'B1', levelColor: 'bg-blue-500', meaning: 'nhân tạo', phonetic: '/ˌɑːrtɪˈfɪʃl/', inVocabulary: false, language: 'english' },
  'intelligence': { word: 'intelligence', level: 'B1', levelColor: 'bg-blue-500', meaning: 'trí tuệ', phonetic: '/ɪnˈtelɪdʒəns/', inVocabulary: true, language: 'english' },
  'transforming': { word: 'transforming', level: 'B2', levelColor: 'bg-yellow-500', meaning: 'chuyển đổi, biến đổi', phonetic: '/trænsˈfɔːrmɪŋ/', inVocabulary: false, language: 'english' },
  'algorithm': { word: 'algorithm', level: 'C1', levelColor: 'bg-orange-500', meaning: 'thuật toán', phonetic: '/ˈælɡərɪðəm/', inVocabulary: true, language: 'english' },
  'unprecedented': { word: 'unprecedented', level: 'C2', levelColor: 'bg-red-500', meaning: 'chưa từng có tiền lệ', phonetic: '/ʌnˈpresɪdentɪd/', inVocabulary: false, language: 'english' },
  'revolutionizing': { word: 'revolutionizing', level: 'C1', levelColor: 'bg-orange-500', meaning: 'cách mạng hóa', phonetic: '/ˌrevəˈluːʃənaɪzɪŋ/', inVocabulary: false, language: 'english' },
  'ethical': { word: 'ethical', level: 'B2', levelColor: 'bg-yellow-500', meaning: 'thuộc về đạo đức', phonetic: '/ˈeθɪkl/', inVocabulary: true, language: 'english' },
  'autonomous': { word: 'autonomous', level: 'C1', levelColor: 'bg-orange-500', meaning: 'tự động, tự trị', phonetic: '/ɔːˈtɑːnəməs/', inVocabulary: false, language: 'english' },
  'rapidly': { word: 'rapidly', level: 'B1', levelColor: 'bg-blue-500', meaning: 'nhanh chóng', phonetic: '/ˈræpɪdli/', inVocabulary: false, language: 'english' },
  'various': { word: 'various', level: 'B1', levelColor: 'bg-blue-500', meaning: 'đa dạng, khác nhau', phonetic: '/ˈveriəs/', inVocabulary: true, language: 'english' },
  'enabling': { word: 'enabling', level: 'B2', levelColor: 'bg-yellow-500', meaning: 'cho phép, tạo điều kiện', phonetic: '/ɪˈneɪblɪŋ/', inVocabulary: false, language: 'english' },
};

export function ReadingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addWord, getWordByText } = useVocabulary();
  const [selectedWord, setSelectedWord] = useState<WordInfo | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>({ top: 0, left: 0 });
  const [showMeanings, setShowMeanings] = useState(false);
  const [pinTooltip, setPinTooltip] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const article = id ? articleData[id] : null;

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (!article) {
    return (
      <AnimatedPage>
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Không tìm thấy bài đọc
            </h2>
            <button
              onClick={() => navigate('/reading')}
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // Tokenize text into clickable words
  const tokenizeText = (text: string) => {
    // Split by spaces and newlines while preserving them
    const lines = text.split('\n');
    const result: JSX.Element[] = [];
    const isJapanese = article.language === 'japanese';

    lines.forEach((line, lineIndex) => {
      if (line.trim() === '') {
        result.push(<br key={`br-${lineIndex}`} />);
        return;
      }

      if (isJapanese) {
        // For Japanese, split by character and create spans for each character/word
        const chars = line.split('');
        chars.forEach((char, charIndex) => {
          // Check if it's a Japanese character (hiragana, katakana, kanji)
          if (char.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
            result.push(
              <span
                key={`${lineIndex}-${charIndex}`}
                className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-700 dark:hover:text-purple-300 transition-colors rounded px-0.5 inline-block"
                onClick={(e) => handleWordClick(char, e)}
              >
                {char}
              </span>
            );
          } else {
            // Punctuation or space
            result.push(<span key={`${lineIndex}-${charIndex}-punct`}>{char}</span>);
          }
        });
      } else {
        // For English, split by words and spaces
        const parts = line.split(/(\s+)/);
        
        parts.forEach((part, partIndex) => {
          if (part.match(/^\s+$/)) {
            // It's a space
            result.push(<span key={`${lineIndex}-${partIndex}-space`}>{part}</span>);
          } else if (part.trim() !== '') {
            // It's a word - check if it contains punctuation
            const wordMatch = part.match(/^([^\s.,!?;:]+)([\s.,!?;:]*)$/);
            if (wordMatch) {
              const [, word, punctuation] = wordMatch;
              result.push(
                <span
                  key={`${lineIndex}-${partIndex}`}
                  className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-700 dark:hover:text-purple-300 transition-colors rounded px-0.5 inline-block"
                  onClick={(e) => handleWordClick(word.toLowerCase(), e)}
                >
                  {word}
                </span>
              );
              if (punctuation) {
                result.push(<span key={`${lineIndex}-${partIndex}-punct`}>{punctuation}</span>);
              }
            } else {
              result.push(
                <span
                  key={`${lineIndex}-${partIndex}`}
                  className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-700 dark:hover:text-purple-300 transition-colors rounded px-0.5 inline-block"
                  onClick={(e) => handleWordClick(part.toLowerCase(), e)}
                >
                  {part}
                </span>
              );
            }
          }
        });
      }

      if (lineIndex < lines.length - 1) {
        result.push(<br key={`br-end-${lineIndex}`} />);
      }
    });

    return result;
  };

  const handleWordClick = (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
    // If tooltip is not pinned and clicking a different word, close the current one first
    if (!pinTooltip && selectedWord && selectedWord.word !== word) {
      setSelectedWord(null);
      // Small delay before opening new popup for smooth transition
      setTimeout(() => {
        openWordPopup(word, event);
      }, 100);
    } else {
      openWordPopup(word, event);
    }
  };

  const openWordPopup = (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
    // Check if word exists in dictionary
    const wordInfo = vocabularyDict[word];
    
    if (wordInfo) {
      setSelectedWord(wordInfo);
    } else {
      // Generate random word info for demo
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'N5', 'N4', 'N3', 'N2', 'N1'];
      const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const sampleMeanings = ['nghĩa mẫu', 'ví dụ từ', 'từ demo', 'từ vựng mẫu'];
      
      setSelectedWord({
        word: word,
        level: randomLevel,
        levelColor: randomColor,
        meaning: sampleMeanings[Math.floor(Math.random() * sampleMeanings.length)],
        phonetic: '[phiên âm]',
        inVocabulary: false,
        language: article.language,
      });
    }

    // Calculate popup position - add null check
    if (!event.currentTarget) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    setPopupPosition({
      top: rect.top + scrollTop - 10,
      left: rect.left + rect.width / 2,
    });
  };

  const handleClosePopup = () => {
    setSelectedWord(null);
  };

  const handleLookupWord = () => {
    // Navigate to translation page or open dictionary
    navigate('/translation');
  };

  const handlePronounce = () => {
    if (!selectedWord) return;
    
    // Try to use Web Speech API if available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(selectedWord.word);
      
      // Determine language based on word characteristics
      const isJapanese = selectedWord.word.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
      utterance.lang = isJapanese ? 'ja-JP' : 'en-US';
      utterance.rate = 0.8; // Slower for learning
      
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt của bạn không hỗ trợ phát âm tự động.');
    }
  };

  const handleAddToVocabulary = () => {
    if (!selectedWord) return;
    
    // Convert level color string to proper format
    const getLevelFromColor = (color: string): string => {
      // Just return the level from selectedWord
      return selectedWord.level;
    };
    
    // Add word to vocabulary context
    addWord({
      word: selectedWord.word,
      meaning: selectedWord.meaning,
      phonetic: selectedWord.phonetic,
      language: selectedWord.language,
      level: selectedWord.level,
      source: 'reading',
      memoryStrength: 0, // New word starts at 0
      inDecks: [],
      furigana: selectedWord.furigana,
      examples: selectedWord.examples,
    });
    
    // Update the selected word to show it's now in vocabulary
    setSelectedWord({ ...selectedWord, inVocabulary: true });
    
    // Optional: Show success message
    setTimeout(() => {
      alert(`✅ Đã thêm "${selectedWord.word}" vào danh sách từ vựng!`);
    }, 100);
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen pb-32">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-950 border-b-2 border-purple-200 dark:border-purple-800 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/reading')}
                className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-purple-700 dark:text-purple-300" />
              </button>
              <h1 
                className="text-2xl font-bold text-gray-800 dark:text-gray-100"
                style={{ 
                  fontFamily: article.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif" 
                }}
              >
                {article.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto px-6 py-10" ref={contentRef}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 lg:p-12 shadow-sm">
            <div 
              className="text-lg leading-relaxed text-gray-800 dark:text-gray-100"
              style={{ 
                fontFamily: article.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif",
                lineHeight: '2.2',
              }}
            >
              {tokenizeText(article.content)}
            </div>
          </div>
        </div>

        {/* Word Popup Tooltip */}
        <AnimatePresence>
          {selectedWord && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed z-50"
              style={{
                top: `${popupPosition.top}px`,
                left: `${popupPosition.left}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-purple-300 dark:border-purple-700 shadow-2xl p-5 w-80">
                {/* Close Button */}
                <button
                  onClick={handleClosePopup}
                  className="absolute top-3 right-3 p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Word and Badge */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedWord.word}
                  </span>
                  <span className={`px-2.5 py-0.5 ${selectedWord.levelColor} text-white text-xs font-bold rounded-full`}>
                    {selectedWord.level}
                  </span>
                </div>

                {/* Phonetic */}
                {selectedWord.phonetic && (
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {selectedWord.phonetic}
                    </span>
                    <button
                      onClick={handlePronounce}
                      className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg transition-colors"
                      title="Phát âm"
                    >
                      <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </button>
                  </div>
                )}

                {/* Meaning */}
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950 rounded-xl border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    {selectedWord.meaning}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleLookupWord}
                    className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    Tra chi tiết
                  </button>
                  {!selectedWord.inVocabulary && (
                    <button
                      onClick={handleAddToVocabulary}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm"
                      title="Thêm vào danh sách"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm
                    </button>
                  )}
                </div>

                {/* Vocabulary Status */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {selectedWord.inVocabulary
                    ? '✓ Từ này đã có trong danh sách từ vựng của bạn'
                    : 'Từ này chưa có trong danh sách từ vựng của bạn'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Control Bar */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-2xl px-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-300 dark:border-purple-700 shadow-2xl p-5">
            <div className="flex items-center justify-between gap-6">
              {/* Show/Hide Meanings Toggle */}
              <button
                onClick={() => setShowMeanings(!showMeanings)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-xl transition-colors"
                title={showMeanings ? 'Ẩn nghĩa' : 'Hiện nghĩa'}
              >
                {showMeanings ? (
                  <EyeOff className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                ) : (
                  <Eye className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {showMeanings ? 'Ẩn nghĩa' : 'Hiện nghĩa'}
                </span>
              </button>

              {/* Pin Tooltip Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinTooltip}
                  onChange={(e) => setPinTooltip(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ghim thẻ từ cố định
                </span>
              </label>

              {/* Settings Button */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-xl transition-colors"
                title="Cài đặt"
              >
                <Settings className="w-5 h-5 text-purple-700 dark:text-purple-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}