import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Offline Indicator Component
 *
 * Shows a banner when the user goes offline, and a brief
 * "back online" notification when connectivity is restored.
 * Follows existing accessibility and design patterns.
 */
const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline, justChanged } = useOnlineStatus();

  // Show nothing if online and not recently changed
  if (isOnline && !justChanged) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-indicator"
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
        isOnline ? 'animate-slide-down-out' : ''
      }`}
    >
      <div
        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium ${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-amber-500 dark:bg-amber-600 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" aria-hidden="true" />
            <span>{t('pwa.offline.backOnline')}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            <span>{t('pwa.offline.youAreOffline')}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
