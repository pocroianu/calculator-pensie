import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PensionInputs } from '../types/pensionTypes';
import {
  calculateMonthlyPension,
  calculateMonthlyPensionWithLawVersion,
  getReferenceValue,
  getVPRInfo,
  clearPensionCache
} from '../utils/pensionCalculations';
import { CURRENT_AVERAGE_SALARY, getAverageSalaryForYear } from '../data/historicalSalaries';
import { isRetired } from '../utils/dateCalculations';
import { validatePensionForm, clearValidationCache } from '../utils/validation';
import { useLocalStorage } from './useLocalStorage';
import { VPR_CONFIG_STORAGE_KEY } from '../config/vprConfig';
import { clearGapAnalysisCache } from '../utils/gapAnalysis';
import { useLawVersion } from './useLawVersion';

/**
 * Local storage key for pension calculator inputs
 */
const STORAGE_KEY = 'inputs';

/**
 * Debounce delay for saving to local storage (in milliseconds)
 */
const SAVE_DEBOUNCE_DELAY = 500;

export interface PensionDetails {
  contributionPoints: number;
  stabilityPoints: number;
  totalPoints: number;
}

/**
 * Default initial values for the pension calculator
 */
const DEFAULT_INPUTS: PensionInputs = {
  birthDate: '1996-08-26',
  retirementYear: 2061,
  contributionPeriods: [
    {
      fromDate: '2015-09-01',
      toDate: '2019-06-30',
      nonContributiveType: 'university',
    },
    {
      fromDate: '2018-01-01',
      toDate: '2020-12-31',
      company: 'ISoftbet',
      monthlyGrossSalary: 6000,
      workingCondition: 'normal'
    },
    {
      fromDate: '2021-01-01',
      toDate: '2060-12-31',
      company: 'Elektrobit',
      monthlyGrossSalary: 10000,
      workingCondition: 'normal'
    }
  ]
};

export const usePensionCalculator = () => {
  const currentYear = new Date().getFullYear();

  // Use localStorage for persistent storage with debounced saving
  const [inputs, setInputs, isStorageLoaded] = useLocalStorage<PensionInputs>(
    STORAGE_KEY,
    DEFAULT_INPUTS,
    SAVE_DEBOUNCE_DELAY
  );

  const [monthlyPension, setMonthlyPension] = useState<number>(0);
  const [yearlyPension, setYearlyPension] = useState<number>(0);
  const [pensionDetails, setPensionDetails] = useState<PensionDetails>({
    contributionPoints: 0,
    stabilityPoints: 0,
    totalPoints: 0
  });

  // Track VPR changes to trigger recalculation
  const [vprVersion, setVprVersion] = useState(0);

  // Law version management
  const lawVersion = useLawVersion();

  // Listen for VPR config changes (cross-tab and local)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === VPR_CONFIG_STORAGE_KEY) {
        setVprVersion(v => v + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Run validation to check for overlaps
  const validationResult = useMemo(() => {
    return validatePensionForm(inputs);
  }, [inputs]);

  // Get current VPR info
  const vprInfo = useMemo(() => getVPRInfo(), [vprVersion]);

  useEffect(() => {
    // Block calculation if there are overlapping periods
    if (validationResult.hasOverlaps) {
      setMonthlyPension(0);
      setYearlyPension(0);
      setPensionDetails({
        contributionPoints: 0,
        stabilityPoints: 0,
        totalPoints: 0,
        error: 'overlappingPeriods'
      } as any);
      return;
    }

    // Use law-version-aware calculation when a historical law version is selected,
    // otherwise use the standard calculation (which uses VPR from config)
    let result;
    if (lawVersion.isHistoricalVersion) {
      result = calculateMonthlyPensionWithLawVersion(
        inputs.contributionPeriods,
        inputs.birthDate,
        lawVersion.parameters,
      );
    } else {
      result = calculateMonthlyPension(
        inputs.contributionPeriods,
        inputs.birthDate,
      );
    }

    setMonthlyPension(result.monthlyPension);
    setYearlyPension(result.monthlyPension * 12);
    setPensionDetails(result.details);
  }, [inputs, validationResult.hasOverlaps, vprVersion, lawVersion.selectedVersionId, lawVersion.isHistoricalVersion, lawVersion.parameters]);

  const handleInputChange = useCallback((field: keyof PensionInputs, value: any) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setInputs]);

  /**
   * Reset inputs to default values and clear stored data
   */
  const resetToDefaults = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
  }, [setInputs]);

  // Function to trigger VPR recalculation (used when VPR is updated in the same tab)
  const refreshVPR = useCallback(() => {
    // Clear all calculation caches when VPR changes since results are affected
    clearPensionCache();
    clearValidationCache();
    clearGapAnalysisCache();
    setVprVersion(v => v + 1);
  }, []);

  /**
   * Clear all calculation caches - useful for forcing recalculation
   */
  const clearAllCaches = useCallback(() => {
    clearPensionCache();
    clearValidationCache();
    clearGapAnalysisCache();
  }, []);

  return {
    inputs,
    handleInputChange,
    monthlyPension,
    yearlyPension,
    pensionDetails,
    averageGrossSalary: CURRENT_AVERAGE_SALARY,
    getAverageSalaryForYear,
    hasOverlaps: validationResult.hasOverlaps,
    isStorageLoaded,
    resetToDefaults,
    vprInfo,
    refreshVPR,
    clearAllCaches,
    // Law version
    lawVersion,
  };
};
