import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import PensionCalculator from './components/PensionCalculator';
import { Calculator, HelpCircle, Keyboard, Settings } from 'lucide-react';
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
          <div className="min-h-screen bg-[#f7f9fb] text-slate-950 dark:bg-dark-bg dark:text-dark-text transition-colors">
            {/* Toast Notifications */}
            <ToastContainer />

            {/* PWA Components */}
            <OfflineIndicator />
            <PWAInstallPrompt enabled={hasAcceptedLegal} />
            <PWAUpdateNotification />

            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f7f9fb]/95 backdrop-blur dark:border-dark-border dark:bg-dark-bg/95 print:hidden">
              <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300" aria-hidden="true">
                    <Calculator className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold tracking-normal text-slate-950 dark:text-dark-text sm:text-3xl">
                      {t('pension.title')}
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-dark-text-secondary sm:text-base">
                      {t('pension.description')}
                    </p>
                  </div>
                </div>

                <nav
                  className="flex flex-wrap items-center gap-2 lg:justify-end"
                  aria-label={t('nav.quickActions')}
                >
                  <ThemeToggle variant="dropdown" />
                  <button
                    onClick={() => helpPanelRef.current?.openHelpPanel()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-blue-700 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text dark:hover:bg-dark-bg-tertiary"
                    aria-label={t('help.openHelp')}
                    data-testid="open-help-panel"
                  >
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden 2xl:inline">{t('help.openHelp')}</span>
                  </button>
                  <button
                    onClick={() => setIsShortcutsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text dark:hover:bg-dark-bg-tertiary"
                    aria-label={t('keyboard.title')}
                    data-testid="open-shortcuts-modal"
                  >
                    <Keyboard className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden 2xl:inline">{t('keyboard.title')}</span>
                  </button>
                  <button
                    onClick={() => setIsVPRAdminOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text dark:hover:bg-dark-bg-tertiary"
                    aria-label={t('vprAdmin.openAdmin')}
                    data-testid="open-vpr-admin"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden 2xl:inline">{t('vprAdmin.openAdmin')}</span>
                  </button>
                  <LanguageSwitcher />
                </nav>
              </div>
            </header>

            {/* VPR Admin Panel - Lazy loaded */}
            {isVPRAdminOpen && (
              <Suspense fallback={<ModalLoadingFallback message={t('common.loading')} />}>
                <VPRAdmin isOpen={isVPRAdminOpen} onClose={() => setIsVPRAdminOpen(false)} />
              </Suspense>
            )}

            {/* Main Content Area */}
            <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <PensionCalculator ref={pensionCalculatorRef} />
            </main>

            {/* Help Panel with FAQ and Guided Tour - Complementary Region */}
            <aside aria-label={t('help.title')}>
              <HelpPanel ref={helpPanelRef} deferTourPrompt={!hasAcceptedLegal} showFloatingButton={false} />
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
