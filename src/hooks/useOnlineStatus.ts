import { useState, useEffect, useCallback } from 'react';

interface OnlineStatusState {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether the status just changed (for animation purposes) */
  justChanged: boolean;
}

/**
 * Hook to track online/offline network status
 * Provides reactive online status with transition state
 */
export function useOnlineStatus(): OnlineStatusState {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [justChanged, setJustChanged] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setJustChanged(true);
    // Reset transition state after animation
    setTimeout(() => setJustChanged(false), 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setJustChanged(true);
    // Reset transition state after animation
    setTimeout(() => setJustChanged(false), 3000);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, justChanged };
}
