/**
 * Scenario Calculations Utilities
 *
 * Utility functions for managing what-if scenarios and calculating
 * pension outcomes based on different assumptions.
 */

import {
  WhatIfScenario,
  ScenarioModification,
  ScenarioStorage,
  ScenarioComparisonResult,
  PensionInputs,
  PensionDetails,
  ContributionPeriod,
  WorkingCondition,
  SCENARIO_CONFIG,
} from '../types/pensionTypes';
import { calculateMonthlyPension } from './pensionCalculations';

/**
 * Generate a unique ID for a scenario
 */
export function generateScenarioId(): string {
  return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create an empty scenario storage
 */
export function createEmptyScenarioStorage(): ScenarioStorage {
  return {
    scenarios: [],
    version: SCENARIO_CONFIG.SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get the next available color for a scenario
 */
export function getNextScenarioColor(existingScenarios: WhatIfScenario[]): string {
  const usedColors = new Set(existingScenarios.map(s => s.color));
  const availableColor = SCENARIO_CONFIG.COLORS.find(c => !usedColors.has(c));
  return availableColor || SCENARIO_CONFIG.COLORS[existingScenarios.length % SCENARIO_CONFIG.COLORS.length];
}

/**
 * Deep clone PensionInputs to avoid mutation
 */
function cloneInputs(inputs: PensionInputs): PensionInputs {
  return JSON.parse(JSON.stringify(inputs));
}

/**
 * Apply a salary change modification to inputs
 */
function applySalaryChange(
  inputs: PensionInputs,
  percentChange: number
): PensionInputs {
  const modified = cloneInputs(inputs);
  const multiplier = 1 + (percentChange / 100);

  modified.contributionPeriods = modified.contributionPeriods.map(period => {
    if (period.monthlyGrossSalary && !period.nonContributiveType) {
      return {
        ...period,
        monthlyGrossSalary: Math.round(period.monthlyGrossSalary * multiplier),
      };
    }
    return period;
  });

  return modified;
}

/**
 * Apply additional years modification to inputs
 */
function applyAdditionalYears(
  inputs: PensionInputs,
  additionalYears: number
): PensionInputs {
  const modified = cloneInputs(inputs);

  if (modified.contributionPeriods.length === 0) {
    return modified;
  }

  // Find the last employment period (non-contributive periods excluded)
  const employmentPeriods = modified.contributionPeriods.filter(p => !p.nonContributiveType);

  if (employmentPeriods.length === 0) {
    return modified;
  }

  // Sort by end date and get the last one
  const sortedPeriods = [...employmentPeriods].sort((a, b) => {
    return new Date(b.toDate).getTime() - new Date(a.toDate).getTime();
  });

  const lastPeriod = sortedPeriods[0];
  const lastPeriodIndex = modified.contributionPeriods.findIndex(
    p => p.fromDate === lastPeriod.fromDate && p.toDate === lastPeriod.toDate
  );

  if (lastPeriodIndex !== -1) {
    const currentEndDate = new Date(lastPeriod.toDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + additionalYears);

    modified.contributionPeriods[lastPeriodIndex] = {
      ...modified.contributionPeriods[lastPeriodIndex],
      toDate: newEndDate.toISOString().split('T')[0],
    };
  }

  return modified;
}

/**
 * Apply working condition change modification to inputs
 */
function applyWorkingConditionChange(
  inputs: PensionInputs,
  newCondition: WorkingCondition
): PensionInputs {
  const modified = cloneInputs(inputs);

  modified.contributionPeriods = modified.contributionPeriods.map(period => {
    if (!period.nonContributiveType) {
      return {
        ...period,
        workingCondition: newCondition,
      };
    }
    return period;
  });

  return modified;
}

/**
 * Apply retirement age change modification
 */
function applyRetirementAgeChange(
  inputs: PensionInputs,
  targetRetirementAge: number,
  birthDate: string
): PensionInputs {
  const modified = cloneInputs(inputs);

  // Calculate the new retirement year based on birth date and target age
  const birth = new Date(birthDate);
  const targetYear = birth.getFullYear() + targetRetirementAge;

  modified.retirementYear = targetYear;

  return modified;
}

/**
 * Apply all modifications to create modified inputs
 */
export function applyModifications(
  baseInputs: PensionInputs,
  modifications: ScenarioModification[]
): PensionInputs {
  let modified = cloneInputs(baseInputs);

  for (const mod of modifications) {
    switch (mod.type) {
      case 'salaryChange':
        if (mod.salaryChangePercent !== undefined) {
          modified = applySalaryChange(modified, mod.salaryChangePercent);
        }
        break;
      case 'additionalYears':
        if (mod.additionalYears !== undefined) {
          modified = applyAdditionalYears(modified, mod.additionalYears);
        }
        break;
      case 'workingConditionChange':
        if (mod.newWorkingCondition !== undefined) {
          modified = applyWorkingConditionChange(modified, mod.newWorkingCondition);
        }
        break;
      case 'retirementAgeChange':
        if (mod.targetRetirementAge !== undefined) {
          modified = applyRetirementAgeChange(modified, mod.targetRetirementAge, baseInputs.birthDate);
        }
        break;
    }
  }

  return modified;
}

/**
 * Calculate pension results for modified inputs
 */
export function calculateScenarioResults(
  modifiedInputs: PensionInputs
): { monthlyPension: number; yearlyPension: number; details: PensionDetails } {
  const { monthlyPension, details } = calculateMonthlyPension(
    modifiedInputs.contributionPeriods,
    modifiedInputs.birthDate
  );

  return {
    monthlyPension,
    yearlyPension: monthlyPension * 12,
    details,
  };
}

/**
 * Create a new what-if scenario
 */
export function createScenario(
  name: string,
  baseInputs: PensionInputs,
  modifications: ScenarioModification[],
  existingScenarios: WhatIfScenario[],
  description?: string,
  isBaseline?: boolean
): WhatIfScenario {
  const modifiedInputs = applyModifications(baseInputs, modifications);
  const { monthlyPension, yearlyPension, details } = calculateScenarioResults(modifiedInputs);

  const now = new Date().toISOString();

  return {
    id: generateScenarioId(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    baseInputs: cloneInputs(baseInputs),
    modifications,
    modifiedInputs,
    results: details,
    monthlyPension,
    yearlyPension,
    color: getNextScenarioColor(existingScenarios),
    isBaseline,
  };
}

/**
 * Create a baseline scenario from current inputs
 */
export function createBaselineScenario(
  inputs: PensionInputs,
  pensionDetails: PensionDetails,
  monthlyPension: number
): WhatIfScenario {
  const now = new Date().toISOString();

  return {
    id: 'baseline',
    name: 'Current Situation',
    description: 'Your current pension calculation based on actual data',
    createdAt: now,
    updatedAt: now,
    baseInputs: cloneInputs(inputs),
    modifications: [],
    modifiedInputs: cloneInputs(inputs),
    results: { ...pensionDetails },
    monthlyPension,
    yearlyPension: monthlyPension * 12,
    color: '#6B7280', // Gray for baseline
    isBaseline: true,
  };
}

/**
 * Update an existing scenario
 */
export function updateScenario(
  scenario: WhatIfScenario,
  updates: {
    name?: string;
    description?: string;
    modifications?: ScenarioModification[];
  }
): WhatIfScenario {
  const modified = { ...scenario };
  modified.updatedAt = new Date().toISOString();

  if (updates.name !== undefined) {
    modified.name = updates.name;
  }

  if (updates.description !== undefined) {
    modified.description = updates.description;
  }

  if (updates.modifications !== undefined) {
    modified.modifications = updates.modifications;
    modified.modifiedInputs = applyModifications(scenario.baseInputs, updates.modifications);
    const results = calculateScenarioResults(modified.modifiedInputs);
    modified.results = results.details;
    modified.monthlyPension = results.monthlyPension;
    modified.yearlyPension = results.yearlyPension;
  }

  return modified;
}

/**
 * Compare a scenario against the baseline
 */
export function compareScenarioToBaseline(
  scenario: WhatIfScenario,
  baseline: WhatIfScenario
): ScenarioComparisonResult {
  const monthlyPensionDiff = scenario.monthlyPension - baseline.monthlyPension;
  const yearlyPensionDiff = scenario.yearlyPension - baseline.yearlyPension;
  const monthlyPensionDiffPercent = baseline.monthlyPension > 0
    ? (monthlyPensionDiff / baseline.monthlyPension) * 100
    : 0;

  const totalPointsDiff = scenario.results.totalPoints - baseline.results.totalPoints;
  const totalPointsDiffPercent = baseline.results.totalPoints > 0
    ? (totalPointsDiff / baseline.results.totalPoints) * 100
    : 0;

  return {
    scenario,
    monthlyPensionDiff,
    yearlyPensionDiff,
    monthlyPensionDiffPercent,
    totalPointsDiff,
    totalPointsDiffPercent,
    contributionPointsDiff: scenario.results.contributionPoints - baseline.results.contributionPoints,
    stabilityPointsDiff: scenario.results.stabilityPoints - baseline.results.stabilityPoints,
    nonContributivePointsDiff: (scenario.results.nonContributivePoints || 0) - (baseline.results.nonContributivePoints || 0),
    yearsUntilRetirementDiff: (scenario.results.yearsUntilRetirement || 0) - (baseline.results.yearsUntilRetirement || 0),
  };
}

/**
 * Add a scenario to storage
 */
export function addScenarioToStorage(
  storage: ScenarioStorage,
  scenario: WhatIfScenario
): ScenarioStorage {
  const newScenarios = [scenario, ...storage.scenarios];

  // Enforce maximum limit
  if (newScenarios.length > SCENARIO_CONFIG.MAX_SCENARIOS) {
    newScenarios.splice(SCENARIO_CONFIG.MAX_SCENARIOS);
  }

  return {
    ...storage,
    scenarios: newScenarios,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Remove a scenario from storage
 */
export function removeScenarioFromStorage(
  storage: ScenarioStorage,
  scenarioId: string
): ScenarioStorage {
  return {
    ...storage,
    scenarios: storage.scenarios.filter(s => s.id !== scenarioId),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Update a scenario in storage
 */
export function updateScenarioInStorage(
  storage: ScenarioStorage,
  scenarioId: string,
  updates: {
    name?: string;
    description?: string;
    modifications?: ScenarioModification[];
  }
): ScenarioStorage {
  return {
    ...storage,
    scenarios: storage.scenarios.map(s => {
      if (s.id === scenarioId) {
        return updateScenario(s, updates);
      }
      return s;
    }),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get a scenario by ID
 */
export function getScenarioById(
  storage: ScenarioStorage,
  scenarioId: string
): WhatIfScenario | undefined {
  return storage.scenarios.find(s => s.id === scenarioId);
}

/**
 * Validate scenario storage
 */
export function validateScenarioStorage(data: unknown): data is ScenarioStorage {
  if (!data || typeof data !== 'object') return false;

  const storage = data as ScenarioStorage;

  if (!Array.isArray(storage.scenarios)) return false;
  if (typeof storage.version !== 'string') return false;
  if (typeof storage.lastUpdated !== 'string') return false;

  // Validate each scenario
  for (const scenario of storage.scenarios) {
    if (!validateScenario(scenario)) return false;
  }

  return true;
}

/**
 * Validate a single scenario
 */
export function validateScenario(data: unknown): data is WhatIfScenario {
  if (!data || typeof data !== 'object') return false;

  const scenario = data as WhatIfScenario;

  if (typeof scenario.id !== 'string') return false;
  if (typeof scenario.name !== 'string') return false;
  if (typeof scenario.createdAt !== 'string') return false;
  if (!scenario.baseInputs || typeof scenario.baseInputs !== 'object') return false;
  if (!Array.isArray(scenario.modifications)) return false;
  if (!scenario.modifiedInputs || typeof scenario.modifiedInputs !== 'object') return false;
  if (!scenario.results || typeof scenario.results !== 'object') return false;
  if (typeof scenario.monthlyPension !== 'number') return false;
  if (typeof scenario.yearlyPension !== 'number') return false;

  return true;
}

/**
 * Migrate scenario storage from older versions if needed
 */
export function migrateScenarioStorage(storage: ScenarioStorage): ScenarioStorage {
  // Currently only version 1.0.0 exists, so no migration needed
  return {
    ...storage,
    version: SCENARIO_CONFIG.SCHEMA_VERSION,
  };
}

/**
 * Clear all scenarios
 */
export function clearScenarioStorage(): ScenarioStorage {
  return createEmptyScenarioStorage();
}

/**
 * Get a human-readable description of a modification
 */
export function getModificationDescription(
  mod: ScenarioModification,
  t: (key: string, params?: Record<string, unknown>) => string
): string {
  switch (mod.type) {
    case 'salaryChange':
      const sign = (mod.salaryChangePercent || 0) >= 0 ? '+' : '';
      return t('scenarios.modifications.salaryChange', { percent: `${sign}${mod.salaryChangePercent}` });
    case 'additionalYears':
      return t('scenarios.modifications.additionalYears', { years: mod.additionalYears });
    case 'workingConditionChange':
      return t('scenarios.modifications.workingConditionChange', { condition: mod.newWorkingCondition });
    case 'retirementAgeChange':
      return t('scenarios.modifications.retirementAgeChange', { age: mod.targetRetirementAge });
    default:
      return mod.description || '';
  }
}

/**
 * Predefined scenario templates for quick creation
 */
export const SCENARIO_TEMPLATES = [
  {
    id: 'salary_increase_10',
    nameKey: 'scenarios.templates.salaryIncrease10.name',
    descriptionKey: 'scenarios.templates.salaryIncrease10.description',
    modifications: [
      { type: 'salaryChange' as const, salaryChangePercent: 10 },
    ],
  },
  {
    id: 'salary_increase_20',
    nameKey: 'scenarios.templates.salaryIncrease20.name',
    descriptionKey: 'scenarios.templates.salaryIncrease20.description',
    modifications: [
      { type: 'salaryChange' as const, salaryChangePercent: 20 },
    ],
  },
  {
    id: 'work_2_more_years',
    nameKey: 'scenarios.templates.work2MoreYears.name',
    descriptionKey: 'scenarios.templates.work2MoreYears.description',
    modifications: [
      { type: 'additionalYears' as const, additionalYears: 2 },
    ],
  },
  {
    id: 'work_5_more_years',
    nameKey: 'scenarios.templates.work5MoreYears.name',
    descriptionKey: 'scenarios.templates.work5MoreYears.description',
    modifications: [
      { type: 'additionalYears' as const, additionalYears: 5 },
    ],
  },
  {
    id: 'group_ii_conditions',
    nameKey: 'scenarios.templates.groupIIConditions.name',
    descriptionKey: 'scenarios.templates.groupIIConditions.description',
    modifications: [
      { type: 'workingConditionChange' as const, newWorkingCondition: 'groupII' as WorkingCondition },
    ],
  },
  {
    id: 'salary_increase_work_longer',
    nameKey: 'scenarios.templates.salaryIncreaseAndWorkLonger.name',
    descriptionKey: 'scenarios.templates.salaryIncreaseAndWorkLonger.description',
    modifications: [
      { type: 'salaryChange' as const, salaryChangePercent: 15 },
      { type: 'additionalYears' as const, additionalYears: 3 },
    ],
  },
];
