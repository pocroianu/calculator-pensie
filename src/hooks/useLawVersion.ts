import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  LawVersionId,
  LawVersion,
  LawVersionComparison,
  LawCalculationParameters,
} from '../types/lawVersionTypes';
import {
  LAW_VERSIONS,
  getLawVersionById,
  getActiveLawVersion,
  saveSelectedLawVersion,
  getLawVersionConfig,
  compareLawVersions,
  getLawVersionForDate,
  LAW_VERSION_STORAGE_KEY,
} from '../config/lawVersionsConfig';

/**
 * Hook for managing law version selection and providing calculation parameters.
 *
 * Allows users to select different law versions and get the corresponding
 * calculation parameters. Persists the selection in localStorage.
 */
export function useLawVersion() {
  const [selectedVersionId, setSelectedVersionId] = useState<LawVersionId>(() => {
    const config = getLawVersionConfig();
    return config.selectedVersionId;
  });

  // Listen for storage changes (cross-tab support)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LAW_VERSION_STORAGE_KEY && event.newValue) {
        const newId = event.newValue as LawVersionId;
        if (LAW_VERSIONS.some(v => v.id === newId)) {
          setSelectedVersionId(newId);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /** All available law versions */
  const versions = LAW_VERSIONS;

  /** The currently active (latest) law version */
  const activeVersion = useMemo(() => getActiveLawVersion(), []);

  /** The version selected by the user */
  const selectedVersion = useMemo<LawVersion>(
    () => getLawVersionById(selectedVersionId) || activeVersion,
    [selectedVersionId, activeVersion]
  );

  /** Whether user has selected a non-active (historical) law version */
  const isHistoricalVersion = useMemo(
    () => selectedVersionId !== activeVersion.id,
    [selectedVersionId, activeVersion.id]
  );

  /** Get the calculation parameters for the selected version */
  const parameters = useMemo<LawCalculationParameters>(
    () => selectedVersion.parameters,
    [selectedVersion]
  );

  /** Select a law version */
  const selectVersion = useCallback((versionId: LawVersionId) => {
    setSelectedVersionId(versionId);
    saveSelectedLawVersion(versionId);
  }, []);

  /** Reset to the currently active law version */
  const resetToActive = useCallback(() => {
    selectVersion(activeVersion.id);
  }, [selectVersion, activeVersion.id]);

  /** Compare the selected version with another version */
  const compareWithVersion = useCallback(
    (otherVersionId: LawVersionId): LawVersionComparison | null => {
      return compareLawVersions(selectedVersionId, otherVersionId);
    },
    [selectedVersionId]
  );

  /** Get the law version that was active at a specific date */
  const getVersionForDate = useCallback((date: string): LawVersion => {
    return getLawVersionForDate(date);
  }, []);

  return {
    // State
    versions,
    selectedVersion,
    selectedVersionId,
    activeVersion,
    isHistoricalVersion,
    parameters,

    // Actions
    selectVersion,
    resetToActive,
    compareWithVersion,
    getVersionForDate,
  };
}
