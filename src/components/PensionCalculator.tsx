import React, { useCallback, forwardRef, useImperativeHandle, useRef, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
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

const PensionCalculator = forwardRef<PensionCalculatorRef, {}>((_, ref) => {
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
    <div className="bg-gray-50 dark:bg-dark-bg">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Hidden when printing (input form is not needed in print output) */}
          <div className="space-y-6 print-hide-input-form lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2 smooth-scroll scrollbar-styled">
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
          </div>
        </div>
      </main>

      {/* Share and History Buttons - Fixed position */}
      <div className="fixed bottom-24 right-4 z-40 flex items-center gap-2">
        {/* Share Button */}
        {monthlyPension > 0 && pensionDetails && vprInfo && (
          <ShareButton
            monthlyPension={monthlyPension}
            yearlyPension={yearlyPension}
            pensionDetails={pensionDetails}
            vprInfo={vprInfo}
            className="shadow-lg rounded-full"
          />
        )}

        {/* History Button */}
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          aria-label={t('history.openHistory')}
          data-testid="open-history-button"
        >
          <History className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">{t('history.openHistory')}</span>
        </button>
      </div>

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
    </div>
  );
});

PensionCalculator.displayName = 'PensionCalculator';

export default PensionCalculator;
