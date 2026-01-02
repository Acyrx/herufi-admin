'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'sw';

interface LanguageContextProps {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const loadTranslations = async (lang: Language) => {
  const response = await fetch(`/translations/${lang}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load translations for ${lang}`);
  }
  return response.json();
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage) {
      setLanguageState(storedLanguage);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await loadTranslations(language);
        setTranslations(data);
      } catch (error) {
        console.error(error);
      }
    };

    load();
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prevLanguage) => (prevLanguage === 'en' ? 'sw' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};