import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

type PronounceButtonProps = {
  text: string;
  lang: 'en-US' | 'ja-JP';
  label?: string;
  className?: string;
};

export function PronounceButton({
  text,
  lang,
  label = 'Phát âm',
  className = '',
}: PronounceButtonProps) {
  const { isSupported, isSpeaking, speak } = useSpeech({ text, lang });

  if (!isSupported) {
    return null;
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={speak}
      title={label}
      aria-label={label}
      className={`relative inline-flex items-center justify-center rounded-2xl border border-purple-200 bg-purple-50 p-3 text-purple-600 shadow-sm transition hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 dark:hover:border-purple-700 dark:hover:bg-purple-900 ${className}`}
    >
      <Volume2
        className={`h-5 w-5 transition ${
          isSpeaking ? 'text-purple-800 dark:text-fuchsia-300' : ''
        }`}
      />

      {isSpeaking ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute h-8 w-8 rounded-full border border-purple-400/60 animate-ping" />
          <span className="absolute h-11 w-11 rounded-full border border-fuchsia-400/40 animate-ping [animation-delay:120ms]" />
        </span>
      ) : null}
    </motion.button>
  );
}
