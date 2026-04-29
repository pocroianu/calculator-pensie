/**
 * National Pension Benchmarks for Romania
 *
 * This file contains official pension statistics used to compare
 * calculated pensions with national averages and minimums.
 *
 * Sources:
 * - Casa Națională de Pensii Publice (CNPP)
 * - Institutul Național de Statistică (INS)
 *
 * Note: These values are updated periodically by the Romanian government.
 * Last updated: 2024
 */

// 2024 National Pension Statistics
// Source: CNPP Reports and government announcements

/**
 * National average pension in Romania (2024)
 * This represents the average monthly pension across all pension types
 * As of September 2024, after the pension law reform
 */
export const NATIONAL_AVERAGE_PENSION_2024 = 2800; // RON (approximately)

/**
 * Minimum pension guarantee in Romania (2024)
 * The social minimum pension for those with minimum contribution period
 * This is the guaranteed minimum for pensioners
 */
export const MINIMUM_PENSION_2024 = 1281; // RON (minimum social pension)

/**
 * Minimum pension for complete contribution period (35 years)
 * Higher guaranteed minimum for those who completed full contribution
 */
export const MINIMUM_PENSION_COMPLETE_CONTRIBUTION_2024 = 2032; // RON

/**
 * Median pension in Romania (2024)
 * The median represents the middle value - 50% earn more, 50% earn less
 */
export const MEDIAN_PENSION_2024 = 2400; // RON (estimated)

/**
 * Pension distribution brackets for percentile calculations
 * Based on CNPP statistical reports
 * Values represent the upper limit of each bracket
 */
export const PENSION_DISTRIBUTION_2024 = {
  // Percentile: Upper pension limit in RON
  5: 1300,   // Bottom 5% earn less than 1300 RON
  10: 1500,  // Bottom 10% earn less than 1500 RON
  20: 1800,  // Bottom 20% earn less than 1800 RON
  25: 2000,  // Bottom 25% (first quartile)
  30: 2200,
  40: 2500,
  50: 2800,  // Median
  60: 3200,
  70: 3700,
  75: 4000,  // Third quartile
  80: 4500,
  90: 6000,  // Top 10% earn more than 6000 RON
  95: 8000,  // Top 5% earn more than 8000 RON
  99: 15000, // Top 1% earn more than 15000 RON
};

/**
 * Benchmark configuration type
 */
export interface PensionBenchmarks {
  nationalAverage: number;
  minimumPension: number;
  minimumPensionComplete: number;
  medianPension: number;
  distribution: Record<number, number>;
  year: number;
  lastUpdated: string;
}

/**
 * Get current pension benchmarks
 * Returns the most recent benchmark data
 */
export const getPensionBenchmarks = (): PensionBenchmarks => ({
  nationalAverage: NATIONAL_AVERAGE_PENSION_2024,
  minimumPension: MINIMUM_PENSION_2024,
  minimumPensionComplete: MINIMUM_PENSION_COMPLETE_CONTRIBUTION_2024,
  medianPension: MEDIAN_PENSION_2024,
  distribution: PENSION_DISTRIBUTION_2024,
  year: 2024,
  lastUpdated: '2024-09-01',
});

/**
 * Calculate the percentile ranking for a given pension amount
 * Returns where the pension falls in the national distribution
 *
 * @param monthlyPension - The monthly pension amount in RON
 * @returns The estimated percentile (0-100)
 */
export const calculatePercentileRanking = (monthlyPension: number): number => {
  const distribution = PENSION_DISTRIBUTION_2024;
  const percentiles = Object.keys(distribution)
    .map(Number)
    .sort((a, b) => a - b);

  // Below minimum tracked
  if (monthlyPension <= distribution[percentiles[0]]) {
    return Math.max(1, Math.round((monthlyPension / distribution[percentiles[0]]) * percentiles[0]));
  }

  // Above maximum tracked
  const maxPercentile = percentiles[percentiles.length - 1];
  if (monthlyPension >= distribution[maxPercentile]) {
    // Estimate percentile above 99th
    const excess = (monthlyPension - distribution[maxPercentile]) / distribution[maxPercentile];
    return Math.min(99.9, maxPercentile + excess);
  }

  // Find the bracket
  for (let i = 0; i < percentiles.length - 1; i++) {
    const lowerPercentile = percentiles[i];
    const upperPercentile = percentiles[i + 1];
    const lowerValue = distribution[lowerPercentile];
    const upperValue = distribution[upperPercentile];

    if (monthlyPension >= lowerValue && monthlyPension < upperValue) {
      // Linear interpolation between brackets
      const ratio = (monthlyPension - lowerValue) / (upperValue - lowerValue);
      return lowerPercentile + ratio * (upperPercentile - lowerPercentile);
    }
  }

  return 50; // Default to median if something goes wrong
};

/**
 * Get comparison statistics for a given pension
 * @param monthlyPension - The monthly pension amount in RON
 * @returns Comparison statistics object
 */
export const getPensionComparison = (monthlyPension: number) => {
  const benchmarks = getPensionBenchmarks();
  const percentile = calculatePercentileRanking(monthlyPension);

  const vsAverage = monthlyPension - benchmarks.nationalAverage;
  const vsAveragePercent = ((monthlyPension / benchmarks.nationalAverage) - 1) * 100;

  const vsMinimum = monthlyPension - benchmarks.minimumPension;
  const vsMinimumPercent = ((monthlyPension / benchmarks.minimumPension) - 1) * 100;

  const vsMedian = monthlyPension - benchmarks.medianPension;
  const vsMedianPercent = ((monthlyPension / benchmarks.medianPension) - 1) * 100;

  return {
    monthlyPension,
    percentile: Math.round(percentile * 10) / 10, // Round to 1 decimal
    benchmarks,
    comparison: {
      vsAverage: {
        difference: vsAverage,
        percentDifference: vsAveragePercent,
        isAbove: vsAverage >= 0,
      },
      vsMinimum: {
        difference: vsMinimum,
        percentDifference: vsMinimumPercent,
        isAbove: vsMinimum >= 0,
      },
      vsMedian: {
        difference: vsMedian,
        percentDifference: vsMedianPercent,
        isAbove: vsMedian >= 0,
      },
    },
  };
};

/**
 * Get a human-readable description of the percentile ranking
 * @param percentile - The percentile value (0-100)
 * @returns A category string for the ranking
 */
export const getPercentileCategory = (percentile: number): 'excellent' | 'good' | 'above_average' | 'average' | 'below_average' | 'low' => {
  if (percentile >= 90) return 'excellent';
  if (percentile >= 75) return 'good';
  if (percentile >= 60) return 'above_average';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'below_average';
  return 'low';
};
