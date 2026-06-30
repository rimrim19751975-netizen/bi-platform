'use client';
import { create } from 'zustand';
import { LanguageCode, TranslationKeys, getTranslation, isRTL } from '@/i18n';

interface I18nState {
  lang: LanguageCode;
  t: TranslationKeys;
  isRtl: boolean;
  setLang: (lang: LanguageCode) => void;
  toggleLang: () => void;
}

const STORAGE_KEY = 'bi-lang';

function getInitialLang(): LanguageCode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    if (stored && ['fr', 'en', 'ar'].includes(stored)) return stored;
  }
  return 'fr';
}

export const useI18n = create<I18nState>((set) => {
  const initial = getInitialLang();
  return {
    lang: initial,
    t: getTranslation(initial),
    isRtl: isRTL(initial),
    setLang: (lang: LanguageCode) => {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      set({ lang, t: getTranslation(lang), isRtl: isRTL(lang) });
    },
    toggleLang: () => {
      set((state) => {
        const langs: LanguageCode[] = ['fr', 'en', 'ar'];
        const idx = (langs.indexOf(state.lang) + 1) % langs.length;
        const newLang = langs[idx];
        localStorage.setItem(STORAGE_KEY, newLang);
        document.documentElement.dir = isRTL(newLang) ? 'rtl' : 'ltr';
        document.documentElement.lang = newLang;
        return { lang: newLang, t: getTranslation(newLang), isRtl: isRTL(newLang) };
      });
    },
  };
});
