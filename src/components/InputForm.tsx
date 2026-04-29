import { useMemo, useState, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { CalendarDays, Plus, Clock, AlertCircle, AlertTriangle, ChevronUp, ChevronDown, Smartphone, FileText, Briefcase, CheckCircle2, ArrowRight } from 'lucide-react';
import { PensionInputs, ContributionPeriod as ContributionPeriodType } from '../types/pensionTypes';
import ContributionPeriod from './ContributionPeriod';
import PeriodTemplatesPanel from './PeriodTemplatesPanel';
import SaveTemplateModal from './SaveTemplateModal';
import Tooltip from './Tooltip';
import ShortcutHint from './ShortcutHint';
import TouchDatePicker from './TouchDatePicker';
import { RETIREMENT_AGE } from '../utils/pensionCalculations';
import { useTranslation } from 'react-i18next';
import {
  validatePensionForm,
  isValidRetirementYear,
  isValidDate,
  isDateInFuture,
  FormValidationResult
} from '../utils/validation';
import { useIsTouchDevice, useHapticFeedback } from '../hooks/useTouchGestures';
import { useToast } from '../contexts/ToastContext';

interface InputFormProps {
  inputs: PensionInputs;
  onChange: <K extends keyof PensionInputs>(field: K, value: PensionInputs[K]) => void;
}

export interface InputFormRef {
  addPeriod: () => void;
  focusBirthDate: () => void;
  focusRetirementYear: () => void;
  focusContributionPeriods: () => void;
  collapseAll: () => void;
  expandAll: () => void;
}

// Calculate total contribution years from periods
const calculateTotalYears = (periods: ContributionPeriodType[]): number => {
  if (!periods || periods.length === 0) return 0;
  let totalMonths = 0;
  periods.forEach(p => {
    if (p.fromDate && p.toDate) {
      const start = new Date(p.fromDate);
      const end = new Date(p.toDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      }
    }
  });
  return totalMonths / 12;
};

const InputForm = forwardRef<InputFormRef, InputFormProps>(({
  inputs,
  onChange
}, ref) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const isTouch = useIsTouchDevice();
  const { lightTap } = useHapticFeedback();

  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const retirementYearInputRef = useRef<HTMLInputElement>(null);
  const addPeriodButtonRef = useRef<HTMLButtonElement>(null);

  const [collapsedPeriods, setCollapsedPeriods] = useState<Set<number>>(new Set());
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);

  const validationResult: FormValidationResult = useMemo(() => {
    return validatePensionForm(inputs);
  }, [inputs]);

  const togglePeriodCollapse = useCallback((index: number) => {
    setCollapsedPeriods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  }, []);

  const allCollapsed = useMemo(() => {
    const count = inputs.contributionPeriods?.length || 0;
    return count > 0 && collapsedPeriods.size === count;
  }, [collapsedPeriods, inputs.contributionPeriods?.length]);

  const allExpanded = useMemo(() => collapsedPeriods.size === 0, [collapsedPeriods]);

  const collapseAll = useCallback(() => {
    setCollapsedPeriods(new Set((inputs.contributionPeriods || []).map((_, i) => i)));
  }, [inputs.contributionPeriods]);

  const expandAll = useCallback(() => { setCollapsedPeriods(new Set()); }, []);

  // Smart add period - starts where the last period ended
  const handleAddPeriod = useCallback(() => {
    const existingPeriods = inputs.contributionPeriods || [];
    let smartStartDate = '';

    // Find the latest end date among existing periods
    if (existingPeriods.length > 0) {
      const lastPeriod = existingPeriods[existingPeriods.length - 1];
      if (lastPeriod.toDate) {
        // Start the new period the day after the last one ended
        const lastEnd = new Date(lastPeriod.toDate);
        if (!isNaN(lastEnd.getTime())) {
          lastEnd.setDate(lastEnd.getDate() + 1);
          smartStartDate = lastEnd.toISOString().split('T')[0];
        }
      }
    }

    const newPeriod: ContributionPeriodType = {
      fromDate: smartStartDate,
      toDate: '',
      company: '',
      monthlyGrossSalary: 0,
      workingCondition: 'normal'
    };

    // Collapse existing periods and expand the new one
    const newPeriodIndex = existingPeriods.length;
    setCollapsedPeriods(prev => {
      const newSet = new Set(prev);
      existingPeriods.forEach((_, i) => newSet.add(i));
      newSet.delete(newPeriodIndex);
      return newSet;
    });

    onChange('contributionPeriods', [...existingPeriods, newPeriod]);
    showToast('success', 'toast.actions.periodAdded');
  }, [inputs.contributionPeriods, onChange, showToast]);

  const handleAddPeriodFromTemplate = useCallback((period: ContributionPeriodType) => {
    const existingPeriods = inputs.contributionPeriods || [];
    const newPeriodIndex = existingPeriods.length;

    // Collapse existing, expand new
    setCollapsedPeriods(prev => {
      const newSet = new Set(prev);
      existingPeriods.forEach((_, i) => newSet.add(i));
      newSet.delete(newPeriodIndex);
      return newSet;
    });

    onChange('contributionPeriods', [...existingPeriods, period]);
    showToast('success', 'toast.actions.periodAdded');
  }, [inputs.contributionPeriods, onChange, showToast]);

  useImperativeHandle(ref, () => ({
    addPeriod: handleAddPeriod,
    focusBirthDate: () => { birthDateInputRef.current?.focus(); birthDateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    focusRetirementYear: () => { retirementYearInputRef.current?.focus(); retirementYearInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    focusContributionPeriods: () => { addPeriodButtonRef.current?.focus(); addPeriodButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    collapseAll,
    expandAll,
  }), [handleAddPeriod, collapseAll, expandAll]);

  const handleUpdatePeriod = (index: number, updatedPeriod: ContributionPeriodType) => {
    const newPeriods = [...(inputs.contributionPeriods || [])];
    newPeriods[index] = updatedPeriod;
    onChange('contributionPeriods', newPeriods);
  };

  const handleRemovePeriod = useCallback((index: number) => {
    const newPeriods = (inputs.contributionPeriods || []).filter((_, i) => i !== index);
    onChange('contributionPeriods', newPeriods);
    // Adjust collapsed set for removed index
    setCollapsedPeriods(prev => {
      const newSet = new Set<number>();
      prev.forEach(i => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
    showToast('info', 'toast.actions.periodRemoved');
  }, [inputs.contributionPeriods, onChange, showToast]);

  const calculateSuggestedRetirementYear = () => {
    if (!inputs.birthDate) return null;
    const birthYear = new Date(inputs.birthDate).getFullYear();
    return birthYear + RETIREMENT_AGE;
  };

  const suggestedRetirementYear = calculateSuggestedRetirementYear();

  const birthDateError = useMemo(() => {
    if (!inputs.birthDate) return null;
    if (!isValidDate(inputs.birthDate)) return t('validation.invalidDate');
    if (isDateInFuture(inputs.birthDate)) return t('validation.birthDateInFuture');
    return null;
  }, [inputs.birthDate, t]);

  const retirementYearError = useMemo(() => {
    if (!inputs.retirementYear) return null;
    const validation = isValidRetirementYear(inputs.retirementYear, inputs.birthDate);
    if (!validation.valid && validation.reason) return t(`validation.${validation.reason}`);
    return null;
  }, [inputs.retirementYear, inputs.birthDate, t]);

  const getPeriodErrors = (index: number) => validationResult.periodErrors.get(index) || [];

  // Contribution progress
  const totalYears = useMemo(() => calculateTotalYears(inputs.contributionPeriods || []), [inputs.contributionPeriods]);
  const minYears = 15;
  const completeYears = 35;
  const progressPercent = Math.min(100, (totalYears / completeYears) * 100);
  const periodsCount = inputs.contributionPeriods?.length || 0;

  // Count completed periods
  const completedPeriodsCount = useMemo(() => {
    return (inputs.contributionPeriods || []).filter(p => {
      if (!p.fromDate || !p.toDate) return false;
      if (p.nonContributiveType) return true;
      return p.monthlyGrossSalary && p.monthlyGrossSalary > 0;
    }).length;
  }, [inputs.contributionPeriods]);

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <section
        className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden"
        aria-labelledby="personal-info-heading"
      >
        <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" aria-hidden="true" />
            <h2 id="personal-info-heading" className="font-medium text-gray-900 dark:text-dark-text">{t('pension.personalInfo.title')}</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="birthDate" className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text mb-1.5">
              {t('pension.personalInfo.birthDate')}
              <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">{t('accessibility.requiredField')}</span>
              <Tooltip content={t('help.tooltips.birthDate')} />
            </label>
            <TouchDatePicker
              value={inputs.birthDate}
              onChange={(date) => onChange('birthDate', date)}
              max={new Date().toISOString().split('T')[0]}
              data-testid="birth-date-input"
              error={!!birthDateError}
              label={t('pension.personalInfo.birthDate')}
              aria-describedby={birthDateError ? 'birth-date-error' : undefined}
              aria-invalid={!!birthDateError}
            />
            {birthDateError && (
              <p id="birth-date-error" role="alert" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {birthDateError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="retirement-year" className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text mb-1.5">
              {t('pension.personalInfo.plannedRetirementYear')}
              <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">{t('accessibility.requiredField')}</span>
              <Tooltip content={t('help.tooltips.retirementYear')} />
            </label>
            <div className="relative">
              <input
                ref={retirementYearInputRef}
                id="retirement-year"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                data-testid="retirement-year-input"
                value={inputs.retirementYear}
                onChange={(e) => onChange('retirementYear', Number(e.target.value))}
                min={new Date().getFullYear()}
                aria-describedby={retirementYearError ? 'retirement-year-error' : 'retirement-year-hint'}
                aria-invalid={!!retirementYearError}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-input dark:bg-dark-bg dark:text-dark-text ${
                  retirementYearError ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-dark-border'
                }`}
              />
              <span id="retirement-year-hint" className="sr-only">{t('help.tooltips.retirementYear')}</span>
              {suggestedRetirementYear && inputs.retirementYear !== suggestedRetirementYear && !retirementYearError && (
                <button
                  onClick={() => { lightTap(); onChange('retirementYear', suggestedRetirementYear); }}
                  type="button"
                  aria-label={t('pension.personalInfo.use2061', { year: suggestedRetirementYear })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 active:bg-blue-100 bg-blue-50 px-3 py-2 rounded-lg touch-target-small"
                >
                  {t('pension.personalInfo.use2061', { year: suggestedRetirementYear })}
                </button>
              )}
            </div>
            {retirementYearError && (
              <p id="retirement-year-error" role="alert" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {retirementYearError}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Period Templates Panel */}
      <PeriodTemplatesPanel
        onApplyTemplate={handleAddPeriodFromTemplate}
        onOpenSaveModal={() => setIsSaveTemplateModalOpen(true)}
      />

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
      />

      {/* Contribution Periods Section */}
      <section
        className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden"
        aria-labelledby="contribution-periods-heading"
      >
        <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" aria-hidden="true" />
              <h2 id="contribution-periods-heading" className="font-medium text-gray-900 dark:text-dark-text">{t('pension.contributionPeriods.title')}</h2>
              {periodsCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {completedPeriodsCount}/{periodsCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {inputs.contributionPeriods && inputs.contributionPeriods.length >= 2 && (
                <div className="flex items-center gap-1" role="group" aria-label={t('pension.contributionPeriods.expandAll')}>
                  <button onClick={expandAll} disabled={allExpanded} data-testid="expand-all-button"
                    aria-label={t('pension.contributionPeriods.expandAll')}
                    className={`p-1.5 rounded-lg transition-colors ${allExpanded ? 'text-gray-300 dark:text-dark-text-muted cursor-not-allowed' : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'}`}>
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button onClick={collapseAll} disabled={allCollapsed} data-testid="collapse-all-button"
                    aria-label={t('pension.contributionPeriods.collapseAll')}
                    className={`p-1.5 rounded-lg transition-colors ${allCollapsed ? 'text-gray-300 dark:text-dark-text-muted cursor-not-allowed' : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'}`}>
                    <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}
              <button
                ref={addPeriodButtonRef}
                onClick={() => { lightTap(); handleAddPeriod(); }}
                type="button" data-testid="add-period-button"
                aria-label={t('pension.contributionPeriods.addPeriod')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors touch-target"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                {t('pension.contributionPeriods.addPeriod')}
                <ShortcutHint shortcutId="addPeriod" inline />
              </button>
            </div>
          </div>

          {/* Contribution Progress Bar */}
          {periodsCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-dark-text-muted">
                  {t('pension.contributionPeriods.progressLabel')}
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-text">
                  {totalYears.toFixed(1)} / {completeYears} {t('common.years')}
                </span>
              </div>
              <div className="relative h-2 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full overflow-hidden">
                {/* Min years marker */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-gray-400 dark:bg-gray-500 z-10"
                  style={{ left: `${(minYears / completeYears) * 100}%` }}
                  title={`${minYears} ${t('common.years')} (${t('pension.contributionPeriods.minimumLabel')})`}
                />
                {/* Progress fill */}
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    totalYears >= completeYears
                      ? 'bg-green-500'
                      : totalYears >= minYears
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(totalYears)}
                  aria-valuemin={0}
                  aria-valuemax={completeYears}
                  aria-label={t('pension.contributionPeriods.progressLabel')}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">{minYears}y min</span>
                <span className="text-[10px] text-gray-400">{completeYears}y</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Overlap Warning Banner */}
          {validationResult.hasOverlaps && (
            <div className="mb-4 bg-a11y-error-bg border border-a11y-error-border rounded-lg p-4" data-testid="overlap-warning-banner" role="alert" aria-live="assertive">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-a11y-error-icon flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-a11y-error-text">{t('pension.contributionPeriods.validation.overlapWarningTitle')}</h3>
                  <p className="text-sm text-a11y-error-text mt-1">{t('pension.contributionPeriods.validation.overlapWarningDescription')}</p>
                  <ul className="mt-2 space-y-1">
                    {validationResult.overlappingPeriods.map(([i, j], idx) => (
                      <li key={idx} className="text-sm text-a11y-error-text flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-a11y-error-icon rounded-full" aria-hidden="true" />
                        {t('pension.contributionPeriods.validation.overlapSummary', { period1: i + 1, period2: j + 1 })}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(inputs.contributionPeriods || []).map((period, index) => (
              <ContributionPeriod
                key={index}
                index={index}
                period={period}
                onUpdate={(updatedPeriod: ContributionPeriodType) => handleUpdatePeriod(index, updatedPeriod)}
                onRemove={() => handleRemovePeriod(index)}
                errors={getPeriodErrors(index)}
                isCollapsed={collapsedPeriods.has(index)}
                onToggleCollapse={() => togglePeriodCollapse(index)}
                allPeriods={inputs.contributionPeriods}
              />
            ))}

            {/* Inline add-another button after existing periods */}
            {periodsCount > 0 && (
              <button
                onClick={() => { lightTap(); handleAddPeriod(); }}
                type="button"
                data-testid="add-another-period-button"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all active:scale-[0.99] touch-target"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                {t('pension.contributionPeriods.addPeriod')}
              </button>
            )}

            {/* Empty State — guided onboarding */}
            {(!inputs.contributionPeriods || inputs.contributionPeriods.length === 0) && (
              <div className="py-10 px-4 empty-state-enter" role="status">
                <div className="max-w-sm mx-auto text-center">
                  {/* Step indicator */}
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${inputs.birthDate ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-dark-bg-tertiary dark:text-dark-text-muted'}`}>
                      {inputs.birthDate ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
                    </span>
                    <div className="w-8 h-px bg-gray-200 dark:bg-dark-border" />
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${inputs.retirementYear ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-dark-bg-tertiary dark:text-dark-text-muted'}`}>
                      {inputs.retirementYear ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
                    </span>
                    <div className="w-8 h-px bg-gray-200 dark:bg-dark-border" />
                    <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-200 dark:ring-blue-800">3</span>
                  </div>

                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 mb-4" aria-hidden="true">
                    <Briefcase className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-dark-text mb-1">{t('pension.contributionPeriods.emptyTitle')}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-6 max-w-xs mx-auto leading-relaxed">
                    {t('pension.contributionPeriods.emptyDescription')}
                  </p>

                  {/* Quick-start actions */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => { lightTap(); handleAddPeriod(); }}
                      type="button" data-testid="add-first-period-button"
                      className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all touch-target shadow-sm hover:shadow-md group"
                    >
                      <Briefcase className="w-4 h-4" aria-hidden="true" />
                      {t('pension.contributionPeriods.addEmployment')}
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        lightTap();
                        const newPeriod: ContributionPeriodType = {
                          fromDate: '',
                          toDate: '',
                          nonContributiveType: 'university',
                          monthlyGrossSalary: 0,
                          workingCondition: 'normal'
                        };
                        onChange('contributionPeriods', [newPeriod]);
                        showToast('success', 'toast.actions.periodAdded');
                      }}
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-gray-600 dark:text-dark-text-secondary bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors touch-target"
                    >
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      {t('pension.contributionPeriods.addNonContributive')}
                    </button>
                  </div>

                  {isTouch && (
                    <p className="text-xs text-gray-400 dark:text-dark-text-muted mt-4 flex items-center justify-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                      {t('common.swipeToDelete')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
});

InputForm.displayName = 'InputForm';

export default InputForm;
