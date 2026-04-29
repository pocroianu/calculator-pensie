import React, { useState, useEffect, forwardRef, useImperativeHandle, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, X, Compass, BookOpen } from 'lucide-react';
import FAQ from './FAQ';
import { ModalLoadingFallback } from './LoadingSpinner';

// Lazy load the GuidedTour component
const GuidedTour = lazy(() => import('./GuidedTour'));

// Tour completed key - duplicated here to avoid importing from GuidedTour
const TOUR_COMPLETED_KEY = 'guided_tour_completed';

interface HelpPanelProps {
  className?: string;
  deferTourPrompt?: boolean;
  showFloatingButton?: boolean;
}

export interface HelpPanelRef {
  openHelpPanel: () => void;
}

const HelpPanel = forwardRef<HelpPanelRef, HelpPanelProps>(({ className = '', deferTourPrompt = false, showFloatingButton = true }, ref) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(false);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openHelpPanel: () => setIsOpen(true)
  }));

  useEffect(() => {
    if (deferTourPrompt) {
      setShowTourPrompt(false);
      return;
    }

    // Show tour prompt for first-time users
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!tourCompleted) {
      const timeoutId = window.setTimeout(() => setShowTourPrompt(true), 1200);
      return () => window.clearTimeout(timeoutId);
    }
  }, [deferTourPrompt]);

  const handleStartTour = () => {
    setShowTourPrompt(false);
    setIsOpen(false);
    setIsTourOpen(true);
  };

  const handleDismissTourPrompt = () => {
    setShowTourPrompt(false);
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  };

  return (
    <>
      {showFloatingButton && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 left-4 z-30 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-md transition-all hover:bg-slate-50 hover:text-blue-700 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text dark:hover:bg-dark-bg-tertiary sm:px-4 ${className}`}
          aria-label={t('help.openHelp')}
          data-testid="help-button"
        >
          <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">{t('help.openHelp')}</span>
        </button>
      )}

      {/* First-time Tour Prompt */}
      {showTourPrompt && (
        <div
          className="fixed right-4 top-24 z-40 rounded-lg border border-blue-200 bg-white p-4 shadow-xl dark:border-blue-700 dark:bg-dark-bg-secondary sm:w-80"
          data-testid="tour-prompt"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Compass className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-dark-text mb-1">
                {t('help.tour.welcome.title')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">
                {t('help.tour.welcome.description')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleStartTour}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="tour-prompt-start"
                >
                  {t('help.startTour')}
                </button>
                <button
                  onClick={handleDismissTourPrompt}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-dark-text-secondary bg-gray-100 dark:bg-dark-bg-tertiary rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                  data-testid="tour-prompt-dismiss"
                >
                  {t('help.skipTour')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Panel Slide-out */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsOpen(false)}
            data-testid="help-panel-backdrop"
          />

          {/* Panel */}
          <div
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-dark-bg-secondary"
            data-testid="help-panel"
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 p-5 dark:border-dark-border dark:bg-dark-bg">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                  {t('help.title')}
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
                aria-label={t('help.close')}
                data-testid="help-panel-close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {/* Tour Button */}
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-slate-900 dark:border-blue-900 dark:bg-blue-900/20 dark:text-dark-text">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-white p-3 text-blue-700 dark:bg-dark-bg-secondary dark:text-blue-300">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {t('help.tour.welcome.title')}
                    </h3>
                    <p className="mb-3 text-sm text-slate-600 dark:text-dark-text-secondary">
                      {t('help.tour.welcome.description')}
                    </p>
                    <button
                      onClick={handleStartTour}
                      className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                      data-testid="help-panel-start-tour"
                    >
                      {t('help.startTour')}
                    </button>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <FAQ />
            </div>
          </div>
        </>
      )}

      {/* Guided Tour - Lazy loaded */}
      {isTourOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <GuidedTour
            isOpen={isTourOpen}
            onClose={() => setIsTourOpen(false)}
            onComplete={() => setIsTourOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
});

HelpPanel.displayName = 'HelpPanel';

export default HelpPanel;
