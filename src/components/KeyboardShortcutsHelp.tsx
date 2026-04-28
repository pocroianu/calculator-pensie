import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Keyboard, Navigation, Zap, Settings } from 'lucide-react';
import {
  KEYBOARD_SHORTCUTS,
  getShortcutDisplayString,
  getShortcutsByCategory,
  KeyboardShortcut
} from '../config/keyboardShortcuts';
import { createFocusTrap } from '../utils/accessibility';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutItem: React.FC<{ shortcut: KeyboardShortcut }> = ({ shortcut }) => {
  const { t } = useTranslation();
  const displayString = getShortcutDisplayString(shortcut);

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary rounded-lg">
      <span className="text-sm text-gray-700 dark:text-dark-text">
        {t(shortcut.descriptionKey)}
      </span>
      <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono font-medium text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded shadow-sm">
        {displayString}
      </kbd>
    </div>
  );
};

const CategorySection: React.FC<{
  title: string;
  icon: React.ReactNode;
  shortcuts: KeyboardShortcut[];
}> = ({ title, icon, shortcuts }) => {
  if (shortcuts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-3">
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">{title}</h3>
      </div>
      <div className="space-y-1">
        {shortcuts.map(shortcut => (
          <ShortcutItem key={shortcut.id} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
};

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useRef(createFocusTrap());

  // Set up focus trap when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      focusTrapRef.current.activate(modalRef.current);
      // Focus the close button on open
      closeButtonRef.current?.focus();
    }

    return () => {
      focusTrapRef.current.deactivate();
    };
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actionShortcuts = getShortcutsByCategory('actions');
  const navigationShortcuts = getShortcutsByCategory('navigation');
  const generalShortcuts = getShortcutsByCategory('general');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[70]"
        onClick={onClose}
        aria-hidden="true"
        data-testid="shortcuts-modal-backdrop"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl z-[70] max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        aria-describedby="shortcuts-modal-description"
        data-testid="shortcuts-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Keyboard className="w-5 h-5 text-blue-600" />
            </div>
            <h2 id="shortcuts-modal-title" className="text-lg font-semibold text-gray-900 dark:text-dark-text">
              {t('keyboard.title')}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
            aria-label={t('common.close')}
            data-testid="shortcuts-modal-close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          <CategorySection
            title={t('keyboard.categories.actions')}
            icon={<Zap className="w-4 h-4 text-blue-600" />}
            shortcuts={actionShortcuts}
          />

          <CategorySection
            title={t('keyboard.categories.navigation')}
            icon={<Navigation className="w-4 h-4 text-blue-600" />}
            shortcuts={navigationShortcuts}
          />

          <CategorySection
            title={t('keyboard.categories.general')}
            icon={<Settings className="w-4 h-4 text-blue-600" />}
            shortcuts={generalShortcuts}
          />

          {/* Hint */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
            <p id="shortcuts-modal-description" className="text-xs text-gray-500 dark:text-dark-text-muted text-center">
              {t('keyboard.hint')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcutsHelp;
