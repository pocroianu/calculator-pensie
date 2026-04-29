/**
 * Calculation History Panel Component
 *
 * Main panel for viewing, managing, and restoring calculation history.
 * Allows users to save current calculations and browse past versions.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History,
  Save,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useCalculationHistory } from '../hooks/useCalculationHistory';
import { useToast } from '../contexts/ToastContext';
import { CalculationSnapshot, CreateSnapshotInput } from '../types/calculationHistory';
import { PensionInputs, PensionDetails } from '../types/pensionTypes';
import HistoryItemCard from './HistoryItemCard';
import RestoreConfirmDialog from './RestoreConfirmDialog';

interface CalculationHistoryPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Current pension inputs */
  currentInputs: PensionInputs;
  /** Current monthly pension value */
  monthlyPension: number;
  /** Current yearly pension value */
  yearlyPension: number;
  /** Current pension details */
  pensionDetails: PensionDetails;
  /** Current VPR value */
  vprValue?: number;
  /** Callback when a snapshot is restored */
  onRestore: (inputs: PensionInputs) => void;
}

const CalculationHistoryPanel: React.FC<CalculationHistoryPanelProps> = ({
  isOpen,
  onClose,
  currentInputs,
  monthlyPension,
  yearlyPension,
  pensionDetails,
  vprValue,
  onRestore,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // History hook
  const {
    history,
    isLoaded,
    snapshotCount,
    saveSnapshot,
    deleteSnapshot,
    clearHistory,
    isAtCapacity,
  } = useCalculationHistory();

  // Local state
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [snapshotToRestore, setSnapshotToRestore] = useState<CalculationSnapshot | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sort snapshots by timestamp (newest first)
  const sortedSnapshots = useMemo(() => {
    return [...history.snapshots].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [history.snapshots]);

  // Handle save current calculation
  const handleSave = useCallback(() => {
    const input: CreateSnapshotInput = {
      inputs: currentInputs,
      monthlyPension,
      yearlyPension,
      pensionDetails,
      name: snapshotName.trim() || undefined,
      notes: snapshotNotes.trim() || undefined,
      vprValue,
    };

    saveSnapshot(input);
    showToast('success', 'history.saveSuccess');
    setSnapshotName('');
    setSnapshotNotes('');
    setShowSaveForm(false);
  }, [
    currentInputs,
    monthlyPension,
    yearlyPension,
    pensionDetails,
    snapshotName,
    snapshotNotes,
    vprValue,
    saveSnapshot,
    showToast,
  ]);

  // Handle delete snapshot
  const handleDelete = useCallback(
    (snapshotId: string) => {
      deleteSnapshot(snapshotId);
      showToast('info', 'history.deleteSuccess');
    },
    [deleteSnapshot, showToast]
  );

  // Handle restore confirmation
  const handleRestoreConfirm = useCallback(() => {
    if (snapshotToRestore) {
      onRestore(snapshotToRestore.inputs);
      showToast('success', 'history.restoreSuccess');
      setSnapshotToRestore(null);
      onClose();
    }
  }, [snapshotToRestore, onRestore, showToast, onClose]);

  // Handle clear all history
  const handleClearAll = useCallback(() => {
    clearHistory();
    showToast('info', 'history.clearSuccess');
    setShowClearConfirm(false);
  }, [clearHistory, showToast]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" data-testid="calculation-history-panel">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Panel */}
        <div className="flex min-h-full items-start justify-end">
          <div className="relative bg-white dark:bg-dark-bg-secondary w-full max-w-lg h-screen shadow-xl transform transition-all overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                  {t('history.title')}
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-dark-text-secondary rounded-full">
                  {snapshotCount}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Save current calculation section */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
              {!showSaveForm ? (
                <button
                  onClick={() => setShowSaveForm(true)}
                  disabled={monthlyPension <= 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="save-snapshot-button"
                >
                  <Save className="w-4 h-4" />
                  {t('history.saveCurrentCalculation')}
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                      {t('history.snapshotName')}
                      <span className="text-gray-400 ml-1">({t('common.optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                      placeholder={t('history.namePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="snapshot-name-input"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                      {t('history.notes')}
                      <span className="text-gray-400 ml-1">({t('common.optional')})</span>
                    </label>
                    <textarea
                      value={snapshotNotes}
                      onChange={(e) => setSnapshotNotes(e.target.value)}
                      placeholder={t('history.notesPlaceholder')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      data-testid="snapshot-notes-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowSaveForm(false);
                        setSnapshotName('');
                        setSnapshotNotes('');
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-bg-tertiary rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      data-testid="confirm-save-button"
                    >
                      <Save className="w-4 h-4" />
                      {t('common.save')}
                    </button>
                  </div>
                </div>
              )}

              {/* Capacity warning */}
              {isAtCapacity && (
                <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t('history.capacityWarning')}</span>
                </div>
              )}
            </div>

            {/* History list */}
            <div className="flex-1 overflow-y-auto p-4">
              {!isLoaded ? (
                <div className="text-center text-gray-500 dark:text-dark-text-secondary py-8">
                  {t('common.loading')}
                </div>
              ) : sortedSnapshots.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-dark-text-secondary py-8">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>{t('history.noSnapshots')}</p>
                  <p className="text-sm mt-1">{t('history.noSnapshotsHint')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSnapshots.map((snapshot, index) => (
                    <HistoryItemCard
                      key={snapshot.id}
                      snapshot={snapshot}
                      previousSnapshot={sortedSnapshots[index + 1]}
                      onRestore={(s) => setSnapshotToRestore(s)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer with clear all button */}
            {snapshotCount > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-dark-border flex-shrink-0">
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    data-testid="clear-history-button"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('history.clearAll')}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-center text-gray-600 dark:text-dark-text-secondary">
                      {t('history.clearConfirm')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-bg-tertiary rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        data-testid="confirm-clear-button"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('history.clearAllConfirm')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restore confirmation dialog */}
      <RestoreConfirmDialog
        isOpen={snapshotToRestore !== null}
        snapshot={snapshotToRestore}
        onConfirm={handleRestoreConfirm}
        onCancel={() => setSnapshotToRestore(null)}
      />
    </>
  );
};

export default CalculationHistoryPanel;
