import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Share2, Calculator, Clock, Coins, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { ShareableData, clearShareParamFromUrl, formatShareTimestamp } from '../utils/socialSharing';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface SharedResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedData: ShareableData;
}

const SharedResultsModal: React.FC<SharedResultsModalProps> = ({
  isOpen,
  onClose,
  sharedData
}) => {
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    clearShareParamFromUrl();
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  const {
    monthlyPension,
    yearlyPension,
    contributionPoints,
    stabilityPoints,
    nonContributivePoints,
    totalPoints,
    totalContributiveYears,
    yearsUntilRetirement,
    vprValue,
    vprYear,
    timestamp
  } = sharedData;

  const sharedTimeAgo = formatShareTimestamp(timestamp, t);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        data-testid="shared-results-backdrop"
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shared-results-title"
          data-testid="shared-results-modal"
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-full">
                <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <h2 id="shared-results-title" className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                  {t('sharing.sharedResults')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  {sharedTimeAgo}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
              aria-label={t('common.close')}
              data-testid="shared-results-close"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-dark-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Privacy Notice */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('sharing.privacyNotice')}
              </p>
            </div>

            {/* Pension Estimate Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <h3 className="font-semibold text-gray-900 dark:text-dark-text">
                  {t('sharing.pensionEstimate')}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {t('pension.stats.pensionEstimate.monthlyPension')}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(monthlyPension)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {t('pension.stats.pensionEstimate.yearlyPension')}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(yearlyPension)}
                  </p>
                </div>
              </div>
            </div>

            {/* Points Breakdown */}
            <div className="bg-white dark:bg-dark-bg-tertiary rounded-xl border border-gray-200 dark:border-dark-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h3 className="font-semibold text-gray-900 dark:text-dark-text">
                  {t('pension.stats.pointsBreakdown.title')}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-dark-text-secondary">
                    {t('pension.stats.pointsBreakdown.contribution')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-dark-text">
                    {formatNumber(contributionPoints, 2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-dark-text-secondary">
                    {t('pension.stats.pointsBreakdown.stability')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-dark-text">
                    {formatNumber(stabilityPoints, 2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-dark-text-secondary">
                    {t('pension.stats.pointsBreakdown.nonContributive')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-dark-text">
                    {formatNumber(nonContributivePoints, 2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-dark-border flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-dark-text">
                    {t('pension.stats.pointsBreakdown.totalPoints')}
                  </span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(totalPoints, 2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-500 dark:text-dark-text-secondary" aria-hidden="true" />
                  <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {t('sharing.contributionYears')}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-dark-text">
                  {totalContributiveYears} {t('common.years')}
                </p>
              </div>

              {yearsUntilRetirement !== undefined && yearsUntilRetirement > 0 && (
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-dark-text-secondary" aria-hidden="true" />
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      {t('sharing.yearsToRetirement')}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-dark-text">
                    {yearsUntilRetirement} {t('common.years')}
                  </p>
                </div>
              )}
            </div>

            {/* VPR Info */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-dark-text-secondary">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>
                {t('sharing.calculatedWith')} VPR {vprValue} RON ({vprYear})
              </span>
            </div>

            {/* Call to Action */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-dark-border">
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">
                {t('sharing.calculateYourOwn')}
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                data-testid="start-calculating-button"
              >
                {t('sharing.startCalculating')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SharedResultsModal;
