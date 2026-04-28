/**
 * Gap Analysis Utilities
 *
 * Functions to identify gaps in contribution timeline and calculate
 * their impact on pension, along with strategies to fill them.
 *
 * Optimized with memoization for large numbers of contribution periods.
 */

import {
  ContributionPeriod,
  ContributionGap,
  GapFillStrategy,
  GapAnalysisResult,
  GapFillStrategyType,
} from '../types/pensionTypes';
import { REFERENCE_VALUE_2024, CURRENT_AVERAGE_SALARY } from './pensionCalculations';
import { getAverageSalaryForYear } from '../data/historicalSalaries';
import { memoize, hashContributionPeriods } from './memoization';

// Cache for gap analysis results
const gapAnalysisCache = new Map<string, GapAnalysisResult>();

// Minimum gap duration to report (in months)
const MIN_GAP_MONTHS = 3;

// Maximum years to look back from current date for gap analysis
const MAX_ANALYSIS_YEARS = 50;

/**
 * Parse a date string and return a Date object
 */
const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Calculate the difference between two dates in months
 */
const getMonthsDifference = (startDate: Date, endDate: Date): number => {
  const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthsDiff = endDate.getMonth() - startDate.getMonth();
  return yearsDiff * 12 + monthsDiff;
};

/**
 * Pre-processed period with cached timestamp
 */
interface ProcessedPeriod extends ContributionPeriod {
  fromTimestamp: number;
  toTimestamp: number;
}

/**
 * Sort contribution periods by start date
 * Optimized to parse dates once and cache timestamps
 */
const sortPeriodsByDate = (periods: ContributionPeriod[]): ProcessedPeriod[] => {
  return periods
    .filter(p => p.fromDate && p.toDate)
    .map(p => ({
      ...p,
      fromTimestamp: new Date(p.fromDate).getTime(),
      toTimestamp: new Date(p.toDate).getTime()
    }))
    .sort((a, b) => a.fromTimestamp - b.fromTimestamp);
};

/**
 * Calculate estimated contribution points for a gap period
 * Assumes average salary contribution during the gap
 */
const calculateGapPointsImpact = (
  startDate: string,
  endDate: string
): number => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  let totalPoints = 0;
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    let monthsInYear: number;

    if (year === startYear) {
      monthsInYear = 12 - start.getMonth();
      if (year === endYear) {
        monthsInYear = end.getMonth() - start.getMonth() + 1;
      }
    } else if (year === endYear) {
      monthsInYear = end.getMonth() + 1;
    } else {
      monthsInYear = 12;
    }

    // Assume average salary would earn 1 point per year
    const yearlyPoints = monthsInYear / 12;
    totalPoints += yearlyPoints;
  }

  return totalPoints;
};

/**
 * Identify gaps between contribution periods
 */
export const identifyGaps = (
  periods: ContributionPeriod[],
  birthDate?: string
): ContributionGap[] => {
  const gaps: ContributionGap[] = [];
  const sortedPeriods = sortPeriodsByDate(periods);

  if (sortedPeriods.length === 0) {
    return gaps;
  }

  // Determine the earliest reasonable start date for analysis
  const today = new Date();
  let analysisStartDate: Date;

  if (birthDate) {
    const birth = parseDate(birthDate);
    // Start analysis from age 18 (working age)
    analysisStartDate = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
  } else {
    // Default to MAX_ANALYSIS_YEARS ago
    analysisStartDate = new Date(today.getFullYear() - MAX_ANALYSIS_YEARS, today.getMonth(), today.getDate());
  }

  // Don't analyze future dates
  const analysisEndDate = today;

  // Find gaps between consecutive periods
  for (let i = 0; i < sortedPeriods.length - 1; i++) {
    const currentPeriod = sortedPeriods[i];
    const nextPeriod = sortedPeriods[i + 1];

    const currentEnd = parseDate(currentPeriod.toDate);
    const nextStart = parseDate(nextPeriod.fromDate);

    // Add one day to current end to get the gap start
    const gapStart = new Date(currentEnd);
    gapStart.setDate(gapStart.getDate() + 1);

    // Subtract one day from next start to get the gap end
    const gapEnd = new Date(nextStart);
    gapEnd.setDate(gapEnd.getDate() - 1);

    const monthsDiff = getMonthsDifference(gapStart, gapEnd);

    if (monthsDiff >= MIN_GAP_MONTHS) {
      const durationYears = Math.floor(monthsDiff / 12);
      const durationMonths = monthsDiff % 12;

      const gapStartStr = gapStart.toISOString().split('T')[0];
      const gapEndStr = gapEnd.toISOString().split('T')[0];

      const impactOnPoints = calculateGapPointsImpact(gapStartStr, gapEndStr);
      const impactOnMonthlyPension = impactOnPoints * REFERENCE_VALUE_2024;

      gaps.push({
        startDate: gapStartStr,
        endDate: gapEndStr,
        durationYears,
        durationMonths,
        impactOnPoints,
        impactOnMonthlyPension,
      });
    }
  }

  // Check for gap before the first period (from working age)
  if (sortedPeriods.length > 0) {
    const firstPeriodStart = parseDate(sortedPeriods[0].fromDate);

    if (firstPeriodStart > analysisStartDate) {
      const gapEnd = new Date(firstPeriodStart);
      gapEnd.setDate(gapEnd.getDate() - 1);

      const monthsDiff = getMonthsDifference(analysisStartDate, gapEnd);

      // Only report early career gaps if they're significant (> 2 years)
      // to avoid reporting normal education periods
      if (monthsDiff >= 24) {
        const durationYears = Math.floor(monthsDiff / 12);
        const durationMonths = monthsDiff % 12;

        const gapStartStr = analysisStartDate.toISOString().split('T')[0];
        const gapEndStr = gapEnd.toISOString().split('T')[0];

        const impactOnPoints = calculateGapPointsImpact(gapStartStr, gapEndStr);
        const impactOnMonthlyPension = impactOnPoints * REFERENCE_VALUE_2024;

        gaps.unshift({
          startDate: gapStartStr,
          endDate: gapEndStr,
          durationYears,
          durationMonths,
          impactOnPoints,
          impactOnMonthlyPension,
        });
      }
    }
  }

  // Check for gap after the last period (to current date)
  if (sortedPeriods.length > 0) {
    const lastPeriodEnd = parseDate(sortedPeriods[sortedPeriods.length - 1].toDate);

    // Add one day to get the gap start
    const gapStart = new Date(lastPeriodEnd);
    gapStart.setDate(gapStart.getDate() + 1);

    if (gapStart < analysisEndDate) {
      const monthsDiff = getMonthsDifference(gapStart, analysisEndDate);

      if (monthsDiff >= MIN_GAP_MONTHS) {
        const durationYears = Math.floor(monthsDiff / 12);
        const durationMonths = monthsDiff % 12;

        const gapStartStr = gapStart.toISOString().split('T')[0];
        const gapEndStr = analysisEndDate.toISOString().split('T')[0];

        const impactOnPoints = calculateGapPointsImpact(gapStartStr, gapEndStr);
        const impactOnMonthlyPension = impactOnPoints * REFERENCE_VALUE_2024;

        gaps.push({
          startDate: gapStartStr,
          endDate: gapEndStr,
          durationYears,
          durationMonths,
          impactOnPoints,
          impactOnMonthlyPension,
        });
      }
    }
  }

  return gaps;
};

/**
 * Generate strategies to fill identified gaps
 */
export const suggestGapFillingStrategies = (
  gaps: ContributionGap[]
): GapFillStrategy[] => {
  const strategies: GapFillStrategy[] = [];

  if (gaps.length === 0) {
    return strategies;
  }

  // Calculate total gap metrics
  const totalGapYears = gaps.reduce(
    (sum, gap) => sum + gap.durationYears + gap.durationMonths / 12,
    0
  );

  // Strategy 1: Voluntary Contributions (Retroactive)
  // In Romania, you can make voluntary pension contributions
  if (totalGapYears > 0) {
    const estimatedPoints = Math.min(totalGapYears, 5); // Cap at 5 years for voluntary
    strategies.push({
      type: 'voluntaryContributions',
      description: 'voluntaryContributions',
      yearsToAdd: Math.min(totalGapYears, 5),
      estimatedPointGain: estimatedPoints,
      estimatedPensionIncrease: estimatedPoints * REFERENCE_VALUE_2024,
      feasibility: 'medium',
    });
  }

  // Strategy 2: Part-time Work
  // Suggest part-time work for recent/current gaps
  const recentGaps = gaps.filter(gap => {
    const gapEnd = parseDate(gap.endDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return gapEnd >= threeMonthsAgo;
  });

  if (recentGaps.length > 0) {
    const recentGapYears = recentGaps.reduce(
      (sum, gap) => sum + gap.durationYears + gap.durationMonths / 12,
      0
    );
    const estimatedPoints = recentGapYears * 0.5; // Part-time = 50% of full points
    strategies.push({
      type: 'partTimeWork',
      description: 'partTimeWork',
      yearsToAdd: recentGapYears,
      estimatedPointGain: estimatedPoints,
      estimatedPensionIncrease: estimatedPoints * REFERENCE_VALUE_2024,
      feasibility: 'high',
    });
  }

  // Strategy 3: Child Care Credits
  // If there are gaps that could be covered by child care
  const longGaps = gaps.filter(gap => gap.durationYears >= 1);
  if (longGaps.length > 0) {
    const maxChildCareYears = 6; // Max years for child care credit in Romania
    const childCareYears = Math.min(
      longGaps.reduce((sum, gap) => sum + gap.durationYears, 0),
      maxChildCareYears
    );
    const estimatedPoints = childCareYears * 0.25; // 0.25 points per year for child care
    strategies.push({
      type: 'childCareCredit',
      description: 'childCareCredit',
      yearsToAdd: childCareYears,
      estimatedPointGain: estimatedPoints,
      estimatedPensionIncrease: estimatedPoints * REFERENCE_VALUE_2024,
      feasibility: 'medium',
    });
  }

  // Strategy 4: University Credits
  // For early career gaps that might be university years
  const earlyGaps = gaps.filter(gap => {
    const gapEnd = parseDate(gap.endDate);
    return gapEnd.getFullYear() < new Date().getFullYear() - 10;
  });

  if (earlyGaps.length > 0) {
    const universityYears = Math.min(
      earlyGaps.reduce((sum, gap) => sum + gap.durationYears, 0),
      6 // Max university years
    );
    if (universityYears >= 3) {
      const estimatedPoints = universityYears * 0.25; // 0.25 points per year for university
      strategies.push({
        type: 'universityCredit',
        description: 'universityCredit',
        yearsToAdd: universityYears,
        estimatedPointGain: estimatedPoints,
        estimatedPensionIncrease: estimatedPoints * REFERENCE_VALUE_2024,
        feasibility: 'high',
      });
    }
  }

  // Sort strategies by estimated pension increase (descending)
  strategies.sort((a, b) => b.estimatedPensionIncrease - a.estimatedPensionIncrease);

  return strategies;
};

/**
 * Perform complete gap analysis
 * Results are cached based on periods hash and birth date
 */
export const analyzeContributionGaps = (
  periods: ContributionPeriod[],
  birthDate?: string
): GapAnalysisResult => {
  // Create cache key from periods and birthDate
  const cacheKey = `${hashContributionPeriods(periods)}|${birthDate || ''}`;

  // Check cache first
  if (gapAnalysisCache.has(cacheKey)) {
    return gapAnalysisCache.get(cacheKey)!;
  }

  const gaps = identifyGaps(periods, birthDate);
  const strategies = suggestGapFillingStrategies(gaps);

  // Use reduce with accumulator to avoid multiple iterations
  let totalGapYears = 0;
  let totalGapMonths = 0;
  let totalImpactOnPoints = 0;
  let totalImpactOnPension = 0;

  for (const gap of gaps) {
    totalGapYears += gap.durationYears;
    totalGapMonths += gap.durationMonths;
    totalImpactOnPoints += gap.impactOnPoints;
    totalImpactOnPension += gap.impactOnMonthlyPension;
  }

  const result: GapAnalysisResult = {
    gaps,
    totalGapYears: totalGapYears + Math.floor(totalGapMonths / 12),
    totalGapMonths: totalGapMonths % 12,
    totalImpactOnPoints,
    totalImpactOnPension,
    strategies,
  };

  // Cache the result (limit cache size to prevent memory issues)
  if (gapAnalysisCache.size >= 50) {
    // Clear oldest entries (simple FIFO approach)
    const firstKey = gapAnalysisCache.keys().next().value;
    if (firstKey) {
      gapAnalysisCache.delete(firstKey);
    }
  }
  gapAnalysisCache.set(cacheKey, result);

  return result;
};

/**
 * Clear gap analysis cache
 * Call this when contribution periods change
 */
export const clearGapAnalysisCache = (): void => {
  gapAnalysisCache.clear();
};

/**
 * Format gap duration for display
 */
export const formatGapDuration = (years: number, months: number): string => {
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  }

  if (months > 0) {
    parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  }

  return parts.join(', ') || '0 months';
};
