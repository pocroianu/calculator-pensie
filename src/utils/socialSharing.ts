/**
 * Social Sharing Utility Functions
 *
 * Generates shareable links to anonymized calculation results.
 * No personal data (birth date, company names, specific dates) is included in shared links.
 * Only aggregated pension calculation results are shared.
 */

import { PensionDetails } from '../types/pensionTypes';

/**
 * Version for shareable link format
 * Increment when making breaking changes to the format
 */
export const SHARE_VERSION = '1';

/**
 * Data structure for shareable pension results
 * Contains ONLY anonymized, aggregated data - no personal information
 */
export interface ShareableData {
  version: string;
  // Pension amounts
  monthlyPension: number;
  yearlyPension: number;
  // Points breakdown
  contributionPoints: number;
  stabilityPoints: number;
  nonContributivePoints: number;
  totalPoints: number;
  // Summary statistics (anonymized)
  totalContributiveYears: number;
  yearsUntilRetirement?: number;
  // VPR info
  vprValue: number;
  vprYear: number;
  // Timestamp for when the calculation was made
  timestamp: number;
}

/**
 * Result of decoding a shared link
 */
export interface DecodeResult {
  success: boolean;
  data?: ShareableData;
  errorKey?: string;
}

/**
 * Creates a shareable data object from pension calculation results
 * Only includes anonymized aggregated data - no personal information
 */
export function createShareableData(
  monthlyPension: number,
  yearlyPension: number,
  pensionDetails: PensionDetails,
  vprInfo: { value: number; year: number }
): ShareableData {
  return {
    version: SHARE_VERSION,
    monthlyPension: Math.round(monthlyPension * 100) / 100,
    yearlyPension: Math.round(yearlyPension * 100) / 100,
    contributionPoints: Math.round(pensionDetails.contributionPoints * 100) / 100,
    stabilityPoints: Math.round(pensionDetails.stabilityPoints * 100) / 100,
    nonContributivePoints: Math.round(pensionDetails.nonContributivePoints * 100) / 100,
    totalPoints: Math.round(pensionDetails.totalPoints * 100) / 100,
    totalContributiveYears: pensionDetails.totalContributiveYears || 0,
    yearsUntilRetirement: pensionDetails.yearsUntilRetirement,
    vprValue: vprInfo.value,
    vprYear: vprInfo.year,
    timestamp: Date.now()
  };
}

/**
 * Encodes shareable data to a URL-safe string
 * Uses base64 encoding for compact representation
 */
export function encodeShareableData(data: ShareableData): string {
  try {
    const jsonString = JSON.stringify(data);
    // Use base64 encoding for URL-safe transmission
    const encoded = btoa(unescape(encodeURIComponent(jsonString)));
    return encoded;
  } catch (error) {
    console.error('Error encoding shareable data:', error);
    throw new Error('Failed to encode data');
  }
}

/**
 * Decodes a URL parameter back to shareable data
 */
export function decodeShareableData(encoded: string): DecodeResult {
  try {
    // Decode from base64
    const jsonString = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(jsonString);

    // Validate the decoded data
    if (!isValidShareableData(data)) {
      return {
        success: false,
        errorKey: 'sharing.error.invalidFormat'
      };
    }

    // Check version compatibility
    const [majorVersion] = data.version.split('.').map(Number);
    const [currentMajorVersion] = SHARE_VERSION.split('.').map(Number);

    if (majorVersion > currentMajorVersion) {
      return {
        success: false,
        errorKey: 'sharing.error.newerVersion'
      };
    }

    return {
      success: true,
      data: data as ShareableData
    };
  } catch (error) {
    console.error('Error decoding shareable data:', error);
    return {
      success: false,
      errorKey: 'sharing.error.decodeError'
    };
  }
}

/**
 * Validates that the decoded data has all required fields
 */
function isValidShareableData(data: unknown): data is ShareableData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (typeof obj.version !== 'string') return false;
  if (typeof obj.monthlyPension !== 'number') return false;
  if (typeof obj.yearlyPension !== 'number') return false;
  if (typeof obj.contributionPoints !== 'number') return false;
  if (typeof obj.stabilityPoints !== 'number') return false;
  if (typeof obj.nonContributivePoints !== 'number') return false;
  if (typeof obj.totalPoints !== 'number') return false;
  if (typeof obj.totalContributiveYears !== 'number') return false;
  if (typeof obj.vprValue !== 'number') return false;
  if (typeof obj.vprYear !== 'number') return false;
  if (typeof obj.timestamp !== 'number') return false;

  // Optional field validation
  if (obj.yearsUntilRetirement !== undefined && typeof obj.yearsUntilRetirement !== 'number') {
    return false;
  }

  // Sanity checks for values
  if (obj.monthlyPension < 0 || obj.yearlyPension < 0) return false;
  if (obj.totalPoints < 0 || obj.contributionPoints < 0) return false;
  if (obj.totalContributiveYears < 0 || obj.totalContributiveYears > 80) return false;

  return true;
}

/**
 * Generates a full shareable URL with encoded data
 */
export function generateShareableUrl(data: ShareableData, baseUrl?: string): string {
  const encoded = encodeShareableData(data);
  const base = baseUrl || window.location.origin + window.location.pathname;
  return `${base}?share=${encoded}`;
}

/**
 * Extracts shared data from URL parameters
 */
export function getSharedDataFromUrl(): DecodeResult | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');

    if (!shareParam) {
      return null;
    }

    return decodeShareableData(shareParam);
  } catch (error) {
    console.error('Error extracting shared data from URL:', error);
    return {
      success: false,
      errorKey: 'sharing.error.urlError'
    };
  }
}

/**
 * Copies text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      return true;
    } finally {
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Attempts to use the Web Share API if available
 * Falls back to clipboard copy if not supported
 */
export async function shareViaWebShareApi(
  url: string,
  title: string,
  text: string
): Promise<{ method: 'share' | 'clipboard'; success: boolean }> {
  // Check if Web Share API is available and supports URLs
  if (navigator.share && navigator.canShare?.({ url })) {
    try {
      await navigator.share({
        title,
        text,
        url
      });
      return { method: 'share', success: true };
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name === 'AbortError') {
        return { method: 'share', success: false };
      }
      // Fall through to clipboard
    }
  }

  // Fallback to clipboard
  const success = await copyToClipboard(url);
  return { method: 'clipboard', success };
}

/**
 * Clears the share parameter from the URL without reloading the page
 */
export function clearShareParamFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.toString());
}

/**
 * Formats a timestamp for display (e.g., "Shared 2 hours ago")
 */
export function formatShareTimestamp(timestamp: number, t: (key: string) => string): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return t('sharing.timestamp.justNow');
  } else if (minutes < 60) {
    return t('sharing.timestamp.minutesAgo').replace('{{minutes}}', String(minutes));
  } else if (hours < 24) {
    return t('sharing.timestamp.hoursAgo').replace('{{hours}}', String(hours));
  } else if (days < 7) {
    return t('sharing.timestamp.daysAgo').replace('{{days}}', String(days));
  } else {
    // Format as date
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }
}
