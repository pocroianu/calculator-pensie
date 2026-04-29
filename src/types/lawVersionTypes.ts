/**
 * Types for tracking different versions of Romanian pension law over time.
 *
 * Romania's pension system has undergone several major legislative changes:
 * - Legea 19/2000 (Public Pension System and Other Social Insurance Rights)
 * - Legea 263/2010 (Unified Public Pension System)
 * - Legea 127/2019 (Modifications to Pension Law)
 * - OUG 163/2022 (Emergency Government Ordinance)
 * - Legea 360/2023 (September 2024 Pension Reform)
 *
 * Each law version may have different parameters for:
 * - Retirement age
 * - Minimum/complete contribution years
 * - Point calculation formulas
 * - Working condition bonuses
 * - Early retirement penalties
 * - VPR (pension point reference value)
 */

export type LawVersionId =
  | 'legea_19_2000'
  | 'legea_263_2010'
  | 'legea_127_2019'
  | 'oug_163_2022'
  | 'legea_360_2023';

/**
 * Parameters that define how pensions are calculated under a specific law version
 */
export interface LawCalculationParameters {
  /** Standard retirement age */
  retirementAge: number;
  /** Minimum contribution years required for pension eligibility */
  minimumContributionYears: number;
  /** Complete contribution years for full pension benefits */
  completeContributionYears: number;
  /** Group II working condition bonus (as decimal, e.g., 0.25 = 25%) */
  groupIIBonus: number;
  /** Group I working condition bonus (as decimal, e.g., 0.50 = 50%) */
  groupIBonus: number;
  /** Special conditions working bonus (as decimal, e.g., 0.50 = 50%) */
  specialConditionsBonus: number;
  /** VPR - Pension point reference value in RON */
  vprValue: number;
  /** Early retirement penalty per year (as percentage, e.g., 6 = 6%) */
  earlyRetirementPenaltyPerYear: number;
  /** Maximum years allowed for early retirement */
  maxEarlyRetirementYears: number;
  /** Minimum early retirement age */
  minimumEarlyRetirementAge: number;
  /** Group I retirement age reduction (in years) */
  groupIRetirementAgeReduction: number;
  /** Group II retirement age reduction (in years) */
  groupIIRetirementAgeReduction: number;
  /** Special conditions retirement age reduction (in years) */
  specialConditionsRetirementAgeReduction: number;
  /** Minimum years in Group I for retirement reduction */
  groupIMinimumYears: number;
  /** Minimum years in Group II for retirement reduction */
  groupIIMinimumYears: number;
  /** Minimum years in special conditions for retirement reduction */
  specialConditionsMinimumYears: number;
  /** Stability points tiers */
  stabilityTiers: StabilityTier[];
  /** Non-contributive period point rates */
  nonContributiveRates: NonContributiveRates;
}

export interface StabilityTier {
  startYear: number;
  endYear: number;
  pointsPerYear: number;
}

export interface NonContributiveRates {
  military: number;
  university: number;
  childCare: number;
  medical: number;
}

/**
 * A specific version of the Romanian pension law
 */
export interface LawVersion {
  /** Unique identifier for this law version */
  id: LawVersionId;
  /** Official name of the law (e.g., "Legea nr. 263/2010") */
  name: string;
  /** Short description of the law */
  shortDescription: string;
  /** The date this law became effective */
  effectiveDate: string; // ISO date string YYYY-MM-DD
  /** The date this law was superseded (null if currently active) */
  supersededDate: string | null;
  /** Whether this is the currently active law */
  isActive: boolean;
  /** Key changes introduced by this law version */
  keyChanges: string[];
  /** Calculation parameters for this law version */
  parameters: LawCalculationParameters;
  /** Official reference (Monitorul Oficial publication) */
  officialReference?: string;
}

/**
 * Configuration for law version management
 */
export interface LawVersionConfig {
  /** All available law versions, ordered by effective date (newest first) */
  versions: LawVersion[];
  /** The ID of the currently active law version */
  activeVersionId: LawVersionId;
  /** The ID of the version selected by the user (may differ from active for comparison) */
  selectedVersionId: LawVersionId;
  /** Timestamp of last configuration update */
  lastUpdated: string;
}

/**
 * Result of comparing two law versions
 */
export interface LawVersionComparison {
  fromVersion: LawVersion;
  toVersion: LawVersion;
  changes: LawVersionChange[];
}

export interface LawVersionChange {
  parameter: string;
  label: string;
  oldValue: string | number;
  newValue: string | number;
  impact: 'positive' | 'negative' | 'neutral';
}
