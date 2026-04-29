import React, { useMemo } from 'react';
import { Award, TrendingUp, Target, CheckCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContributionPeriod } from '../types/pensionTypes';
import {
  TIER1_START,
  TIER1_END,
  TIER2_START,
  TIER2_END,
  TIER3_START,
  TIER3_END,
  TIER1_POINTS,
  TIER2_POINTS,
  TIER3_POINTS,
  MINIMUM_CONTRIBUTION_YEARS
} from '../utils/pensionCalculations';
import { formatPoints } from '../utils/formatters';

interface Props {
  contributionPeriods: ContributionPeriod[];
  birthDate: string;
  totalContributiveYears: number;
  stabilityPoints: number;
}

interface TierInfo {
  tier: number;
  name: string;
  startYear: number;
  endYear: number;
  pointsPerYear: number;
  yearsWorked: number;
  pointsEarned: number;
  isComplete: boolean;
  isCurrent: boolean;
  isLocked: boolean;
}

const StabilityBonusTracker: React.FC<Props> = ({
  contributionPeriods,
  birthDate,
  totalContributiveYears,
  stabilityPoints
}) => {
  const { t } = useTranslation();

  // Calculate stability bonus tier information
  const tierData = useMemo((): {
    tiers: TierInfo[];
    currentTier: number;
    yearsToNextTier: number;
    nextTierBonus: number;
    totalYearsEligible: number;
  } => {
    // Filter contribution periods (exclude non-contributive)
    const validPeriods = contributionPeriods.filter(
      p => p.fromDate && p.toDate && !p.nonContributiveType
    );

    if (!birthDate || validPeriods.length === 0) {
      return {
        tiers: [],
        currentTier: 0,
        yearsToNextTier: TIER1_START,
        nextTierBonus: TIER1_POINTS,
        totalYearsEligible: 0
      };
    }

    const birthYear = new Date(birthDate).getFullYear();

    // Calculate years worked in each age range
    let tier1Years = 0;
    let tier2Years = 0;
    let tier3Years = 0;

    for (const period of validPeriods) {
      const fromDate = new Date(period.fromDate);
      const toDate = new Date(period.toDate);

      // Calculate age at start and end of period
      const startAge = fromDate.getFullYear() - birthYear;
      const endAge = toDate.getFullYear() - birthYear;

      const periodYears = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      // Tier 1: Ages 26-30
      if (endAge >= TIER1_START && startAge <= TIER1_END) {
        const effectiveStart = Math.max(startAge, TIER1_START);
        const effectiveEnd = Math.min(endAge, TIER1_END);
        const yearsInTier = Math.max(0, Math.min(effectiveEnd - effectiveStart, periodYears));
        tier1Years += yearsInTier;
      }

      // Tier 2: Ages 31-35
      if (endAge >= TIER2_START && startAge <= TIER2_END) {
        const effectiveStart = Math.max(startAge, TIER2_START);
        const effectiveEnd = Math.min(endAge, TIER2_END);
        const yearsInTier = Math.max(0, Math.min(effectiveEnd - effectiveStart, periodYears));
        tier2Years += yearsInTier;
      }

      // Tier 3: Ages 36+
      if (endAge >= TIER3_START) {
        const effectiveStart = Math.max(startAge, TIER3_START);
        const effectiveEnd = Math.min(endAge, TIER3_END);
        const yearsInTier = Math.max(0, Math.min(effectiveEnd - effectiveStart, periodYears));
        tier3Years += yearsInTier;
      }
    }

    // Cap years at tier maximums
    tier1Years = Math.min(tier1Years, TIER1_END - TIER1_START + 1);
    tier2Years = Math.min(tier2Years, TIER2_END - TIER2_START + 1);
    tier3Years = Math.min(tier3Years, TIER3_END - TIER3_START + 1);

    const totalYearsEligible = tier1Years + tier2Years + tier3Years;

    // Calculate points for each tier (only if minimum contribution met)
    const meetsMinimum = totalContributiveYears >= MINIMUM_CONTRIBUTION_YEARS;
    const tier1Points = meetsMinimum ? tier1Years * TIER1_POINTS : 0;
    const tier2Points = meetsMinimum ? tier2Years * TIER2_POINTS : 0;
    const tier3Points = meetsMinimum ? tier3Years * TIER3_POINTS : 0;

    // Determine current tier and progress
    let currentTier = 0;
    let yearsToNextTier = 0;
    let nextTierBonus = 0;

    if (totalContributiveYears < TIER1_START) {
      currentTier = 0;
      yearsToNextTier = TIER1_START - totalContributiveYears;
      nextTierBonus = TIER1_POINTS;
    } else if (totalContributiveYears < TIER2_START) {
      currentTier = 1;
      yearsToNextTier = TIER2_START - totalContributiveYears;
      nextTierBonus = TIER2_POINTS;
    } else if (totalContributiveYears < TIER3_START) {
      currentTier = 2;
      yearsToNextTier = TIER3_START - totalContributiveYears;
      nextTierBonus = TIER3_POINTS;
    } else if (totalContributiveYears < TIER3_END) {
      currentTier = 3;
      yearsToNextTier = TIER3_END - totalContributiveYears;
      nextTierBonus = TIER3_POINTS;
    } else {
      currentTier = 4; // Max tier reached
      yearsToNextTier = 0;
      nextTierBonus = 0;
    }

    const tiers: TierInfo[] = [
      {
        tier: 1,
        name: t('pension.stabilityTracker.tier1'),
        startYear: TIER1_START,
        endYear: TIER1_END,
        pointsPerYear: TIER1_POINTS,
        yearsWorked: tier1Years,
        pointsEarned: tier1Points,
        isComplete: totalContributiveYears >= TIER1_END + 1,
        isCurrent: currentTier === 1,
        isLocked: totalContributiveYears < TIER1_START || !meetsMinimum
      },
      {
        tier: 2,
        name: t('pension.stabilityTracker.tier2'),
        startYear: TIER2_START,
        endYear: TIER2_END,
        pointsPerYear: TIER2_POINTS,
        yearsWorked: tier2Years,
        pointsEarned: tier2Points,
        isComplete: totalContributiveYears >= TIER2_END + 1,
        isCurrent: currentTier === 2,
        isLocked: totalContributiveYears < TIER2_START || !meetsMinimum
      },
      {
        tier: 3,
        name: t('pension.stabilityTracker.tier3'),
        startYear: TIER3_START,
        endYear: TIER3_END,
        pointsPerYear: TIER3_POINTS,
        yearsWorked: tier3Years,
        pointsEarned: tier3Points,
        isComplete: totalContributiveYears >= TIER3_END,
        isCurrent: currentTier === 3,
        isLocked: totalContributiveYears < TIER3_START || !meetsMinimum
      }
    ];

    return {
      tiers,
      currentTier,
      yearsToNextTier: Math.max(0, Math.ceil(yearsToNextTier)),
      nextTierBonus,
      totalYearsEligible
    };
  }, [contributionPeriods, birthDate, totalContributiveYears, t]);

  const meetsMinimumContribution = totalContributiveYears >= MINIMUM_CONTRIBUTION_YEARS;

  // Calculate color classes based on tier
  const getTierColorClasses = (tier: TierInfo) => {
    if (tier.isLocked) {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-400',
        progress: 'bg-gray-200'
      };
    }
    if (tier.isComplete) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
        progress: 'bg-green-500'
      };
    }
    if (tier.isCurrent) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        progress: 'bg-blue-500'
      };
    }
    return {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-500',
      progress: 'bg-gray-300'
    };
  };

  // If no contribution periods or birth date, show a message
  if (!birthDate || contributionPeriods.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      data-testid="stability-bonus-tracker"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            <h3 className="font-medium text-gray-900">{t('pension.stabilityTracker.title')}</h3>
          </div>
          <div className="text-sm text-gray-500">
            {formatPoints(stabilityPoints)} {t('common.points')}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('pension.stabilityTracker.overallProgress')}</span>
            <span className="font-medium text-gray-900">
              {Math.round(totalContributiveYears)} / {TIER3_END} {t('common.years')}
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 transition-all duration-500"
                style={{ width: `${Math.min(100, (totalContributiveYears / TIER3_END) * 100)}%` }}
                data-testid="overall-progress-bar"
              />
            </div>
            {/* Tier markers */}
            <div className="absolute inset-0 flex items-center">
              {[TIER1_START, TIER2_START, TIER3_START].map((marker) => (
                <div
                  key={marker}
                  className={`absolute h-3 w-0.5 ${
                    totalContributiveYears >= marker ? 'bg-purple-200' : 'bg-gray-300'
                  }`}
                  style={{ left: `${(marker / TIER3_END) * 100}%` }}
                  title={`${marker} ${t('common.years')}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>0</span>
            <span>{TIER1_START}</span>
            <span>{TIER2_START}</span>
            <span>{TIER3_START}</span>
            <span>{TIER3_END}</span>
          </div>
        </div>

        {/* Minimum Contribution Warning */}
        {!meetsMinimumContribution && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Target className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">
                  {t('pension.stabilityTracker.minimumRequired')}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {t('pension.stabilityTracker.needMoreYears', {
                    years: Math.ceil(MINIMUM_CONTRIBUTION_YEARS - totalContributiveYears)
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tier Cards */}
        <div className="space-y-3">
          {tierData.tiers.map((tier) => {
            const colors = getTierColorClasses(tier);
            const tierProgress = tier.isLocked
              ? 0
              : Math.min(100, (tier.yearsWorked / (tier.endYear - tier.startYear + 1)) * 100);

            return (
              <div
                key={tier.tier}
                className={`${colors.bg} border ${colors.border} rounded-lg p-4 transition-all duration-200`}
                data-testid={`tier-${tier.tier}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {tier.isComplete ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : tier.isCurrent ? (
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 ${tier.isLocked ? 'border-gray-300' : 'border-gray-400'}`} />
                    )}
                    <span className={`font-medium ${colors.text}`}>
                      {tier.name}
                    </span>
                    {tier.isCurrent && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {t('pension.stabilityTracker.current')}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${colors.text}`}>
                      {formatPoints(tier.pointsPerYear)} {t('pension.stabilityTracker.pointsPerYear')}
                    </div>
                  </div>
                </div>

                {/* Tier Progress */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>
                      {t('pension.stabilityTracker.yearsRange', {
                        start: tier.startYear,
                        end: tier.endYear
                      })}
                    </span>
                    <span>
                      {formatPoints(tier.pointsEarned)} {t('common.points')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors.progress} transition-all duration-300`}
                      style={{ width: `${tierProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Tier Info */}
        {tierData.yearsToNextTier > 0 && tierData.currentTier < 4 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <ChevronRight className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium text-purple-700">
                  {t('pension.stabilityTracker.nextTier')}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {t('pension.stabilityTracker.yearsToNextTier', {
                    years: tierData.yearsToNextTier
                  })}
                  {tierData.nextTierBonus > 0 && (
                    <span className="ml-2">
                      ({formatPoints(tierData.nextTierBonus)} {t('pension.stabilityTracker.pointsPerYear')})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Max Tier Reached */}
        {tierData.currentTier === 4 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-700">
                  {t('pension.stabilityTracker.maxTierReached')}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {t('pension.stabilityTracker.congratulations')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatPoints(stabilityPoints)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('pension.stabilityTracker.totalStabilityPoints')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">
              {Math.round(totalContributiveYears)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('pension.stabilityTracker.contributionYears')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StabilityBonusTracker;
