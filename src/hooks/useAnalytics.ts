import { useCallback } from 'react';
import { useAnalyticsContext } from '../contexts/AnalyticsContext';
import { AnalyticsEvents, type AnalyticsEventType } from '../config/analyticsConfig';

/**
 * Custom hook for analytics tracking throughout the application.
 * Provides convenient methods for tracking various user interactions
 * without exposing the full analytics context.
 */
export function useAnalytics() {
  const { trackEvent, trackError, isEnabled, isLoaded } = useAnalyticsContext();

  // Track calculation events
  const trackCalculation = useCallback(() => {
    trackEvent(AnalyticsEvents.CALCULATION_PERFORMED);
  }, [trackEvent]);

  // Track period management
  const trackPeriodAdded = useCallback(() => {
    trackEvent(AnalyticsEvents.PERIOD_ADDED);
  }, [trackEvent]);

  const trackPeriodRemoved = useCallback(() => {
    trackEvent(AnalyticsEvents.PERIOD_REMOVED);
  }, [trackEvent]);

  // Track feature usage
  const trackKeyboardShortcut = useCallback((shortcut: string) => {
    trackEvent(AnalyticsEvents.KEYBOARD_SHORTCUT_USED, { shortcut });
  }, [trackEvent]);

  const trackThemeChange = useCallback((theme: string) => {
    trackEvent(AnalyticsEvents.THEME_CHANGED, { theme });
  }, [trackEvent]);

  const trackLanguageChange = useCallback((language: string) => {
    trackEvent(AnalyticsEvents.LANGUAGE_CHANGED, { language });
  }, [trackEvent]);

  const trackHelpOpened = useCallback(() => {
    trackEvent(AnalyticsEvents.HELP_OPENED);
  }, [trackEvent]);

  const trackVPRAdminOpened = useCallback(() => {
    trackEvent(AnalyticsEvents.VPR_ADMIN_OPENED);
  }, [trackEvent]);

  const trackTemplateApplied = useCallback((templateName: string) => {
    trackEvent(AnalyticsEvents.TEMPLATE_APPLIED, { template: templateName });
  }, [trackEvent]);

  // Track export/import
  const trackDataExported = useCallback((format?: string) => {
    trackEvent(AnalyticsEvents.DATA_EXPORTED, format ? { format } : undefined);
  }, [trackEvent]);

  const trackDataImported = useCallback((success: boolean) => {
    trackEvent(AnalyticsEvents.DATA_IMPORTED, { success });
  }, [trackEvent]);

  // Track errors
  const trackCalculationError = useCallback((errorType: string) => {
    trackError(errorType);
  }, [trackError]);

  const trackImportError = useCallback((errorType: string) => {
    trackEvent(AnalyticsEvents.IMPORT_ERROR, { error_type: errorType });
  }, [trackEvent]);

  // Generic event tracking
  const track = useCallback((
    eventName: AnalyticsEventType | string,
    props?: Record<string, string | number | boolean>
  ) => {
    trackEvent(eventName, props);
  }, [trackEvent]);

  return {
    // State
    isEnabled,
    isLoaded,

    // Calculation tracking
    trackCalculation,
    trackPeriodAdded,
    trackPeriodRemoved,

    // Feature tracking
    trackKeyboardShortcut,
    trackThemeChange,
    trackLanguageChange,
    trackHelpOpened,
    trackVPRAdminOpened,
    trackTemplateApplied,

    // Export/Import tracking
    trackDataExported,
    trackDataImported,

    // Error tracking
    trackCalculationError,
    trackImportError,

    // Generic tracking
    track,
  };
}

export default useAnalytics;
