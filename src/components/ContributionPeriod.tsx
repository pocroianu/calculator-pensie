import React, { useMemo, useCallback, useState } from 'react';
import { X, AlertCircle, ChevronDown, ChevronUp, Trash2, Briefcase, GraduationCap, Shield, Heart, Stethoscope, Calendar, Clock, TrendingUp, Zap } from 'lucide-react';
import { ContributionPeriod as ContributionPeriodType } from '../types/pensionTypes';
import { useTranslation } from 'react-i18next';
import { ValidationError } from '../utils/validation';
import Tooltip from './Tooltip';
import TouchDatePicker from './TouchDatePicker';
import CompanyAutocomplete from './CompanyAutocomplete';
import { useTouchGestures, useIsTouchDevice, useHapticFeedback } from '../hooks/useTouchGestures';
import { getAverageSalaryForYear, CURRENT_AVERAGE_SALARY } from '../data/historicalSalaries';

interface Props {
  period: ContributionPeriodType;
  index: number;
  onUpdate: (updatedPeriod: ContributionPeriodType) => void;
  onRemove: () => void;
  errors?: ValidationError[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  allPeriods?: ContributionPeriodType[];
}

// Duration calculation helper
const calculateDuration = (fromDate: string, toDate: string): { years: number; months: number; totalMonths: number } | null => {
  if (!fromDate || !toDate) return null;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months--;
  if (months < 0) return null;
  return { years: Math.floor(months / 12), months: months % 12, totalMonths: months };
};

// Period type visual config
const getPeriodTypeConfig = (period: ContributionPeriodType) => {
  if (period.nonContributiveType) {
    switch (period.nonContributiveType) {
      case 'military': return { icon: Shield, borderAccent: 'border-l-emerald-500', bgAccent: 'bg-emerald-50/50 dark:bg-emerald-900/10', tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
      case 'university': return { icon: GraduationCap, borderAccent: 'border-l-violet-500', bgAccent: 'bg-violet-50/50 dark:bg-violet-900/10', tagColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' };
      case 'childCare': return { icon: Heart, borderAccent: 'border-l-pink-500', bgAccent: 'bg-pink-50/50 dark:bg-pink-900/10', tagColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' };
      case 'medical': return { icon: Stethoscope, borderAccent: 'border-l-amber-500', bgAccent: 'bg-amber-50/50 dark:bg-amber-900/10', tagColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    }
  }
  switch (period.workingCondition) {
    case 'groupII': return { icon: Briefcase, borderAccent: 'border-l-orange-500', bgAccent: 'bg-orange-50/50 dark:bg-orange-900/10', tagColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
    case 'groupI': return { icon: Briefcase, borderAccent: 'border-l-red-500', bgAccent: 'bg-red-50/50 dark:bg-red-900/10', tagColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    case 'specialConditions': return { icon: Shield, borderAccent: 'border-l-purple-500', bgAccent: 'bg-purple-50/50 dark:bg-purple-900/10', tagColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
    default: return { icon: Briefcase, borderAccent: 'border-l-blue-500', bgAccent: 'bg-white dark:bg-dark-bg-secondary', tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  }
};

// Salary context: how does the salary compare to national average
const getSalaryContext = (salary: number | undefined, fromDate: string): { ratio: number; label: string; color: string; bgColor: string } | null => {
  if (!salary || salary <= 0) return null;
  const year = fromDate ? new Date(fromDate).getFullYear() : new Date().getFullYear();
  const avg = getAverageSalaryForYear(year) || CURRENT_AVERAGE_SALARY;
  const ratio = salary / avg;

  if (ratio >= 2) return { ratio, label: `${ratio.toFixed(1)}×`, color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' };
  if (ratio >= 1.2) return { ratio, label: `${ratio.toFixed(1)}×`, color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
  if (ratio >= 0.8) return { ratio, label: `${ratio.toFixed(1)}×`, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/40' };
  return { ratio, label: `${ratio.toFixed(1)}×`, color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20' };
};

// Quick duration presets
const DURATION_PRESETS = [
  { label: '1y', months: 12 },
  { label: '3y', months: 36 },
  { label: '5y', months: 60 },
  { label: '10y', months: 120 },
];

const ContributionPeriod: React.FC<Props> = ({
  period, index, onUpdate, onRemove, errors = [], isCollapsed = false, onToggleCollapse, allPeriods = [],
}) => {
  const { t } = useTranslation();
  const isTouch = useIsTouchDevice();
  const { lightTap, error: errorVibrate } = useHapticFeedback();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSwipeLeft = useCallback(() => { if (isTouch) { lightTap(); setShowDeleteConfirm(true); } }, [isTouch, lightTap]);
  const handleSwipeRight = useCallback(() => { if (showDeleteConfirm) setShowDeleteConfirm(false); }, [showDeleteConfirm]);
  const handleConfirmDelete = useCallback(() => { errorVibrate(); onRemove(); }, [onRemove, errorVibrate]);
  const handleCancelDelete = useCallback(() => { setShowDeleteConfirm(false); }, []);

  const { ref: swipeRef, isSwiping, swipeOffset: gestureOffset } = useTouchGestures<HTMLDivElement>({
    onSwipeLeft: handleSwipeLeft, onSwipeRight: handleSwipeRight,
  }, { enabled: isTouch && !isCollapsed, swipeThreshold: 60 });

  const handleChange = (field: keyof ContributionPeriodType, value: any) => {
    if (field === 'nonContributiveType') {
      if (value) { onUpdate({ ...period, [field]: value, monthlyGrossSalary: 0, workingCondition: 'normal' }); }
      else { onUpdate({ ...period, [field]: value }); }
    } else { onUpdate({ ...period, [field]: value }); }
  };

  // Quick-fill end date based on start date + duration
  const handleQuickDuration = useCallback((months: number) => {
    if (!period.fromDate) return;
    lightTap();
    const start = new Date(period.fromDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    end.setDate(end.getDate() - 1);
    const today = new Date();
    const finalEnd = end > today ? today : end;
    const endStr = finalEnd.toISOString().split('T')[0];
    onUpdate({ ...period, toDate: endStr });
  }, [period, onUpdate, lightTap]);

  const hasFieldError = (fieldSuffix: string): boolean => errors.some(e => e.field.endsWith(fieldSuffix));
  const getFieldError = (fieldSuffix: string): ValidationError | undefined => errors.find(e => e.field.endsWith(fieldSuffix));

  const renderError = (fieldSuffix: string) => {
    const error = getFieldError(fieldSuffix);
    if (!error) return null;
    const translationKey = error.messageKey.replace('validation.', 'pension.contributionPeriods.validation.');
    return (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {t(translationKey, error.params)}
      </p>
    );
  };

  const hasOverlapError = errors.some(e => e.field.includes('overlap'));
  const overlapError = errors.find(e => e.field.includes('overlap'));
  const typeConfig = useMemo(() => getPeriodTypeConfig(period), [period.nonContributiveType, period.workingCondition]);
  const TypeIcon = typeConfig.icon;
  const duration = useMemo(() => calculateDuration(period.fromDate, period.toDate), [period.fromDate, period.toDate]);
  const isSalaryInvalid = !period.nonContributiveType && (!period.monthlyGrossSalary || period.monthlyGrossSalary <= 0);
  const hasDateRangeError = hasFieldError('dateRange');

  const salaryContext = useMemo(() => getSalaryContext(period.monthlyGrossSalary, period.fromDate), [period.monthlyGrossSalary, period.fromDate]);

  const completeness = useMemo(() => {
    let filled = 0, total = 2;
    if (period.fromDate) filled++;
    if (period.toDate) filled++;
    if (!period.nonContributiveType) { total += 1; if (period.monthlyGrossSalary && period.monthlyGrossSalary > 0) filled++; }
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [period]);

  const collapsedSummary = useMemo(() => {
    const parts: string[] = [];
    if (period.fromDate && period.toDate) {
      const fmt = (d: string) => { const [y, m] = d.split('-'); return `${m}/${y}`; };
      parts.push(`${fmt(period.fromDate)} — ${fmt(period.toDate)}`);
    }
    if (duration) {
      const dP: string[] = [];
      if (duration.years > 0) dP.push(`${duration.years}y`);
      if (duration.months > 0) dP.push(`${duration.months}m`);
      if (dP.length > 0) parts.push(dP.join(' '));
    }
    if (!period.nonContributiveType) {
      if (period.company) parts.push(period.company);
      if (period.monthlyGrossSalary && period.monthlyGrossSalary > 0) parts.push(`${period.monthlyGrossSalary.toLocaleString('ro-RO')} RON`);
    }
    return parts.join(' · ');
  }, [period, duration]);

  const cardClasses = useMemo(() => {
    const base = 'rounded-xl shadow-sm transition-all duration-200 swipeable-card border-l-4';
    if (hasOverlapError) return `${base} bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 border-l-red-500`;
    return `${base} border border-gray-200 dark:border-dark-border ${typeConfig.borderAccent} ${typeConfig.bgAccent}`;
  }, [hasOverlapError, typeConfig]);

  return (
    <div
      ref={swipeRef}
      className={`${cardClasses} ${isSwiping ? 'swiping' : ''} ${showDeleteConfirm ? 'border-red-400' : ''} period-card-enter`}
      data-testid={`contribution-period-${index}`}
      style={{ transform: isSwiping ? `translateX(${Math.max(-80, Math.min(0, gestureOffset.x))}px)` : 'translateX(0)' }}
    >
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-red-500 rounded-xl flex items-center justify-end px-6 z-10 animate-fade-in">
          <div className="flex items-center gap-4">
            <button onClick={handleCancelDelete} className="touch-target px-4 py-3 bg-white text-red-600 rounded-lg font-medium active:bg-gray-100">{t('common.cancel')}</button>
            <button onClick={handleConfirmDelete} className="touch-target px-4 py-3 bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 active:bg-red-800">
              <Trash2 className="w-5 h-5" />{t('common.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`flex justify-between items-center px-4 py-3 ${!isCollapsed ? 'border-b border-gray-100 dark:border-dark-border' : ''} cursor-pointer touch-feedback no-select`}
        onClick={() => { lightTap(); onToggleCollapse?.(); }}
        data-testid={`period-header-${index}`}
        role="button" tabIndex={0} aria-expanded={!isCollapsed} aria-controls={`period-content-${index}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleCollapse?.(); } }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary flex-shrink-0">
            <TypeIcon className="w-4 h-4 text-gray-600 dark:text-dark-text-muted" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-dark-text truncate">
                {period.nonContributiveType
                  ? t(`pension.contributionPeriods.nonContributivePeriod.${period.nonContributiveType}`)
                  : period.company ? period.company : `${t('pension.contributionPeriods.employmentPeriod')} ${index + 1}`}
              </h4>
              {completeness === 100 && !hasOverlapError && errors.length === 0 && (
                <span className="inline-flex items-center w-4 h-4 justify-center rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
              )}
              {completeness < 100 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">{completeness}%</span>
              )}
            </div>
            {/* Rich collapsed summary */}
            {isCollapsed && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {collapsedSummary && (
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted truncate" data-testid={`period-summary-${index}`}>{collapsedSummary}</p>
                )}
                {salaryContext && !period.nonContributiveType && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${salaryContext.bgColor} ${salaryContext.color} flex-shrink-0`}>
                    <TrendingUp className="w-2.5 h-2.5" />
                    {salaryContext.label}
                  </span>
                )}
                {!period.nonContributiveType && period.workingCondition && period.workingCondition !== 'normal' && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${typeConfig.tagColor} flex-shrink-0`}>
                    {period.workingCondition === 'groupII' ? '+25%' : '+50%'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {duration && isCollapsed && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-dark-text-muted mr-1">
              <Clock className="w-3 h-3" />
              {duration.years > 0 ? `${duration.years}y ` : ''}{duration.months > 0 ? `${duration.months}m` : duration.years > 0 ? '' : '0m'}
            </span>
          )}
          <button onClick={(e) => { e.stopPropagation(); lightTap(); onToggleCollapse?.(); }} type="button"
            aria-label={isCollapsed ? t('pension.contributionPeriods.expand') : t('pension.contributionPeriods.collapse')}
            className="touch-target-small flex items-center justify-center text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text rounded-full flex-shrink-0"
            data-testid={`collapse-toggle-${index}`}>
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (isTouch) { lightTap(); setShowDeleteConfirm(true); } else onRemove(); }} type="button"
            aria-label={t('pension.contributionPeriods.removePeriod')}
            className="touch-target-small flex items-center justify-center text-gray-300 hover:text-red-500 dark:text-dark-text-muted dark:hover:text-red-400 rounded-full flex-shrink-0 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div id={`period-content-${index}`} className="p-4 space-y-5" data-testid={`period-content-${index}`}>
          {hasOverlapError && overlapError && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{t('pension.contributionPeriods.validation.periodsOverlap', overlapError.params)}</p>
            </div>
          )}

          {/* PERIOD TYPE SELECTOR — at top for faster classification */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider mb-2">
              {t('pension.contributionPeriods.periodType')}
              <Tooltip content={t('help.tooltips.nonContributiveType')} />
            </label>
            <div className="flex flex-wrap gap-1.5" data-testid={`period-type-selector-${index}`}>
              <button type="button" onClick={() => handleChange('nonContributiveType', '')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${!period.nonContributiveType ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-text-muted hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'}`}
                data-testid={`type-employment-${index}`}>
                <Briefcase className="w-3.5 h-3.5 flex-shrink-0" /><span>{t('pension.contributionPeriods.typeEmployment')}</span>
              </button>
              {(['military', 'university', 'childCare', 'medical'] as const).map((type) => {
                const icons: Record<string, React.ElementType> = { military: Shield, university: GraduationCap, childCare: Heart, medical: Stethoscope };
                const Icon = icons[type];
                const isSelected = period.nonContributiveType === type;
                return (
                  <button key={type} type="button" onClick={() => handleChange('nonContributiveType', type)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isSelected ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-text-muted hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'}`}
                    data-testid={`type-${type}-${index}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" /><span>{t(`pension.contributionPeriods.nonContributivePeriod.${type}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DATES */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">{t('pension.contributionPeriods.dateSection')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                  {t('pension.contributionPeriods.startDate')}<span className="text-red-500">*</span>
                </label>
                <TouchDatePicker value={period.fromDate || ''} onChange={(date) => handleChange('fromDate', date)}
                  max={new Date().toISOString().split('T')[0]} data-testid={`start-date-input-${index}`}
                  error={hasFieldError('fromDate')} label={t('pension.contributionPeriods.startDate')} />
                {renderError('fromDate')}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                  {t('pension.contributionPeriods.endDate')}<span className="text-red-500">*</span>
                </label>
                <TouchDatePicker value={period.toDate || ''} onChange={(date) => handleChange('toDate', date)}
                  max={new Date().toISOString().split('T')[0]} data-testid={`end-date-input-${index}`}
                  error={hasFieldError('toDate')} label={t('pension.contributionPeriods.endDate')} />
                {renderError('toDate')}
              </div>
            </div>

            {/* Quick duration presets — show only when start date set but no end date */}
            {period.fromDate && !period.toDate && (
              <div className="mt-2.5 flex items-center gap-2 flex-wrap quick-duration-enter">
                <span className="text-xs text-gray-400 dark:text-dark-text-muted">{t('pension.contributionPeriods.quickFill')}:</span>
                {DURATION_PRESETS.map(({ label, months }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleQuickDuration(months)}
                    className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-muted hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 transition-all active:scale-95"
                    data-testid={`quick-duration-${label}-${index}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {duration && (
              <div className="mt-2.5 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg duration-display">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  {duration.years > 0 && <><span className="font-semibold text-gray-800 dark:text-dark-text">{duration.years}</span><span className="text-gray-500"> {duration.years === 1 ? t('pension.contributionPeriods.durationYear') : t('pension.contributionPeriods.durationYears')}</span></>}
                  {duration.years > 0 && duration.months > 0 && <span className="text-gray-400 mx-1">,</span>}
                  {duration.months > 0 && <><span className="font-semibold text-gray-800 dark:text-dark-text">{duration.months}</span><span className="text-gray-500"> {duration.months === 1 ? t('pension.contributionPeriods.durationMonth') : t('pension.contributionPeriods.durationMonths')}</span></>}
                  {duration.years === 0 && duration.months === 0 && <span className="text-gray-500">{t('pension.contributionPeriods.lessThanMonth')}</span>}
                </span>
              </div>
            )}

            {hasDateRangeError && (
              <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-2">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{t('pension.contributionPeriods.validation.endDateBeforeStartDate')}</p>
              </div>
            )}
          </div>

          {/* EMPLOYMENT DETAILS */}
          {!period.nonContributiveType && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">{t('pension.contributionPeriods.employmentDetails')}</span>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                  {t('pension.contributionPeriods.company')}<span className="text-xs text-gray-400 font-normal ml-1">({t('common.optional')})</span>
                </label>
                <CompanyAutocomplete value={period.company || ''} onChange={(value) => handleChange('company', value)}
                  currentPeriods={allPeriods} data-testid={`company-autocomplete-${index}`} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                  {t('pension.contributionPeriods.monthlyGrossSalary')}<span className="text-red-500">*</span>
                  <Tooltip content={t('help.tooltips.monthlyGrossSalary')} />
                </label>
                <div className="relative">
                  <input type="number" value={period.monthlyGrossSalary || ''}
                    onChange={(e) => handleChange('monthlyGrossSalary', Number(e.target.value))}
                    min={0} required inputMode="numeric" pattern="[0-9]*" placeholder="0"
                    data-testid={`salary-input-${index}`}
                    className={`w-full pl-4 pr-14 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-input dark:bg-dark-bg dark:text-dark-text ${isSalaryInvalid || hasFieldError('salary') ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-dark-border'}`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">RON</span>
                </div>

                {/* Salary context indicator */}
                {salaryContext && (
                  <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg ${salaryContext.bgColor} salary-context-enter`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${salaryContext.color}`}>
                          {salaryContext.label} {t('pension.contributionPeriods.vsNationalAvg')}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            salaryContext.ratio >= 2 ? 'bg-emerald-500' :
                            salaryContext.ratio >= 1.2 ? 'bg-blue-500' :
                            salaryContext.ratio >= 0.8 ? 'bg-gray-400' :
                            'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (salaryContext.ratio / 3) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${salaryContext.color}`} />
                  </div>
                )}

                {isSalaryInvalid && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{t('pension.contributionPeriods.validation.monthlyGrossSalaryRequired')}</p>
                )}
                {hasFieldError('salary') && !isSalaryInvalid && renderError('salary')}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                  {t('pension.contributionPeriods.workingCondition.label')}
                  <Tooltip content={t('help.tooltips.workingCondition')} />
                </label>
                <div className="grid grid-cols-2 gap-2" data-testid={`working-condition-selector-${index}`}>
                  {([
                    { value: 'normal' as const, bonus: null },
                    { value: 'groupII' as const, bonus: '+25%' },
                    { value: 'groupI' as const, bonus: '+50%' },
                    { value: 'specialConditions' as const, bonus: '+50%' },
                  ]).map(({ value, bonus }) => {
                    const isSelected = (period.workingCondition || 'normal') === value;
                    return (
                      <button key={value} type="button" onClick={() => handleChange('workingCondition', value)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${isSelected ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-muted hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'}`}
                        data-testid={`working-condition-${value}-${index}`}>
                        <span className="font-medium truncate">{t(`pension.contributionPeriods.workingCondition.${value}Short`)}</span>
                        {bonus && <span className={`ml-1 text-xs font-bold flex-shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400'}`}>{bonus}</span>}
                      </button>
                    );
                  })}
                </div>
                {period.workingCondition && period.workingCondition !== 'normal' && (
                  <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {t('pension.contributionPeriods.workingCondition.bonusApplied', { bonus: period.workingCondition === 'groupII' ? '25%' : '50%' })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Completion progress bar at bottom */}
          {completeness < 100 && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
              <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-400 dark:text-dark-text-muted whitespace-nowrap">
                {t('pension.contributionPeriods.completionLabel', { percent: completeness })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContributionPeriod;
