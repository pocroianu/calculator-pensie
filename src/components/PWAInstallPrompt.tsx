import React from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * PWA Install Prompt Banner
 *
 * Shows a non-intrusive banner at the bottom of the screen
 * when the app can be installed. Follows the existing design
 * patterns (Tailwind, dark mode, accessibility).
 */
interface PWAInstallPromptProps {
  enabled?: boolean;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ enabled = true }) => {
  const { t } = useTranslation();
  const { isInstallable, promptInstall, dismissInstall } = usePWAInstall();
  const [isReadyToShow, setIsReadyToShow] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setIsReadyToShow(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setIsReadyToShow(true), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [enabled]);

  if (!enabled || !isReadyToShow || !isInstallable) return null;

  return (
    <div
      className="fixed left-4 right-4 top-24 z-40 animate-slide-down sm:left-auto sm:right-4 sm:max-w-md"
      role="complementary"
      aria-label={t('pwa.install.title')}
      data-testid="pwa-install-prompt"
    >
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-dark-border dark:bg-dark-bg-secondary">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">
              {t('pwa.install.title')}
            </h3>
            <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-0.5">
              {t('pwa.install.description')}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={promptInstall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary"
                data-testid="pwa-install-button"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                {t('pwa.install.installButton')}
              </button>
              <button
                onClick={dismissInstall}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors"
                data-testid="pwa-install-dismiss"
              >
                {t('pwa.install.notNow')}
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={dismissInstall}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-secondary rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
