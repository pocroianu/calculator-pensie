/**
 * useGapAnalysis Hook
 *
 * Custom hook to analyze contribution gaps and provide strategies for filling them.
 * Uses memoization for performance optimization.
 */

import { useMemo } from 'react';
import { PensionInputs, GapAnalysisResult } from '../types/pensionTypes';
import { analyzeContributionGaps } from '../utils/gapAnalysis';

interface UseGapAnalysisResult {
  gapAnalysis: GapAnalysisResult;
  hasGaps: boolean;
  gapCount: number;
  hasStrategies: boolean;
}

/**
 * Analyzes contribution periods for gaps and suggests strategies to fill them
 *
 * @param inputs - The pension calculator inputs containing contribution periods and birth date
 * @returns Gap analysis results with memoized values
 */
export const useGapAnalysis = (inputs: PensionInputs): UseGapAnalysisResult => {
  const gapAnalysis = useMemo(() => {
    if (!inputs.contributionPeriods || inputs.contributionPeriods.length === 0) {
      return {
        gaps: [],
        totalGapYears: 0,
        totalGapMonths: 0,
        totalImpactOnPoints: 0,
        totalImpactOnPension: 0,
        strategies: [],
      };
    }

    return analyzeContributionGaps(inputs.contributionPeriods, inputs.birthDate);
  }, [inputs.contributionPeriods, inputs.birthDate]);

  const hasGaps = useMemo(() => gapAnalysis.gaps.length > 0, [gapAnalysis.gaps]);

  const gapCount = useMemo(() => gapAnalysis.gaps.length, [gapAnalysis.gaps]);

  const hasStrategies = useMemo(
    () => gapAnalysis.strategies.length > 0,
    [gapAnalysis.strategies]
  );

  return {
    gapAnalysis,
    hasGaps,
    gapCount,
    hasStrategies,
  };
};

export default useGapAnalysis;
