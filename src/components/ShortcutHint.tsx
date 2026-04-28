import React from 'react';
import { getShortcutById, getShortcutDisplayString } from '../config/keyboardShortcuts';

interface ShortcutHintProps {
  shortcutId: string;
  className?: string;
  inline?: boolean;
}

/**
 * A small badge component that displays a keyboard shortcut hint
 * Can be used inline with buttons or in tooltips
 */
const ShortcutHint: React.FC<ShortcutHintProps> = ({
  shortcutId,
  className = '',
  inline = false
}) => {
  const shortcut = getShortcutById(shortcutId);

  if (!shortcut) return null;

  const displayString = getShortcutDisplayString(shortcut);

  if (inline) {
    return (
      <span
        className={`text-xs text-gray-400 ml-2 ${className}`}
        data-testid={`shortcut-hint-${shortcutId}`}
      >
        ({displayString})
      </span>
    );
  }

  return (
    <kbd
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded ${className}`}
      data-testid={`shortcut-hint-${shortcutId}`}
    >
      {displayString}
    </kbd>
  );
};

export default ShortcutHint;
