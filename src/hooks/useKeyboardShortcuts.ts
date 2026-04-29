import { useEffect, useCallback, useRef } from 'react';
import {
  KEYBOARD_SHORTCUTS,
  matchesShortcut
} from '../config/keyboardShortcuts';

export interface ShortcutHandlers {
  addPeriod?: () => void;
  save?: () => void;
  toggleLanguage?: () => void;
  exportData?: () => void;
  focusBirthDate?: () => void;
  focusRetirementYear?: () => void;
  focusContributionPeriods?: () => void;
  collapseAll?: () => void;
  expandAll?: () => void;
  showHelp?: () => void;
  showShortcuts?: () => void;
  closeModal?: () => void;
}

interface UseKeyboardShortcutsOptions {
  /**
   * Whether the shortcuts should be enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Elements that should not trigger shortcuts when focused
   * @default ['INPUT', 'TEXTAREA', 'SELECT']
   */
  ignoreElements?: string[];
}

/**
 * Hook to handle keyboard shortcuts across the application
 *
 * @param handlers - Object containing handler functions for each shortcut
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   addPeriod: () => handleAddPeriod(),
 *   toggleLanguage: () => i18n.changeLanguage(i18n.language === 'en' ? 'ro' : 'en'),
 *   showShortcuts: () => setShowShortcutsModal(true),
 * });
 * ```
 */
export const useKeyboardShortcuts = (
  handlers: ShortcutHandlers,
  options: UseKeyboardShortcutsOptions = {}
): void => {
  const { enabled = true, ignoreElements = ['INPUT', 'TEXTAREA', 'SELECT'] } = options;

  // Store handlers in a ref to avoid recreating the event listener
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when disabled
    if (!enabled) return;

    // Get the active element
    const activeElement = document.activeElement;
    const tagName = activeElement?.tagName || '';

    // Check for shortcuts that should work in input fields
    const shortcut = KEYBOARD_SHORTCUTS.find(s => matchesShortcut(event, s));

    if (!shortcut) return;

    // For most shortcuts, ignore if focused on an input element
    // Exception: certain shortcuts like Escape should always work
    const alwaysWorkShortcuts = ['closeModal', 'showShortcuts'];

    if (
      ignoreElements.includes(tagName) &&
      !alwaysWorkShortcuts.includes(shortcut.id)
    ) {
      // For the '?' shortcut specifically, only ignore if in input
      if (shortcut.key !== '?') {
        return;
      }
      // If it's '?', check if user is typing - in which case ignore
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
        return;
      }
    }

    // Get the handler for this shortcut
    const handler = handlersRef.current[shortcut.id as keyof ShortcutHandlers];

    if (handler) {
      // Prevent default browser behavior for handled shortcuts
      event.preventDefault();
      event.stopPropagation();
      handler();
    }
  }, [enabled, ignoreElements]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

/**
 * Hook to get the display string for a specific shortcut
 * Useful for showing shortcut hints in the UI
 */
export const useShortcutDisplay = () => {
  const getShortcutHint = useCallback((shortcutId: string): string => {
    const shortcut = KEYBOARD_SHORTCUTS.find(s => s.id === shortcutId);
    if (!shortcut) return '';

    const isMac = navigator.platform.toLowerCase().includes('mac');
    const parts: string[] = [];

    if (shortcut.modifiers.ctrl) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.modifiers.alt) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.modifiers.shift) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.modifiers.meta) {
      parts.push(isMac ? '⌘' : 'Win');
    }

    let keyDisplay = shortcut.key.toUpperCase();
    if (shortcut.key === ' ') keyDisplay = 'Space';
    if (shortcut.key === 'Escape') keyDisplay = 'Esc';

    parts.push(keyDisplay);

    return isMac ? parts.join('') : parts.join('+');
  }, []);

  return { getShortcutHint };
};

export default useKeyboardShortcuts;
