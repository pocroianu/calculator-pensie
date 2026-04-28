import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import PensionCalculator from './components/PensionCalculator';
import { Calculator, Settings, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import LegalDisclaimer from './components/LegalDisclaimer';
import HelpPanel from './components/HelpPanel';
import ShortcutHint from './components/ShortcutHint';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ModalLoadingFallback } from './components/LoadingSpinner';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import ThemeToggle from './components/ThemeToggle';
import { getNextLanguage } from './i18n/config';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import SharedResultsModal from './components/SharedResultsModal';
import { getSharedDataFromUrl, ShareableData } from './utils/socialSharing';

// Lazy load heavy modal components
const VPRAdmin = lazy(() => import('./components/VPRAdmin'));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp'));

function App() {
  const { t, i18n } = useTranslation();
  const [isVPRAdminOpen, setIsVPRAdminOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [sharedData, setSharedData] = useState<ShareableData | null>(null);
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);

  // Check for shared data in URL on mount
  useEffect(() => {
    const result = getSharedDataFromUrl();
    if (result && result.success && result.data) {
      setSharedData(result.data);
      setIsSharedModalOpen(true);
    }
  }, []);

  // Refs for triggering actions in child components
  const helpPanelRef = useRef<{ openHelpPanel: () => void } | null>(null);
  const pensionCalculatorRef = useRef<{
    addPeriod: () => void;
    exportData: () => void;
    focusBirthDate: () => void;
    focusRetirementYear: () => void;
    focusContributionPeriods: () => void;
    collapseAll: () => void;
    expandAll: () => void;
  } | null>(null);

  // Toggle language handler - cycles through all supported languages
  const toggleLanguage = useCallback(() => {
    const newLang = getNextLanguage(i18n.language);
    i18n.changeLanguage(newLang);
  }, [i18n]);

  // Close any open modal
  const closeModal = useCallback(() => {
    if (isShortcutsModalOpen) {
      setIsShortcutsModalOpen(false);
    }
    if (isVPRAdminOpen) {
      setIsVPRAdminOpen(false);
    }
    if (isSharedModalOpen) {
      setIsSharedModalOpen(false);
    }
  }, [isShortcutsModalOpen, isVPRAdminOpen, isSharedModalOpen]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    addPeriod: () => pensionCalculatorRef.current?.addPeriod(),
    save: () => pensionCalculatorRef.current?.exportData(),
    toggleLanguage,
    exportData: () => pensionCalculatorRef.current?.exportData(),
    focusBirthDate: () => pensionCalculatorRef.current?.focusBirthDate(),
    focusRetirementYear: () => pensionCalculatorRef.current?.focusRetirementYear(),
    focusContributionPeriods: () => pensionCalculatorRef.current?.focusContributionPeriods(),
    collapseAll: () => pensionCalculatorRef.current?.collapseAll(),
    expandAll: () => pensionCalculatorRef.current?.expandAll(),
    showHelp: () => helpPanelRef.current?.openHelpPanel(),
    showShortcuts: () => setIsShortcutsModalOpen(true),
    closeModal,
  });

  return (
    <AnalyticsProvider>
      <ThemeProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors">
            {/* Toast Notifications */}
            <ToastContainer />

            {/* PWA Components */}
            <OfflineIndicator />
            <PWAInstallPrompt />
            <PWAUpdateNotification />

            {/* Fixed Controls - Navigation Region */}
            <nav
              className="fixed top-4 right-4 z-50 flex items-center gap-2"
              aria-label={t('nav.quickActions')}
            >
              {/* Theme Toggle */}
              <ThemeToggle variant="dropdown" />
              {/* Keyboard Shortcuts Button */}
              <button
                onClick={() => setIsShortcutsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-sm font-medium text-gray-700 dark:text-dark-text"
                aria-label={t('keyboard.title')}
                data-testid="open-shortcuts-modal"
              >
                <Keyboard className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('keyboard.title')}</span>
              </button>
              {/* VPR Settings Button */}
              <button
                onClick={() => setIsVPRAdminOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-sm font-medium text-gray-700 dark:text-dark-text"
                aria-label={t('vprAdmin.openAdmin')}
                data-testid="open-vpr-admin"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('vprAdmin.openAdmin')}</span>
              </button>
              <LanguageSwitcher />
            </nav>

            {/* VPR Admin Panel - Lazy loaded */}
            {isVPRAdminOpen && (
              <Suspense fallback={<ModalLoadingFallback message={t('common.loading')} />}>
                <VPRAdmin isOpen={isVPRAdminOpen} onClose={() => setIsVPRAdminOpen(false)} />
              </Suspense>
            )}

            {/* Main Content Area */}
            <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Page Header */}
              <header className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Calculator className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
                    {t('pension.title')}
                  </h1>
                </div>
                <p className="text-lg text-gray-600 dark:text-dark-text-secondary max-w-3xl mx-auto">
                  {t('pension.description')}
                </p>
              </header>

              <PensionCalculator ref={pensionCalculatorRef} />

              {/* Add padding at the bottom to prevent content from being hidden by fixed footer */}
              <div className="h-16" aria-hidden="true" />
            </main>

            {/* Help Panel with FAQ and Guided Tour - Complementary Region */}
            <aside aria-label={t('help.title')}>
              <HelpPanel ref={helpPanelRef} />
            </aside>

            {/* Keyboard Shortcuts Modal - Lazy loaded */}
            {isShortcutsModalOpen && (
              <Suspense fallback={<ModalLoadingFallback message={t('common.loading')} />}>
                <KeyboardShortcutsHelp
                  isOpen={isShortcutsModalOpen}
                  onClose={() => setIsShortcutsModalOpen(false)}
                />
              </Suspense>
            )}

            {/* Shared Results Modal - for displaying shared calculation links */}
            {sharedData && (
              <SharedResultsModal
                isOpen={isSharedModalOpen}
                onClose={() => setIsSharedModalOpen(false)}
                sharedData={sharedData}
              />
            )}

            {/* Legal Disclaimer with Footer */}
            <footer>
              <LegalDisclaimer />
            </footer>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}

export default App;
