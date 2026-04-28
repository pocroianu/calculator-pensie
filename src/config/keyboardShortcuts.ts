/**
 * Keyboard shortcuts configuration for the Romanian Pension Calculator
 */

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  descriptionKey: string;
  category: 'navigation' | 'actions' | 'general';
}

/**
 * Get the modifier key based on the operating system
 * Mac uses Command (⌘), Windows/Linux uses Ctrl
 */
export const getModifierKey = (): 'meta' | 'ctrl' => {
  return navigator.platform.toLowerCase().includes('mac') ? 'meta' : 'ctrl';
};

/**
 * Get display string for a shortcut
 */
export const getShortcutDisplayString = (shortcut: KeyboardShortcut): string => {
  const isMac = navigator.platform.toLowerCase().includes('mac');
  const parts: string[] = [];

  if (shortcut.modifiers.ctrl) {
    parts.push(isMac ? '⌃' : 'Ctrl');
  }
  if (shortcut.modifiers.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.modifiers.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.modifiers.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }

  // Format the key display
  let keyDisplay = shortcut.key.toUpperCase();
  if (shortcut.key === ' ') keyDisplay = 'Space';
  if (shortcut.key === 'Escape') keyDisplay = 'Esc';
  if (shortcut.key === '?') keyDisplay = '?';

  parts.push(keyDisplay);

  return isMac ? parts.join('') : parts.join('+');
};

/**
 * Define all keyboard shortcuts for the application
 */
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Actions
  {
    id: 'addPeriod',
    key: 'p',
    modifiers: { alt: true },
    descriptionKey: 'keyboard.shortcuts.addPeriod',
    category: 'actions'
  },
  {
    id: 'save',
    key: 's',
    modifiers: { ctrl: true },
    descriptionKey: 'keyboard.shortcuts.save',
    category: 'actions'
  },
  {
    id: 'toggleLanguage',
    key: 'l',
    modifiers: { alt: true },
    descriptionKey: 'keyboard.shortcuts.toggleLanguage',
    category: 'actions'
  },
  {
    id: 'exportData',
    key: 'e',
    modifiers: { alt: true },
    descriptionKey: 'keyboard.shortcuts.exportData',
    category: 'actions'
  },

  // Navigation
  {
    id: 'focusBirthDate',
    key: '1',
    modifiers: { alt: true },
    descriptionKey: 'keyboard.shortcuts.focusBirthDate',
    category: 'navigation'
  },
  {
    id: 'focusRetirementYear',
    key: '2',
    modifiers: { alt: true },
    descriptionKey: 'keyboard.shortcuts.focusRetirementYear',
    category: 'navigation'
  },
  {
    id: 'focusContributionPeriods',
    key: '3',
    modifiers: { alt: true },
    descriptionKey: 'keyboard.shortcuts.focusContributionPeriods',
    category: 'navigation'
  },
  {
    id: 'collapseAll',
    key: 'k',
    modifiers: { alt: true },
    descriptionKey: 'keyboard.shortcuts.collapseAll',
    category: 'navigation'
  },
  {
    id: 'expandAll',
    key: 'j',
    modifiers: { alt: true },
    descriptionKey: 'keyboard.shortcuts.expandAll',
    category: 'navigation'
  },

  // General
  {
    id: 'showHelp',
    key: '?',
    modifiers: {},
    descriptionKey: 'keyboard.shortcuts.showHelp',
    category: 'general'
  },
  {
    id: 'showShortcuts',
    key: '/',
    modifiers: { ctrl: true },
    descriptionKey: 'keyboard.shortcuts.showShortcuts',
    category: 'general'
  },
  {
    id: 'closeModal',
    key: 'Escape',
    modifiers: {},
    descriptionKey: 'keyboard.shortcuts.closeModal',
    category: 'general'
  }
];

/**
 * Check if a keyboard event matches a shortcut
 */
export const matchesShortcut = (
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean => {
  // Check the key (case-insensitive for letters)
  const eventKey = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  if (eventKey !== shortcutKey) {
    return false;
  }

  // Check modifiers
  const { ctrl, alt, shift, meta } = shortcut.modifiers;

  // For ctrl modifier, check both ctrlKey and metaKey on Mac
  if (ctrl) {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    if (isMac) {
      if (!event.metaKey && !event.ctrlKey) return false;
    } else {
      if (!event.ctrlKey) return false;
    }
  } else {
    // If ctrl is not expected, it shouldn't be pressed (except on Mac where cmd might be used)
    if (event.ctrlKey && !navigator.platform.toLowerCase().includes('mac')) return false;
  }

  if (alt && !event.altKey) return false;
  if (!alt && event.altKey) return false;

  if (shift && !event.shiftKey) return false;
  if (!shift && event.shiftKey && shortcut.key !== '?') return false;

  if (meta && !event.metaKey) return false;

  return true;
};

/**
 * Get shortcut by ID
 */
export const getShortcutById = (id: string): KeyboardShortcut | undefined => {
  return KEYBOARD_SHORTCUTS.find(shortcut => shortcut.id === id);
};

/**
 * Get shortcuts by category
 */
export const getShortcutsByCategory = (category: KeyboardShortcut['category']): KeyboardShortcut[] => {
  return KEYBOARD_SHORTCUTS.filter(shortcut => shortcut.category === category);
};
