import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, FileSpreadsheet, AlertTriangle, Check, ChevronDown, Info } from 'lucide-react';
import { ContributionPeriod } from '../types/pensionTypes';
import {
  CSVColumnMapping,
  CSVPreviewData,
  CSVImportResult,
  CSVRowError,
  importFromCSVFile,
  autoDetectMapping,
  validateMapping,
  transformToContributionPeriods,
  CSVParseResult
} from '../utils/csvImport';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (periods: ContributionPeriod[]) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'result';

const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<ImportStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [preview, setPreview] = useState<CSVPreviewData | null>(null);
  const [mapping, setMapping] = useState<CSVColumnMapping>({
    fromDate: null,
    toDate: null,
    company: null,
    monthlyGrossSalary: null,
    workingCondition: null,
    nonContributiveType: null
  });
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  const resetState = useCallback(() => {
    setStep('upload');
    setParseResult(null);
    setPreview(null);
    setMapping({
      fromDate: null,
      toDate: null,
      company: null,
      monthlyGrossSalary: null,
      workingCondition: null,
      nonContributiveType: null
    });
    setImportResult(null);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await importFromCSVFile(file);

      if (!result.parseResult.success) {
        setError(t(result.parseResult.errorKey || 'csvImport.error.parseError'));
        setIsLoading(false);
        return;
      }

      setParseResult(result.parseResult);
      setPreview(result.preview || null);

      // Auto-detect column mapping
      const detectedMapping = autoDetectMapping(result.parseResult.headers);
      setMapping(detectedMapping);

      setStep('mapping');
    } catch (err) {
      setError(t('csvImport.error.readError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle mapping change
  const handleMappingChange = useCallback((field: keyof CSVColumnMapping, value: string | null) => {
    setMapping(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Proceed to preview
  const handleProceedToPreview = useCallback(() => {
    if (!parseResult) return;

    const validationResult = validateMapping(mapping);
    if (!validationResult.valid) {
      setError(t('csvImport.error.missingRequiredFields', {
        fields: validationResult.missingFields.join(', ')
      }));
      return;
    }

    // Transform data
    const result = transformToContributionPeriods(
      parseResult.rows,
      parseResult.headers,
      mapping
    );

    setImportResult(result);
    setStep('preview');
  }, [parseResult, mapping, t]);

  // Confirm import
  const handleConfirmImport = useCallback(() => {
    if (importResult?.periods && importResult.periods.length > 0) {
      onImport(importResult.periods);
      handleClose();
    }
  }, [importResult, onImport, handleClose]);

  // Render column mapping selector
  const renderColumnSelector = useCallback((
    field: keyof CSVColumnMapping,
    label: string,
    required: boolean = false
  ) => {
    const headers = parseResult?.headers || [];
    const value = mapping[field];

    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={value || ''}
            onChange={(e) => handleMappingChange(field, e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            data-testid={`csv-mapping-${field}`}
          >
            <option value="">{t('csvImport.mapping.selectColumn')}</option>
            {headers.map((header, index) => (
              <option key={index} value={header}>
                {header}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {value && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            {t('csvImport.mapping.mapped')}
          </span>
        )}
      </div>
    );
  }, [parseResult, mapping, handleMappingChange, t]);

  // Memoize validation result
  const mappingValidation = useMemo(() => validateMapping(mapping), [mapping]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[70]"
        onClick={handleClose}
        data-testid="csv-import-backdrop"
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[70] overflow-hidden flex flex-col"
        data-testid="csv-import-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('csvImport.title')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step === 'upload' && t('csvImport.steps.upload')}
                {step === 'mapping' && t('csvImport.steps.mapping')}
                {step === 'preview' && t('csvImport.steps.preview')}
                {step === 'result' && t('csvImport.steps.result')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label={t('common.close')}
            data-testid="csv-import-close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('csvImport.info.description')}
                </p>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
                data-testid="csv-drop-zone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                  data-testid="csv-file-input"
                />
                <FileSpreadsheet className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-emerald-500' : 'text-gray-400'}`} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  data-testid="csv-select-file-button"
                >
                  {isLoading ? t('common.loading') : t('csvImport.selectFile')}
                </button>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('csvImport.dragDrop')}
                </p>
              </div>

              {/* Format Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('csvImport.format.title')}
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t('csvImport.format.headers')}</li>
                  <li>• {t('csvImport.format.dates')}</li>
                  <li>• {t('csvImport.format.salary')}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && parseResult && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('csvImport.mapping.instructions')}
                </p>
              </div>

              {/* Sample Data Preview */}
              {preview && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 overflow-x-auto">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t('csvImport.mapping.sampleData', { count: preview.totalRows })}
                  </p>
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        {preview.headers.map((header, i) => (
                          <th key={i} className="px-2 py-1 text-left text-gray-600 dark:text-gray-400 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sampleRows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                          {row.map((cell, j) => (
                            <td key={j} className="px-2 py-1 text-gray-900 dark:text-gray-100 max-w-[150px] truncate">
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Column Mapping Form */}
              <div className="grid grid-cols-2 gap-4">
                {renderColumnSelector('fromDate', t('csvImport.fields.fromDate'), true)}
                {renderColumnSelector('toDate', t('csvImport.fields.toDate'), true)}
                {renderColumnSelector('company', t('csvImport.fields.company'))}
                {renderColumnSelector('monthlyGrossSalary', t('csvImport.fields.salary'))}
                {renderColumnSelector('workingCondition', t('csvImport.fields.workingCondition'))}
                {renderColumnSelector('nonContributiveType', t('csvImport.fields.nonContributiveType'))}
              </div>

              {!mappingValidation.valid && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('csvImport.error.requiredFieldsNotMapped')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview & Validation Results */}
          {step === 'preview' && importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`p-4 rounded-lg ${
                importResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  {importResult.success ? (
                    <Check className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  )}
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {importResult.success ? t('csvImport.preview.allValid') : t('csvImport.preview.hasErrors')}
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">{t('csvImport.preview.totalRows')}:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{importResult.totalRows}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">{t('csvImport.preview.validRows')}:</span>
                    <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">{importResult.validRows}</span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                    {t('csvImport.preview.errors', { count: importResult.errors.length })}
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <div key={i} className="text-sm text-red-600 dark:text-red-400">
                        {t('csvImport.preview.errorRow', { row: err.row })}: {t(err.messageKey, err.params)}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-sm text-red-600 dark:text-red-400 italic">
                        {t('csvImport.preview.moreErrors', { count: importResult.errors.length - 10 })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview of valid periods */}
              {importResult.periods && importResult.periods.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    {t('csvImport.preview.periodsToImport', { count: importResult.periods.length })}
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {importResult.periods.slice(0, 10).map((period, i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {period.company || t('csvImport.preview.noCompany')}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {period.fromDate} - {period.toDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {period.nonContributiveType ? (
                            <span>{t(`pension.contributionPeriods.nonContributivePeriod.${period.nonContributiveType}`)}</span>
                          ) : (
                            <>
                              <span>{period.monthlyGrossSalary?.toLocaleString()} RON</span>
                              <span>{t(`pension.contributionPeriods.workingCondition.${period.workingCondition}`)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {importResult.periods.length > 10 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center italic">
                        {t('csvImport.preview.morePeriods', { count: importResult.periods.length - 10 })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={step === 'upload' ? handleClose : () => setStep(step === 'preview' ? 'mapping' : 'upload')}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            data-testid="csv-import-back"
          >
            {step === 'upload' ? t('common.cancel') : t('csvImport.back')}
          </button>

          {step === 'mapping' && (
            <button
              onClick={handleProceedToPreview}
              disabled={!mappingValidation.valid}
              className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="csv-import-next"
            >
              {t('csvImport.next')}
            </button>
          )}

          {step === 'preview' && importResult?.periods && importResult.periods.length > 0 && (
            <button
              onClick={handleConfirmImport}
              className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              data-testid="csv-import-confirm"
            >
              <Upload className="w-4 h-4" />
              {t('csvImport.import', { count: importResult.periods.length })}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CSVImportModal;
