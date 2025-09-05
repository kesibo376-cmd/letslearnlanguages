import React, { createContext, useContext, useMemo } from 'react';
import type { Language } from '../types';
import { translations } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to get nested properties from a key string
const getNestedTranslation = (language: Language, key: string): string | undefined => {
  return key.split('.').reduce((obj: any, k: string) => {
    return obj?.[k];
  }, translations[language]);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode; language: Language }> = ({ children, language }) => {
  const t = useMemo(() => (key: string, replacements?: { [key: string]: string | number }): string => {
    let translation = getNestedTranslation(language, key);

    if (!translation) {
      // Fallback to English if translation is missing
      translation = getNestedTranslation('en', key);
      if (!translation) {
        console.warn(`Translation not found for key: ${key}`);
        return key; // Return the key itself as a last resort
      }
    }

    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation!.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
      });
    }

    return translation!;
  }, [language]);

  const value = { language, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
