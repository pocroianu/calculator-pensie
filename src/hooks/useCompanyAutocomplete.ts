/**
 * useCompanyAutocomplete Hook
 *
 * Provides intelligent company name auto-complete suggestions by combining:
 * 1. User's previously entered company names (from localStorage / current periods)
 * 2. Popular Romanian employers database
 *
 * Features:
 * - Debounced search for performance
 * - Prioritizes user history over popular employers
 * - Deduplicates results
 * - Configurable result limit
 */

import { useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { searchEmployers, EmployerEntry } from '../data/romanianEmployers';
import { ContributionPeriod } from '../types/pensionTypes';
import { getPensionStorageItem } from './useLocalStorage';

/** Shape of a suggestion item */
export interface CompanySuggestion {
  name: string;
  source: 'history' | 'popular';
  sector?: string;
}

/** Configuration for the autocomplete hook */
interface UseCompanyAutocompleteOptions {
  /** Current query string */
  query: string;
  /** All current contribution periods (for extracting used companies) */
  currentPeriods?: ContributionPeriod[];
  /** Maximum number of suggestions to show */
  maxSuggestions?: number;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Minimum query length before suggestions appear */
  minQueryLength?: number;
}

const DEFAULT_MAX_SUGGESTIONS = 8;
const DEFAULT_DEBOUNCE_DELAY = 150;
const DEFAULT_MIN_QUERY_LENGTH = 1;

/**
 * Extract unique company names from current contribution periods
 */
function getCompaniesFromCurrentPeriods(periods: ContributionPeriod[] = []): string[] {
  const companies = new Set<string>();
  for (const period of periods) {
    if (period.company && period.company.trim().length > 0) {
      companies.add(period.company.trim());
    }
  }
  return Array.from(companies);
}

/**
 * Extract unique company names from stored calculation history
 */
function getCompaniesFromHistory(): string[] {
  const companies = new Set<string>();

  try {
    // Try to read from calculation history
    const history = getPensionStorageItem<{
      snapshots: Array<{
        inputs: { contributionPeriods: ContributionPeriod[] };
      }>;
    }>('calculation_history');

    if (history?.snapshots) {
      for (const snapshot of history.snapshots) {
        if (snapshot.inputs?.contributionPeriods) {
          for (const period of snapshot.inputs.contributionPeriods) {
            if (period.company && period.company.trim().length > 0) {
              companies.add(period.company.trim());
            }
          }
        }
      }
    }
  } catch {
    // Silently fail - history might not exist yet
  }

  try {
    // Try to read from stored inputs
    const inputs = getPensionStorageItem<{
      contributionPeriods: ContributionPeriod[];
    }>('inputs');

    if (inputs?.contributionPeriods) {
      for (const period of inputs.contributionPeriods) {
        if (period.company && period.company.trim().length > 0) {
          companies.add(period.company.trim());
        }
      }
    }
  } catch {
    // Silently fail
  }

  return Array.from(companies);
}

/**
 * Custom hook for company name auto-complete.
 *
 * Combines user history and popular Romanian employers to provide suggestions.
 */
export function useCompanyAutocomplete({
  query,
  currentPeriods = [],
  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
  debounceDelay = DEFAULT_DEBOUNCE_DELAY,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
}: UseCompanyAutocompleteOptions) {
  // Debounce the query for performance
  const debouncedQuery = useDebounce(query, debounceDelay);

  // Memoize user history companies (combines current periods + stored history)
  const userCompanies = useMemo(() => {
    const fromCurrent = getCompaniesFromCurrentPeriods(currentPeriods);
    const fromHistory = getCompaniesFromHistory();

    // Combine and deduplicate (case-insensitive)
    const seen = new Set<string>();
    const combined: string[] = [];

    for (const company of [...fromCurrent, ...fromHistory]) {
      const key = company.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(company);
      }
    }

    return combined;
  }, [currentPeriods]);

  // Generate suggestions based on debounced query
  const suggestions = useMemo((): CompanySuggestion[] => {
    if (!debouncedQuery || debouncedQuery.trim().length < minQueryLength) {
      return [];
    }

    const normalizedQuery = debouncedQuery.toLowerCase().trim();
    const results: CompanySuggestion[] = [];
    const seenNames = new Set<string>();

    // 1. First, add matching user history companies (highest priority)
    for (const company of userCompanies) {
      if (company.toLowerCase().includes(normalizedQuery)) {
        const key = company.toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          results.push({
            name: company,
            source: 'history',
          });
        }
      }
    }

    // 2. Then, add matching popular employers
    if (results.length < maxSuggestions) {
      const popularResults = searchEmployers(
        debouncedQuery,
        maxSuggestions - results.length
      );

      for (const employer of popularResults) {
        const key = employer.name.toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          results.push({
            name: employer.name,
            source: 'popular',
            sector: employer.sector,
          });
        }
      }
    }

    return results.slice(0, maxSuggestions);
  }, [debouncedQuery, userCompanies, maxSuggestions, minQueryLength]);

  // Check if there are any suggestions
  const hasSuggestions = suggestions.length > 0;

  // Helper to check if query exactly matches a suggestion
  const isExactMatch = useCallback(
    (value: string): boolean => {
      return suggestions.some(
        (s) => s.name.toLowerCase() === value.toLowerCase()
      );
    },
    [suggestions]
  );

  return {
    suggestions,
    hasSuggestions,
    isExactMatch,
    isLoading: query !== debouncedQuery,
  };
}

export default useCompanyAutocomplete;
