import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../hooks/useAnalytics';

interface ThemeToggleProps {
  /** Show as a dropdown menu or simple toggle button */
  variant?: 'toggle' | 'dropdown';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Theme toggle component that allows users to switch between light, dark, and system themes.
 * Supports both simple toggle (light/dark) and dropdown (light/dark/system) variants.
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'toggle', className = '' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { trackThemeChange } = useAnalytics();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Close dropdown on escape
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen]);

  const getCurrentIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" aria-hidden="true" />;
    }
    return resolvedTheme === 'dark' ? (
      <Moon className="w-4 h-4" aria-hidden="true" />
    ) : (
      <Sun className="w-4 h-4" aria-hidden="true" />
    );
  };

  const themeOptions: { value: Theme; icon: React.ReactNode; label: string }[] = [
    {
      value: 'light',
      icon: <Sun className="w-4 h-4" aria-hidden="true" />,
      label: t('theme.light', 'Light'),
    },
    {
      value: 'dark',
      icon: <Moon className="w-4 h-4" aria-hidden="true" />,
      label: t('theme.dark', 'Dark'),
    },
    {
      value: 'system',
      icon: <Monitor className="w-4 h-4" aria-hidden="true" />,
      label: t('theme.system', 'System'),
    },
  ];

  const handleToggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    toggleTheme();
    trackThemeChange(newTheme);
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    trackThemeChange(newTheme);
    setIsDropdownOpen(false);
  };

  if (variant === 'toggle') {
    return (
      <button
        onClick={handleToggleTheme}
        className={`flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-sm font-medium text-gray-700 dark:text-dark-text ${className}`}
        aria-label={
          resolvedTheme === 'dark'
            ? t('theme.switchToLight', 'Switch to light mode')
            : t('theme.switchToDark', 'Switch to dark mode')
        }
        data-testid="theme-toggle"
      >
        {getCurrentIcon()}
        <span className="hidden sm:inline">
          {resolvedTheme === 'dark' ? t('theme.dark', 'Dark') : t('theme.light', 'Light')}
        </span>
      </button>
    );
  }

  // Dropdown variant
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-sm font-medium text-gray-700 dark:text-dark-text"
        aria-label={t('theme.selectTheme', 'Select theme')}
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
        data-testid="theme-dropdown-trigger"
      >
        {getCurrentIcon()}
        <span className="hidden sm:inline">
          {theme === 'system'
            ? t('theme.system', 'System')
            : resolvedTheme === 'dark'
              ? t('theme.dark', 'Dark')
              : t('theme.light', 'Light')}
        </span>
      </button>

      {isDropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-36 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-50 animate-scale-in"
          role="listbox"
          aria-label={t('theme.themeOptions', 'Theme options')}
        >
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSetTheme(option.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                theme === option.value
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
              }`}
              role="option"
              aria-selected={theme === option.value}
              data-testid={`theme-option-${option.value}`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
