import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, X, FileJson, AlertTriangle, FileText, FileSpreadsheet } from 'lucide-react';
import { PensionInputs, ContributionPeriod } from '../types/pensionTypes';
import { exportToJson, importFromJsonFile, ImportResult } from '../utils/importExport';
import { exportToPdf, PdfExportData } from '../utils/pdfExport';
import { generateAllChartImages } from '../utils/pdfChartGenerator';
import ShortcutHint from './ShortcutHint';
import { useToast } from '../contexts/ToastContext';
import { useAnalytics } from '../hooks/useAnalytics';
import CSVImportModal from './CSVImportModal';

interface ImportExportPanelProps {
  inputs: PensionInputs;
  onImport: (data: PensionInputs) => void;
  onImportPeriods?: (periods: ContributionPeriod[]) => void;
  className?: string;
  pensionDetails?: {
    contributionPoints: number;
    stabilityPoints: number;
    nonContributivePoints?: number;
    totalPoints: number;
    totalContributiveYears?: number;
    currentAge?: number;
    yearsUntilRetirement?: number;
  };
  monthlyPension?: number;
  yearlyPension?: number;
  vprInfo?: {
    value: number;
    year: number;
    effectiveDate: string;
  };
  showTrigger?: boolean;
}

export interface ImportExportPanelRef {
  exportData: () => void;
  openPanel: () => void;
}

const ImportExportPanel = forwardRef<ImportExportPanelRef, ImportExportPanelProps>(({
  inputs,
  onImport,
  onImportPeriods,
  className = '',
  pensionDetails,
  monthlyPension,
  yearlyPension,
  vprInfo,
  showTrigger = true
}, ref) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { trackDataExported, trackDataImported, trackImportError } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingImport, setPendingImport] = useState<PensionInputs | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle JSON export
  const handleExport = useCallback(() => {
    try {
      exportToJson(inputs);
      showToast('success', 'importExport.export.success');
      trackDataExported('json');
    } catch {
      showToast('error', 'importExport.error.readError');
    }
  }, [inputs, showToast, trackDataExported]);

  // Handle PDF export
  const handlePdfExport = useCallback(() => {
    if (!pensionDetails || !vprInfo || monthlyPension === undefined || yearlyPension === undefined) {
      showToast('error', 'importExport.error.readError');
      return;
    }

    try {
      // Generate chart images for PDF embedding
      const chartImages = generateAllChartImages(
        inputs.contributionPeriods,
        inputs.birthDate,
        t
      );

      const pdfData: PdfExportData = {
        inputs,
        pensionDetails,
        monthlyPension,
        yearlyPension,
        vprInfo,
        chartImages
      };
      exportToPdf(pdfData, t);
      showToast('success', 'importExport.pdf.success');
      trackDataExported('pdf');
    } catch (error) {
      console.error('PDF export error:', error);
      showToast('error', 'importExport.error.readError');
    }
  }, [inputs, pensionDetails, monthlyPension, yearlyPension, vprInfo, t, showToast, trackDataExported]);

  // Check if PDF export is available (has pension calculation data)
  const canExportPdf = Boolean(pensionDetails && vprInfo && monthlyPension !== undefined && yearlyPension !== undefined);

  // Expose methods via ref for keyboard shortcuts
  useImperativeHandle(ref, () => ({
    exportData: handleExport,
    openPanel: () => setIsOpen(true)
  }), [handleExport]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const result: ImportResult = await importFromJsonFile(file);

    if (result.success && result.data) {
      setPendingImport(result.data);
      setShowConfirmDialog(true);
    } else {
      showToast('error', result.errorKey || 'importExport.error.parseError');
      trackImportError(result.errorKey || 'parseError');
    }
  }, [showToast, trackImportError]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Confirm import
  const confirmImport = useCallback(() => {
    if (pendingImport) {
      onImport(pendingImport);
      showToast('success', 'importExport.import.success');
      trackDataImported(true);
      setPendingImport(null);
      setShowConfirmDialog(false);
      setIsOpen(false);
    }
  }, [pendingImport, onImport, showToast, trackDataImported]);

  // Cancel import
  const cancelImport = useCallback(() => {
    setPendingImport(null);
    setShowConfirmDialog(false);
  }, []);

  // Handle CSV import of periods
  const handleCSVImport = useCallback((periods: ContributionPeriod[]) => {
    if (onImportPeriods) {
      onImportPeriods(periods);
      showToast('success', 'csvImport.success');
      trackDataImported(true);
      setIsOpen(false);
    }
  }, [onImportPeriods, showToast, trackDataImported]);

  return (
    <>
      {/* Import/Export Button - Fixed Position */}
      {showTrigger && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-36 right-4 z-40 flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-white shadow-lg transition-all hover:bg-emerald-800 hover:shadow-xl ${className}`}
          aria-label={t('importExport.title')}
          data-testid="import-export-button"
        >
          <FileJson className="w-5 h-5" />
          <span className="text-sm font-medium">{t('importExport.title')}</span>
        </button>
      )}

      {/* Panel Slide-out */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsOpen(false)}
            data-testid="import-export-backdrop"
          />

          {/* Panel */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            data-testid="import-export-panel"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <FileJson className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('importExport.title')}
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t('help.close')}
                data-testid="import-export-close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Export Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">{t('importExport.export.title')}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    {t('importExport.export.description')}
                  </p>
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    data-testid="export-button"
                  >
                    <Download className="w-5 h-5" />
                    {t('importExport.export.button')}
                    <ShortcutHint shortcutId="save" className="text-emerald-200 bg-emerald-700 border-emerald-600" />
                  </button>
                </div>
              </div>

              {/* PDF Export Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">{t('importExport.pdf.title')}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    {t('importExport.pdf.description')}
                  </p>
                  <button
                    onClick={handlePdfExport}
                    disabled={!canExportPdf}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-colors ${
                      canExportPdf
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    data-testid="pdf-export-button"
                  >
                    <FileText className="w-5 h-5" />
                    {t('importExport.pdf.button')}
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">{t('importExport.import.title')}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    {t('importExport.import.description')}
                  </p>

                  {/* Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    data-testid="import-drop-zone"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileInputChange}
                      className="hidden"
                      data-testid="import-file-input"
                    />
                    <FileJson className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      data-testid="import-select-file-button"
                    >
                      {t('importExport.import.selectFile')}
                    </button>
                    <p className="mt-2 text-sm text-gray-500">
                      {t('importExport.import.dragDrop')}
                    </p>
                  </div>
                </div>
              </div>

              {/* CSV Import Section */}
              {onImportPeriods && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                      <h3 className="font-medium text-gray-900">{t('csvImport.title')}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      {t('csvImport.description')}
                    </p>
                    <button
                      onClick={() => setShowCSVImportModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      data-testid="csv-import-button"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      {t('csvImport.button')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <>
          {/* Dialog Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
            onClick={cancelImport}
            data-testid="confirm-dialog-backdrop"
          />

          {/* Dialog */}
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow-2xl z-[60] overflow-hidden"
            data-testid="confirm-dialog"
          >
            <div className="p-4 border-b border-gray-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  {t('importExport.warning.title')}
                </h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                {t('importExport.warning.message')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelImport}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  data-testid="confirm-dialog-cancel"
                >
                  {t('importExport.import.cancel')}
                </button>
                <button
                  onClick={confirmImport}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  data-testid="confirm-dialog-confirm"
                >
                  {t('importExport.import.confirm')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSVImportModal}
        onClose={() => setShowCSVImportModal(false)}
        onImport={handleCSVImport}
      />
    </>
  );
});

ImportExportPanel.displayName = 'ImportExportPanel';

export default ImportExportPanel;
