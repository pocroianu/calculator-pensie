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
}

export interface HelpPanelRef {
  openHelpPanel: () => void;
}

const HelpPanel = forwardRef<HelpPanelRef, HelpPanelProps>(({ className = '' }, ref) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(false);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openHelpPanel: () => setIsOpen(true)
  }));

  useEffect(() => {
    // Show tour prompt for first-time users
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!tourCompleted) {
      setShowTourPrompt(true);
    }
  }, []);

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
      {/* Help Button - Fixed Position */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl ${className}`}
        aria-label={t('help.openHelp')}
        data-testid="help-button"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-medium">{t('help.openHelp')}</span>
      </button>

      {/* First-time Tour Prompt */}
      {showTourPrompt && (
        <div
          className="fixed bottom-32 right-4 z-50 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl p-4 w-72 border border-blue-200 dark:border-blue-700"
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
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-dark-bg-secondary shadow-2xl z-50 overflow-y-auto"
            data-testid="help-panel"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
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
            <div className="p-4 space-y-6">
              {/* Tour Button */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {t('help.tour.welcome.title')}
                    </h3>
                    <p className="text-sm text-blue-100 mb-3">
                      {t('help.tour.welcome.description')}
                    </p>
                    <button
                      onClick={handleStartTour}
                      className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
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
