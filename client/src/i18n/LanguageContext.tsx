import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, type Translation } from './translations';

type Language = 'ru' | 'kk' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first, then browser language, default to Russian for Kazakhstan
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['ru', 'kk', 'en'].includes(saved)) {
      return saved;
    }
    
    // Detect browser language and default to appropriate language for Kazakhstan
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.includes('kk') || browserLang.includes('kaz')) {
      return 'kk';
    } else if (browserLang.includes('en')) {
      return 'en';
    }
    return 'ru'; // Default to Russian for Kazakhstan market
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}