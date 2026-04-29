/**
 * Calculation History Hook
 *
 * Custom hook for managing calculation history state with localStorage persistence.
 */

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  CalculationHistory,
  CalculationSnapshot,
  CreateSnapshotInput,
  SnapshotComparison,
  CALCULATION_HISTORY_CONFIG,
} from '../types/calculationHistory';
import {
  createSnapshot,
  createEmptyHistory,
  addSnapshotToHistory,
  removeSnapshotFromHistory,
  updateSnapshot as updateSnapshotUtil,
  getSnapshotById,
  compareSnapshots,
  clearHistory as clearHistoryUtil,
  validateHistory,
  migrateHistory,
} from '../utils/calculationHistory';

/**
 * Default debounce delay for saving to local storage (in milliseconds)
 */
const SAVE_DEBOUNCE_DELAY = 500;

export interface UseCalculationHistoryReturn {
  /** The calculation history */
  history: CalculationHistory;
  /** Whether the history has been loaded from storage */
  isLoaded: boolean;
  /** Number of snapshots in history */
  snapshotCount: number;
  /** Save a new snapshot to history */
  saveSnapshot: (input: CreateSnapshotInput) => CalculationSnapshot;
  /** Delete a snapshot by ID */
  deleteSnapshot: (snapshotId: string) => void;
  /** Update a snapshot's name or notes */
  updateSnapshot: (snapshotId: string, updates: { name?: string; notes?: string }) => void;
  /** Get a snapshot by ID */
  getSnapshot: (snapshotId: string) => CalculationSnapshot | undefined;
  /** Compare two snapshots */
  compare: (olderId: string, newerId: string) => SnapshotComparison | null;
  /** Clear all history */
  clearHistory: () => void;
  /** Check if history is at max capacity */
  isAtCapacity: boolean;
}

export function useCalculationHistory(): UseCalculationHistoryReturn {
  // Use localStorage for persistent storage with debounced saving
  const [history, setHistory, isLoaded] = useLocalStorage<CalculationHistory>(
    CALCULATION_HISTORY_CONFIG.STORAGE_KEY,
    createEmptyHistory(),
    SAVE_DEBOUNCE_DELAY
  );

  // Ensure history is valid and migrated
  const validHistory = useMemo(() => {
    if (!validateHistory(history)) {
      return createEmptyHistory();
    }
    return migrateHistory(history);
  }, [history]);

  // Calculate derived state
  const snapshotCount = validHistory.snapshots.length;
  const isAtCapacity = snapshotCount >= CALCULATION_HISTORY_CONFIG.MAX_SNAPSHOTS;

  /**
   * Save a new snapshot to history
   */
  const saveSnapshot = useCallback(
    (input: CreateSnapshotInput): CalculationSnapshot => {
      const snapshot = createSnapshot(input);
      setHistory((prev) => addSnapshotToHistory(prev, snapshot));
      return snapshot;
    },
    [setHistory]
  );

  /**
   * Delete a snapshot by ID
   */
  const deleteSnapshot = useCallback(
    (snapshotId: string) => {
      setHistory((prev) => removeSnapshotFromHistory(prev, snapshotId));
    },
    [setHistory]
  );

  /**
   * Update a snapshot's name or notes
   */
  const updateSnapshot = useCallback(
    (snapshotId: string, updates: { name?: string; notes?: string }) => {
      setHistory((prev) => updateSnapshotUtil(prev, snapshotId, updates));
    },
    [setHistory]
  );

  /**
   * Get a snapshot by ID
   */
  const getSnapshot = useCallback(
    (snapshotId: string): CalculationSnapshot | undefined => {
      return getSnapshotById(validHistory, snapshotId);
    },
    [validHistory]
  );

  /**
   * Compare two snapshots
   */
  const compare = useCallback(
    (olderId: string, newerId: string): SnapshotComparison | null => {
      const older = getSnapshotById(validHistory, olderId);
      const newer = getSnapshotById(validHistory, newerId);

      if (!older || !newer) return null;

      return compareSnapshots(older, newer);
    },
    [validHistory]
  );

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory(clearHistoryUtil());
  }, [setHistory]);

  return {
    history: validHistory,
    isLoaded,
    snapshotCount,
    saveSnapshot,
    deleteSnapshot,
    updateSnapshot,
    getSnapshot,
    compare,
    clearHistory,
    isAtCapacity,
  };
}
