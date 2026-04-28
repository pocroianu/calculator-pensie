import { ContributionPeriod, PensionDetails, EarlyRetirementScenario, EarlyRetirementAnalysis, SpecialRetirementCategory, SpecialRetirementEligibility, SpecialRetirementAnalysis, WorkingCondition } from "../types/pensionTypes";
import {
  getAverageSalaryForYear,
  calculateHistoricalContributionPoints,
  CURRENT_AVERAGE_SALARY
} from "../data/historicalSalaries";
import { getCurrentVPR, getVPRConfig } from "../config/vprConfig";
import { pensionCache, hashContributionPeriods, hashPeriod } from "./memoization";
import { LawCalculationParameters } from "../types/lawVersionTypes";

// Legacy constant for backward compatibility - now reads from config
export const REFERENCE_VALUE_2024 = 81.03; // Lei (default value)

// Dynamic VPR getter function for calculations
export const getReferenceValue = (): number => {
  return getCurrentVPR();
};

// Get VPR configuration info for display
export const getVPRInfo = () => {
  const config = getVPRConfig();
  return {
    value: config.currentValue,
    year: config.currentYear,
    effectiveDate: config.effectiveDate
  };
};

export const GROUP_II_BONUS = 0.25; // 25% bonus for Group II work
export const GROUP_I_BONUS = 0.50; // 50% bonus for Group I work
export const SPECIAL_CONDITIONS_BONUS = 0.50; // 50% bonus for special conditions

// Constants based on Article 47
export const MINIMUM_CONTRIBUTION_YEARS = 15;  // Stagiul minim de cotizare contributiv
export const COMPLETE_CONTRIBUTION_YEARS = 35; // Stagiul complet de cotizare contributiv
export const RETIREMENT_AGE = 65;             // Vârsta standard de pensionare

// Early Retirement Constants based on Romanian pension law
export const MINIMUM_EARLY_RETIREMENT_AGE = 60; // Minimum age for early retirement (5 years before standard)
export const EARLY_RETIREMENT_PENALTY_PER_YEAR = 6; // 6% reduction per year of early retirement
export const MAX_EARLY_RETIREMENT_YEARS = 5;    // Maximum years allowed for early retirement

// Special Retirement Age Constants based on Romanian pension law (Legea 263/2010)
// Workers in special conditions can retire earlier with reduced retirement ages
export const GROUP_I_RETIREMENT_AGE_REDUCTION = 10;      // Group I: Can retire up to 10 years earlier
export const GROUP_II_RETIREMENT_AGE_REDUCTION = 5;      // Group II: Can retire up to 5 years earlier
export const SPECIAL_CONDITIONS_RETIREMENT_AGE_REDUCTION = 10; // Special conditions: Up to 10 years earlier

// Minimum years required in special conditions to qualify for reduced retirement age
export const GROUP_I_MINIMUM_YEARS = 10;          // Need at least 10 years in Group I conditions
export const GROUP_II_MINIMUM_YEARS = 15;         // Need at least 15 years in Group II conditions
export const SPECIAL_CONDITIONS_MINIMUM_YEARS = 10; // Need at least 10 years in special conditions

// Special retirement categories configuration
export const SPECIAL_RETIREMENT_CATEGORIES: SpecialRetirementCategory[] = [
  {
    workingCondition: 'groupI',
    retirementAgeReduction: GROUP_I_RETIREMENT_AGE_REDUCTION,
    minimumSpecialWorkYears: GROUP_I_MINIMUM_YEARS,
    reducedRetirementAge: RETIREMENT_AGE - GROUP_I_RETIREMENT_AGE_REDUCTION,
    displayName: 'Group I - Very Difficult Conditions'
  },
  {
    workingCondition: 'groupII',
    retirementAgeReduction: GROUP_II_RETIREMENT_AGE_REDUCTION,
    minimumSpecialWorkYears: GROUP_II_MINIMUM_YEARS,
    reducedRetirementAge: RETIREMENT_AGE - GROUP_II_RETIREMENT_AGE_REDUCTION,
    displayName: 'Group II - Difficult Conditions'
  },
  {
    workingCondition: 'specialConditions',
    retirementAgeReduction: SPECIAL_CONDITIONS_RETIREMENT_AGE_REDUCTION,
    minimumSpecialWorkYears: SPECIAL_CONDITIONS_MINIMUM_YEARS,
    reducedRetirementAge: RETIREMENT_AGE - SPECIAL_CONDITIONS_RETIREMENT_AGE_REDUCTION,
    displayName: 'Special Conditions'
  }
];

export const TIER1_START = 26;
export const TIER1_END = 30;
export const TIER2_START = 31;
export const TIER2_END = 35;
export const TIER3_START = 36;
export const TIER3_END = 40;

export const TIER1_POINTS = 0.50;
export const TIER2_POINTS = 0.75;
export const TIER3_POINTS = 1.00;

// Re-export for backward compatibility
export { getAverageSalaryForYear, CURRENT_AVERAGE_SALARY };

/**
 * Cached version of calculateHistoricalContributionPoints
 * Uses memoization to avoid recalculating points for the same period
 */
const getCachedHistoricalPoints = (
  monthlyGrossSalary: number,
  fromDate: string,
  toDate: string
): number => {
  const cacheKey = { salary: monthlyGrossSalary, from: fromDate, to: toDate };

  if (pensionCache.historicalPoints.has(cacheKey)) {
    return pensionCache.historicalPoints.get(cacheKey)!;
  }

  const points = calculateHistoricalContributionPoints(monthlyGrossSalary, fromDate, toDate);
  pensionCache.historicalPoints.set(cacheKey, points);
  return points;
};

/**
 * Pre-calculate years between two dates (optimized)
 * Avoids creating Date objects repeatedly
 */
const calculateYearsBetweenDates = (fromDate: string, toDate: string): number => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

/**
 * Get the bonus multiplier for a specific working condition
 * @param workingCondition The working condition type
 * @returns The multiplier (1.0 for normal, 1.25 for Group II, 1.50 for Group I and Special Conditions)
 */
export const getWorkingConditionMultiplier = (workingCondition?: string): number => {
  switch (workingCondition) {
    case 'groupII':
      return 1 + GROUP_II_BONUS;
    case 'groupI':
      return 1 + GROUP_I_BONUS;
    case 'specialConditions':
      return 1 + SPECIAL_CONDITIONS_BONUS;
    default:
      return 1.0;
  }
};

/**
 * Get the bonus percentage for display purposes
 * @param workingCondition The working condition type
 * @returns The bonus percentage (0 for normal, 25 for Group II, 50 for Group I and Special Conditions)
 */
export const getWorkingConditionBonusPercentage = (workingCondition?: string): number => {
  switch (workingCondition) {
    case 'groupII':
      return GROUP_II_BONUS * 100;
    case 'groupI':
      return GROUP_I_BONUS * 100;
    case 'specialConditions':
      return SPECIAL_CONDITIONS_BONUS * 100;
    default:
      return 0;
  }
};

/**
 * Formula de calcul a pensiei de la data de 1 septembrie 2024 este:
 * VPR x Numar total de puncte.
 * VPR (valoarea punctului de referință) = valoarea punctului de pensie (2.032 lei) împartit la 25 = 81 lei.
 * Numar total de puncte = puncte contributivitate + puncte stabilitate + puncte asimilate/necontributive.
 * 
 * 
 * Pensie = VPR (81 lei) x numár total de puncte (puncte de contributivitate + puncte de stabilitate + puncte asimilate / necontributive)
 * 
 * In timp ce VPR are o valoare fixă (la 1 septembrie 2024 este 81 de lei), numărul total de puncte acumulate diferă de la persoană la persoană, 
 * în funcție de venitul brut lunar realizat pe parcursul anilor de muncă, dar și în funcție de punctele de stabilitate ale pensionarului.
 * 
 * Puncte de contributivitate: Reprezintă suma punctajelor anuale acumulate de asigurat pe intreaga perioadă de contribuție la sistemul de pensii.
 * 
 * Punctul de contributivitate se determină lunar prin raportarea veniturilor brute ale asiguratului la salariul mediu brut pe economie 
 * din luna respectivă. Apoi ele se însumează și se împart la 12 pentru a determina punctajul anual.
 */

export const calculateMonthlyPension = (
  contributionPeriods: ContributionPeriod[],
  birthDate: string,
): {
  monthlyPension: number;
  details: PensionDetails;
} => {
  let totalPoints = 0;
  let contributionPoints = 0;
  let stabilityPoints = 0;
  let nonContributivePoints = 0;
  let totalContributiveYears = 0;
  let error: string | undefined;

  // Calculate current age (optimized - single Date object creation)
  const today = new Date();
  const birth = new Date(birthDate);
  const birthYear = birth.getFullYear();
  const birthMonth = birth.getMonth();
  const birthDay = birth.getDate();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  let currentAge = todayYear - birthYear;
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    currentAge--;
  }

  // Calculate years until retirement
  const yearsUntilRetirement = RETIREMENT_AGE - currentAge;

  // Pre-calculate period data to avoid repeated Date object creation
  // This is especially important for large numbers of periods
  const periodData = contributionPeriods.map(period => ({
    period,
    numberOfYears: period.fromDate && period.toDate
      ? calculateYearsBetweenDates(period.fromDate, period.toDate)
      : 0
  }));

  // Calculate contribution points and non-contributive points
  for (const { period, numberOfYears } of periodData) {
    if (period.nonContributiveType) {
      // Handle non-contributive periods
      switch (period.nonContributiveType) {
        case 'military':
        case 'university':
        case 'childCare':
          nonContributivePoints += numberOfYears * 0.25; // 0.25 points per year for all these types
          break;
        case 'medical':
          nonContributivePoints += numberOfYears * 0.20; // 0.20 points per year
          break;
      }
    } else if (period.monthlyGrossSalary && period.fromDate && period.toDate) {
      // Handle regular contribution periods
      // Use cached historical salary data for accurate point calculations
      totalContributiveYears += numberOfYears;

      // Use cached version for performance
      const basePoints = getCachedHistoricalPoints(
        period.monthlyGrossSalary,
        period.fromDate,
        period.toDate
      );

      // Apply working condition bonus multipliers (using pre-computed function)
      const bonusMultiplier = getWorkingConditionMultiplier(period.workingCondition);
      const adjustedPoints = basePoints * bonusMultiplier;
      contributionPoints += adjustedPoints;
    }
  }

  // Only calculate stability points if minimum contribution years are met
  if (totalContributiveYears >= MINIMUM_CONTRIBUTION_YEARS) {
    stabilityPoints = calculateStabilityPoints(
      contributionPeriods.filter(p => !p.nonContributiveType), 
      birthDate
    );
  }

  totalPoints = contributionPoints + stabilityPoints + nonContributivePoints;

  // According to Article 47, check if minimum contribution years are met
  if (totalContributiveYears < MINIMUM_CONTRIBUTION_YEARS) {
    error = `You need ${Math.ceil(MINIMUM_CONTRIBUTION_YEARS - totalContributiveYears)} more years to reach the minimum contribution period of ${MINIMUM_CONTRIBUTION_YEARS} years`;
    return {
      monthlyPension: 0,
      details: {
        contributionPoints: 0,
        stabilityPoints: 0,
        nonContributivePoints: 0,
        totalPoints: 0,
        totalContributiveYears,
        monthlyPension: 0,
        currentAge,
        yearsUntilRetirement,
        error
      }
    };
  }

  const monthlyPension = totalPoints * getReferenceValue();

  return {
    monthlyPension,
    details: {
      contributionPoints,
      stabilityPoints,
      nonContributivePoints,
      totalPoints,
      totalContributiveYears,
      monthlyPension,
      currentAge,
      yearsUntilRetirement,
      error
    }
  };
};

/**
 * Calculate monthly pension using specific law version parameters.
 * This allows computing pensions under different legislative regimes.
 *
 * @param contributionPeriods Array of contribution periods
 * @param birthDate Birth date string
 * @param lawParams The calculation parameters from a specific law version
 * @returns Object containing monthlyPension and detailed breakdown
 */
export const calculateMonthlyPensionWithLawVersion = (
  contributionPeriods: ContributionPeriod[],
  birthDate: string,
  lawParams: LawCalculationParameters,
): {
  monthlyPension: number;
  details: PensionDetails;
} => {
  let totalPoints = 0;
  let contributionPoints = 0;
  let stabilityPoints = 0;
  let nonContributivePoints = 0;
  let totalContributiveYears = 0;
  let error: string | undefined;

  // Calculate current age
  const today = new Date();
  const birth = new Date(birthDate);
  const birthYear = birth.getFullYear();
  const birthMonth = birth.getMonth();
  const birthDay = birth.getDate();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  let currentAge = todayYear - birthYear;
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    currentAge--;
  }

  const yearsUntilRetirement = lawParams.retirementAge - currentAge;

  const periodData = contributionPeriods.map(period => ({
    period,
    numberOfYears: period.fromDate && period.toDate
      ? calculateYearsBetweenDates(period.fromDate, period.toDate)
      : 0
  }));

  // Calculate contribution points and non-contributive points using law parameters
  for (const { period, numberOfYears } of periodData) {
    if (period.nonContributiveType) {
      const rates = lawParams.nonContributiveRates;
      switch (period.nonContributiveType) {
        case 'military':
          nonContributivePoints += numberOfYears * rates.military;
          break;
        case 'university':
          nonContributivePoints += numberOfYears * rates.university;
          break;
        case 'childCare':
          nonContributivePoints += numberOfYears * rates.childCare;
          break;
        case 'medical':
          nonContributivePoints += numberOfYears * rates.medical;
          break;
      }
    } else if (period.monthlyGrossSalary && period.fromDate && period.toDate) {
      totalContributiveYears += numberOfYears;

      const basePoints = getCachedHistoricalPoints(
        period.monthlyGrossSalary,
        period.fromDate,
        period.toDate
      );

      // Apply working condition bonus using law-specific parameters
      let bonusMultiplier = 1.0;
      switch (period.workingCondition) {
        case 'groupII':
          bonusMultiplier = 1 + lawParams.groupIIBonus;
          break;
        case 'groupI':
          bonusMultiplier = 1 + lawParams.groupIBonus;
          break;
        case 'specialConditions':
          bonusMultiplier = 1 + lawParams.specialConditionsBonus;
          break;
      }

      contributionPoints += basePoints * bonusMultiplier;
    }
  }

  // Calculate stability points using law-specific tiers
  if (totalContributiveYears >= lawParams.minimumContributionYears) {
    stabilityPoints = calculateStabilityPointsWithLawVersion(
      contributionPeriods.filter(p => !p.nonContributiveType),
      birthDate,
      lawParams
    );
  }

  totalPoints = contributionPoints + stabilityPoints + nonContributivePoints;

  if (totalContributiveYears < lawParams.minimumContributionYears) {
    error = `You need ${Math.ceil(lawParams.minimumContributionYears - totalContributiveYears)} more years to reach the minimum contribution period of ${lawParams.minimumContributionYears} years`;
    return {
      monthlyPension: 0,
      details: {
        contributionPoints: 0,
        stabilityPoints: 0,
        nonContributivePoints: 0,
        totalPoints: 0,
        totalContributiveYears,
        monthlyPension: 0,
        currentAge,
        yearsUntilRetirement,
        error
      }
    };
  }

  const monthlyPension = totalPoints * lawParams.vprValue;

  return {
    monthlyPension,
    details: {
      contributionPoints,
      stabilityPoints,
      nonContributivePoints,
      totalPoints,
      totalContributiveYears,
      monthlyPension,
      currentAge,
      yearsUntilRetirement,
      error
    }
  };
};

/**
 * Calculate stability points using law-version-specific tier parameters
 */
export const calculateStabilityPointsWithLawVersion = (
  contributionPeriods: ContributionPeriod[],
  birthDate: string,
  lawParams: LawCalculationParameters
): number => {
  let totalPoints = 0;

  const validPeriods = contributionPeriods
    .filter(p => p.fromDate && p.toDate)
    .map(p => ({
      ...p,
      fromTimestamp: new Date(p.fromDate).getTime(),
      toTimestamp: new Date(p.toDate).getTime(),
      fromYear: new Date(p.fromDate).getFullYear(),
      toYear: new Date(p.toDate).getFullYear()
    }))
    .sort((a, b) => a.fromTimestamp - b.fromTimestamp);

  const birthYear = new Date(birthDate).getFullYear();

  let totalYears = 0;

  for (const period of validPeriods) {
    const startAge = period.fromYear - birthYear;
    const endAge = period.toYear - birthYear;
    const years = (period.toTimestamp - period.fromTimestamp) / (1000 * 60 * 60 * 24 * 365.25);
    totalYears += years;

    if (totalYears <= lawParams.minimumContributionYears) continue;

    // Apply each stability tier from the law parameters
    for (const tier of lawParams.stabilityTiers) {
      if (startAge >= (tier.startYear - 1)) {
        if (startAge < tier.endYear) {
          const tierYears = Math.min(years, tier.endYear - startAge);
          totalPoints += tierYears * tier.pointsPerYear;
        }
      }
      if (startAge < tier.endYear && endAge >= tier.startYear) {
        // This period spans into this tier
        if (startAge < tier.startYear) {
          const tierYears = Math.min(
            years,
            Math.min(tier.endYear, endAge) - tier.startYear
          );
          if (tierYears > 0) {
            totalPoints += tierYears * tier.pointsPerYear;
          }
        }
      }
    }
  }

  return totalPoints;
};

export const calculateContributionPoint = (
  monthlyGrossSalary: number,
  averageGrossSalary: number
): number => {
  return monthlyGrossSalary / averageGrossSalary;
};

export const calculateStabilityPoints = (
  contributionPeriods: ContributionPeriod[],
  birthDate: string
): number => {
  // Check cache first using a hash of the periods and birthdate
  const periodsHash = hashContributionPeriods(contributionPeriods);
  const cacheKey = { periodsHash, birthDate };

  if (pensionCache.stabilityPoints.has(cacheKey)) {
    return pensionCache.stabilityPoints.get(cacheKey)!;
  }

  let totalPoints = 0;

  // Filter and sort periods - optimized to create timestamps once
  const validPeriods = contributionPeriods
    .filter(p => p.fromDate && p.toDate)
    .map(p => ({
      ...p,
      fromTimestamp: new Date(p.fromDate).getTime(),
      toTimestamp: new Date(p.toDate).getTime(),
      fromYear: new Date(p.fromDate).getFullYear(),
      toYear: new Date(p.toDate).getFullYear()
    }))
    .sort((a, b) => a.fromTimestamp - b.fromTimestamp);

  // Pre-calculate birth year once
  const birthYear = new Date(birthDate).getFullYear();

  // Calculate total contribution years and the age at which they occurred
  let totalYears = 0;

  for (const period of validPeriods) {
    const startAge = period.fromYear - birthYear;
    const endAge = period.toYear - birthYear;

    // Calculate years for each tier based on age
    const years = (period.toTimestamp - period.fromTimestamp) / (1000 * 60 * 60 * 24 * 365.25);
    totalYears += years;

    // No points before minimum years
    if (totalYears <= MINIMUM_CONTRIBUTION_YEARS) continue;

    // Calculate points for each tier
    if (startAge >= 25) {
      // Tier 1 (26-30 years)
      if (startAge < 30) {
        const tier1Years = Math.min(years, 30 - startAge);
        totalPoints += tier1Years * TIER1_POINTS;
      }

      // Tier 2 (31-35 years)
      if (startAge < 35 && endAge >= 31) {
        const tier2Years = Math.min(
          years,
          Math.min(35, endAge) - Math.max(31, startAge)
        );
        totalPoints += tier2Years * TIER2_POINTS;
      }

      // Tier 3 (36+ years)
      if (endAge >= 36) {
        const tier3Years = endAge - Math.max(36, startAge);
        totalPoints += tier3Years * TIER3_POINTS;
      }
    }
  }

  // Cache the result
  pensionCache.stabilityPoints.set(cacheKey, totalPoints);

  return totalPoints;
};

/**
 * Calculate the penalty percentage for early retirement
 * @param yearsEarly Number of years before standard retirement age
 * @returns The penalty percentage (e.g., 6% per year)
 */
export const calculateEarlyRetirementPenalty = (yearsEarly: number): number => {
  if (yearsEarly <= 0) return 0;
  if (yearsEarly > MAX_EARLY_RETIREMENT_YEARS) return MAX_EARLY_RETIREMENT_YEARS * EARLY_RETIREMENT_PENALTY_PER_YEAR;
  return yearsEarly * EARLY_RETIREMENT_PENALTY_PER_YEAR;
};

/**
 * Calculate the reduced pension amount after applying early retirement penalty
 * @param standardMonthlyPension The full monthly pension at standard retirement age
 * @param penaltyPercentage The penalty percentage to apply
 * @returns The reduced monthly pension amount
 */
export const calculateReducedPension = (
  standardMonthlyPension: number,
  penaltyPercentage: number
): number => {
  const reductionFactor = 1 - (penaltyPercentage / 100);
  return standardMonthlyPension * reductionFactor;
};

/**
 * Calculate early retirement scenarios with penalties
 * Generates scenarios for retiring 1-5 years early with corresponding penalties
 *
 * @param standardMonthlyPension The full monthly pension at standard retirement age
 * @param currentAge Current age of the person
 * @param totalContributiveYears Total years of contributions
 * @returns EarlyRetirementAnalysis object with all scenarios
 */
/**
 * Clear all pension calculation caches
 * Call this when underlying data changes (e.g., VPR update, period changes)
 */
export const clearPensionCache = (): void => {
  pensionCache.clearAll();
};

export const calculateEarlyRetirementScenarios = (
  standardMonthlyPension: number,
  currentAge: number,
  totalContributiveYears: number
): EarlyRetirementAnalysis => {
  const scenarios: EarlyRetirementScenario[] = [];

  // Calculate standard yearly pension
  const standardYearlyPension = standardMonthlyPension * 12;

  // Determine if the person can retire early at all
  // Requires complete contribution period (35 years) for early retirement eligibility
  const hasCompleteContribution = totalContributiveYears >= COMPLETE_CONTRIBUTION_YEARS;

  // Generate scenarios for 1 to MAX_EARLY_RETIREMENT_YEARS years early
  for (let yearsEarly = 1; yearsEarly <= MAX_EARLY_RETIREMENT_YEARS; yearsEarly++) {
    const retirementAge = RETIREMENT_AGE - yearsEarly;
    const penaltyPercentage = calculateEarlyRetirementPenalty(yearsEarly);

    // Determine eligibility for this scenario
    let isEligible = true;
    let eligibilityReason: string | undefined;

    // Check if person meets minimum contribution requirements
    if (!hasCompleteContribution) {
      isEligible = false;
      eligibilityReason = 'needsCompleteContribution';
    }

    // Check if person is already past this early retirement age
    if (currentAge > retirementAge) {
      isEligible = false;
      eligibilityReason = 'alreadyPastAge';
    }

    // Check minimum early retirement age
    if (retirementAge < MINIMUM_EARLY_RETIREMENT_AGE) {
      isEligible = false;
      eligibilityReason = 'belowMinimumAge';
    }

    const reducedMonthlyPension = isEligible
      ? calculateReducedPension(standardMonthlyPension, penaltyPercentage)
      : 0;
    const reducedYearlyPension = reducedMonthlyPension * 12;

    scenarios.push({
      yearsEarly,
      retirementAge,
      penaltyPercentage,
      reducedMonthlyPension,
      reducedYearlyPension,
      monthlyPensionLoss: standardMonthlyPension - reducedMonthlyPension,
      yearlyPensionLoss: standardYearlyPension - reducedYearlyPension,
      isEligible,
      eligibilityReason
    });
  }

  // Determine the earliest possible retirement age for this person
  const eligibleScenarios = scenarios.filter(s => s.isEligible);
  const earliestRetirementAge = eligibleScenarios.length > 0
    ? Math.min(...eligibleScenarios.map(s => s.retirementAge))
    : RETIREMENT_AGE;

  return {
    standardRetirementAge: RETIREMENT_AGE,
    standardMonthlyPension,
    standardYearlyPension,
    minimumEarlyRetirementAge: MINIMUM_EARLY_RETIREMENT_AGE,
    penaltyPerYearEarly: EARLY_RETIREMENT_PENALTY_PER_YEAR,
    scenarios,
    currentAge,
    canRetireEarly: hasCompleteContribution && currentAge < RETIREMENT_AGE,
    earliestRetirementAge
  };
};

/**
 * Calculate years worked in a specific working condition
 * @param contributionPeriods Array of contribution periods
 * @param workingCondition The working condition to filter by
 * @returns Number of years worked in that condition
 */
export const calculateYearsInCondition = (
  contributionPeriods: ContributionPeriod[],
  workingCondition: WorkingCondition
): number => {
  return contributionPeriods
    .filter(p => p.workingCondition === workingCondition && p.fromDate && p.toDate && !p.nonContributiveType)
    .reduce((total, period) => {
      const from = new Date(period.fromDate);
      const to = new Date(period.toDate);
      const years = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return total + years;
    }, 0);
};

/**
 * Calculate special retirement eligibility for workers in special conditions
 * Based on Romanian pension law (Legea 263/2010), workers in Group I, Group II,
 * and special conditions can retire earlier with reduced retirement ages.
 *
 * @param contributionPeriods Array of contribution periods
 * @param birthDate Birth date string
 * @param totalContributiveYears Total years of contributions
 * @returns SpecialRetirementAnalysis object with eligibility for each category
 */
export const calculateSpecialRetirementEligibility = (
  contributionPeriods: ContributionPeriod[],
  birthDate: string,
  totalContributiveYears: number
): SpecialRetirementAnalysis => {
  // Calculate current age
  const today = new Date();
  const birth = new Date(birthDate);
  let currentAge = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    currentAge--;
  }

  // Check if minimum contribution is met
  const meetsMinimumContribution = totalContributiveYears >= MINIMUM_CONTRIBUTION_YEARS;

  // Check if there are any special condition periods
  const hasSpecialConditionPeriods = contributionPeriods.some(
    p => p.workingCondition && p.workingCondition !== 'normal' && !p.nonContributiveType
  );

  // Calculate eligibility for each special retirement category
  const eligibilities: SpecialRetirementEligibility[] = SPECIAL_RETIREMENT_CATEGORIES.map(category => {
    const yearsInCondition = calculateYearsInCondition(contributionPeriods, category.workingCondition);
    const meetsMinimumYearsRequirement = yearsInCondition >= category.minimumSpecialWorkYears;

    // Calculate proportional retirement age reduction based on actual years worked
    // Full reduction requires minimum years, partial reduction proportional to years worked
    let effectiveAgeReduction = 0;
    if (yearsInCondition > 0) {
      if (meetsMinimumYearsRequirement) {
        effectiveAgeReduction = category.retirementAgeReduction;
      } else {
        // Proportional reduction for partial years (at least 50% of minimum)
        const proportionWorked = yearsInCondition / category.minimumSpecialWorkYears;
        if (proportionWorked >= 0.5) {
          effectiveAgeReduction = Math.floor(category.retirementAgeReduction * proportionWorked);
        }
      }
    }

    const eligibleRetirementAge = RETIREMENT_AGE - effectiveAgeReduction;
    const yearsUntilEligibility = Math.max(0, eligibleRetirementAge - currentAge);
    const isCurrentlyEligible = currentAge >= eligibleRetirementAge &&
                                meetsMinimumContribution &&
                                yearsInCondition > 0;

    return {
      category,
      yearsInSpecialConditions: yearsInCondition,
      meetsMinimumYearsRequirement,
      currentAge,
      eligibleRetirementAge,
      yearsUntilEligibility,
      isCurrentlyEligible,
      meetsMinimumContribution
    };
  });

  // Find the best (earliest) retirement option
  const eligibleCategories = eligibilities.filter(e => e.yearsInSpecialConditions > 0);
  const earliestSpecialRetirementAge = eligibleCategories.length > 0
    ? Math.min(...eligibleCategories.map(e => e.eligibleRetirementAge))
    : null;

  const bestCategory = eligibleCategories.length > 0
    ? eligibleCategories.reduce((best, current) =>
        current.eligibleRetirementAge < best.eligibleRetirementAge ? current : best
      ).category
    : null;

  return {
    standardRetirementAge: RETIREMENT_AGE,
    currentAge,
    totalContributiveYears,
    hasSpecialConditionPeriods,
    eligibilities,
    earliestSpecialRetirementAge,
    bestCategory
  };
};