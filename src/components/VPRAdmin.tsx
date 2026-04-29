import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Plus, Trash2, Download, Upload, RefreshCw, AlertCircle, Check, X, History, Calendar, Info } from 'lucide-react';
import { useVPRConfig } from '../hooks/useVPRConfig';
import { VPRValue } from '../config/vprConfig';
import { formatCurrencyWithDecimals } from '../utils/formatters';
import { createFocusTrap } from '../utils/accessibility';

interface VPRAdminProps {
  isOpen: boolean;
  onClose: () => void;
}

const VPRAdmin: React.FC<VPRAdminProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    config,
    currentVPR,
    isLoading,
    error,
    updateVPR,
    addHistorical,
    removeHistorical,
    reset,
    exportConfig,
    importConfig,
    clearError
  } = useVPRConfig();

  const [isEditing, setIsEditing] = useState(false);
  const [editYear, setEditYear] = useState(new Date().getFullYear());
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddHistorical, setShowAddHistorical] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useRef(createFocusTrap());

  // Set up focus trap when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      focusTrapRef.current.activate(modalRef.current);
      closeButtonRef.current?.focus();
    }

    return () => {
      focusTrapRef.current.deactivate();
    };
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpdateCurrent = () => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value <= 0) {
      return;
    }
    updateVPR(editYear, value, editDate, editDescription);
    setIsEditing(false);
    setSuccessMessage(t('vprAdmin.updateSuccess'));
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddHistorical = () => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value <= 0) {
      return;
    }

    const newValue: VPRValue = {
      year: editYear,
      value,
      effectiveDate: editDate,
      description: editDescription
    };

    addHistorical(newValue);
    setShowAddHistorical(false);
    setEditValue('');
    setEditDate('');
    setEditDescription('');
    setSuccessMessage(t('vprAdmin.addSuccess'));
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRemoveHistorical = (year: number) => {
    if (year === config.currentYear) {
      return;
    }
    removeHistorical(year);
    setSuccessMessage(t('vprAdmin.removeSuccess'));
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleExport = () => {
    const jsonData = exportConfig();
    if (!jsonData) return;

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vpr-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMessage(t('vprAdmin.exportSuccess'));
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importConfig(content);
      if (success) {
        setSuccessMessage(t('vprAdmin.importSuccess'));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setImportError(t('vprAdmin.importError'));
        setTimeout(() => setImportError(null), 5000);
      }
    };
    reader.onerror = () => {
      setImportError(t('vprAdmin.readError'));
      setTimeout(() => setImportError(null), 5000);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirmReset) {
      reset();
      setConfirmReset(false);
      setSuccessMessage(t('vprAdmin.resetSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const startEditing = () => {
    setEditYear(config.currentYear);
    setEditValue(config.currentValue.toString());
    setEditDate(config.effectiveDate);
    setEditDescription('');
    setIsEditing(true);
  };

  const startAddHistorical = () => {
    setEditYear(new Date().getFullYear());
    setEditValue('');
    setEditDate(new Date().toISOString().split('T')[0]);
    setEditDescription('');
    setShowAddHistorical(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl sm:max-w-2xl sm:w-full max-h-[90vh] overflow-y-auto z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vpr-admin-title"
        aria-describedby="vpr-admin-description"
        data-testid="vpr-admin-panel"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h2 id="vpr-admin-title" className="text-xl font-semibold text-gray-900 dark:text-dark-text">{t('vprAdmin.title')}</h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {(error || importError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error || importError}</span>
              <button
                onClick={() => { clearError(); setImportError(null); }}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Current VPR Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200">{t('vprAdmin.currentValue')}</h3>
              {!isEditing && (
                <button
                  onClick={startEditing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  data-testid="edit-vpr-button"
                >
                  {t('vprAdmin.edit')}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                      {t('vprAdmin.year')}
                    </label>
                    <input
                      type="number"
                      value={editYear}
                      onChange={(e) => setEditYear(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg dark:text-dark-text"
                      min={2000}
                      max={2100}
                      data-testid="vpr-year-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                      {t('vprAdmin.value')} (RON)
                    </label>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg dark:text-dark-text"
                      step="0.01"
                      min="0"
                      data-testid="vpr-value-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                    {t('vprAdmin.effectiveDate')}
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg dark:text-dark-text"
                    data-testid="vpr-date-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                    {t('vprAdmin.description')} ({t('vprAdmin.optional')})
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg dark:text-dark-text"
                    placeholder={t('vprAdmin.descriptionPlaceholder')}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateCurrent}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    data-testid="save-vpr-button"
                  >
                    {isLoading ? t('vprAdmin.saving') : t('common.save')}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{t('vprAdmin.year')}</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="current-vpr-year">{config.currentYear}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{t('vprAdmin.value')}</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="current-vpr-value">{formatCurrencyWithDecimals(currentVPR)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{t('vprAdmin.effectiveDate')}</p>
                  <p className="text-lg font-medium text-blue-900 dark:text-blue-100">{new Date(config.effectiveDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p id="vpr-admin-description" className="text-amber-800 dark:text-amber-200 text-sm">{t('vprAdmin.info')}</p>
            </div>
          </div>

          {/* Historical Values */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">{t('vprAdmin.historicalValues')}</h3>
              </div>
              <button
                onClick={startAddHistorical}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                data-testid="add-historical-button"
              >
                <Plus className="w-4 h-4" />
                {t('vprAdmin.addHistorical')}
              </button>
            </div>

            {/* Add Historical Form */}
            {showAddHistorical && (
              <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-dark-text mb-3">{t('vprAdmin.addHistorical')}</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                        {t('vprAdmin.year')}
                      </label>
                      <input
                        type="number"
                        value={editYear}
                        onChange={(e) => setEditYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg dark:text-dark-text"
                        min={2000}
                        max={2100}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                        {t('vprAdmin.value')} (RON)
                      </label>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg dark:text-dark-text"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                      {t('vprAdmin.effectiveDate')}
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                      {t('vprAdmin.description')} ({t('vprAdmin.optional')})
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-bg dark:text-dark-text"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddHistorical}
                      disabled={isLoading || !editValue || !editDate}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {t('common.add')}
                    </button>
                    <button
                      onClick={() => setShowAddHistorical(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors font-medium text-sm"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Historical Values List */}
            <div className="space-y-2" data-testid="historical-values-list">
              {config.historicalValues.map((vpr) => (
                <div
                  key={vpr.year}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    vpr.year === config.currentYear
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border'
                  }`}
                  data-testid={`historical-vpr-${vpr.year}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
                      <span className="font-medium text-gray-900 dark:text-dark-text">{vpr.year}</span>
                    </div>
                    <span className="text-gray-600 dark:text-dark-text-secondary">{formatCurrencyWithDecimals(vpr.value)}</span>
                    {vpr.description && (
                      <span className="text-sm text-gray-500 dark:text-dark-text-muted italic">{vpr.description}</span>
                    )}
                    {vpr.year === config.currentYear && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {t('vprAdmin.current')}
                      </span>
                    )}
                  </div>
                  {vpr.year !== config.currentYear && (
                    <button
                      onClick={() => handleRemoveHistorical(vpr.year)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('common.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-dark-border pt-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">{t('vprAdmin.actions')}</h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                data-testid="export-vpr-button"
              >
                <Download className="w-4 h-4" />
                {t('vprAdmin.export')}
              </button>

              {/* Import */}
              <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                {t('vprAdmin.import')}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  data-testid="import-vpr-input"
                />
              </label>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                confirmReset
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'border border-red-300 text-red-600 hover:bg-red-50'
              }`}
              data-testid="reset-vpr-button"
            >
              <RefreshCw className="w-4 h-4" />
              {confirmReset ? t('vprAdmin.confirmReset') : t('vprAdmin.reset')}
            </button>
          </div>

          {/* Last Updated Info */}
          <div className="text-sm text-gray-500 dark:text-dark-text-muted text-center pt-4 border-t border-gray-200 dark:border-dark-border">
            {t('vprAdmin.lastUpdated')}: {new Date(config.lastUpdated).toLocaleString()}
            {config.updatedBy && ` (${config.updatedBy})`}
          </div>
        </div>
      </div>
    </>
  );
};

export default VPRAdmin;
