/**
 * Calculation History Utilities
 *
 * Utility functions for managing calculation history snapshots.
 */

import {
  CalculationSnapshot,
  CalculationHistory,
  CreateSnapshotInput,
  SnapshotComparison,
  CALCULATION_HISTORY_CONFIG,
} from '../types/calculationHistory';

/**
 * Generate a unique ID for a snapshot
 */
export function generateSnapshotId(): string {
  return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new calculation snapshot
 */
export function createSnapshot(input: CreateSnapshotInput): CalculationSnapshot {
  return {
    id: generateSnapshotId(),
    timestamp: new Date().toISOString(),
    inputs: JSON.parse(JSON.stringify(input.inputs)), // Deep clone
    results: {
      monthlyPension: input.monthlyPension,
      yearlyPension: input.yearlyPension,
      pensionDetails: JSON.parse(JSON.stringify(input.pensionDetails)), // Deep clone
    },
    name: input.name,
    metadata: {
      vprValue: input.vprValue,
      notes: input.notes,
    },
  };
}

/**
 * Create an empty calculation history
 */
export function createEmptyHistory(): CalculationHistory {
  return {
    snapshots: [],
    version: CALCULATION_HISTORY_CONFIG.SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Add a snapshot to history, enforcing the maximum snapshot limit
 */
export function addSnapshotToHistory(
  history: CalculationHistory,
  snapshot: CalculationSnapshot
): CalculationHistory {
  const newSnapshots = [snapshot, ...history.snapshots];

  // Enforce maximum limit by removing oldest snapshots
  if (newSnapshots.length > CALCULATION_HISTORY_CONFIG.MAX_SNAPSHOTS) {
    newSnapshots.splice(CALCULATION_HISTORY_CONFIG.MAX_SNAPSHOTS);
  }

  return {
    ...history,
    snapshots: newSnapshots,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Remove a snapshot from history by ID
 */
export function removeSnapshotFromHistory(
  history: CalculationHistory,
  snapshotId: string
): CalculationHistory {
  return {
    ...history,
    snapshots: history.snapshots.filter((s) => s.id !== snapshotId),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Update a snapshot's name or notes
 */
export function updateSnapshot(
  history: CalculationHistory,
  snapshotId: string,
  updates: { name?: string; notes?: string }
): CalculationHistory {
  return {
    ...history,
    snapshots: history.snapshots.map((s) => {
      if (s.id !== snapshotId) return s;
      return {
        ...s,
        name: updates.name !== undefined ? updates.name : s.name,
        metadata: {
          ...s.metadata,
          notes: updates.notes !== undefined ? updates.notes : s.metadata?.notes,
        },
      };
    }),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get a snapshot by ID
 */
export function getSnapshotById(
  history: CalculationHistory,
  snapshotId: string
): CalculationSnapshot | undefined {
  return history.snapshots.find((s) => s.id === snapshotId);
}

/**
 * Compare two snapshots and calculate differences
 */
export function compareSnapshots(
  older: CalculationSnapshot,
  newer: CalculationSnapshot
): SnapshotComparison {
  const monthlyPensionChange =
    newer.results.monthlyPension - older.results.monthlyPension;
  const monthlyPensionChangePercent =
    older.results.monthlyPension > 0
      ? (monthlyPensionChange / older.results.monthlyPension) * 100
      : 0;

  return {
    older,
    newer,
    differences: {
      monthlyPensionChange,
      monthlyPensionChangePercent,
      yearlyPensionChange: newer.results.yearlyPension - older.results.yearlyPension,
      totalPointsChange:
        newer.results.pensionDetails.totalPoints -
        older.results.pensionDetails.totalPoints,
      contributionPointsChange:
        newer.results.pensionDetails.contributionPoints -
        older.results.pensionDetails.contributionPoints,
      stabilityPointsChange:
        newer.results.pensionDetails.stabilityPoints -
        older.results.pensionDetails.stabilityPoints,
    },
  };
}

/**
 * Format a timestamp for display
 */
export function formatSnapshotDate(timestamp: string, locale: string = 'en'): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get a human-readable time difference
 */
export function getRelativeTime(timestamp: string, locale: string = 'en'): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isRomanian = locale === 'ro';

  if (diffMins < 1) {
    return isRomanian ? 'Acum' : 'Just now';
  } else if (diffMins < 60) {
    return isRomanian
      ? `Acum ${diffMins} ${diffMins === 1 ? 'minut' : 'minute'}`
      : `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return isRomanian
      ? `Acum ${diffHours} ${diffHours === 1 ? 'oră' : 'ore'}`
      : `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return isRomanian
      ? `Acum ${diffDays} ${diffDays === 1 ? 'zi' : 'zile'}`
      : `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatSnapshotDate(timestamp, locale);
  }
}

/**
 * Validate a calculation history object
 */
export function validateHistory(data: unknown): data is CalculationHistory {
  if (!data || typeof data !== 'object') return false;

  const history = data as CalculationHistory;

  if (!Array.isArray(history.snapshots)) return false;
  if (typeof history.version !== 'string') return false;
  if (typeof history.lastUpdated !== 'string') return false;

  // Validate each snapshot
  for (const snapshot of history.snapshots) {
    if (!validateSnapshot(snapshot)) return false;
  }

  return true;
}

/**
 * Validate a single snapshot
 */
export function validateSnapshot(data: unknown): data is CalculationSnapshot {
  if (!data || typeof data !== 'object') return false;

  const snapshot = data as CalculationSnapshot;

  if (typeof snapshot.id !== 'string') return false;
  if (typeof snapshot.timestamp !== 'string') return false;
  if (!snapshot.inputs || typeof snapshot.inputs !== 'object') return false;
  if (!snapshot.results || typeof snapshot.results !== 'object') return false;
  if (typeof snapshot.results.monthlyPension !== 'number') return false;
  if (typeof snapshot.results.yearlyPension !== 'number') return false;

  return true;
}

/**
 * Migrate history from older schema versions if needed
 */
export function migrateHistory(history: CalculationHistory): CalculationHistory {
  // Currently only version 1.0.0 exists, so no migration needed
  // Future versions would add migration logic here
  return {
    ...history,
    version: CALCULATION_HISTORY_CONFIG.SCHEMA_VERSION,
  };
}

/**
 * Clear all history
 */
export function clearHistory(): CalculationHistory {
  return createEmptyHistory();
}

/**
 * Export history as JSON string
 */
export function exportHistoryToJson(history: CalculationHistory): string {
  return JSON.stringify(
    {
      ...history,
      exportDate: new Date().toISOString(),
      appName: 'Romanian Pension Calculator',
    },
    null,
    2
  );
}

/**
 * Import history from JSON string
 */
export function importHistoryFromJson(json: string): CalculationHistory | null {
  try {
    const data = JSON.parse(json);
    if (validateHistory(data)) {
      return migrateHistory(data);
    }
    return null;
  } catch {
    return null;
  }
}
