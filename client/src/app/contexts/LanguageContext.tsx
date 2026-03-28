import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'vietnamese' | 'english' | 'japanese';

interface LanguageContextType {
  uiLanguage: Language;
  learningLanguages: Language[];
  setUILanguage: (lang: Language) => void;
  toggleLearningLanguage: (lang: Language) => void;
  isLearningLanguage: (lang: Language) => boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUILanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('openlang_ui_language');
    return (saved as Language) || 'vietnamese';
  });
  
  const [learningLanguages, setLearningLanguages] = useState<Language[]>(() => {
    const saved = localStorage.getItem('openlang_learning_languages');
    return saved ? JSON.parse(saved) : ['english', 'japanese'];
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('openlang_ui_language', uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    localStorage.setItem('openlang_learning_languages', JSON.stringify(learningLanguages));
  }, [learningLanguages]);

  const setUILanguage = (lang: Language) => {
    setUILanguageState(lang);
  };

  const toggleLearningLanguage = (lang: Language) => {
    setLearningLanguages(prev => {
      if (prev.includes(lang)) {
        return prev.filter(l => l !== lang);
      } else {
        return [...prev, lang];
      }
    });
  };

  const isLearningLanguage = (lang: Language) => {
    return learningLanguages.includes(lang);
  };

  return (
    <LanguageContext.Provider value={{ uiLanguage, learningLanguages, setUILanguage, toggleLearningLanguage, isLearningLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}