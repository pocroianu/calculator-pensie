/**
 * History Item Card Component
 *
 * Displays a single calculation history snapshot with options to
 * view details, restore, or delete.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Trash2,
  RotateCcw,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { CalculationSnapshot } from '../types/calculationHistory';
import { getRelativeTime } from '../utils/calculationHistory';

interface HistoryItemCardProps {
  snapshot: CalculationSnapshot;
  /** Previous snapshot for comparison (optional) */
  previousSnapshot?: CalculationSnapshot;
  /** Callback when restore is clicked */
  onRestore: (snapshot: CalculationSnapshot) => void;
  /** Callback when delete is clicked */
  onDelete: (snapshotId: string) => void;
  /** Callback when view details is clicked */
  onViewDetails?: (snapshot: CalculationSnapshot) => void;
  /** Whether this card is expanded */
  isExpanded?: boolean;
}

const HistoryItemCard: React.FC<HistoryItemCardProps> = ({
  snapshot,
  previousSnapshot,
  onRestore,
  onDelete,
  onViewDetails,
  isExpanded = false,
}) => {
  const { t, i18n } = useTranslation();

  // Calculate change from previous snapshot
  const change = previousSnapshot
    ? snapshot.results.monthlyPension - previousSnapshot.results.monthlyPension
    : 0;
  const changePercent = previousSnapshot && previousSnapshot.results.monthlyPension > 0
    ? (change / previousSnapshot.results.monthlyPension) * 100
    : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language === 'ro' ? 'ro-RO' : 'en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get change indicator
  const getChangeIndicator = () => {
    if (!previousSnapshot) return null;

    if (change > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
          <TrendingUp className="w-3 h-3" />
          +{formatCurrency(change)} ({changePercent.toFixed(1)}%)
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <TrendingDown className="w-3 h-3" />
          {formatCurrency(change)} ({changePercent.toFixed(1)}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Minus className="w-3 h-3" />
          {t('history.noChange')}
        </span>
      );
    }
  };

  return (
    <div
      className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition-shadow"
      data-testid="history-item-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Snapshot name or default */}
          <h4 className="font-medium text-gray-900 dark:text-dark-text truncate">
            {snapshot.name || t('history.unnamedSnapshot')}
          </h4>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
            <Clock className="w-3.5 h-3.5" />
            <span>{getRelativeTime(snapshot.timestamp, i18n.language)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onRestore(snapshot)}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title={t('history.restore')}
            aria-label={t('history.restore')}
            data-testid="restore-snapshot-button"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(snapshot.id)}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title={t('common.delete')}
            aria-label={t('common.delete')}
            data-testid="delete-snapshot-button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results summary */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-dark-text">
              {formatCurrency(snapshot.results.monthlyPension)} RON
              <span className="text-sm font-normal text-gray-500 dark:text-dark-text-secondary ml-1">
                /{t('history.month')}
              </span>
            </div>
            {getChangeIndicator()}
          </div>

          {onViewDetails && (
            <button
              onClick={() => onViewDetails(snapshot)}
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors"
              data-testid="view-details-button"
            >
              {t('history.viewDetails')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Points breakdown (compact) */}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-dark-text-secondary">
          <span>
            {t('history.totalPoints')}: {snapshot.results.pensionDetails.totalPoints.toFixed(2)}
          </span>
          <span>
            {t('history.periods')}: {snapshot.inputs.contributionPeriods.length}
          </span>
        </div>

        {/* Notes if present */}
        {snapshot.metadata?.notes && (
          <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary italic">
            {snapshot.metadata.notes}
          </p>
        )}
      </div>
    </div>
  );
};

export default HistoryItemCard;
