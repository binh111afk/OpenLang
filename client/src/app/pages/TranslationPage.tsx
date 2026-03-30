import { ArrowLeftRight, X, Mic, Volume2, Copy, Plus, Camera, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useTheme } from '../contexts/ThemeContext';
import { CustomDropdown } from '../components/CustomDropdown';
import { Tooltip } from '../components/Tooltip';
import { fetchJson } from '@/utils/api';

type Language = 'vietnamese' | 'english' | 'japanese';

interface VocabBreakdown {
  word: string;
  reading?: string;
  meaning: string;
  partOfSpeech: string;
  synonyms: string[];
  shortExample: string;
}

interface TranslationAlternatives {
  formal: string;
  casual: string;
  slang: string;
}

interface TranslateResponse {
  translatedText: string;
  alternatives: TranslationAlternatives;
  breakdown: VocabBreakdown[];
  isSentence: boolean;
  provider: string;
}

export function TranslationPage() {
  const { isDarkMode } = useTheme();
  const [sourceLang, setSourceLang] = useState<Language>('vietnamese');
  const [targetLang, setTargetLang] = useState<Language>('japanese');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [alternatives, setAlternatives] = useState<TranslationAlternatives | null>(null);
  const [vocabBreakdown, setVocabBreakdown] = useState<VocabBreakdown[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');
  const [lastProvider, setLastProvider] = useState('');

  const languageOptions = [
    { value: 'vietnamese', label: '🇻🇳 Tiếng Việt' },
    { value: 'english', label: '🇬🇧 English' },
    { value: 'japanese', label: '🇯🇵 日本語' },
  ];

  const languages = [
    { value: 'vietnamese' as const, label: 'Tiếng Việt', flag: '🇻🇳', code: 'VI' },
    { value: 'english' as const, label: 'English', flag: '🇬🇧', code: 'EN' },
    { value: 'japanese' as const, label: '日本語', flag: '🇯🇵', code: 'JP' },
  ];

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setTranslateError('');
    setIsTranslating(true);

    try {
      const payload = await fetchJson<TranslateResponse>('/api/ai-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText.trim(),
          sourceLang,
          targetLang,
        }),
      });

      setTranslatedText(payload.translatedText || '');
      setAlternatives(payload.alternatives || null);
      setVocabBreakdown(payload.isSentence ? payload.breakdown || [] : []);
      setLastProvider(payload.provider || '');
    } catch (error) {
      setTranslateError(error instanceof Error ? error.message : 'Không thể dịch văn bản.');
      setTranslatedText('');
      setAlternatives(null);
      setVocabBreakdown([]);
      setLastProvider('');
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const clearInput = () => {
    setInputText('');
    setTranslatedText('');
    setAlternatives(null);
    setVocabBreakdown([]);
    setTranslateError('');
    setLastProvider('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    // Show toast notification (simplified)
    alert('Đã sao chép vào clipboard!');
  };

  const playAudio = () => {
    // Mock audio playback
    alert('Đang phát âm thanh...');
  };

  const saveToLibrary = () => {
    alert('Đã lưu vào thư viện!');
  };

  const openCamera = () => {
    alert('Mở camera để dịch từ hình ảnh...');
  };

  const getSourceLang = () => languages.find(l => l.value === sourceLang);
  const getTargetLang = () => languages.find(l => l.value === targetLang);

  return (
    <AnimatedPage>
      <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Dịch Thuật Thông Minh</h1>
              <p className="text-gray-600 dark:text-gray-400">Dịch và phân tích từ vựng chi tiết</p>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm">
          <div className="flex items-center justify-center gap-4">
            {/* Source Language */}
            <div className="flex-1 max-w-xs">
              <CustomDropdown
                value={sourceLang}
                onChange={(value) => setSourceLang(value as Language)}
                options={languageOptions}
                placeholder="Chọn ngôn ngữ"
              />
            </div>

            {/* Swap Button */}
            <button
              onClick={swapLanguages}
              className="p-4 bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-purple-300 dark:hover:shadow-purple-900"
            >
              <ArrowLeftRight className="w-6 h-6" />
            </button>

            {/* Target Language */}
            <div className="flex-1 max-w-xs">
              <CustomDropdown
                value={targetLang}
                onChange={(value) => setTargetLang(value as Language)}
                options={languageOptions}
                placeholder="Chọn ngôn ngữ"
              />
            </div>
          </div>
        </div>

        {/* Translation Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Box */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getSourceLang()?.flag}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{getSourceLang()?.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="Xóa văn bản">
                  <button
                    onClick={clearInput}
                    className="p-2 hover:bg-purple-100 dark:hover:bg-purple-950 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </Tooltip>
                <Tooltip content="Nhập bằng giọng nói">
                  <button
                    className="p-2 hover:bg-purple-100 dark:hover:bg-purple-950 rounded-xl transition-colors"
                  >
                    <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </button>
                </Tooltip>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập văn bản cần dịch..."
              className="w-full h-48 p-4 bg-purple-50 dark:bg-purple-950 border-2 border-purple-100 dark:border-purple-900 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-lg"
              style={{ fontFamily: sourceLang === 'japanese' ? "'Noto Sans JP', sans-serif" : undefined }}
            />

            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-semibold rounded-2xl transition-all hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isTranslating ? 'Đang dịch...' : 'Dịch ngay'}
            </button>

            {translateError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {translateError}
              </div>
            ) : null}
          </div>

          {/* Output Box */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getTargetLang()?.flag}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{getTargetLang()?.label}</span>
              </div>
            </div>

            <div
              className="w-full h-48 p-4 bg-white dark:bg-gray-900 border-2 border-purple-100 dark:border-purple-900 rounded-2xl text-gray-800 dark:text-gray-100 text-lg overflow-y-auto"
              style={{ fontFamily: targetLang === 'japanese' ? "'Noto Sans JP', sans-serif" : undefined }}
            >
              {translatedText || (
                <span className="text-gray-400 dark:text-gray-500">Kết quả dịch sẽ hiển thị ở đây...</span>
              )}
            </div>

            {translatedText && (
              <div className="space-y-3">
                {alternatives ? (
                  <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                    <div className="rounded-xl border border-purple-200 bg-white px-3 py-2 dark:border-purple-800 dark:bg-gray-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-500 dark:text-purple-400">Trang trọng</p>
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{alternatives.formal || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-purple-200 bg-white px-3 py-2 dark:border-purple-800 dark:bg-gray-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-500 dark:text-purple-400">Thân mật</p>
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{alternatives.casual || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-purple-200 bg-white px-3 py-2 dark:border-purple-800 dark:bg-gray-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-500 dark:text-purple-400">Slang</p>
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{alternatives.slang || '-'}</p>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={playAudio}
                  className="flex-1 min-w-[120px] py-3 px-4 bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  Nghe
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex-1 min-w-[120px] py-3 px-4 bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Sao chép
                </button>
                <button
                  onClick={saveToLibrary}
                  className="flex-1 min-w-[120px] py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Lưu vào thư viện
                </button>

                {lastProvider ? (
                  <div className="w-full text-right text-xs text-gray-500 dark:text-gray-400">
                    AI: {lastProvider}
                  </div>
                ) : null}
              </div>
              </div>
            )}
          </div>
        </div>

        {/* Sentence Breakdown Section */}
        {vocabBreakdown.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Bóc Tách Câu</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phân tích các từ/cụm trong câu đã dịch</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vocabBreakdown.map((vocab, index) => (
                <div
                  key={index}
                  className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-2 border-purple-100 dark:border-purple-900 rounded-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all group cursor-pointer"
                >
                  {vocab.reading ? (
                    <div className="mb-3">
                      <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {vocab.word}
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {vocab.reading}
                      </div>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                      {vocab.word}
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{vocab.meaning}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full inline-block">
                      {vocab.partOfSpeech}
                    </p>

                    {vocab.synonyms?.length ? (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {vocab.synonyms.map((synonym, synIndex) => (
                          <span
                            key={`${vocab.word}-syn-${synIndex}`}
                            className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
                          >
                            {synonym}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {vocab.shortExample ? (
                      <p className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                        VD: {vocab.shortExample}
                      </p>
                    ) : null}
                  </div>

                  <button className="mt-3 w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-purple-700">
                    Thêm vào học
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Action Button - Camera */}
        <button
          onClick={openCamera}
          className="fixed bottom-8 right-8 p-5 bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-full shadow-2xl hover:shadow-purple-400/50 transition-all hover:scale-110 active:scale-95 z-50"
          title="Dịch từ hình ảnh"
        >
          <Camera className="w-7 h-7" />
        </button>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
    </AnimatedPage>
  );
}