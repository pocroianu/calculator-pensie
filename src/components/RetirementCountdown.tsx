import React, { useMemo } from 'react';
import { Timer, Target, Award, CalendarDays, TrendingUp, PartyPopper } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, differenceInMonths, differenceInYears, addYears } from 'date-fns';
import { RETIREMENT_AGE } from '../utils/pensionCalculations';

interface Props {
  birthDate: string;
  currentAge: number;
}

interface CountdownTime {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

interface Milestone {
  yearsRemaining: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  reached: boolean;
}

const RetirementCountdown: React.FC<Props> = ({ birthDate }) => {
  const { t } = useTranslation();

  const countdown = useMemo((): CountdownTime | null => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);

    // Calculate retirement date (birthDate + RETIREMENT_AGE years)
    const retirementDate = addYears(birth, RETIREMENT_AGE);

    // If already retired
    if (today >= retirementDate) {
      return null;
    }

    // Calculate differences
    const totalDays = differenceInDays(retirementDate, today);
    const years = differenceInYears(retirementDate, today);

    // For months: get the date after subtracting years
    const afterYears = addYears(today, years);
    const months = differenceInMonths(retirementDate, afterYears);

    // For days: get remaining days after years and months
    const afterMonths = new Date(afterYears);
    afterMonths.setMonth(afterMonths.getMonth() + months);
    const days = differenceInDays(retirementDate, afterMonths);

    return {
      years,
      months,
      days,
      totalDays
    };
  }, [birthDate]);

  const progressPercentage = useMemo(() => {
    if (!birthDate) return 0;

    const birth = new Date(birthDate);
    const today = new Date();
    const retirementDate = addYears(birth, RETIREMENT_AGE);

    // Career span from 18 years old to retirement
    const careerStartDate = addYears(birth, 18);
    const totalCareerDays = differenceInDays(retirementDate, careerStartDate);
    const daysWorked = differenceInDays(today, careerStartDate);

    if (daysWorked <= 0) return 0;
    if (daysWorked >= totalCareerDays) return 100;

    return Math.min(100, Math.max(0, (daysWorked / totalCareerDays) * 100));
  }, [birthDate]);

  const milestones = useMemo((): Milestone[] => {
    const yearsRemaining = countdown?.years ?? 0;

    return [
      {
        yearsRemaining: 20,
        label: t('pension.countdown.milestones.twentyYears'),
        icon: <Target className="w-4 h-4" />,
        color: 'text-gray-400',
        reached: yearsRemaining <= 20
      },
      {
        yearsRemaining: 10,
        label: t('pension.countdown.milestones.tenYears'),
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-blue-500',
        reached: yearsRemaining <= 10
      },
      {
        yearsRemaining: 5,
        label: t('pension.countdown.milestones.fiveYears'),
        icon: <Award className="w-4 h-4" />,
        color: 'text-orange-500',
        reached: yearsRemaining <= 5
      },
      {
        yearsRemaining: 1,
        label: t('pension.countdown.milestones.oneYear'),
        icon: <PartyPopper className="w-4 h-4" />,
        color: 'text-green-500',
        reached: yearsRemaining <= 1
      }
    ];
  }, [countdown, t]);

  // If already retired, show congratulations message - WCAG AA Compliant
  if (!countdown) {
    return (
      <div className="bg-gradient-to-r from-a11y-success-bg-subtle to-a11y-emerald-bg-subtle rounded-xl shadow-sm border border-a11y-success-border overflow-hidden" data-testid="retirement-countdown">
        <div className="p-4 border-b border-a11y-success-border bg-a11y-success-bg">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-a11y-success-icon" />
            <h3 className="font-medium text-a11y-success-text">{t('pension.countdown.title')}</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="text-a11y-success-text font-semibold text-lg">
            {t('pension.countdown.alreadyEligible')}
          </div>
          <p className="text-sm text-a11y-success-text mt-2">
            {t('pension.countdown.congratulations')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-testid="retirement-countdown">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium text-gray-900">{t('pension.countdown.title')}</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Countdown Display - WCAG AA Compliant */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Years */}
          <div className="bg-a11y-info-bg rounded-lg p-4 border border-a11y-info-border">
            <div className="text-3xl font-bold text-a11y-info-text" data-testid="countdown-years">
              {countdown.years}
            </div>
            <div className="text-sm text-a11y-info-text font-medium mt-1">
              {t('pension.countdown.years')}
            </div>
          </div>

          {/* Months */}
          <div className="bg-a11y-orange-bg rounded-lg p-4 border border-a11y-orange-border">
            <div className="text-3xl font-bold text-a11y-orange-text" data-testid="countdown-months">
              {countdown.months}
            </div>
            <div className="text-sm text-a11y-orange-text font-medium mt-1">
              {t('pension.countdown.months')}
            </div>
          </div>

          {/* Days */}
          <div className="bg-a11y-success-bg rounded-lg p-4 border border-a11y-success-border">
            <div className="text-3xl font-bold text-a11y-success-text" data-testid="countdown-days">
              {countdown.days}
            </div>
            <div className="text-sm text-a11y-success-text font-medium mt-1">
              {t('pension.countdown.days')}
            </div>
          </div>
        </div>

        {/* Total days info */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <CalendarDays className="w-4 h-4" />
          <span>
            {t('pension.countdown.totalDays', { days: countdown.totalDays.toLocaleString() })}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('pension.countdown.progressToRetirement')}</span>
            <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
                data-testid="progress-bar"
              />
            </div>
            {/* Milestone markers on progress bar */}
            <div className="absolute inset-0 flex items-center">
              {[25, 50, 75].map((marker) => (
                <div
                  key={marker}
                  className={`absolute h-3 w-0.5 ${
                    progressPercentage >= marker ? 'bg-blue-200' : 'bg-gray-300'
                  }`}
                  style={{ left: `${marker}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{t('pension.countdown.careerStart')}</span>
            <span>{t('pension.countdown.retirement')}</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            {t('pension.countdown.milestonesTitle')}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  milestone.reached
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-100'
                }`}
                data-testid={`milestone-${milestone.yearsRemaining}`}
              >
                <span className={milestone.reached ? 'text-green-500' : milestone.color}>
                  {milestone.icon}
                </span>
                <span className={milestone.reached ? 'text-green-700' : 'text-gray-600'}>
                  {milestone.label}
                </span>
                {milestone.reached && (
                  <span className="ml-auto text-green-500 text-xs">&#10003;</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Motivational message based on progress */}
        <div className="text-center text-sm text-gray-500 italic pt-2 border-t border-gray-100">
          {countdown.years > 15 && t('pension.countdown.messages.longWay')}
          {countdown.years <= 15 && countdown.years > 10 && t('pension.countdown.messages.goodProgress')}
          {countdown.years <= 10 && countdown.years > 5 && t('pension.countdown.messages.halfwayThere')}
          {countdown.years <= 5 && countdown.years > 1 && t('pension.countdown.messages.almostThere')}
          {countdown.years <= 1 && t('pension.countdown.messages.finalStretch')}
        </div>
      </div>
    </div>
  );
};

export default RetirementCountdown;
