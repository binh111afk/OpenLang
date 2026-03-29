import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SupportedLang = 'en-US' | 'ja-JP';

type SpeechOptions = {
  lang: SupportedLang;
  text: string;
};

type UseSpeechResult = {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: () => void;
  cancel: () => void;
};

function pickBestVoice(voices: SpeechSynthesisVoice[], lang: SupportedLang) {
  const normalizedLang = lang.toLowerCase();
  const matchingVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(normalizedLang.split('-')[0]),
  );

  if (matchingVoices.length === 0) {
    return null;
  }

  const preferredNames =
    lang === 'ja-JP'
      ? ['Google 日本語', 'Microsoft Nanami', 'Kyoko', 'Otoya']
      : ['Google US English', 'Microsoft Aria', 'Samantha', 'Jenny'];

  for (const preferred of preferredNames) {
    const found = matchingVoices.find((voice) =>
      voice.name.toLowerCase().includes(preferred.toLowerCase()),
    );

    if (found) {
      return found;
    }
  }

  const naturalVoice =
    matchingVoices.find(
      (voice) =>
        !voice.localService ||
        /google|microsoft|natural|premium|enhanced/i.test(voice.name),
    ) ?? matchingVoices[0];

  return naturalVoice;
}

export function useSpeech({ text, lang }: SpeechOptions): UseSpeechResult {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const loadVoices = () => {
      const nextVoices = window.speechSynthesis.getVoices();
      if (nextVoices.length > 0) {
        setVoices(nextVoices);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (!isSupported) {
        return;
      }

      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const selectedVoice = useMemo(
    () => pickBestVoice(voices, lang),
    [lang, voices],
  );

  const cancel = useCallback(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(() => {
    if (!isSupported || !text.trim()) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
    utterance.pitch = 1.0;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, lang, selectedVoice, text]);

  return {
    isSupported,
    isSpeaking,
    speak,
    cancel,
  };
}

export type { SupportedLang, UseSpeechResult };
