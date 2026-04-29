/**
 * Analytics Configuration System
 *
 * This module provides a centralized configuration system for privacy-respecting
 * analytics (Plausible Analytics). It handles configuration, user consent preferences,
 * and event tracking without collecting personal data.
 *
 * Key Features:
 * - Privacy-first approach (no cookies by default)
 * - GDPR compliant
 * - Configurable via environment variables
 * - User opt-out support
 */

export interface AnalyticsConfig {
  enabled: boolean;
  domain: string;
  scriptSrc: string;
  apiHost: string;
  trackLocalhost: boolean;
  hashMode: boolean;
}

export interface AnalyticsPreferences {
  analyticsEnabled: boolean;
  lastUpdated: string;
}

// Storage key for analytics preferences
export const ANALYTICS_PREFERENCES_KEY = 'analytics_preferences';

// Default analytics configuration
// In production, these should be set via environment variables
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
  domain: import.meta.env.VITE_ANALYTICS_DOMAIN || 'calculator-pensie.example.com',
  scriptSrc: import.meta.env.VITE_ANALYTICS_SCRIPT_SRC || 'https://plausible.io/js/script.js',
  apiHost: import.meta.env.VITE_ANALYTICS_API_HOST || 'https://plausible.io',
  trackLocalhost: import.meta.env.VITE_ANALYTICS_TRACK_LOCALHOST === 'true',
  hashMode: import.meta.env.VITE_ANALYTICS_HASH_MODE === 'true',
};

/**
 * Get analytics configuration
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  return DEFAULT_ANALYTICS_CONFIG;
}

/**
 * Get user's analytics preferences from localStorage
 */
export function getAnalyticsPreferences(): AnalyticsPreferences {
  try {
    const stored = localStorage.getItem(ANALYTICS_PREFERENCES_KEY);
    if (stored) {
      const prefs = JSON.parse(stored) as AnalyticsPreferences;
      if (typeof prefs.analyticsEnabled === 'boolean') {
        return prefs;
      }
    }
  } catch (error) {
    console.error('Error reading analytics preferences:', error);
  }

  // Default: analytics enabled if configured
  return {
    analyticsEnabled: DEFAULT_ANALYTICS_CONFIG.enabled,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save user's analytics preferences to localStorage
 */
export function saveAnalyticsPreferences(prefs: Partial<AnalyticsPreferences>): AnalyticsPreferences {
  try {
    const currentPrefs = getAnalyticsPreferences();
    const newPrefs: AnalyticsPreferences = {
      ...currentPrefs,
      ...prefs,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(ANALYTICS_PREFERENCES_KEY, JSON.stringify(newPrefs));
    return newPrefs;
  } catch (error) {
    console.error('Error saving analytics preferences:', error);
    throw new Error('Failed to save analytics preferences');
  }
}

/**
 * Check if analytics is currently enabled
 * Considers both configuration and user preferences
 */
export function isAnalyticsEnabled(): boolean {
  const config = getAnalyticsConfig();
  const prefs = getAnalyticsPreferences();

  // Analytics must be enabled in config AND user must not have opted out
  return config.enabled && prefs.analyticsEnabled;
}

/**
 * Enable analytics (user opt-in)
 */
export function enableAnalytics(): AnalyticsPreferences {
  return saveAnalyticsPreferences({ analyticsEnabled: true });
}

/**
 * Disable analytics (user opt-out)
 */
export function disableAnalytics(): AnalyticsPreferences {
  return saveAnalyticsPreferences({ analyticsEnabled: false });
}

/**
 * Reset analytics preferences to defaults
 */
export function resetAnalyticsPreferences(): AnalyticsPreferences {
  const defaultPrefs: AnalyticsPreferences = {
    analyticsEnabled: DEFAULT_ANALYTICS_CONFIG.enabled,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(ANALYTICS_PREFERENCES_KEY, JSON.stringify(defaultPrefs));
  return defaultPrefs;
}

// Event categories for tracking
export const AnalyticsEventCategory = {
  CALCULATION: 'calculation',
  FEATURE: 'feature',
  NAVIGATION: 'navigation',
  ERROR: 'error',
  EXPORT_IMPORT: 'export_import',
  SETTINGS: 'settings',
} as const;

export type AnalyticsEventCategoryType = typeof AnalyticsEventCategory[keyof typeof AnalyticsEventCategory];

// Predefined analytics events (no personal data)
export const AnalyticsEvents = {
  // Calculation events
  CALCULATION_PERFORMED: 'calculation_performed',
  PERIOD_ADDED: 'period_added',
  PERIOD_REMOVED: 'period_removed',

  // Feature usage events
  KEYBOARD_SHORTCUT_USED: 'keyboard_shortcut_used',
  THEME_CHANGED: 'theme_changed',
  LANGUAGE_CHANGED: 'language_changed',
  HELP_OPENED: 'help_opened',
  VPR_ADMIN_OPENED: 'vpr_admin_opened',
  TEMPLATE_APPLIED: 'template_applied',

  // Export/Import events
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',

  // Error events
  CALCULATION_ERROR: 'calculation_error',
  IMPORT_ERROR: 'import_error',

  // Navigation events
  PAGE_VIEW: 'pageview',
} as const;

export type AnalyticsEventType = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
