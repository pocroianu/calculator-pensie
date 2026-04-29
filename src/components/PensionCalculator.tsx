import React, { useCallback, forwardRef, useImperativeHandle, useRef, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { FileJson, History } from 'lucide-react';
import PensionStats from './PensionStats';
import InputForm, { InputFormRef } from './InputForm';
import ErrorBoundary from './ErrorBoundary';
import { ChartLoadingFallback, PanelLoadingFallback, ModalLoadingFallback } from './LoadingSpinner';
import { usePensionCalculator } from '../hooks/usePensionCalculator';
import { PensionInputs, ContributionPeriod } from '../types/pensionTypes';
import LawVersionSelector from './LawVersionSelector';
import ShareButton from './ShareButton';

// Lazy load heavy components
const PensionCharts = lazy(() => import('./PensionCharts'));
const ImportExportPanel = lazy(() => import('./ImportExportPanel'));
const CalculationHistoryPanel = lazy(() => import('./CalculationHistoryPanel'));

// Type for ImportExportPanelRef (needed since we can't import it directly with lazy)
export interface ImportExportPanelRef {
  exportData: () => void;
  openPanel: () => void;
}

export interface PensionCalculatorRef {
  addPeriod: () => void;
  exportData: () => void;
  focusBirthDate: () => void;
  focusRetirementYear: () => void;
  focusContributionPeriods: () => void;
  collapseAll: () => void;
  expandAll: () => void;
}

type PensionCalculatorProps = Record<never, never>;

const PensionCalculator = forwardRef<PensionCalculatorRef, PensionCalculatorProps>((_, ref) => {
  const { t } = useTranslation();
  const {
    inputs,
    handleInputChange,
    monthlyPension,
    yearlyPension,
    pensionDetails,
    vprInfo,
    lawVersion,
  } = usePensionCalculator();

  // State for history panel
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Refs for child components
  const inputFormRef = useRef<InputFormRef>(null);
  const importExportRef = useRef<ImportExportPanelRef>(null);

  // Expose methods via ref for keyboard shortcuts
  useImperativeHandle(ref, () => ({
    addPeriod: () => inputFormRef.current?.addPeriod(),
    exportData: () => importExportRef.current?.exportData(),
    focusBirthDate: () => inputFormRef.current?.focusBirthDate(),
    focusRetirementYear: () => inputFormRef.current?.focusRetirementYear(),
    focusContributionPeriods: () => inputFormRef.current?.focusContributionPeriods(),
    collapseAll: () => inputFormRef.current?.collapseAll(),
    expandAll: () => inputFormRef.current?.expandAll(),
  }));

  // Handle importing data by updating all fields at once
  const handleImport = useCallback((importedData: PensionInputs) => {
    handleInputChange('birthDate', importedData.birthDate);
    handleInputChange('retirementYear', importedData.retirementYear);
    handleInputChange('contributionPeriods', importedData.contributionPeriods);
  }, [handleInputChange]);

  // Handle importing contribution periods from CSV (adds to existing periods)
  const handleImportPeriods = useCallback((periods: ContributionPeriod[]) => {
    const existingPeriods = inputs.contributionPeriods || [];
    handleInputChange('contributionPeriods', [...existingPeriods, ...periods]);
  }, [handleInputChange, inputs.contributionPeriods]);

  // Handle restoring from history (same as import)
  const handleHistoryRestore = useCallback((restoredInputs: PensionInputs) => {
    handleInputChange('birthDate', restoredInputs.birthDate);
    handleInputChange('retirementYear', restoredInputs.retirementYear);
    handleInputChange('contributionPeriods', restoredInputs.contributionPeriods);
  }, [handleInputChange]);

  return (
    <section className="space-y-6 dark:bg-dark-bg" aria-label={t('pension.title')}>
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-bg-secondary md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-text-muted">
            Calculator workspace
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-dark-text-secondary">
            {monthlyPension > 0
              ? t('pension.stats.pensionEstimate.basedOn', { points: pensionDetails?.totalPoints?.toFixed(2) ?? '0.00' })
              : t('pension.stats.retirementStatus.unavailable', 'Complete valid contribution periods to calculate retirement status')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => importExportRef.current?.openPanel()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30 sm:px-4"
            aria-label={t('importExport.title')}
            data-testid="import-export-button"
          >
            <FileJson className="h-4 w-4" aria-hidden="true" />
            <span>{t('importExport.title')}</span>
          </button>
          {monthlyPension > 0 && pensionDetails && vprInfo && (
            <ShareButton
              monthlyPension={monthlyPension}
              yearlyPension={yearlyPension}
              pensionDetails={pensionDetails}
              vprInfo={vprInfo}
              className="h-10 rounded-lg px-3 shadow-none sm:px-4"
            />
          )}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-800 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 sm:px-4"
            aria-label={t('history.openHistory')}
            data-testid="open-history-button"
          >
            <History className="h-4 w-4" />
            <span>{t('history.openHistory')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(400px,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-5 print-hide-input-form">
            {/* Law Version Selector */}
            <LawVersionSelector
              versions={lawVersion.versions}
              selectedVersionId={lawVersion.selectedVersionId}
              activeVersionId={lawVersion.activeVersion.id}
              isHistoricalVersion={lawVersion.isHistoricalVersion}
              onSelectVersion={lawVersion.selectVersion}
              onResetToActive={lawVersion.resetToActive}
            />

            {/* Input Form */}
            <InputForm
              ref={inputFormRef}
              inputs={inputs}
              onChange={handleInputChange}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ErrorBoundary
              title={t('error.calculationError')}
              description={t('error.calculationErrorDescription')}
            >
              <PensionStats
                monthlyPension={monthlyPension}
                pensionDetails={pensionDetails}
                inputs={inputs}
              />
            </ErrorBoundary>
          </div>
      </div>

      <ErrorBoundary
        title={t('error.chartError')}
        description={t('error.chartErrorDescription')}
      >
        <Suspense fallback={<ChartLoadingFallback />}>
          <PensionCharts
            className="print-charts-section"
            contributionPeriods={inputs.contributionPeriods}
            birthDate={inputs.birthDate}
          />
        </Suspense>
      </ErrorBoundary>

      {/* Import/Export Panel - Lazy loaded */}
      <Suspense fallback={<PanelLoadingFallback />}>
        <ImportExportPanel
          ref={importExportRef}
          inputs={inputs}
          onImport={handleImport}
          onImportPeriods={handleImportPeriods}
          pensionDetails={pensionDetails}
          monthlyPension={monthlyPension}
          yearlyPension={yearlyPension}
          vprInfo={vprInfo}
          showTrigger={false}
        />
      </Suspense>

      {/* Calculation History Panel - Lazy loaded */}
      {isHistoryOpen && (
        <Suspense fallback={<ModalLoadingFallback message={t('common.loading')} />}>
          <CalculationHistoryPanel
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            currentInputs={inputs}
            monthlyPension={monthlyPension}
            yearlyPension={yearlyPension}
            pensionDetails={pensionDetails}
            vprValue={vprInfo?.currentValue}
            onRestore={handleHistoryRestore}
          />
        </Suspense>
      )}
    </section>
  );
});

PensionCalculator.displayName = 'PensionCalculator';

export default PensionCalculator;
