import { useState } from 'react';
import { Search, Volume2, MoreVertical, Check, Trash2, FolderInput, Edit } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useVocabulary, VocabularyWord } from '../contexts/VocabularyContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Progress } from '../components/ui/progress';

type FilterType = 'all' | 'english' | 'japanese' | 'mastered' | 'learning';
type SourceType = 'reading' | 'translation' | 'manual' | 'flashcard';

export function VocabularyPage() {
  const { vocabularyList, removeWord, removeWords, updateWord, getTotalWords, getMasteredWords } = useVocabulary();
  const { learningLanguages } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter vocabulary based on search and filters
  const filteredVocabulary = vocabularyList.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    switch (selectedFilter) {
      case 'english':
        matchesFilter = word.language === 'english';
        break;
      case 'japanese':
        matchesFilter = word.language === 'japanese';
        break;
      case 'mastered':
        matchesFilter = word.memoryStrength >= 80;
        break;
      case 'learning':
        matchesFilter = word.memoryStrength < 80;
        break;
    }

    // Filter by learning languages setting
    const matchesLanguageSetting = 
      !learningLanguages || 
      learningLanguages.length === 0 || 
      (learningLanguages as string[]).includes(word.language);

    return matchesSearch && matchesFilter && matchesLanguageSetting;
  });

  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'Tất Cả', count: vocabularyList.length },
    { id: 'english', label: 'Tiếng Anh', count: vocabularyList.filter(w => w.language === 'english').length },
    { id: 'japanese', label: 'Tiếng Nhật', count: vocabularyList.filter(w => w.language === 'japanese').length },
    { id: 'mastered', label: 'Đã Thuộc', count: getMasteredWords() },
    { id: 'learning', label: 'Đang Học', count: getTotalWords() - getMasteredWords() },
  ];

  const toggleWordSelection = (wordId: string) => {
    const newSelection = new Set(selectedWords);
    if (newSelection.has(wordId)) {
      newSelection.delete(wordId);
    } else {
      newSelection.add(wordId);
    }
    setSelectedWords(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedWords.size === filteredVocabulary.length) {
      setSelectedWords(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedWords(new Set(filteredVocabulary.map(w => w.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = () => {
    removeWords(Array.from(selectedWords));
    setSelectedWords(new Set());
    setShowBulkActions(false);
  };

  const handleBulkMarkMastered = () => {
    selectedWords.forEach(id => {
      const word = vocabularyList.find(w => w.id === id);
      if (word) {
        updateWord(id, { memoryStrength: 100 });
      }
    });
    setSelectedWords(new Set());
    setShowBulkActions(false);
  };

  const getMemoryColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-500 dark:bg-green-600';
    if (strength >= 50) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  const getMemoryLabel = (strength: number) => {
    if (strength >= 80) return 'Đã Thuộc';
    if (strength >= 50) return 'Trung Bình';
    return 'Cần Luyện';
  };

  const getSourceLabel = (source: SourceType) => {
    const labels: Record<SourceType, string> = {
      reading: 'Bài Đọc',
      translation: 'Dịch',
      manual: 'Thủ Công',
      flashcard: 'Flashcard',
    };
    return labels[source];
  };

  const getSourceIcon = (source: SourceType) => {
    const icons: Record<SourceType, string> = {
      reading: '📖',
      translation: '🔄',
      manual: '✏️',
      flashcard: '🎴',
    };
    return icons[source];
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Từ Vựng Của Tôi</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý và ôn tập {getTotalWords()} từ vựng đã lưu
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-2xl">
                <FolderInput className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tổng Từ Vựng</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{getTotalWords()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-green-200 dark:border-green-800 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-2xl">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Đã Thuộc</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{getMasteredWords()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-blue-200 dark:border-blue-800 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-2xl">
                <Edit className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Đang Học</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{getTotalWords() - getMasteredWords()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm từ vựng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-3 flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-semibold transition-all
                  ${selectedFilter === filter.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                  }
                `}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span className={`ml-2 ${selectedFilter === filter.id ? 'text-purple-200' : 'text-purple-500 dark:text-purple-400'}`}>
                    ({filter.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="bg-purple-600 text-white rounded-3xl p-4 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5" />
              <span className="font-semibold">{selectedWords.size} từ đã chọn</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkMarkMastered}
                className="px-4 py-2 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
              >
                Đánh Dấu Thuộc
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
            </div>
          </div>
        )}

        {/* Vocabulary List */}
        {filteredVocabulary.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 overflow-hidden shadow-sm">
            {/* Header Row */}
            <div className="bg-purple-50 dark:bg-purple-950 border-b-2 border-purple-200 dark:border-purple-800 p-4">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedWords.size === filteredVocabulary.length
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                    }`}
                  >
                    {selectedWords.size === filteredVocabulary.length && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                </div>
                <div className="col-span-3">Từ Vựng</div>
                <div className="col-span-3">Nghĩa</div>
                <div className="col-span-2">Độ Nhớ</div>
                <div className="col-span-2">Nguồn</div>
                <div className="col-span-1"></div>
              </div>
            </div>

            {/* Vocabulary Rows */}
            <div className="divide-y divide-purple-100 dark:divide-purple-800">
              {filteredVocabulary.map((word) => (
                <div
                  key={word.id}
                  className={`p-4 transition-colors ${
                    selectedWords.has(word.id)
                      ? 'bg-purple-50 dark:bg-purple-950'
                      : 'hover:bg-purple-25 dark:hover:bg-purple-975'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Checkbox */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        onClick={() => toggleWordSelection(word.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedWords.has(word.id)
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                        }`}
                      >
                        {selectedWords.has(word.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Word */}
                    <div className="col-span-3">
                      <p
                        className="font-bold text-gray-800 dark:text-gray-100 text-lg"
                        style={{
                          fontFamily: word.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif",
                        }}
                      >
                        {word.word}
                      </p>
                      {(word.furigana || word.phonetic) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {word.furigana ?? word.phonetic}
                        </p>
                      )}
                      {word.language === 'english' && (
                        <button className="mt-1 p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded transition-colors">
                          <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </button>
                      )}
                    </div>

                    {/* Meaning */}
                    <div className="col-span-3">
                      <p className="text-gray-700 dark:text-gray-300">{word.meaning}</p>
                      {word.examples && word.examples.length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic line-clamp-1">
                          {word.examples[0]}
                        </p>
                      )}
                    </div>

                    {/* Memory Strength */}
                    <div className="col-span-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {word.memoryStrength}%
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getMemoryLabel(word.memoryStrength)}
                          </span>
                        </div>
                        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full transition-all ${getMemoryColor(word.memoryStrength)}`}
                            style={{ width: `${word.memoryStrength}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Source */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSourceIcon(word.source)}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getSourceLabel(word.source)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => updateWord(word.id, { memoryStrength: 100 })}
                            className="cursor-pointer"
                          >
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            Đánh Dấu Thuộc
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeWord(word.id)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa Từ Vựng
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800">
            <div className="flex justify-center mb-4">
              <div className="p-6 bg-purple-100 dark:bg-purple-900 rounded-full">
                <FolderInput className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {vocabularyList.length === 0 ? 'Chưa có từ vựng nào' : 'Không tìm thấy từ vựng'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {vocabularyList.length === 0
                ? 'Bắt đầu thêm từ vựng từ bài đọc hoặc flashcard'
                : 'Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác'}
            </p>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
    </AnimatedPage>
  );
}
