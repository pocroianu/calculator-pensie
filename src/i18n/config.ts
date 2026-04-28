import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ro from './locales/ro.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';

/**
 * Supported languages configuration
 * Each entry maps a language code to its native display name and flag emoji
 */
export const SUPPORTED_LANGUAGES = {
  ro: { name: 'Română', flag: '🇷🇴' },
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Español', flag: '🇪🇸' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Get the ordered list of language codes for cycling through languages
 */
export const LANGUAGE_ORDER: SupportedLanguage[] = ['ro', 'en', 'fr', 'de', 'es'];

/**
 * Get the next language in the cycle
 */
export const getNextLanguage = (currentLang: string): SupportedLanguage => {
  const currentIndex = LANGUAGE_ORDER.indexOf(currentLang as SupportedLanguage);
  if (currentIndex === -1) return 'ro';
  return LANGUAGE_ORDER[(currentIndex + 1) % LANGUAGE_ORDER.length];
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ro: {
        translation: ro,
      },
      en: {
        translation: en,
      },
      fr: {
        translation: fr,
      },
      de: {
        translation: de,
      },
      es: {
        translation: es,
      },
    },
    fallbackLng: 'ro',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
