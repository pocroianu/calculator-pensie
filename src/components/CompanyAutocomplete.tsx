/**
 * CompanyAutocomplete Component
 *
 * An accessible auto-complete input for company names that suggests:
 * 1. Previously used company names from user history
 * 2. Popular Romanian employers
 *
 * Features:
 * - Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
 * - ARIA attributes for screen reader support
 * - Highlights matched text in suggestions
 * - Shows source indicators (history vs popular)
 * - Dark mode support
 * - Touch-friendly
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Building2, Clock, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCompanyAutocomplete, CompanySuggestion } from '../hooks/useCompanyAutocomplete';
import { ContributionPeriod } from '../types/pensionTypes';

interface CompanyAutocompleteProps {
  /** Current company name value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** All current contribution periods (for extracting user history) */
  currentPeriods?: ContributionPeriod[];
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * Highlights the matching portion of text with bold styling
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || query.trim().length === 0) {
    return <span>{text}</span>;
  }

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + query.trim().length);
  const after = text.slice(matchIndex + query.trim().length);

  return (
    <span>
      {before}
      <strong className="text-blue-600 dark:text-blue-400 font-semibold">{match}</strong>
      {after}
    </span>
  );
}

/**
 * Source badge for suggestion items
 */
function SourceBadge({ source }: { source: 'history' | 'popular' }) {
  const { t } = useTranslation();

  if (source === 'history') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {t('autocomplete.source.history')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
      <Building2 className="w-3 h-3" aria-hidden="true" />
      {t('autocomplete.source.popular')}
    </span>
  );
}

const CompanyAutocomplete: React.FC<CompanyAutocompleteProps> = ({
  value,
  onChange,
  currentPeriods = [],
  className = '',
  'data-testid': dataTestId,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { suggestions, hasSuggestions, isLoading } = useCompanyAutocomplete({
    query: value,
    currentPeriods,
    maxSuggestions: 8,
    debounceDelay: 150,
    minQueryLength: 1,
  });

  // Generate a unique ID for ARIA attributes
  const listboxId = useMemo(() => `company-autocomplete-listbox-${Math.random().toString(36).substr(2, 9)}`, []);

  // Show dropdown when there are suggestions and input is focused
  const shouldShowDropdown = isOpen && hasSuggestions && value.trim().length > 0;

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleSelect = useCallback(
    (suggestion: CompanySuggestion) => {
      onChange(suggestion.name);
      setIsOpen(false);
      setActiveIndex(-1);
      // Keep focus on input after selection
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setIsOpen(true);
    },
    [onChange]
  );

  const handleInputFocus = useCallback(() => {
    if (value.trim().length > 0) {
      setIsOpen(true);
    }
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!shouldShowDropdown) {
        // If dropdown is closed but we have suggestions, open on ArrowDown
        if (e.key === 'ArrowDown' && hasSuggestions && value.trim().length > 0) {
          e.preventDefault();
          setIsOpen(true);
          setActiveIndex(0);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            handleSelect(suggestions[activeIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;

        case 'Tab':
          // Allow natural tab behavior but close dropdown
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [shouldShowDropdown, suggestions, activeIndex, handleSelect, hasSuggestions, value]
  );

  return (
    <div ref={containerRef} className="relative" data-testid={dataTestId}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-autocomplete="list"
          aria-controls={shouldShowDropdown ? listboxId : undefined}
          aria-activedescendant={
            shouldShowDropdown && activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          autoComplete="off"
          className={`w-full px-4 py-3 pr-10 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-input dark:bg-dark-bg dark:text-dark-text ${className}`}
          data-testid={dataTestId ? `${dataTestId}-input` : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 dark:border-dark-border border-t-blue-500 rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <Search className="w-4 h-4 text-gray-400 dark:text-dark-text-muted" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Dropdown suggestions list */}
      {shouldShowDropdown && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={t('autocomplete.suggestions')}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
          data-testid={dataTestId ? `${dataTestId}-dropdown` : undefined}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.source}-${suggestion.name}`}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`flex items-center justify-between gap-2 px-4 py-2.5 cursor-pointer transition-colors ${
                index === activeIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text'
              }`}
              onMouseDown={(e) => {
                // Use mouseDown instead of click to fire before blur
                e.preventDefault();
                handleSelect(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              data-testid={dataTestId ? `${dataTestId}-option-${index}` : undefined}
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">
                  <HighlightedText text={suggestion.name} query={value} />
                </span>
              </div>
              <SourceBadge source={suggestion.source} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CompanyAutocomplete;
