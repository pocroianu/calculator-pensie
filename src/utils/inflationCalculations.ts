import { InflationProjection, InflationAdjustmentResult } from '../types/pensionTypes';

/**
 * Default inflation rate based on Romanian National Bank (BNR) targets and historical data.
 * Romania's inflation target is 2.5% +/- 1% as set by BNR.
 * Recent years (2022-2024) have seen higher inflation (10-16%), but the target
 * for medium-to-long-term projections is around 4-5% factoring in economic cycles.
 */
export const DEFAULT_INFLATION_RATE = 4.0; // 4% - conservative estimate for Romania

/**
 * Minimum allowed inflation rate for projections
 */
export const MIN_INFLATION_RATE = 0.5;

/**
 * Maximum allowed inflation rate for projections
 */
export const MAX_INFLATION_RATE = 20.0;

/**
 * Default number of years to project into the future
 */
export const DEFAULT_PROJECTION_YEARS = 20;

/**
 * Maximum number of years to project
 */
export const MAX_PROJECTION_YEARS = 40;

/**
 * Minimum number of years to project
 */
export const MIN_PROJECTION_YEARS = 5;

/**
 * Preset inflation scenarios for quick selection
 * Based on Romanian economic context
 */
export const INFLATION_PRESETS = [
  { rate: 2.5, label: 'optimistic' },   // BNR target rate
  { rate: 4.0, label: 'moderate' },      // Conservative estimate
  { rate: 6.0, label: 'pessimistic' },   // Higher inflation scenario
  { rate: 10.0, label: 'high' },         // High inflation scenario (recent Romanian experience)
] as const;

/**
 * Calculate the future purchasing power of a pension adjusted for projected inflation.
 *
 * This function projects how inflation will erode the real value of a fixed pension
 * over time. It assumes the nominal pension stays constant (worst case) while
 * prices increase at the specified inflation rate.
 *
 * Note: In practice, Romanian pensions are periodically indexed/adjusted by the government,
 * but this projection shows the impact if no indexation occurs.
 *
 * @param monthlyPension - The current monthly pension in RON
 * @param inflationRate - Annual inflation rate as a percentage (e.g., 4.0 for 4%)
 * @param yearsToProject - Number of years to project into the future
 * @param yearsUntilRetirement - Years until retirement (projections start from retirement)
 * @returns InflationAdjustmentResult with year-by-year projections
 */
export const calculateInflationAdjustment = (
  monthlyPension: number,
  inflationRate: number = DEFAULT_INFLATION_RATE,
  yearsToProject: number = DEFAULT_PROJECTION_YEARS,
  yearsUntilRetirement: number = 0
): InflationAdjustmentResult => {
  // Validate inputs
  const validInflationRate = Math.max(MIN_INFLATION_RATE, Math.min(MAX_INFLATION_RATE, inflationRate));
  const validYears = Math.max(MIN_PROJECTION_YEARS, Math.min(MAX_PROJECTION_YEARS, yearsToProject));

  const currentYear = new Date().getFullYear();
  const baseYear = currentYear + Math.max(0, yearsUntilRetirement);
  const inflationDecimal = validInflationRate / 100;

  const projections: InflationProjection[] = [];

  for (let i = 0; i <= validYears; i++) {
    const year = baseYear + i;
    const cumulativeInflation = Math.pow(1 + inflationDecimal, i);
    const realPurchasingPower = monthlyPension / cumulativeInflation;
    const purchasingPowerLoss = monthlyPension - realPurchasingPower;
    const purchasingPowerLossPercent = (purchasingPowerLoss / monthlyPension) * 100;

    projections.push({
      year,
      nominalPension: monthlyPension,
      inflationRate: validInflationRate,
      cumulativeInflation,
      realPurchasingPower,
      purchasingPowerLoss,
      purchasingPowerLossPercent,
    });
  }

  // Get the final projection for summary stats
  const finalProjection = projections[projections.length - 1];
  const totalPurchasingPowerLoss = finalProjection.purchasingPowerLoss;
  const totalPurchasingPowerLossPercent = finalProjection.purchasingPowerLossPercent;
  const averageAnnualLoss = validYears > 0 ? totalPurchasingPowerLoss / validYears : 0;

  return {
    baseYear,
    basePension: monthlyPension,
    customInflationRate: validInflationRate,
    yearsProjected: validYears,
    projections,
    totalPurchasingPowerLoss: totalPurchasingPowerLoss,
    totalPurchasingPowerLossPercent,
    averageAnnualLoss,
  };
};

/**
 * Get a human-readable description of the inflation impact
 * @param lossPercent - Purchasing power loss percentage
 * @returns Severity level for UI display
 */
export const getInflationSeverity = (
  lossPercent: number
): 'low' | 'moderate' | 'high' | 'severe' => {
  if (lossPercent < 20) return 'low';
  if (lossPercent < 40) return 'moderate';
  if (lossPercent < 60) return 'high';
  return 'severe';
};
