import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown } from 'lucide-react';
import ShortcutHint from './ShortcutHint';
import { useAnalytics } from '../hooks/useAnalytics';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/config';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { trackLanguageChange } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = (i18n.language in SUPPORTED_LANGUAGES
    ? i18n.language
    : 'ro') as SupportedLanguage;

  const switchLanguage = (langCode: SupportedLanguage) => {
    if (langCode !== currentLang) {
      i18n.changeLanguage(langCode);
      trackLanguageChange(langCode);
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border shadow-sm hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors duration-200 text-sm font-medium text-gray-700 dark:text-dark-text"
        title={t('keyboard.shortcuts.toggleLanguage')}
        data-testid="language-switcher"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Languages className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
        <span>{SUPPORTED_LANGUAGES[currentLang].name}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 dark:text-dark-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        <ShortcutHint shortcutId="toggleLanguage" />
      </button>

      {isOpen && (
        <ul
          className="absolute right-0 mt-1 w-48 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg py-1 z-[60] animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
          aria-label={t('keyboard.shortcuts.toggleLanguage')}
          data-testid="language-dropdown"
        >
          {(Object.entries(SUPPORTED_LANGUAGES) as [SupportedLanguage, typeof SUPPORTED_LANGUAGES[SupportedLanguage]][]).map(
            ([code, { name, flag }]) => (
              <li
                key={code}
                role="option"
                aria-selected={code === currentLang}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-150 text-sm
                  ${
                    code === currentLang
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
                  }`}
                onClick={() => switchLanguage(code)}
                data-testid={`language-option-${code}`}
              >
                <span className="text-base" aria-hidden="true">{flag}</span>
                <span className="flex-1">{name}</span>
                {code === currentLang && (
                  <span className="text-blue-500 dark:text-blue-400" aria-hidden="true">✓</span>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
