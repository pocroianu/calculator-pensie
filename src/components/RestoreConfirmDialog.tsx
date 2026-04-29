/**
 * Restore Confirm Dialog Component
 *
 * Modal dialog for confirming restoration of a calculation snapshot.
 * Shows details of the snapshot being restored and warns about data replacement.
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RotateCcw, AlertTriangle, Calendar, Briefcase } from 'lucide-react';
import { CalculationSnapshot } from '../types/calculationHistory';
import { formatSnapshotDate } from '../utils/calculationHistory';

interface RestoreConfirmDialogProps {
  isOpen: boolean;
  snapshot: CalculationSnapshot | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const RestoreConfirmDialog: React.FC<RestoreConfirmDialogProps> = ({
  isOpen,
  snapshot,
  onConfirm,
  onCancel,
}) => {
  const { t, i18n } = useTranslation();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen || !snapshot) return null;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language === 'ro' ? 'ro-RO' : 'en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Count employment vs non-contributive periods
  const employmentPeriods = snapshot.inputs.contributionPeriods.filter(
    (p) => !p.nonContributiveType
  ).length;
  const nonContributivePeriods = snapshot.inputs.contributionPeriods.length - employmentPeriods;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" data-testid="restore-confirm-dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-xl max-w-md w-full mx-auto transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                {t('history.restoreSnapshot')}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Warning message */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">{t('history.restoreWarningTitle')}</p>
                <p className="mt-1">{t('history.restoreWarningMessage')}</p>
              </div>
            </div>

            {/* Snapshot details */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-dark-text">
                {snapshot.name || t('history.unnamedSnapshot')}
              </h3>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                <Calendar className="w-4 h-4" />
                <span>{formatSnapshotDate(snapshot.timestamp, i18n.language)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-dark-border">
                <div>
                  <div className="text-xs text-gray-500 dark:text-dark-text-secondary uppercase tracking-wide">
                    {t('history.monthlyPension')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                    {formatCurrency(snapshot.results.monthlyPension)} RON
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-dark-text-secondary uppercase tracking-wide">
                    {t('history.totalPoints')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                    {snapshot.results.pensionDetails.totalPoints.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>
                    {employmentPeriods} {t('history.employmentPeriods')}
                  </span>
                </div>
                {nonContributivePeriods > 0 && (
                  <span>
                    {nonContributivePeriods} {t('history.nonContributive')}
                  </span>
                )}
              </div>

              {snapshot.metadata?.notes && (
                <p className="pt-2 text-sm text-gray-600 dark:text-dark-text-secondary italic border-t border-gray-200 dark:border-dark-border">
                  {snapshot.metadata.notes}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-dark-border">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-bg-tertiary rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="confirm-restore-button"
            >
              <RotateCcw className="w-4 h-4" />
              {t('history.restore')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreConfirmDialog;
