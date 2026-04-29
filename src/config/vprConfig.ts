/**
 * VPR (Valoarea Punctului de Referință) Configuration System
 *
 * This module provides a centralized configuration system for managing
 * the pension point reference value (VPR) without requiring code changes.
 *
 * The VPR is updated annually by the Romanian government and affects
 * all pension calculations: monthlyPension = totalPoints × VPR
 */

export interface VPRValue {
  year: number;
  value: number;
  effectiveDate: string; // ISO date string (YYYY-MM-DD)
  description?: string;
}

export interface VPRConfig {
  currentYear: number;
  currentValue: number;
  effectiveDate: string;
  historicalValues: VPRValue[];
  lastUpdated: string; // ISO date string
  updatedBy?: string;
}

// Default VPR configuration with historical values
export const DEFAULT_VPR_CONFIG: VPRConfig = {
  currentYear: 2024,
  currentValue: 81.03,
  effectiveDate: '2024-09-01',
  historicalValues: [
    {
      year: 2024,
      value: 81.03,
      effectiveDate: '2024-09-01',
      description: 'VPR = 2.032 RON / 25 = 81.03 RON'
    },
    {
      year: 2023,
      value: 75.00,
      effectiveDate: '2023-01-01',
      description: 'Previous year reference value'
    },
    {
      year: 2022,
      value: 68.00,
      effectiveDate: '2022-01-01',
      description: 'Historical reference value'
    }
  ],
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

// Storage key for VPR configuration
export const VPR_CONFIG_STORAGE_KEY = 'vpr_config';

/**
 * Get VPR configuration from localStorage or return defaults
 */
export function getVPRConfig(): VPRConfig {
  try {
    const stored = localStorage.getItem(VPR_CONFIG_STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored) as VPRConfig;
      // Validate the config has required fields
      if (config.currentYear && config.currentValue && config.effectiveDate) {
        return config;
      }
    }
  } catch (error) {
    console.error('Error reading VPR config from localStorage:', error);
  }
  return DEFAULT_VPR_CONFIG;
}

/**
 * Save VPR configuration to localStorage
 */
export function saveVPRConfig(config: VPRConfig): void {
  try {
    const configToSave: VPRConfig = {
      ...config,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(VPR_CONFIG_STORAGE_KEY, JSON.stringify(configToSave));
  } catch (error) {
    console.error('Error saving VPR config to localStorage:', error);
    throw new Error('Failed to save VPR configuration');
  }
}

/**
 * Update the current VPR value
 */
export function updateCurrentVPR(
  year: number,
  value: number,
  effectiveDate: string,
  description?: string,
  updatedBy?: string
): VPRConfig {
  const currentConfig = getVPRConfig();

  // Check if this year already exists in historical values
  const existingIndex = currentConfig.historicalValues.findIndex(v => v.year === year);

  const newVPRValue: VPRValue = {
    year,
    value,
    effectiveDate,
    description
  };

  let updatedHistoricalValues: VPRValue[];

  if (existingIndex >= 0) {
    // Update existing entry
    updatedHistoricalValues = [...currentConfig.historicalValues];
    updatedHistoricalValues[existingIndex] = newVPRValue;
  } else {
    // Add new entry and keep sorted by year (descending)
    updatedHistoricalValues = [...currentConfig.historicalValues, newVPRValue]
      .sort((a, b) => b.year - a.year);
  }

  const newConfig: VPRConfig = {
    currentYear: year,
    currentValue: value,
    effectiveDate,
    historicalValues: updatedHistoricalValues,
    lastUpdated: new Date().toISOString(),
    updatedBy
  };

  saveVPRConfig(newConfig);
  return newConfig;
}

/**
 * Get VPR value for a specific year
 * Returns the current value if year is not found in historical data
 */
export function getVPRForYear(year: number): number {
  const config = getVPRConfig();

  // Find exact match
  const exactMatch = config.historicalValues.find(v => v.year === year);
  if (exactMatch) {
    return exactMatch.value;
  }

  // If year is in the future or current, use current value
  if (year >= config.currentYear) {
    return config.currentValue;
  }

  // For past years without data, find the closest available year
  const sortedValues = [...config.historicalValues].sort((a, b) => b.year - a.year);
  const closestPast = sortedValues.find(v => v.year <= year);

  return closestPast?.value ?? config.currentValue;
}

/**
 * Get the current VPR value
 */
export function getCurrentVPR(): number {
  return getVPRConfig().currentValue;
}

/**
 * Reset VPR configuration to defaults
 */
export function resetVPRConfig(): VPRConfig {
  saveVPRConfig(DEFAULT_VPR_CONFIG);
  return DEFAULT_VPR_CONFIG;
}

/**
 * Add a historical VPR value
 */
export function addHistoricalVPR(vprValue: VPRValue): VPRConfig {
  const currentConfig = getVPRConfig();

  // Check if year already exists
  const existingIndex = currentConfig.historicalValues.findIndex(v => v.year === vprValue.year);

  let updatedHistoricalValues: VPRValue[];

  if (existingIndex >= 0) {
    // Update existing entry
    updatedHistoricalValues = [...currentConfig.historicalValues];
    updatedHistoricalValues[existingIndex] = vprValue;
  } else {
    // Add new entry and keep sorted
    updatedHistoricalValues = [...currentConfig.historicalValues, vprValue]
      .sort((a, b) => b.year - a.year);
  }

  const newConfig: VPRConfig = {
    ...currentConfig,
    historicalValues: updatedHistoricalValues,
    lastUpdated: new Date().toISOString()
  };

  saveVPRConfig(newConfig);
  return newConfig;
}

/**
 * Remove a historical VPR value
 * Cannot remove the current year's value
 */
export function removeHistoricalVPR(year: number): VPRConfig {
  const currentConfig = getVPRConfig();

  // Cannot remove current year
  if (year === currentConfig.currentYear) {
    throw new Error('Cannot remove the current year\'s VPR value');
  }

  const updatedHistoricalValues = currentConfig.historicalValues.filter(v => v.year !== year);

  const newConfig: VPRConfig = {
    ...currentConfig,
    historicalValues: updatedHistoricalValues,
    lastUpdated: new Date().toISOString()
  };

  saveVPRConfig(newConfig);
  return newConfig;
}

/**
 * Export VPR configuration as JSON
 */
export function exportVPRConfig(): string {
  const config = getVPRConfig();
  return JSON.stringify({
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    type: 'vpr_config',
    data: config
  }, null, 2);
}

/**
 * Import VPR configuration from JSON
 */
export function importVPRConfig(jsonString: string): VPRConfig {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate the import format
    if (parsed.type !== 'vpr_config' || !parsed.data) {
      throw new Error('Invalid VPR configuration format');
    }

    const config = parsed.data as VPRConfig;

    // Validate required fields
    if (!config.currentYear || !config.currentValue || !config.effectiveDate) {
      throw new Error('Missing required VPR configuration fields');
    }

    saveVPRConfig(config);
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}
