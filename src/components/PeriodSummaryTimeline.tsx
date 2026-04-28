import React, { useMemo } from 'react';
import { Calendar, Briefcase, Clock, GraduationCap, Heart, Shield, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContributionPeriod } from '../types/pensionTypes';
import { format, differenceInMonths } from 'date-fns';
import * as Tooltip from '@radix-ui/react-tooltip';
import { formatCurrency, formatYears } from '../utils/formatters';

interface Props {
  contributionPeriods: ContributionPeriod[];
  birthDate?: string;
}

interface TimelineEntry {
  period: ContributionPeriod;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  type: 'employment' | 'nonContributive';
  periodIndex: number;
}

// Color mapping for different period types
const getPeriodColor = (period: ContributionPeriod): { bg: string; border: string; text: string; dot: string } => {
  if (period.nonContributiveType) {
    switch (period.nonContributiveType) {
      case 'military':
        return { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'university':
        return { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', dot: 'bg-violet-500' };
      case 'childCare':
        return { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700', dot: 'bg-pink-500' };
      case 'medical':
        return { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', dot: 'bg-gray-500' };
    }
  }

  // Employment periods - color by working condition
  switch (period.workingCondition) {
    case 'groupI':
      return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-500' };
    case 'groupII':
      return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-500' };
    case 'specialConditions':
      return { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', dot: 'bg-purple-500' };
    default:
      return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', dot: 'bg-blue-500' };
  }
};

// Get icon for period type
const getPeriodIcon = (period: ContributionPeriod): React.ReactNode => {
  if (period.nonContributiveType) {
    switch (period.nonContributiveType) {
      case 'military':
        return <Shield className="w-4 h-4" />;
      case 'university':
        return <GraduationCap className="w-4 h-4" />;
      case 'childCare':
        return <Heart className="w-4 h-4" />;
      case 'medical':
        return <Stethoscope className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  }
  return <Briefcase className="w-4 h-4" />;
};

const PeriodSummaryTimeline: React.FC<Props> = ({ contributionPeriods, birthDate }) => {
  const { t } = useTranslation();

  // Process and sort periods chronologically
  const timelineEntries = useMemo((): TimelineEntry[] => {
    if (!contributionPeriods?.length) return [];

    return contributionPeriods
      .map((period, index) => {
        if (!period.fromDate || !period.toDate) return null;

        const startDate = new Date(period.fromDate);
        const endDate = new Date(period.toDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

        const durationMonths = differenceInMonths(endDate, startDate);

        return {
          period,
          startDate,
          endDate,
          durationMonths: Math.max(1, durationMonths),
          type: period.nonContributiveType ? 'nonContributive' : 'employment',
          periodIndex: index
        } as TimelineEntry;
      })
      .filter((entry): entry is TimelineEntry => entry !== null)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [contributionPeriods]);

  // Calculate timeline span
  const timelineSpan = useMemo(() => {
    if (timelineEntries.length === 0) return null;

    const firstStart = timelineEntries[0].startDate;
    const lastEnd = timelineEntries[timelineEntries.length - 1].endDate;
    const totalMonths = differenceInMonths(lastEnd, firstStart) || 1;

    return { firstStart, lastEnd, totalMonths };
  }, [timelineEntries]);

  // Calculate total years by type
  const totals = useMemo(() => {
    const employment = timelineEntries
      .filter(e => e.type === 'employment')
      .reduce((sum, e) => sum + e.durationMonths / 12, 0);

    const nonContributive = timelineEntries
      .filter(e => e.type === 'nonContributive')
      .reduce((sum, e) => sum + e.durationMonths / 12, 0);

    return { employment, nonContributive, total: employment + nonContributive };
  }, [timelineEntries]);

  if (!timelineEntries.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">{t('pension.periodSummary.title')}</h3>
          </div>
        </div>
        <div className="p-6 text-center text-gray-500">
          {t('pension.periodSummary.noPeriods')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">{t('pension.periodSummary.title')}</h3>
          </div>
          <div className="text-sm text-gray-500">
            {timelineEntries.length} {timelineEntries.length === 1 ? t('pension.periodSummary.period') : t('pension.periodSummary.periods')}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-700">{formatYears(totals.employment)}</div>
            <div className="text-xs text-blue-600">{t('pension.periodSummary.employment')}</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-semibold text-orange-700">{formatYears(totals.nonContributive)}</div>
            <div className="text-xs text-orange-600">{t('pension.periodSummary.nonContributive')}</div>
          </div>
          <div className="text-center p-3 bg-gray-100 rounded-lg">
            <div className="text-lg font-semibold text-gray-700">{formatYears(totals.total)}</div>
            <div className="text-xs text-gray-600">{t('pension.periodSummary.totalYears')}</div>
          </div>
        </div>

        {/* Visual Timeline Bar */}
        {timelineSpan && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{format(timelineSpan.firstStart, 'MMM yyyy')}</span>
              <span>{format(timelineSpan.lastEnd, 'MMM yyyy')}</span>
            </div>
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              {timelineEntries.map((entry, index) => {
                const offsetPercent = (differenceInMonths(entry.startDate, timelineSpan.firstStart) / timelineSpan.totalMonths) * 100;
                const widthPercent = Math.max(2, (entry.durationMonths / timelineSpan.totalMonths) * 100);
                const colors = getPeriodColor(entry.period);

                return (
                  <Tooltip.Provider key={index}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div
                          className={`absolute h-full ${colors.dot} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                          style={{
                            left: `${offsetPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: '4px'
                          }}
                          data-testid={`timeline-bar-${index}`}
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="top"
                          className="bg-gray-900 text-white text-xs rounded px-2 py-1 max-w-xs z-50"
                          sideOffset={5}
                        >
                          <div className="font-medium">
                            {entry.period.nonContributiveType
                              ? t(`pension.contributionPeriods.nonContributivePeriod.${entry.period.nonContributiveType}`)
                              : entry.period.company || t('pension.contributionPeriods.employmentPeriod')}
                          </div>
                          <div>{format(entry.startDate, 'MMM yyyy')} - {format(entry.endDate, 'MMM yyyy')}</div>
                          <Tooltip.Arrow className="fill-gray-900" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                );
              })}
            </div>
          </div>
        )}

        {/* Period List */}
        <div className="space-y-3">
          {timelineEntries.map((entry, index) => {
            const colors = getPeriodColor(entry.period);
            const years = entry.durationMonths / 12;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border} transition-all hover:shadow-sm`}
                data-testid={`timeline-entry-${index}`}
              >
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                  {index < timelineEntries.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 -mb-8 mt-1" />
                  )}
                </div>

                {/* Icon */}
                <div className={`${colors.text}`}>
                  {getPeriodIcon(entry.period)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${colors.text} truncate`}>
                    {entry.period.nonContributiveType
                      ? t(`pension.contributionPeriods.nonContributivePeriod.${entry.period.nonContributiveType}`)
                      : entry.period.company || t('pension.contributionPeriods.employmentPeriod')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(entry.startDate, 'MMM yyyy')} - {format(entry.endDate, 'MMM yyyy')}
                  </div>
                </div>

                {/* Duration and details */}
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-medium ${colors.text}`}>
                    {formatYears(years)} {t('common.years')}
                  </div>
                  {!entry.period.nonContributiveType && entry.period.monthlyGrossSalary && (
                    <div className="text-xs text-gray-500">
                      {formatCurrency(entry.period.monthlyGrossSalary)}
                    </div>
                  )}
                  {!entry.period.nonContributiveType && entry.period.workingCondition && entry.period.workingCondition !== 'normal' && (
                    <div className="text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {t(`pension.contributionPeriods.workingCondition.${entry.period.workingCondition}`).split(' - ')[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">{t('pension.periodSummary.legend')}</div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">{t('pension.contributionPeriods.workingCondition.normal')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-600">{t('pension.periodSummary.legendGroupII')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">{t('pension.periodSummary.legendGroupI')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-gray-600">{t('pension.periodSummary.legendSpecial')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600">{t('pension.contributionPeriods.nonContributivePeriod.military')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-xs text-gray-600">{t('pension.contributionPeriods.nonContributivePeriod.university')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-xs text-gray-600">{t('pension.contributionPeriods.nonContributivePeriod.childCare')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">{t('pension.contributionPeriods.nonContributivePeriod.medical')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodSummaryTimeline;
