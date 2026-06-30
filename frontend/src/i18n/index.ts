import { fr } from './fr';
import { en } from './en';
import { ar } from './ar';

export type TranslationKeys = typeof fr;
export type LanguageCode = 'fr' | 'en' | 'ar';

const translations: Record<LanguageCode, TranslationKeys> = { fr, en, ar };

export function getTranslation(lang: LanguageCode): TranslationKeys {
  return translations[lang] || translations.fr;
}

export function isRTL(lang: LanguageCode): boolean {
  return lang === 'ar';
}

export { fr, en, ar };
