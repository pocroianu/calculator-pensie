/**
 * Contribution Recommendations Engine
 *
 * Analyzes user's contribution history and provides personalized,
 * actionable recommendations to maximize their pension.
 *
 * Recommendations include:
 * - Years needed for next stability tier
 * - Years needed for minimum/complete contribution periods
 * - Salary optimization suggestions
 * - Working condition bonus awareness
 * - Early retirement eligibility improvements
 */

import { ContributionPeriod, PensionDetails, PensionInputs } from '../types/pensionTypes';
import {
  MINIMUM_CONTRIBUTION_YEARS,
  COMPLETE_CONTRIBUTION_YEARS,
  RETIREMENT_AGE,
  TIER1_START,
  TIER1_END,
  TIER2_START,
  TIER2_END,
  TIER3_START,
  TIER3_END,
  TIER1_POINTS,
  TIER2_POINTS,
  TIER3_POINTS,
  getReferenceValue,
} from './pensionCalculations';
import { CURRENT_AVERAGE_SALARY } from '../data/historicalSalaries';

/**
 * Priority levels for recommendations
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Category of recommendation for display grouping
 */
export type RecommendationCategory =
  | 'milestone'      // Reaching a contribution milestone
  | 'stability'      // Stability tier progression
  | 'salary'         // Salary optimization
  | 'condition'      // Working condition bonuses
  | 'retirement'     // Retirement planning
  | 'general';       // General advice

/**
 * A single actionable recommendation
 */
export interface ContributionRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  titleKey: string;           // i18n key for title
  descriptionKey: string;     // i18n key for description
  descriptionParams?: Record<string, string | number>; // Interpolation params
  impact?: {
    additionalPoints?: number;
    additionalMonthlyPension?: number;
    yearsNeeded?: number;
  };
  progress?: {
    current: number;
    target: number;
    unit: string;             // i18n key for unit label
  };
}

/**
 * Complete recommendations analysis result
 */
export interface RecommendationsResult {
  recommendations: ContributionRecommendation[];
  summary: {
    totalRecommendations: number;
    highPriority: number;
    potentialAdditionalMonthlyPension: number;
    potentialAdditionalPoints: number;
  };
}

/**
 * Calculate average salary across all contributive periods
 */
const calculateAverageSalary = (periods: ContributionPeriod[]): number => {
  const contributivePeriods = periods.filter(
    p => p.monthlyGrossSalary && !p.nonContributiveType
  );
  if (contributivePeriods.length === 0) return 0;

  const totalSalary = contributivePeriods.reduce(
    (sum, p) => sum + (p.monthlyGrossSalary || 0),
    0
  );
  return totalSalary / contributivePeriods.length;
};

/**
 * Calculate total contributive years from periods
 */
const calculateTotalContributiveYears = (periods: ContributionPeriod[]): number => {
  return periods
    .filter(p => p.fromDate && p.toDate && !p.nonContributiveType)
    .reduce((total, period) => {
      const from = new Date(period.fromDate);
      const to = new Date(period.toDate);
      const years = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return total + years;
    }, 0);
};

/**
 * Check if any period has special working conditions
 */
const hasSpecialConditions = (periods: ContributionPeriod[]): boolean => {
  return periods.some(
    p => p.workingCondition && p.workingCondition !== 'normal' && !p.nonContributiveType
  );
};

/**
 * Calculate the current age from birth date
 */
const calculateCurrentAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
};

/**
 * Generate milestone recommendations (minimum and complete contribution)
 */
const generateMilestoneRecommendations = (
  totalContributiveYears: number
): ContributionRecommendation[] => {
  const recommendations: ContributionRecommendation[] = [];
  const vpr = getReferenceValue();

  // Recommendation: Reach minimum contribution period (15 years)
  if (totalContributiveYears < MINIMUM_CONTRIBUTION_YEARS) {
    const yearsNeeded = Math.ceil(MINIMUM_CONTRIBUTION_YEARS - totalContributiveYears);
    recommendations.push({
      id: 'milestone-minimum',
      category: 'milestone',
      priority: 'high',
      titleKey: 'pension.recommendations.milestones.minimumTitle',
      descriptionKey: 'pension.recommendations.milestones.minimumDescription',
      descriptionParams: {
        years: yearsNeeded,
        minimum: MINIMUM_CONTRIBUTION_YEARS,
      },
      impact: {
        yearsNeeded,
      },
      progress: {
        current: Math.round(totalContributiveYears * 10) / 10,
        target: MINIMUM_CONTRIBUTION_YEARS,
        unit: 'common.years',
      },
    });
  }

  // Recommendation: Reach complete contribution period (35 years)
  if (
    totalContributiveYears >= MINIMUM_CONTRIBUTION_YEARS &&
    totalContributiveYears < COMPLETE_CONTRIBUTION_YEARS
  ) {
    const yearsNeeded = Math.ceil(COMPLETE_CONTRIBUTION_YEARS - totalContributiveYears);
    // Estimate additional points from more years at average salary (1 point/year)
    const estimatedAdditionalPoints = yearsNeeded;
    const additionalPension = estimatedAdditionalPoints * vpr;

    recommendations.push({
      id: 'milestone-complete',
      category: 'milestone',
      priority: 'medium',
      titleKey: 'pension.recommendations.milestones.completeTitle',
      descriptionKey: 'pension.recommendations.milestones.completeDescription',
      descriptionParams: {
        years: yearsNeeded,
        complete: COMPLETE_CONTRIBUTION_YEARS,
        additionalPension: Math.round(additionalPension),
      },
      impact: {
        additionalPoints: estimatedAdditionalPoints,
        additionalMonthlyPension: additionalPension,
        yearsNeeded,
      },
      progress: {
        current: Math.round(totalContributiveYears * 10) / 10,
        target: COMPLETE_CONTRIBUTION_YEARS,
        unit: 'common.years',
      },
    });
  }

  return recommendations;
};

/**
 * Generate stability tier recommendations
 */
const generateStabilityRecommendations = (
  totalContributiveYears: number
): ContributionRecommendation[] => {
  const recommendations: ContributionRecommendation[] = [];
  const vpr = getReferenceValue();

  // Determine current tier and what's next
  interface TierTarget {
    id: string;
    start: number;
    end: number;
    pointsPerYear: number;
    tierName: string;
  }

  const tiers: TierTarget[] = [
    { id: 'tier1', start: TIER1_START, end: TIER1_END, pointsPerYear: TIER1_POINTS, tierName: '1' },
    { id: 'tier2', start: TIER2_START, end: TIER2_END, pointsPerYear: TIER2_POINTS, tierName: '2' },
    { id: 'tier3', start: TIER3_START, end: TIER3_END, pointsPerYear: TIER3_POINTS, tierName: '3' },
  ];

  for (const tier of tiers) {
    if (totalContributiveYears < tier.start) {
      // Not yet reached this tier
      const yearsToTier = Math.ceil(tier.start - totalContributiveYears);
      const tierYears = tier.end - tier.start + 1;
      const potentialPoints = tierYears * tier.pointsPerYear;
      const potentialPension = potentialPoints * vpr;

      recommendations.push({
        id: `stability-${tier.id}`,
        category: 'stability',
        priority: yearsToTier <= 3 ? 'high' : yearsToTier <= 5 ? 'medium' : 'low',
        titleKey: 'pension.recommendations.stability.nextTierTitle',
        descriptionKey: 'pension.recommendations.stability.nextTierDescription',
        descriptionParams: {
          years: yearsToTier,
          tier: tier.tierName,
          pointsPerYear: tier.pointsPerYear,
          potentialPension: Math.round(potentialPension),
        },
        impact: {
          additionalPoints: potentialPoints,
          additionalMonthlyPension: potentialPension,
          yearsNeeded: yearsToTier,
        },
        progress: {
          current: Math.round(totalContributiveYears * 10) / 10,
          target: tier.start,
          unit: 'common.years',
        },
      });

      // Only show the next tier to reach, not all future tiers
      break;
    } else if (totalContributiveYears >= tier.start && totalContributiveYears <= tier.end) {
      // Currently in this tier - show progress to completion
      const yearsRemaining = Math.ceil(tier.end - totalContributiveYears);
      if (yearsRemaining > 0) {
        const remainingPoints = yearsRemaining * tier.pointsPerYear;
        const remainingPension = remainingPoints * vpr;

        recommendations.push({
          id: `stability-${tier.id}-progress`,
          category: 'stability',
          priority: yearsRemaining <= 2 ? 'high' : 'medium',
          titleKey: 'pension.recommendations.stability.currentTierTitle',
          descriptionKey: 'pension.recommendations.stability.currentTierDescription',
          descriptionParams: {
            years: yearsRemaining,
            tier: tier.tierName,
            pointsPerYear: tier.pointsPerYear,
            remainingPoints: Math.round(remainingPoints * 100) / 100,
            remainingPension: Math.round(remainingPension),
          },
          impact: {
            additionalPoints: remainingPoints,
            additionalMonthlyPension: remainingPension,
            yearsNeeded: yearsRemaining,
          },
          progress: {
            current: Math.round((totalContributiveYears - tier.start) * 10) / 10,
            target: tier.end - tier.start + 1,
            unit: 'common.years',
          },
        });
      }
      break;
    }
    // If past this tier, continue to next
  }

  // If past all tiers, show congratulatory message
  if (totalContributiveYears > TIER3_END) {
    recommendations.push({
      id: 'stability-max',
      category: 'stability',
      priority: 'low',
      titleKey: 'pension.recommendations.stability.maxReachedTitle',
      descriptionKey: 'pension.recommendations.stability.maxReachedDescription',
      descriptionParams: {},
    });
  }

  return recommendations;
};

/**
 * Generate salary optimization recommendations
 */
const generateSalaryRecommendations = (
  periods: ContributionPeriod[]
): ContributionRecommendation[] => {
  const recommendations: ContributionRecommendation[] = [];
  const vpr = getReferenceValue();

  const averageSalary = calculateAverageSalary(periods);
  if (averageSalary <= 0) return recommendations;

  // Find the most recent contributive period
  const contributivePeriods = periods
    .filter(p => p.monthlyGrossSalary && !p.nonContributiveType && p.fromDate && p.toDate)
    .sort((a, b) => new Date(b.toDate).getTime() - new Date(a.toDate).getTime());

  if (contributivePeriods.length === 0) return recommendations;

  const latestPeriod = contributivePeriods[0];
  const currentSalary = latestPeriod.monthlyGrossSalary || 0;

  // Recommendation: Salary is below national average
  if (currentSalary < CURRENT_AVERAGE_SALARY) {
    // Going from current salary to average means gaining (avg/avg - current/avg) = 1 - current/avg points per year
    const additionalPointsPerYear = (CURRENT_AVERAGE_SALARY - currentSalary) / CURRENT_AVERAGE_SALARY;
    const additionalPensionPerYear = additionalPointsPerYear * vpr;

    recommendations.push({
      id: 'salary-below-average',
      category: 'salary',
      priority: 'medium',
      titleKey: 'pension.recommendations.salary.belowAverageTitle',
      descriptionKey: 'pension.recommendations.salary.belowAverageDescription',
      descriptionParams: {
        currentSalary: Math.round(currentSalary),
        nationalAverage: Math.round(CURRENT_AVERAGE_SALARY),
        additionalPointsPerYear: Math.round(additionalPointsPerYear * 100) / 100,
        additionalPensionPerYear: Math.round(additionalPensionPerYear),
      },
      impact: {
        additionalPoints: additionalPointsPerYear,
        additionalMonthlyPension: additionalPensionPerYear,
      },
    });
  }

  // Recommendation: Salary increase impact projection
  if (currentSalary > 0) {
    // Show impact of a 20% salary increase
    const salaryIncrease = Math.round(currentSalary * 0.20);
    const additionalPointsPerYear = salaryIncrease / CURRENT_AVERAGE_SALARY;
    const additionalPensionPerYear = additionalPointsPerYear * vpr;

    recommendations.push({
      id: 'salary-increase-impact',
      category: 'salary',
      priority: 'low',
      titleKey: 'pension.recommendations.salary.increaseImpactTitle',
      descriptionKey: 'pension.recommendations.salary.increaseImpactDescription',
      descriptionParams: {
        increaseAmount: salaryIncrease,
        additionalPointsPerYear: Math.round(additionalPointsPerYear * 100) / 100,
        additionalPensionPerYear: Math.round(additionalPensionPerYear),
      },
      impact: {
        additionalPoints: additionalPointsPerYear,
        additionalMonthlyPension: additionalPensionPerYear,
      },
    });
  }

  return recommendations;
};

/**
 * Generate working condition recommendations
 */
const generateConditionRecommendations = (
  periods: ContributionPeriod[]
): ContributionRecommendation[] => {
  const recommendations: ContributionRecommendation[] = [];

  // Only suggest if all periods are normal conditions and there are active periods
  const contributivePeriods = periods.filter(p => !p.nonContributiveType && p.monthlyGrossSalary);
  if (contributivePeriods.length === 0) return recommendations;

  // Check if user has any special conditions
  const hasSpecial = hasSpecialConditions(periods);

  if (!hasSpecial) {
    recommendations.push({
      id: 'condition-awareness',
      category: 'condition',
      priority: 'low',
      titleKey: 'pension.recommendations.conditions.awarenessTitle',
      descriptionKey: 'pension.recommendations.conditions.awarenessDescription',
      descriptionParams: {},
    });
  }

  return recommendations;
};

/**
 * Generate retirement planning recommendations
 */
const generateRetirementRecommendations = (
  inputs: PensionInputs,
  pensionDetails: PensionDetails,
  totalContributiveYears: number
): ContributionRecommendation[] => {
  const recommendations: ContributionRecommendation[] = [];

  if (!inputs.birthDate) return recommendations;

  const currentAge = calculateCurrentAge(inputs.birthDate);
  const yearsToRetirement = RETIREMENT_AGE - currentAge;

  // Recommendation: Close to retirement but below complete contribution
  if (
    yearsToRetirement > 0 &&
    yearsToRetirement <= 10 &&
    totalContributiveYears < COMPLETE_CONTRIBUTION_YEARS
  ) {
    const canReachComplete = totalContributiveYears + yearsToRetirement >= COMPLETE_CONTRIBUTION_YEARS;

    if (canReachComplete) {
      recommendations.push({
        id: 'retirement-can-reach-complete',
        category: 'retirement',
        priority: 'high',
        titleKey: 'pension.recommendations.retirement.canReachCompleteTitle',
        descriptionKey: 'pension.recommendations.retirement.canReachCompleteDescription',
        descriptionParams: {
          yearsToRetirement,
          currentYears: Math.round(totalContributiveYears * 10) / 10,
          target: COMPLETE_CONTRIBUTION_YEARS,
        },
      });
    } else {
      const maxYearsAtRetirement = totalContributiveYears + yearsToRetirement;
      recommendations.push({
        id: 'retirement-maximize-remaining',
        category: 'retirement',
        priority: 'high',
        titleKey: 'pension.recommendations.retirement.maximizeRemainingTitle',
        descriptionKey: 'pension.recommendations.retirement.maximizeRemainingDescription',
        descriptionParams: {
          yearsToRetirement,
          maxYears: Math.round(maxYearsAtRetirement * 10) / 10,
          complete: COMPLETE_CONTRIBUTION_YEARS,
        },
      });
    }
  }

  // Recommendation: Young worker with early start advantage
  if (currentAge < 30 && totalContributiveYears > 0 && totalContributiveYears < 10) {
    const projectedYearsAtRetirement = totalContributiveYears + yearsToRetirement;
    recommendations.push({
      id: 'retirement-early-start',
      category: 'retirement',
      priority: 'low',
      titleKey: 'pension.recommendations.retirement.earlyStartTitle',
      descriptionKey: 'pension.recommendations.retirement.earlyStartDescription',
      descriptionParams: {
        yearsToRetirement,
        projectedYears: Math.round(projectedYearsAtRetirement),
      },
    });
  }

  return recommendations;
};

/**
 * Main entry point: Generate all contribution recommendations
 *
 * Analyzes the user's contribution history, current pension details,
 * and personal information to generate personalized, actionable
 * recommendations to maximize their pension.
 */
export const generateContributionRecommendations = (
  inputs: PensionInputs,
  pensionDetails: PensionDetails
): RecommendationsResult => {
  const totalContributiveYears =
    pensionDetails.totalContributiveYears ?? calculateTotalContributiveYears(inputs.contributionPeriods);

  // Gather recommendations from all generators
  const allRecommendations: ContributionRecommendation[] = [
    ...generateMilestoneRecommendations(totalContributiveYears),
    ...generateStabilityRecommendations(totalContributiveYears),
    ...generateSalaryRecommendations(inputs.contributionPeriods),
    ...generateConditionRecommendations(inputs.contributionPeriods),
    ...generateRetirementRecommendations(inputs, pensionDetails, totalContributiveYears),
  ];

  // Sort by priority: high first, then medium, then low
  const priorityOrder: Record<RecommendationPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  allRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Calculate summary
  const highPriority = allRecommendations.filter(r => r.priority === 'high').length;
  const potentialAdditionalPoints = allRecommendations.reduce(
    (sum, r) => sum + (r.impact?.additionalPoints || 0),
    0
  );
  const potentialAdditionalMonthlyPension = allRecommendations.reduce(
    (sum, r) => sum + (r.impact?.additionalMonthlyPension || 0),
    0
  );

  return {
    recommendations: allRecommendations,
    summary: {
      totalRecommendations: allRecommendations.length,
      highPriority,
      potentialAdditionalPoints: Math.round(potentialAdditionalPoints * 100) / 100,
      potentialAdditionalMonthlyPension: Math.round(potentialAdditionalMonthlyPension),
    },
  };
};
