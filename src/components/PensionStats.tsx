import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Briefcase, Activity, Compass } from 'lucide-react';
import { PensionDetails, ContributionPeriod, PensionInputs } from '../types/pensionTypes';
import { RETIREMENT_AGE, MINIMUM_CONTRIBUTION_YEARS, COMPLETE_CONTRIBUTION_YEARS, getWorkingConditionMultiplier, getWorkingConditionBonusPercentage } from '../utils/pensionCalculations';
import { calculateHistoricalContributionPoints } from '../data/historicalSalaries';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatPoints, formatYears, formatPercentage } from '../utils/formatters';
import { useGapAnalysis } from '../hooks/useGapAnalysis';
import ContributionGapAnalysis from './ContributionGapAnalysis';
import EarlyRetirementScenarios from './EarlyRetirementScenarios';
import SpecialRetirementEligibility from './SpecialRetirementEligibility';
import PensionComparisonWidget from './PensionComparisonWidget';
import PeriodSummaryTimeline from './PeriodSummaryTimeline';
import RetirementCountdown from './RetirementCountdown';
import StabilityBonusTracker from './StabilityBonusTracker';
import ContributionRecommendations from './ContributionRecommendations';
import InflationAdjustment from './InflationAdjustment';
import WhatIfScenarioPanel from './WhatIfScenarioPanel';
import PrintButton from './PrintButton';
import PrintHeader from './PrintHeader';
import PrintSummary from './PrintSummary';
import Tabs from './Tabs';
import { debouncedAnnounce, getProgressDescription } from '../utils/accessibility';

interface Props {
  pensionDetails: PensionDetails;
  inputs: PensionInputs;
}

const PensionStats: React.FC<Props> = ({
  pensionDetails,
  inputs
}) => {
  const { t } = useTranslation();
  const { gapAnalysis, hasGaps } = useGapAnalysis(inputs);
  const previousPensionRef = useRef<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'planning'>('overview');

  // Load saved tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('pensionCalculator:activeTab');
    if (savedTab && ['overview', 'progress', 'planning'].includes(savedTab)) {
      setActiveTab(savedTab as 'overview' | 'progress' | 'planning');
    }
  }, []);

  // Persist tab selection to localStorage
  useEffect(() => {
    localStorage.setItem('pensionCalculator:activeTab', activeTab);
  }, [activeTab]);

  // Update URL hash when tab changes
  useEffect(() => {
    window.location.hash = `#${activeTab}`;
  }, [activeTab]);

  // Read URL hash on mount for deep linking
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && ['overview', 'progress', 'planning'].includes(hash)) {
      setActiveTab(hash as 'overview' | 'progress' | 'planning');
    }
  }, []);

  // Announce pension changes to screen readers
  useEffect(() => {
    if (pensionDetails.monthlyPension !== previousPensionRef.current && pensionDetails.monthlyPension > 0) {
      const announcement = t('accessibility.pensionEstimateUpdate', {
        monthly: formatCurrency(pensionDetails.monthlyPension)
      });
      debouncedAnnounce(announcement, 'polite', 1000);
      previousPensionRef.current = pensionDetails.monthlyPension;
    }
  }, [pensionDetails.monthlyPension, t]);

  // Calculate points for each period using historical salary data
  const calculatePeriodPoints = (period: ContributionPeriod) => {
    if (!period.fromDate || !period.toDate) return 0;

    const years = (new Date(period.toDate).getTime() - new Date(period.fromDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (period.nonContributiveType) {
      switch (period.nonContributiveType) {
        case 'military':
        case 'university':
        case 'childCare':
          return years * 0.25; // 0.25 points per year
        case 'medical':
          return years * 0.20; // 0.20 points per year
        default:
          return 0;
      }
    } else if (period.monthlyGrossSalary) {
      // Use historical salary data for accurate calculation
      const basePoints = calculateHistoricalContributionPoints(
        period.monthlyGrossSalary,
        period.fromDate,
        period.toDate
      );
      // Apply working condition bonus multiplier
      const multiplier = getWorkingConditionMultiplier(period.workingCondition);
      return basePoints * multiplier;
    }

    return 0;
  };

  // WCAG AA Compliant validation status colors
  // All text maintains minimum 4.5:1 contrast ratio on backgrounds
  const getValidationStatus = () => {
    if (pensionDetails.error) {
      // Check if error is due to overlapping periods
      const isOverlapError = pensionDetails.error === 'overlappingPeriods';
      return {
        type: 'error',
        icon: <AlertCircle className="w-5 h-5 text-a11y-error-icon" />,
        message: isOverlapError
          ? t('pension.contributionPeriods.validation.calculationBlockedByOverlap')
          : pensionDetails.error,
        color: 'bg-a11y-error-bg-subtle border-a11y-error-border text-a11y-error-text'
      };
    }

    if (!inputs.contributionPeriods?.length) {
      return {
        type: 'warning',
        icon: <AlertCircle className="w-5 h-5 text-a11y-warning-icon" />,
        message: t('pension.stats.validation.noContributionPeriods'),
        color: 'bg-a11y-warning-bg-subtle border-a11y-warning-border text-a11y-warning-text'
      };
    }

    const contributivePeriods = inputs.contributionPeriods.filter(p => !p.nonContributiveType);
    const totalContributiveYears = contributivePeriods.reduce((sum, period) => {
      if (!period.fromDate || !period.toDate) return sum;
      const years = (new Date(period.toDate).getTime() - new Date(period.fromDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return sum + years;
    }, 0);

    if (totalContributiveYears < MINIMUM_CONTRIBUTION_YEARS) {
      return {
        type: 'warning',
        icon: <AlertCircle className="w-5 h-5 text-a11y-warning-icon" />,
        message: t('pension.stats.validation.minimumContributionYears', { years: Math.ceil(MINIMUM_CONTRIBUTION_YEARS - totalContributiveYears), minimum: MINIMUM_CONTRIBUTION_YEARS }),
        color: 'bg-a11y-warning-bg-subtle border-a11y-warning-border text-a11y-warning-text'
      };
    }

    if (totalContributiveYears < COMPLETE_CONTRIBUTION_YEARS) {
      return {
        type: 'warning',
        icon: <AlertCircle className="w-5 h-5 text-a11y-warning-icon" />,
        message: t('pension.stats.validation.completeContributionYears', { years: Math.ceil(COMPLETE_CONTRIBUTION_YEARS - totalContributiveYears), complete: COMPLETE_CONTRIBUTION_YEARS }),
        color: 'bg-a11y-warning-bg-subtle border-a11y-warning-border text-a11y-warning-text'
      };
    }

    return {
      type: 'success',
      icon: <CheckCircle className="w-5 h-5 text-a11y-success-icon" />,
      message: t('pension.stats.validation.allConditionsMet'),
      color: 'bg-a11y-success-bg-subtle border-a11y-success-border text-a11y-success-text'
    };
  };

  const validationStatus = getValidationStatus();

  // Calculate gap count for badge
  const gapCount = hasGaps ? gapAnalysis.gaps.length : 0;

  return (
    <div className="space-y-6" role="region" aria-label={t('accessibility.resultsSection')}>
      {/* Print Header - only visible when printing */}
      <PrintHeader />

      {/* Print Summary - only visible when printing, shows key results at a glance */}
      <PrintSummary pensionDetails={pensionDetails} inputs={inputs} />

      {/* Print Button - hidden when printing */}
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Status Card - Always visible */}
      <div
        className={`p-4 rounded-xl border ${validationStatus.color}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true">{validationStatus.icon}</span>
          <p className="text-sm">{validationStatus.message}</p>
        </div>
      </div>

      {/* Retirement Status - Always visible */}
      <div
        className={`${(pensionDetails.yearsUntilRetirement ?? 0) <= 0 ? 'bg-a11y-info-bg-subtle border-a11y-info-border text-a11y-info-text' : 'bg-a11y-neutral-bg-subtle border-a11y-neutral-border text-a11y-neutral-text'} p-4 rounded-xl border`}
        role="status"
      >
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-a11y-info-icon" aria-hidden="true" />
          <div>
            <h3 className="font-medium">{t('pension.stats.retirementStatus.title')}</h3>
            <p className="text-sm">
              {(pensionDetails.yearsUntilRetirement ?? 0) <= 0
                ? t('pension.stats.retirementStatus.eligible')
                : t('pension.stats.retirementStatus.yearsRemaining', { years: pensionDetails.yearsUntilRetirement })
              }
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Interface - Screen only */}
      <div className="print:hidden">
        <Tabs
          tabs={[
            { id: 'overview', label: t('tabs.overview'), icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'progress', label: t('tabs.progress'), icon: <Activity className="w-4 h-4" /> },
            { id: 'planning', label: t('tabs.planning'), icon: <Compass className="w-4 h-4" />, count: gapCount }
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'overview' | 'progress' | 'planning')}
        >
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden print-no-break">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
                <h3 className="font-medium text-gray-900 dark:text-dark-text">{t('pension.stats.timeline.title')}</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-dark-text-secondary mb-1">{t('pension.stats.timeline.currentAge')}</div>
                  <div className="text-lg font-medium dark:text-dark-text">{pensionDetails.currentAge} {t('pension.stats.timeline.years')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-dark-text-secondary mb-1">{t('pension.stats.timeline.retirementAge')}</div>
                  <div className="text-lg font-medium dark:text-dark-text">{RETIREMENT_AGE} {t('pension.stats.timeline.years')}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-dark-text-secondary mb-2">
                  <span id="contribution-progress-label">{t('pension.stats.contributionProgress.title')}</span>
                  <span>{Math.round(pensionDetails.totalContributiveYears || 0)} / {COMPLETE_CONTRIBUTION_YEARS} {t('pension.stats.contributionProgress.years')}</span>
                </div>
                <div
                  className="w-full bg-gray-100 dark:bg-dark-bg rounded-full h-2.5"
                  role="progressbar"
                  aria-valuenow={Math.round(pensionDetails.totalContributiveYears || 0)}
                  aria-valuemin={0}
                  aria-valuemax={COMPLETE_CONTRIBUTION_YEARS}
                  aria-labelledby="contribution-progress-label"
                  aria-valuetext={getProgressDescription(
                    Math.round(pensionDetails.totalContributiveYears || 0),
                    COMPLETE_CONTRIBUTION_YEARS,
                    t('pension.stats.contributionProgress.title')
                  )}
                >
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(100, ((pensionDetails.totalContributiveYears || 0) / COMPLETE_CONTRIBUTION_YEARS) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

              {/* Points Breakdown Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden print-no-break">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
                <h3 className="font-medium text-gray-900 dark:text-dark-text">{t('pension.stats.pointsBreakdown.title')}</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-dark-text-secondary">{t('pension.stats.pointsBreakdown.contribution')}</span>
                  <span className="text-sm font-medium dark:text-dark-text">{formatPoints(pensionDetails.contributionPoints)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-dark-text-secondary">{t('pension.stats.pointsBreakdown.stability')}</span>
                  <span className="text-sm font-medium dark:text-dark-text">{formatPoints(pensionDetails.stabilityPoints)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-dark-text-secondary">{t('pension.stats.pointsBreakdown.nonContributive')}</span>
                  <span className="text-sm font-medium dark:text-dark-text">{formatPoints(pensionDetails.nonContributivePoints || 0)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-dark-border mt-4">
                <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{t('pension.stats.pointsBreakdown.totalPoints')}</span>
                <span className="text-sm font-bold text-blue-600">{formatPoints(pensionDetails.totalPoints)}</span>
              </div>
            </div>
          </div>

            </div>

              {/* Right Column - Pension Estimate (Sticky) */}
              <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                <section
                  className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg border border-blue-400 overflow-hidden min-w-[280px]"
                  data-tour="pension-estimate"
                  aria-labelledby="pension-estimate-heading"
                  aria-live="polite"
                >
                  <div className="p-4 border-b border-blue-400/30 bg-white/10">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-white" aria-hidden="true" />
                      <h2 id="pension-estimate-heading" className="font-medium text-white">{t('pension.stats.pensionEstimate.title')}</h2>
                    </div>
                  </div>

                  <div className="p-6">
                    {pensionDetails.monthlyPension > 0 ? (
                      <>
                        <div className="text-center">
                          <div className="text-sm text-blue-100 mb-2" id="monthly-pension-label">{t('pension.stats.pensionEstimate.monthlyPension')}</div>
                          <div
                            className="text-3xl lg:text-4xl font-bold text-white mb-1 whitespace-nowrap"
                            aria-labelledby="monthly-pension-label"
                            role="status"
                          >
                            {formatCurrency(pensionDetails.monthlyPension)}
                          </div>
                          <div className="text-xs text-blue-200">
                            {t('pension.stats.pensionEstimate.basedOn', { points: formatPoints(pensionDetails.totalPoints) })}
                          </div>
                        </div>
                        <div className="text-center mt-6 pt-4 border-t border-blue-400/30">
                          <div className="text-sm text-blue-100 mb-2">{t('pension.stats.pensionEstimate.yearlyPension')}</div>
                          <div className="text-xl lg:text-2xl font-semibold text-white whitespace-nowrap">
                            {formatCurrency(pensionDetails.monthlyPension * 12)}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8" data-testid="pension-blocked-message" role="status">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                          {pensionDetails.error === 'overlappingPeriods' ? (
                            <AlertCircle className="w-6 h-6 text-white" />
                          ) : (
                            <Clock className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <p className="text-sm text-white/90 max-w-[240px] mx-auto">
                          {pensionDetails.error === 'overlappingPeriods'
                            ? t('pension.contributionPeriods.validation.calculationBlockedByOverlap')
                            : pensionDetails.error || t('pension.stats.pensionEstimate.completeMinimum')}
                        </p>
                      </div>
                    )}
                    <div className="text-xs text-center text-blue-100/80 pt-4 border-t border-blue-400/30 mt-4">
                      {t('pension.stats.pensionEstimate.formula')}
                    </div>
                  </div>
                </section>

                {/* National Pension Comparison Widget */}
                {pensionDetails.monthlyPension > 0 && (
                  <PensionComparisonWidget monthlyPension={pensionDetails.monthlyPension} />
                )}
              </div>
            </div>
          )}

          {/* Progress & Analysis Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* Retirement Countdown */}
              {inputs.birthDate && (
                <RetirementCountdown
                  birthDate={inputs.birthDate}
                  currentAge={pensionDetails.currentAge || 0}
                />
              )}

              {/* Stability Bonus Tracker */}
              {inputs.birthDate && inputs.contributionPeriods && inputs.contributionPeriods.length > 0 && (
                <StabilityBonusTracker
                  contributionPeriods={inputs.contributionPeriods}
                  birthDate={inputs.birthDate}
                  totalContributiveYears={pensionDetails.totalContributiveYears || 0}
                  stabilityPoints={pensionDetails.stabilityPoints}
                />
              )}

              {/* Period Summary Timeline */}
              <PeriodSummaryTimeline
                contributionPeriods={inputs.contributionPeriods || []}
                birthDate={inputs.birthDate}
              />

              {/* Period Breakdown */}
              <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
                    <h2 className="font-medium text-gray-900 dark:text-dark-text">{t('pension.stats.periodBreakdown.title')}</h2>
                  </div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-dark-border">
                  {inputs.contributionPeriods?.map((period, index) => {
                    if (!period.fromDate || !period.toDate) return null;

                    const startDate = new Date(period.fromDate);
                    const endDate = new Date(period.toDate);

                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

                    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                    const points = calculatePeriodPoints(period);
                    const pointPercentage = pensionDetails.totalPoints > 0 ? (points / pensionDetails.totalPoints) * 100 : 0;
                    const isContributive = !period.nonContributiveType;

                    return (
                      <div key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {isContributive ? (
                                <Briefcase className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-orange-500" />
                              )}
                              <h3 className="font-medium text-gray-900 dark:text-dark-text">
                                {isContributive ? period.company : t(`pension.contributionPeriods.nonContributivePeriod.${period.nonContributiveType}`)}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">
                              {format(startDate, 'MMM yyyy')} - {format(endDate, 'MMM yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-dark-text">
                              {formatPoints(points)} {t('common.points')}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                              {formatYears(years)} {t('common.years')}
                            </div>
                          </div>
                        </div>

                        {isContributive && (
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-dark-text-muted">
                            <div>
                              <span className="font-medium">{t('pension.stats.periodBreakdown.monthlyGrossSalary')}:</span>{' '}
                              {formatCurrency(period.monthlyGrossSalary || 0)}
                            </div>
                            <div>
                              <span className="font-medium">{t('pension.stats.periodBreakdown.workingCondition')}:</span>{' '}
                              {t(`pension.contributionPeriods.workingCondition.${period.workingCondition || 'normal'}`)}
                              {period.workingCondition && period.workingCondition !== 'normal' && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-a11y-success-bg text-a11y-success-text">
                                  +{getWorkingConditionBonusPercentage(period.workingCondition)}%
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {!isContributive && (
                          <div className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">
                            <span className="font-medium">{t('pension.stats.periodBreakdown.nonContributiveType')}:</span>{' '}
                            {t(`pension.contributionPeriods.nonContributivePeriod.${period.nonContributiveType}`)}
                          </div>
                        )}

                        <div className="mt-3">
                          <div className="w-full bg-gray-100 dark:bg-dark-bg rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                isContributive ? 'bg-blue-500' : 'bg-orange-500'
                              }`}
                              style={{
                                width: `${pointPercentage}%`,
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
                            {formatPercentage(pointPercentage)} {t('pension.stats.periodBreakdown.percentageOfTotal')}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(!inputs.contributionPeriods || inputs.contributionPeriods.length === 0) && (
                    <div className="p-6 text-center text-gray-500 dark:text-dark-text-muted">
                      {t('pension.stats.periodBreakdown.noPeriodsYet')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Planning & Scenarios Tab */}
          {activeTab === 'planning' && (
            <div className="space-y-6">
              {/* What-If Scenarios Panel */}
              <WhatIfScenarioPanel
                currentInputs={inputs}
                pensionDetails={pensionDetails}
                monthlyPension={pensionDetails.monthlyPension}
              />

              {/* Gap Analysis */}
              {inputs.contributionPeriods && inputs.contributionPeriods.length > 0 && (
                <ContributionGapAnalysis
                  gapAnalysis={gapAnalysis}
                  hasGaps={hasGaps}
                />
              )}

              {/* Contribution Recommendations */}
              {inputs.birthDate && inputs.contributionPeriods && inputs.contributionPeriods.length > 0 && (
                <ContributionRecommendations
                  inputs={inputs}
                  pensionDetails={pensionDetails}
                />
              )}

              {/* Early Retirement Scenarios */}
              {pensionDetails.monthlyPension > 0 && (
                <EarlyRetirementScenarios
                  monthlyPension={pensionDetails.monthlyPension}
                  currentAge={pensionDetails.currentAge || 0}
                  totalContributiveYears={pensionDetails.totalContributiveYears || 0}
                />
              )}

              {/* Inflation Impact Analysis */}
              {pensionDetails.monthlyPension > 0 && (
                <InflationAdjustment
                  monthlyPension={pensionDetails.monthlyPension}
                  yearsUntilRetirement={pensionDetails.yearsUntilRetirement}
                />
              )}

              {/* Special Retirement Eligibility */}
              {inputs.birthDate && inputs.contributionPeriods && inputs.contributionPeriods.length > 0 && (
                <SpecialRetirementEligibility
                  contributionPeriods={inputs.contributionPeriods}
                  birthDate={inputs.birthDate}
                  totalContributiveYears={pensionDetails.totalContributiveYears || 0}
                />
              )}
            </div>
          )}
        </Tabs>
      </div>

      {/* Print-only content - all tabs visible when printing */}
      <div className="hidden print:block print:space-y-6">
        {/* Overview content */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">{t('tabs.overview')}</h2>

          {/* Timeline Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
                <h3 className="font-medium text-gray-900 dark:text-dark-text">{t('pension.stats.timeline.title')}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-dark-text-secondary mb-1">{t('pension.stats.timeline.currentAge')}</div>
                  <div className="text-lg font-medium dark:text-dark-text">{pensionDetails.currentAge} {t('pension.stats.timeline.years')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-dark-text-secondary mb-1">{t('pension.stats.timeline.retirementAge')}</div>
                  <div className="text-lg font-medium dark:text-dark-text">{RETIREMENT_AGE} {t('pension.stats.timeline.years')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pension Estimate */}
          <section className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg border border-blue-400 overflow-hidden">
            <div className="p-4 border-b border-blue-400/30 bg-white/10">
              <h2 className="font-medium text-white">{t('pension.stats.pensionEstimate.title')}</h2>
            </div>
            <div className="p-6 text-center text-white">
              <div className="text-3xl font-bold">{formatCurrency(pensionDetails.monthlyPension)}</div>
              <div className="text-sm mt-2">Yearly: {formatCurrency(pensionDetails.monthlyPension * 12)}</div>
            </div>
          </section>
        </div>

        {/* Progress content */}
        <div className="space-y-6 page-break-before">
          <h2 className="text-xl font-bold">{t('tabs.progress')}</h2>
          {inputs.birthDate && (
            <RetirementCountdown
              birthDate={inputs.birthDate}
              currentAge={pensionDetails.currentAge || 0}
            />
          )}
        </div>

        {/* Planning content */}
        <div className="space-y-6 page-break-before">
          <h2 className="text-xl font-bold">{t('tabs.planning')}</h2>
          {pensionDetails.monthlyPension > 0 && (
            <EarlyRetirementScenarios
              monthlyPension={pensionDetails.monthlyPension}
              currentAge={pensionDetails.currentAge || 0}
              totalContributiveYears={pensionDetails.totalContributiveYears || 0}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PensionStats;