import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import PensionCalculator from './components/PensionCalculator';
import { Calculator, Settings, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import LegalDisclaimer from './components/LegalDisclaimer';
import HelpPanel from './components/HelpPanel';
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
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(() => {
    return localStorage.getItem('legal_disclaimer_accepted') === '1.0';
  });

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
          <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-dark-bg dark:text-dark-text transition-colors">
            {/* Toast Notifications */}
            <ToastContainer />

            {/* PWA Components */}
            <OfflineIndicator />
            <PWAInstallPrompt enabled={hasAcceptedLegal} />
            <PWAUpdateNotification />

            {/* Fixed Controls - Navigation Region */}
            <nav
              className="relative z-40 mx-auto flex max-w-7xl items-center justify-end gap-2 px-4 pt-4 sm:fixed sm:right-4 sm:top-4 sm:mx-0 sm:px-0 sm:pt-0"
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
              <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
                <div className="mb-4 flex items-center justify-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800" aria-hidden="true">
                    <Calculator className="h-6 w-6" />
                  </span>
                  <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-dark-text sm:text-4xl">
                    {t('pension.title')}
                  </h1>
                </div>
                <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 dark:text-dark-text-secondary sm:text-lg">
                  {t('pension.description')}
                </p>
              </header>

              <PensionCalculator ref={pensionCalculatorRef} />

              {/* Add padding at the bottom to prevent content from being hidden by fixed footer */}
              <div className="h-16" aria-hidden="true" />
            </main>

            {/* Help Panel with FAQ and Guided Tour - Complementary Region */}
            <aside aria-label={t('help.title')}>
              <HelpPanel ref={helpPanelRef} deferTourPrompt={!hasAcceptedLegal} />
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
              <LegalDisclaimer onAccept={() => setHasAcceptedLegal(true)} />
            </footer>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}

export default App;
