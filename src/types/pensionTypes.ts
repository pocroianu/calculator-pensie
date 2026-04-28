// Working conditions according to Romanian pension law:
// - normal: Standard working conditions (no bonus)
// - groupII: Group II conditions - 25% bonus (difficult conditions)
// - groupI: Group I conditions - 50% bonus (very difficult conditions)
// - specialConditions: Special conditions - 50% bonus (hazardous/special circumstances)
export type WorkingCondition = 'normal' | 'groupII' | 'groupI' | 'specialConditions';
export type NonContributivePeriodType = 'military' | 'university' | 'childCare' | 'medical' | '';

export interface ContributionPeriod {
  fromDate: string;
  toDate: string;
  company?: string;
  monthlyGrossSalary?: number;
  workingCondition?: WorkingCondition;
  nonContributiveType?: NonContributivePeriodType;
}

export interface PensionInputs {
  birthDate: string;
  retirementYear: number;
  contributionPeriods: ContributionPeriod[];
}

export interface PensionDetails {
  contributionPoints: number;
  stabilityPoints: number;
  nonContributivePoints: number;
  totalPoints: number;
  totalContributiveYears?: number;
  monthlyPension: number;
  currentAge?: number;
  yearsUntilRetirement?: number;
  error?: string;
}

// Gap Analysis Types
export interface ContributionGap {
  startDate: string;
  endDate: string;
  durationYears: number;
  durationMonths: number;
  impactOnPoints: number;
  impactOnMonthlyPension: number;
}

export type GapFillStrategyType =
  | 'voluntaryContributions'
  | 'extendPreviousEmployment'
  | 'partTimeWork'
  | 'childCareCredit'
  | 'universityCredit';

export interface GapFillStrategy {
  type: GapFillStrategyType;
  description: string;
  yearsToAdd: number;
  estimatedPointGain: number;
  estimatedPensionIncrease: number;
  feasibility: 'high' | 'medium' | 'low';
}

export interface GapAnalysisResult {
  gaps: ContributionGap[];
  totalGapYears: number;
  totalGapMonths: number;
  totalImpactOnPoints: number;
  totalImpactOnPension: number;
  strategies: GapFillStrategy[];
}

// Early Retirement Types
export interface EarlyRetirementScenario {
  yearsEarly: number;           // How many years before standard retirement age
  retirementAge: number;        // Age at which person would retire
  penaltyPercentage: number;    // Penalty percentage applied (e.g., 6% per year early)
  reducedMonthlyPension: number; // Monthly pension after penalty
  reducedYearlyPension: number;  // Yearly pension after penalty
  monthlyPensionLoss: number;    // Monthly loss compared to full pension
  yearlyPensionLoss: number;     // Yearly loss compared to full pension
  isEligible: boolean;          // Whether this scenario meets minimum requirements
  eligibilityReason?: string;   // Reason if not eligible
}

export interface EarlyRetirementAnalysis {
  standardRetirementAge: number;
  standardMonthlyPension: number;
  standardYearlyPension: number;
  minimumEarlyRetirementAge: number;
  penaltyPerYearEarly: number;  // Penalty percentage per year of early retirement
  scenarios: EarlyRetirementScenario[];
  currentAge: number;
  canRetireEarly: boolean;
  earliestRetirementAge: number;
}

// Special Retirement Types for Group I, Group II, and Special Conditions
// According to Romanian pension law, workers in special conditions can retire earlier
export interface SpecialRetirementCategory {
  workingCondition: WorkingCondition;
  retirementAgeReduction: number;      // Years before standard retirement age
  minimumSpecialWorkYears: number;     // Minimum years in special conditions required
  reducedRetirementAge: number;        // Calculated retirement age (65 - reduction)
  displayName: string;                 // Display name for UI
}

export interface SpecialRetirementEligibility {
  category: SpecialRetirementCategory;
  yearsInSpecialConditions: number;    // Actual years worked in this condition
  meetsMinimumYearsRequirement: boolean;
  currentAge: number;
  eligibleRetirementAge: number;
  yearsUntilEligibility: number;
  isCurrentlyEligible: boolean;
  meetsMinimumContribution: boolean;   // Has at least 15 years total contribution
}

export interface SpecialRetirementAnalysis {
  standardRetirementAge: number;
  currentAge: number;
  totalContributiveYears: number;
  hasSpecialConditionPeriods: boolean;
  eligibilities: SpecialRetirementEligibility[];
  earliestSpecialRetirementAge: number | null;
  bestCategory: SpecialRetirementCategory | null;
}

// Inflation Adjustment Types
export interface InflationProjection {
  year: number;
  nominalPension: number;          // Original pension amount (in today's RON)
  inflationRate: number;           // The inflation rate applied for that year (%)
  cumulativeInflation: number;     // Cumulative inflation factor from base year
  realPurchasingPower: number;     // Pension value in today's RON (adjusted for inflation)
  purchasingPowerLoss: number;     // How much purchasing power is lost (in RON)
  purchasingPowerLossPercent: number; // Purchasing power loss as percentage
}

export interface InflationAdjustmentResult {
  baseYear: number;
  basePension: number;             // Monthly pension at base year
  customInflationRate: number;     // User-provided or default inflation rate (%)
  yearsProjected: number;          // Number of years projected into the future
  projections: InflationProjection[];
  totalPurchasingPowerLoss: number; // Total loss at end of projection period (RON)
  totalPurchasingPowerLossPercent: number; // Total loss as percentage
  averageAnnualLoss: number;       // Average annual purchasing power loss (RON)
}

// What-If Scenario Types
// Allows users to create hypothetical scenarios with different assumptions

/**
 * Represents a modification to the base pension calculation
 * Used to model different "what-if" scenarios
 */
export interface ScenarioModification {
  /** Type of modification being applied */
  type: 'salaryChange' | 'additionalYears' | 'workingConditionChange' | 'retirementAgeChange';
  /** Human-readable description of the modification */
  description?: string;
  /** For salaryChange: percentage change (e.g., 20 for 20% increase) */
  salaryChangePercent?: number;
  /** For additionalYears: number of additional years to work */
  additionalYears?: number;
  /** For workingConditionChange: the new working condition */
  newWorkingCondition?: WorkingCondition;
  /** For retirementAgeChange: the target retirement age */
  targetRetirementAge?: number;
}

/**
 * A single what-if scenario with its assumptions and calculated results
 */
export interface WhatIfScenario {
  /** Unique identifier for the scenario */
  id: string;
  /** User-provided name for the scenario */
  name: string;
  /** Optional description or notes */
  description?: string;
  /** When this scenario was created */
  createdAt: string;
  /** When this scenario was last modified */
  updatedAt: string;
  /** The base inputs this scenario is derived from */
  baseInputs: PensionInputs;
  /** List of modifications applied to create this scenario */
  modifications: ScenarioModification[];
  /** The modified inputs after applying modifications */
  modifiedInputs: PensionInputs;
  /** Calculated pension details for this scenario */
  results: PensionDetails;
  /** Monthly pension for this scenario */
  monthlyPension: number;
  /** Yearly pension for this scenario */
  yearlyPension: number;
  /** Color used for visual differentiation in comparisons */
  color?: string;
  /** Whether this is the baseline scenario (current actual inputs) */
  isBaseline?: boolean;
}

/**
 * Comparison between a scenario and the baseline
 */
export interface ScenarioComparisonResult {
  /** The scenario being compared */
  scenario: WhatIfScenario;
  /** Monthly pension difference from baseline */
  monthlyPensionDiff: number;
  /** Yearly pension difference from baseline */
  yearlyPensionDiff: number;
  /** Percentage change in monthly pension */
  monthlyPensionDiffPercent: number;
  /** Total points difference from baseline */
  totalPointsDiff: number;
  /** Percentage change in total points */
  totalPointsDiffPercent: number;
  /** Contribution points difference */
  contributionPointsDiff: number;
  /** Stability points difference */
  stabilityPointsDiff: number;
  /** Non-contributive points difference */
  nonContributivePointsDiff: number;
  /** Years until retirement difference */
  yearsUntilRetirementDiff: number;
}

/**
 * Storage structure for all scenarios
 */
export interface ScenarioStorage {
  /** All saved scenarios */
  scenarios: WhatIfScenario[];
  /** Schema version for future migrations */
  version: string;
  /** Last update timestamp */
  lastUpdated: string;
}

/**
 * Configuration constants for scenarios
 */
export const SCENARIO_CONFIG = {
  /** Maximum number of scenarios allowed */
  MAX_SCENARIOS: 10,
  /** Current schema version */
  SCHEMA_VERSION: '1.0.0',
  /** Storage key for scenarios */
  STORAGE_KEY: 'what_if_scenarios',
  /** Default scenario colors for visual comparison */
  COLORS: [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
  ],
} as const;
