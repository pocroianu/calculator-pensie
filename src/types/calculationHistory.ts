/**
 * Calculation History Types
 *
 * Types for the calculation history feature that saves previous calculations
 * with timestamps and allows users to browse and restore past versions.
 */

import { PensionInputs, PensionDetails } from './pensionTypes';

/**
 * A snapshot of a pension calculation at a specific point in time
 */
export interface CalculationSnapshot {
  /** Unique identifier for the snapshot */
  id: string;
  /** ISO date string when the calculation was saved */
  timestamp: string;
  /** The inputs used for this calculation */
  inputs: PensionInputs;
  /** The results of the calculation */
  results: {
    monthlyPension: number;
    yearlyPension: number;
    pensionDetails: PensionDetails;
  };
  /** Optional user-given name for the snapshot */
  name?: string;
  /** Additional metadata */
  metadata?: {
    /** VPR value at time of calculation */
    vprValue?: number;
    /** User notes */
    notes?: string;
  };
}

/**
 * The complete calculation history stored in localStorage
 */
export interface CalculationHistory {
  /** Array of calculation snapshots */
  snapshots: CalculationSnapshot[];
  /** Schema version for future migrations */
  version: string;
  /** Last update timestamp */
  lastUpdated: string;
}

/**
 * Input for creating a new calculation snapshot
 */
export interface CreateSnapshotInput {
  inputs: PensionInputs;
  monthlyPension: number;
  yearlyPension: number;
  pensionDetails: PensionDetails;
  name?: string;
  notes?: string;
  vprValue?: number;
}

/**
 * Comparison between two calculation snapshots
 */
export interface SnapshotComparison {
  /** The older snapshot */
  older: CalculationSnapshot;
  /** The newer snapshot */
  newer: CalculationSnapshot;
  /** Differences in the results */
  differences: {
    monthlyPensionChange: number;
    monthlyPensionChangePercent: number;
    yearlyPensionChange: number;
    totalPointsChange: number;
    contributionPointsChange: number;
    stabilityPointsChange: number;
  };
}

/**
 * Constants for calculation history
 */
export const CALCULATION_HISTORY_CONFIG = {
  /** Maximum number of snapshots to store */
  MAX_SNAPSHOTS: 50,
  /** Current schema version */
  SCHEMA_VERSION: '1.0.0',
  /** Storage key for calculation history */
  STORAGE_KEY: 'calculation_history',
  /** Auto-save interval in milliseconds (disabled by default) */
  AUTO_SAVE_INTERVAL: 0,
} as const;
