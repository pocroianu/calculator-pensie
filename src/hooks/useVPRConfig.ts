import { useState, useEffect, useCallback } from 'react';
import {
  VPRConfig,
  VPRValue,
  getVPRConfig,
  updateCurrentVPR,
  resetVPRConfig,
  addHistoricalVPR,
  removeHistoricalVPR,
  getCurrentVPR,
  getVPRForYear,
  exportVPRConfig,
  importVPRConfig,
  VPR_CONFIG_STORAGE_KEY
} from '../config/vprConfig';

export interface UseVPRConfigReturn {
  config: VPRConfig;
  currentVPR: number;
  isLoading: boolean;
  error: string | null;
  // Actions
  updateVPR: (year: number, value: number, effectiveDate: string, description?: string) => void;
  addHistorical: (vprValue: VPRValue) => void;
  removeHistorical: (year: number) => void;
  reset: () => void;
  refresh: () => void;
  exportConfig: () => string;
  importConfig: (jsonString: string) => boolean;
  getVPRForYear: (year: number) => number;
  clearError: () => void;
}

/**
 * React hook for managing VPR configuration
 * Provides reactive updates when configuration changes
 */
export function useVPRConfig(): UseVPRConfigReturn {
  const [config, setConfig] = useState<VPRConfig>(getVPRConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for storage changes (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === VPR_CONFIG_STORAGE_KEY) {
        setConfig(getVPRConfig());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refresh = useCallback(() => {
    setConfig(getVPRConfig());
    setError(null);
  }, []);

  const updateVPR = useCallback((
    year: number,
    value: number,
    effectiveDate: string,
    description?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate inputs
      if (value <= 0) {
        throw new Error('VPR value must be greater than 0');
      }
      if (year < 2000 || year > 2100) {
        throw new Error('Year must be between 2000 and 2100');
      }
      if (!effectiveDate) {
        throw new Error('Effective date is required');
      }

      const newConfig = updateCurrentVPR(year, value, effectiveDate, description, 'admin');
      setConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update VPR');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addHistorical = useCallback((vprValue: VPRValue) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate inputs
      if (vprValue.value <= 0) {
        throw new Error('VPR value must be greater than 0');
      }
      if (vprValue.year < 2000 || vprValue.year > 2100) {
        throw new Error('Year must be between 2000 and 2100');
      }

      const newConfig = addHistoricalVPR(vprValue);
      setConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add historical VPR');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeHistorical = useCallback((year: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const newConfig = removeHistoricalVPR(year);
      setConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove historical VPR');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const newConfig = resetVPRConfig();
      setConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset VPR configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExportConfig = useCallback((): string => {
    try {
      return exportVPRConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export configuration');
      return '';
    }
  }, []);

  const handleImportConfig = useCallback((jsonString: string): boolean => {
    setIsLoading(true);
    setError(null);
    try {
      const newConfig = importVPRConfig(jsonString);
      setConfig(newConfig);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import configuration');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGetVPRForYear = useCallback((year: number): number => {
    return getVPRForYear(year);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    config,
    currentVPR: config.currentValue,
    isLoading,
    error,
    updateVPR,
    addHistorical,
    removeHistorical,
    reset,
    refresh,
    exportConfig: handleExportConfig,
    importConfig: handleImportConfig,
    getVPRForYear: handleGetVPRForYear,
    clearError
  };
}

/**
 * Simple hook to get just the current VPR value
 * Useful for components that only need to read the value
 */
export function useCurrentVPR(): number {
  const [vpr, setVPR] = useState(getCurrentVPR);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === VPR_CONFIG_STORAGE_KEY) {
        setVPR(getCurrentVPR());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return vpr;
}

export default useVPRConfig;
