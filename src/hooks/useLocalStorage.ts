import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Storage key prefix for the pension calculator app
 */
const STORAGE_KEY_PREFIX = 'pension_calculator_';

/**
 * Default debounce delay for saving to local storage (in milliseconds)
 */
const DEFAULT_DEBOUNCE_DELAY = 500;

/**
 * Custom hook for persisting state to localStorage with debounced saving.
 *
 * Features:
 * - Automatically saves state changes to localStorage after a debounce delay
 * - Restores state from localStorage on initial mount
 * - Handles JSON serialization/deserialization
 * - Provides error handling for localStorage operations
 * - Uses debouncing to prevent performance issues from frequent saves
 *
 * @param key - The localStorage key (will be prefixed with 'pension_calculator_')
 * @param initialValue - The initial value to use if no stored value exists
 * @param debounceDelay - The delay in milliseconds before saving (default: 500ms)
 * @returns A tuple containing [storedValue, setValue, isLoaded] where isLoaded indicates
 *          if the value has been loaded from localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  debounceDelay: number = DEFAULT_DEBOUNCE_DELAY
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
  const isFirstMount = useRef(true);

  // Track if we've loaded from localStorage
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize state with a function to avoid reading localStorage on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(fullKey);
      if (item !== null) {
        const parsed = JSON.parse(item);
        return parsed;
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${fullKey}":`, error);
      return initialValue;
    }
  });

  // Debounce the stored value for saving
  const debouncedValue = useDebounce(storedValue, debounceDelay);

  // Mark as loaded after initial mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Save to localStorage when debounced value changes (skip first mount)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    try {
      window.localStorage.setItem(fullKey, JSON.stringify(debouncedValue));
    } catch (error) {
      console.warn(`Error saving to localStorage key "${fullKey}":`, error);
    }
  }, [debouncedValue, fullKey]);

  // Setter function that handles both direct values and updater functions
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  return [storedValue, setValue, isLoaded];
}

/**
 * Clear all pension calculator data from localStorage
 */
export function clearPensionCalculatorStorage(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Error clearing pension calculator storage:', error);
  }
}

/**
 * Get a specific item from pension calculator storage
 */
export function getPensionStorageItem<T>(key: string): T | null {
  try {
    const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
    const item = window.localStorage.getItem(fullKey);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Error reading pension storage item "${key}":`, error);
    return null;
  }
}

export default useLocalStorage;
