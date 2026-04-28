/**
 * Scenarios Hook
 *
 * Custom hook for managing what-if scenarios with localStorage persistence.
 */

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  ScenarioStorage,
  WhatIfScenario,
  ScenarioModification,
  ScenarioComparisonResult,
  PensionInputs,
  PensionDetails,
  SCENARIO_CONFIG,
} from '../types/pensionTypes';
import {
  createScenario,
  createBaselineScenario,
  createEmptyScenarioStorage,
  addScenarioToStorage,
  removeScenarioFromStorage,
  updateScenarioInStorage,
  getScenarioById,
  compareScenarioToBaseline,
  validateScenarioStorage,
  migrateScenarioStorage,
  clearScenarioStorage,
  SCENARIO_TEMPLATES,
} from '../utils/scenarioCalculations';

/**
 * Default debounce delay for saving to local storage (in milliseconds)
 */
const SAVE_DEBOUNCE_DELAY = 500;

export interface UseScenariosReturn {
  /** The scenario storage */
  storage: ScenarioStorage;
  /** Whether the storage has been loaded */
  isLoaded: boolean;
  /** All scenarios including baseline */
  scenarios: WhatIfScenario[];
  /** Number of user-created scenarios (excluding baseline) */
  scenarioCount: number;
  /** Whether storage is at max capacity */
  isAtCapacity: boolean;
  /** The baseline scenario (current actual inputs) */
  baseline: WhatIfScenario | null;
  /** Create a new scenario */
  createNewScenario: (
    name: string,
    modifications: ScenarioModification[],
    description?: string
  ) => WhatIfScenario | null;
  /** Create a scenario from a template */
  createFromTemplate: (templateId: string, name?: string) => WhatIfScenario | null;
  /** Delete a scenario by ID */
  deleteScenario: (scenarioId: string) => void;
  /** Update a scenario */
  updateScenarioById: (
    scenarioId: string,
    updates: {
      name?: string;
      description?: string;
      modifications?: ScenarioModification[];
    }
  ) => void;
  /** Get a scenario by ID */
  getScenario: (scenarioId: string) => WhatIfScenario | undefined;
  /** Compare a scenario to the baseline */
  compareToBaseline: (scenarioId: string) => ScenarioComparisonResult | null;
  /** Compare all scenarios to baseline */
  compareAllToBaseline: () => ScenarioComparisonResult[];
  /** Clear all scenarios */
  clearAllScenarios: () => void;
  /** Update the baseline with current inputs */
  updateBaseline: () => void;
  /** Get available scenario templates */
  templates: typeof SCENARIO_TEMPLATES;
}

export interface UseScenariosProps {
  /** Current pension inputs */
  currentInputs: PensionInputs;
  /** Current pension details */
  pensionDetails: PensionDetails;
  /** Current monthly pension */
  monthlyPension: number;
}

export function useScenarios({
  currentInputs,
  pensionDetails,
  monthlyPension,
}: UseScenariosProps): UseScenariosReturn {
  // Use localStorage for persistent storage with debounced saving
  const [storage, setStorage, isLoaded] = useLocalStorage<ScenarioStorage>(
    SCENARIO_CONFIG.STORAGE_KEY,
    createEmptyScenarioStorage(),
    SAVE_DEBOUNCE_DELAY
  );

  // Ensure storage is valid and migrated
  const validStorage = useMemo(() => {
    if (!validateScenarioStorage(storage)) {
      return createEmptyScenarioStorage();
    }
    return migrateScenarioStorage(storage);
  }, [storage]);

  // Create or update the baseline scenario
  const baseline = useMemo(() => {
    if (!currentInputs.birthDate || !currentInputs.contributionPeriods?.length) {
      return null;
    }
    return createBaselineScenario(currentInputs, pensionDetails, monthlyPension);
  }, [currentInputs, pensionDetails, monthlyPension]);

  // Combine baseline with user scenarios
  const scenarios = useMemo(() => {
    const userScenarios = validStorage.scenarios.filter(s => !s.isBaseline);
    return baseline ? [baseline, ...userScenarios] : userScenarios;
  }, [validStorage.scenarios, baseline]);

  // Calculate derived state
  const scenarioCount = validStorage.scenarios.filter(s => !s.isBaseline).length;
  const isAtCapacity = scenarioCount >= SCENARIO_CONFIG.MAX_SCENARIOS;

  /**
   * Create a new scenario
   */
  const createNewScenario = useCallback(
    (
      name: string,
      modifications: ScenarioModification[],
      description?: string
    ): WhatIfScenario | null => {
      if (!currentInputs.birthDate || isAtCapacity) {
        return null;
      }

      const scenario = createScenario(
        name,
        currentInputs,
        modifications,
        validStorage.scenarios,
        description
      );

      setStorage((prev) => addScenarioToStorage(prev, scenario));
      return scenario;
    },
    [currentInputs, validStorage.scenarios, isAtCapacity, setStorage]
  );

  /**
   * Create a scenario from a template
   */
  const createFromTemplate = useCallback(
    (templateId: string, customName?: string): WhatIfScenario | null => {
      const template = SCENARIO_TEMPLATES.find(t => t.id === templateId);
      if (!template || !currentInputs.birthDate || isAtCapacity) {
        return null;
      }

      const name = customName || template.nameKey;
      const scenario = createScenario(
        name,
        currentInputs,
        template.modifications,
        validStorage.scenarios,
        template.descriptionKey
      );

      setStorage((prev) => addScenarioToStorage(prev, scenario));
      return scenario;
    },
    [currentInputs, validStorage.scenarios, isAtCapacity, setStorage]
  );

  /**
   * Delete a scenario by ID
   */
  const deleteScenario = useCallback(
    (scenarioId: string) => {
      setStorage((prev) => removeScenarioFromStorage(prev, scenarioId));
    },
    [setStorage]
  );

  /**
   * Update a scenario
   */
  const updateScenarioById = useCallback(
    (
      scenarioId: string,
      updates: {
        name?: string;
        description?: string;
        modifications?: ScenarioModification[];
      }
    ) => {
      setStorage((prev) => updateScenarioInStorage(prev, scenarioId, updates));
    },
    [setStorage]
  );

  /**
   * Get a scenario by ID
   */
  const getScenario = useCallback(
    (scenarioId: string): WhatIfScenario | undefined => {
      if (scenarioId === 'baseline') {
        return baseline || undefined;
      }
      return getScenarioById(validStorage, scenarioId);
    },
    [validStorage, baseline]
  );

  /**
   * Compare a scenario to the baseline
   */
  const compareToBaseline = useCallback(
    (scenarioId: string): ScenarioComparisonResult | null => {
      if (!baseline) return null;

      const scenario = getScenario(scenarioId);
      if (!scenario) return null;

      return compareScenarioToBaseline(scenario, baseline);
    },
    [baseline, getScenario]
  );

  /**
   * Compare all scenarios to baseline
   */
  const compareAllToBaseline = useCallback((): ScenarioComparisonResult[] => {
    if (!baseline) return [];

    return validStorage.scenarios
      .filter(s => !s.isBaseline)
      .map(scenario => compareScenarioToBaseline(scenario, baseline));
  }, [validStorage.scenarios, baseline]);

  /**
   * Clear all scenarios
   */
  const clearAllScenarios = useCallback(() => {
    setStorage(clearScenarioStorage());
  }, [setStorage]);

  /**
   * Update baseline with current inputs (recalculates all scenarios)
   */
  const updateBaseline = useCallback(() => {
    // Scenarios will automatically recalculate when currentInputs changes
    // This is handled by the useMemo for baseline above
  }, []);

  return {
    storage: validStorage,
    isLoaded,
    scenarios,
    scenarioCount,
    isAtCapacity,
    baseline,
    createNewScenario,
    createFromTemplate,
    deleteScenario,
    updateScenarioById,
    getScenario,
    compareToBaseline,
    compareAllToBaseline,
    clearAllScenarios,
    updateBaseline,
    templates: SCENARIO_TEMPLATES,
  };
}
