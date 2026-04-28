import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  /** Whether the install prompt is available */
  isInstallable: boolean;
  /** Whether the app is already installed (standalone mode) */
  isInstalled: boolean;
  /** Trigger the install prompt */
  promptInstall: () => Promise<boolean>;
  /** Dismiss the install banner */
  dismissInstall: () => void;
  /** Whether the user has dismissed the install banner */
  isDismissed: boolean;
}

const DISMISS_KEY = 'pension_calc_pwa_dismiss';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hook to manage PWA installation prompt
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if already installed
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsInstalled(isStandalone);

    // Check if previously dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_KEY);
      }
    }
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handler = (event: Event) => {
      // Prevent the default mini-infobar
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[PWA] App installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  return {
    isInstallable: !!deferredPrompt && !isInstalled && !isDismissed,
    isInstalled,
    promptInstall,
    dismissInstall,
    isDismissed,
  };
}
