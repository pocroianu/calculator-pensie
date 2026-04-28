import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  getAnalyticsConfig,
  getAnalyticsPreferences,
  saveAnalyticsPreferences,
  isAnalyticsEnabled,
  AnalyticsConfig,
  AnalyticsPreferences,
  AnalyticsEvents,
  type AnalyticsEventType,
} from '../config/analyticsConfig';

// Extend window interface for Plausible
declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        callback?: () => void;
      }
    ) => void;
  }
}

interface AnalyticsContextType {
  // State
  isEnabled: boolean;
  isLoaded: boolean;
  config: AnalyticsConfig;
  preferences: AnalyticsPreferences;

  // Actions
  trackEvent: (eventName: AnalyticsEventType | string, props?: Record<string, string | number | boolean>) => void;
  trackPageView: (path?: string) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;

  // Error tracking
  trackError: (errorType: string, errorMessage?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

/**
 * Inject Plausible analytics script into the document
 */
function injectAnalyticsScript(config: AnalyticsConfig): Promise<boolean> {
  return new Promise((resolve) => {
    // Don't inject if already present
    if (document.querySelector('script[data-analytics="plausible"]')) {
      resolve(true);
      return;
    }

    // Don't inject on localhost unless explicitly configured
    if (!config.trackLocalhost && window.location.hostname === 'localhost') {
      console.info('[Analytics] Skipping analytics on localhost');
      resolve(false);
      return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', config.domain);
    script.setAttribute('data-analytics', 'plausible');
    script.src = config.scriptSrc;

    // Add optional attributes
    if (config.apiHost !== 'https://plausible.io') {
      script.setAttribute('data-api', `${config.apiHost}/api/event`);
    }

    if (config.hashMode) {
      script.setAttribute('data-hash', 'true');
    }

    script.onload = () => {
      console.info('[Analytics] Plausible script loaded successfully');
      resolve(true);
    };

    script.onerror = () => {
      console.warn('[Analytics] Failed to load Plausible script');
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

/**
 * Remove analytics script from the document
 */
function removeAnalyticsScript(): void {
  const script = document.querySelector('script[data-analytics="plausible"]');
  if (script) {
    script.remove();
    // Clear the plausible function
    delete window.plausible;
    console.info('[Analytics] Analytics script removed');
  }
}

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config] = useState<AnalyticsConfig>(() => getAnalyticsConfig());
  const [preferences, setPreferences] = useState<AnalyticsPreferences>(() => getAnalyticsPreferences());
  const [isEnabled, setIsEnabled] = useState<boolean>(() => isAnalyticsEnabled());
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Initialize analytics script on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (isEnabled && config.enabled) {
      injectAnalyticsScript(config).then((loaded) => {
        if (isMountedRef.current) {
          setIsLoaded(loaded);
        }
      });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [config, isEnabled]);

  // Handle enabling/disabling analytics
  const setAnalyticsEnabled = useCallback((enabled: boolean) => {
    const newPrefs = saveAnalyticsPreferences({ analyticsEnabled: enabled });
    setPreferences(newPrefs);
    setIsEnabled(enabled && config.enabled);

    if (enabled && config.enabled) {
      injectAnalyticsScript(config).then((loaded) => {
        if (isMountedRef.current) {
          setIsLoaded(loaded);
        }
      });
    } else {
      removeAnalyticsScript();
      setIsLoaded(false);
    }
  }, [config]);

  // Track custom events
  const trackEvent = useCallback((
    eventName: AnalyticsEventType | string,
    props?: Record<string, string | number | boolean>
  ) => {
    if (!isEnabled || !isLoaded) {
      console.debug('[Analytics] Event not tracked (disabled or not loaded):', eventName);
      return;
    }

    if (typeof window.plausible === 'function') {
      window.plausible(eventName, props ? { props } : undefined);
      console.debug('[Analytics] Event tracked:', eventName, props);
    } else {
      console.debug('[Analytics] Plausible not available, event not tracked:', eventName);
    }
  }, [isEnabled, isLoaded]);

  // Track page views
  const trackPageView = useCallback((path?: string) => {
    if (!isEnabled || !isLoaded) {
      return;
    }

    // Plausible automatically tracks page views, but we can manually trigger for SPAs
    if (typeof window.plausible === 'function') {
      window.plausible(AnalyticsEvents.PAGE_VIEW, path ? { props: { path } } : undefined);
      console.debug('[Analytics] Page view tracked:', path || window.location.pathname);
    }
  }, [isEnabled, isLoaded]);

  // Track errors (without sensitive information)
  const trackError = useCallback((errorType: string, errorMessage?: string) => {
    if (!isEnabled || !isLoaded) {
      return;
    }

    // Sanitize error message to remove potentially sensitive information
    const sanitizedMessage = errorMessage
      ? errorMessage.substring(0, 100).replace(/[0-9]{4,}/g, '[REDACTED]')
      : undefined;

    trackEvent(AnalyticsEvents.CALCULATION_ERROR, {
      error_type: errorType,
      ...(sanitizedMessage && { error_message: sanitizedMessage }),
    });
  }, [isEnabled, isLoaded, trackEvent]);

  const value: AnalyticsContextType = {
    isEnabled,
    isLoaded,
    config,
    preferences,
    trackEvent,
    trackPageView,
    setAnalyticsEnabled,
    trackError,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

export default AnalyticsContext;
