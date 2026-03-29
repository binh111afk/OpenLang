import { Volume2 } from 'lucide-react';

interface VocabularyCardProps {
  word: string;
  pronunciation?: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
  level?: string;
  category?: string;
  language: 'english' | 'japanese';
}

export function VocabularyCard({
  word,
  pronunciation,
  meaning,
  example,
  exampleTranslation,
  level,
  category,
  language,
}: VocabularyCardProps) {
  const isJapanese = language === 'japanese';
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {pronunciation && isJapanese && (
            <div className="mb-1">
              <ruby className="text-sm text-purple-600 dark:text-purple-400 font-medium" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                {pronunciation}
              </ruby>
            </div>
          )}
          <div className="mb-3">
            <span 
              className={`${isJapanese ? 'text-4xl' : 'text-3xl'} font-bold text-gray-800 dark:text-gray-100`}
              style={{ fontFamily: isJapanese ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif" }}
            >
              {word}
            </span>
          </div>
          {pronunciation && !isJapanese && (
            <div className="mb-2">
              <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">/{pronunciation}/</span>
            </div>
          )}
        </div>
        <button className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 transition-colors">
          <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-base font-medium text-gray-700 dark:text-gray-300">{meaning}</p>
        {example && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">{example}</p>
        )}
        {exampleTranslation && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{exampleTranslation}</p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-800 flex gap-2 flex-wrap">
        <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
          {isJapanese ? 'JLPT N5' : (level || 'Cơ Bản')}
        </span>
        {category && (
          <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
            {category}
          </span>
        )}
        <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
          {isJapanese ? '日本語' : 'English'}
        </span>
      </div>
    </div>
  );
}
