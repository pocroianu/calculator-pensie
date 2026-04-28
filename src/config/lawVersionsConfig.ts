/**
 * Law Versions Configuration
 *
 * Defines all Romanian pension law versions with their calculation parameters.
 * Each law version represents a major legislative change that affects pension calculations.
 *
 * This configuration allows the calculator to compute pensions under different
 * legislative regimes, enabling users to compare outcomes across law versions.
 */

import {
  LawVersion,
  LawVersionConfig,
  LawVersionId,
  LawVersionComparison,
  LawVersionChange,
  LawCalculationParameters,
} from '../types/lawVersionTypes';

// localStorage key for user-selected law version
export const LAW_VERSION_STORAGE_KEY = 'selected_law_version';

/**
 * All Romanian pension law versions with their calculation parameters
 */
export const LAW_VERSIONS: LawVersion[] = [
  {
    id: 'legea_360_2023',
    name: 'Legea nr. 360/2023',
    shortDescription: 'September 2024 Pension Reform',
    effectiveDate: '2024-09-01',
    supersededDate: null,
    isActive: true,
    keyChanges: [
      'lawVersions.changes.360_vpr',
      'lawVersions.changes.360_formula',
      'lawVersions.changes.360_stabilityPoints',
      'lawVersions.changes.360_recalculation',
    ],
    parameters: {
      retirementAge: 65,
      minimumContributionYears: 15,
      completeContributionYears: 35,
      groupIIBonus: 0.25,
      groupIBonus: 0.50,
      specialConditionsBonus: 0.50,
      vprValue: 81.03,
      earlyRetirementPenaltyPerYear: 6,
      maxEarlyRetirementYears: 5,
      minimumEarlyRetirementAge: 60,
      groupIRetirementAgeReduction: 10,
      groupIIRetirementAgeReduction: 5,
      specialConditionsRetirementAgeReduction: 10,
      groupIMinimumYears: 10,
      groupIIMinimumYears: 15,
      specialConditionsMinimumYears: 10,
      stabilityTiers: [
        { startYear: 26, endYear: 30, pointsPerYear: 0.50 },
        { startYear: 31, endYear: 35, pointsPerYear: 0.75 },
        { startYear: 36, endYear: 40, pointsPerYear: 1.00 },
      ],
      nonContributiveRates: {
        military: 0.25,
        university: 0.25,
        childCare: 0.25,
        medical: 0.20,
      },
    },
    officialReference: 'Monitorul Oficial nr. 1214/2023',
  },
  {
    id: 'oug_163_2022',
    name: 'OUG nr. 163/2022',
    shortDescription: 'Emergency Ordinance 2022',
    effectiveDate: '2023-01-01',
    supersededDate: '2024-08-31',
    isActive: false,
    keyChanges: [
      'lawVersions.changes.163_indexation',
      'lawVersions.changes.163_pensionPoint',
      'lawVersions.changes.163_minimumPension',
    ],
    parameters: {
      retirementAge: 65,
      minimumContributionYears: 15,
      completeContributionYears: 35,
      groupIIBonus: 0.25,
      groupIBonus: 0.50,
      specialConditionsBonus: 0.50,
      vprValue: 75.00,
      earlyRetirementPenaltyPerYear: 6,
      maxEarlyRetirementYears: 5,
      minimumEarlyRetirementAge: 60,
      groupIRetirementAgeReduction: 10,
      groupIIRetirementAgeReduction: 5,
      specialConditionsRetirementAgeReduction: 10,
      groupIMinimumYears: 10,
      groupIIMinimumYears: 15,
      specialConditionsMinimumYears: 10,
      stabilityTiers: [
        { startYear: 26, endYear: 30, pointsPerYear: 0.50 },
        { startYear: 31, endYear: 35, pointsPerYear: 0.75 },
        { startYear: 36, endYear: 40, pointsPerYear: 1.00 },
      ],
      nonContributiveRates: {
        military: 0.25,
        university: 0.25,
        childCare: 0.25,
        medical: 0.20,
      },
    },
    officialReference: 'Monitorul Oficial nr. 1187/2022',
  },
  {
    id: 'legea_127_2019',
    name: 'Legea nr. 127/2019',
    shortDescription: 'Pension Law Modifications 2019',
    effectiveDate: '2019-09-01',
    supersededDate: '2022-12-31',
    isActive: false,
    keyChanges: [
      'lawVersions.changes.127_pensionPoint',
      'lawVersions.changes.127_indexation',
      'lawVersions.changes.127_specialConditions',
    ],
    parameters: {
      retirementAge: 65,
      minimumContributionYears: 15,
      completeContributionYears: 35,
      groupIIBonus: 0.25,
      groupIBonus: 0.50,
      specialConditionsBonus: 0.50,
      vprValue: 57.50,
      earlyRetirementPenaltyPerYear: 6,
      maxEarlyRetirementYears: 5,
      minimumEarlyRetirementAge: 60,
      groupIRetirementAgeReduction: 10,
      groupIIRetirementAgeReduction: 5,
      specialConditionsRetirementAgeReduction: 10,
      groupIMinimumYears: 10,
      groupIIMinimumYears: 15,
      specialConditionsMinimumYears: 10,
      stabilityTiers: [
        { startYear: 26, endYear: 30, pointsPerYear: 0.50 },
        { startYear: 31, endYear: 35, pointsPerYear: 0.75 },
        { startYear: 36, endYear: 40, pointsPerYear: 1.00 },
      ],
      nonContributiveRates: {
        military: 0.25,
        university: 0.25,
        childCare: 0.25,
        medical: 0.20,
      },
    },
    officialReference: 'Monitorul Oficial nr. 563/2019',
  },
  {
    id: 'legea_263_2010',
    name: 'Legea nr. 263/2010',
    shortDescription: 'Unified Public Pension System',
    effectiveDate: '2011-01-01',
    supersededDate: '2019-08-31',
    isActive: false,
    keyChanges: [
      'lawVersions.changes.263_unifiedSystem',
      'lawVersions.changes.263_retirementAge',
      'lawVersions.changes.263_contributionYears',
      'lawVersions.changes.263_pointSystem',
    ],
    parameters: {
      retirementAge: 65,
      minimumContributionYears: 15,
      completeContributionYears: 35,
      groupIIBonus: 0.25,
      groupIBonus: 0.50,
      specialConditionsBonus: 0.50,
      vprValue: 37.50,
      earlyRetirementPenaltyPerYear: 6,
      maxEarlyRetirementYears: 5,
      minimumEarlyRetirementAge: 60,
      groupIRetirementAgeReduction: 10,
      groupIIRetirementAgeReduction: 5,
      specialConditionsRetirementAgeReduction: 10,
      groupIMinimumYears: 10,
      groupIIMinimumYears: 15,
      specialConditionsMinimumYears: 10,
      stabilityTiers: [
        { startYear: 26, endYear: 30, pointsPerYear: 0.50 },
        { startYear: 31, endYear: 35, pointsPerYear: 0.75 },
        { startYear: 36, endYear: 40, pointsPerYear: 1.00 },
      ],
      nonContributiveRates: {
        military: 0.25,
        university: 0.25,
        childCare: 0.25,
        medical: 0.20,
      },
    },
    officialReference: 'Monitorul Oficial nr. 852/2010',
  },
  {
    id: 'legea_19_2000',
    name: 'Legea nr. 19/2000',
    shortDescription: 'Public Pension System and Social Insurance',
    effectiveDate: '2001-04-01',
    supersededDate: '2010-12-31',
    isActive: false,
    keyChanges: [
      'lawVersions.changes.19_firstModernLaw',
      'lawVersions.changes.19_pointSystem',
      'lawVersions.changes.19_retirementAge',
      'lawVersions.changes.19_workingConditions',
    ],
    parameters: {
      retirementAge: 63,
      minimumContributionYears: 15,
      completeContributionYears: 30,
      groupIIBonus: 0.25,
      groupIBonus: 0.50,
      specialConditionsBonus: 0.50,
      vprValue: 25.00,
      earlyRetirementPenaltyPerYear: 6,
      maxEarlyRetirementYears: 5,
      minimumEarlyRetirementAge: 58,
      groupIRetirementAgeReduction: 10,
      groupIIRetirementAgeReduction: 5,
      specialConditionsRetirementAgeReduction: 10,
      groupIMinimumYears: 10,
      groupIIMinimumYears: 15,
      specialConditionsMinimumYears: 10,
      stabilityTiers: [
        { startYear: 26, endYear: 30, pointsPerYear: 0.50 },
        { startYear: 31, endYear: 35, pointsPerYear: 0.75 },
        { startYear: 36, endYear: 40, pointsPerYear: 1.00 },
      ],
      nonContributiveRates: {
        military: 0.25,
        university: 0.25,
        childCare: 0.25,
        medical: 0.20,
      },
    },
    officialReference: 'Monitorul Oficial nr. 140/2000',
  },
];

/**
 * Get the default (currently active) law version configuration
 */
export function getDefaultLawVersionConfig(): LawVersionConfig {
  const activeVersion = LAW_VERSIONS.find(v => v.isActive) || LAW_VERSIONS[0];
  return {
    versions: LAW_VERSIONS,
    activeVersionId: activeVersion.id,
    selectedVersionId: activeVersion.id,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get law version configuration from localStorage, or return defaults
 */
export function getLawVersionConfig(): LawVersionConfig {
  try {
    const stored = localStorage.getItem(LAW_VERSION_STORAGE_KEY);
    if (stored) {
      const selectedId = stored as LawVersionId;
      // Validate that the stored version ID is valid
      const isValid = LAW_VERSIONS.some(v => v.id === selectedId);
      if (isValid) {
        const config = getDefaultLawVersionConfig();
        config.selectedVersionId = selectedId;
        return config;
      }
    }
  } catch (error) {
    console.error('Error reading law version config from localStorage:', error);
  }
  return getDefaultLawVersionConfig();
}

/**
 * Save the selected law version ID to localStorage
 */
export function saveSelectedLawVersion(versionId: LawVersionId): void {
  try {
    localStorage.setItem(LAW_VERSION_STORAGE_KEY, versionId);
  } catch (error) {
    console.error('Error saving law version to localStorage:', error);
  }
}

/**
 * Get a specific law version by ID
 */
export function getLawVersionById(id: LawVersionId): LawVersion | undefined {
  return LAW_VERSIONS.find(v => v.id === id);
}

/**
 * Get the currently active law version
 */
export function getActiveLawVersion(): LawVersion {
  return LAW_VERSIONS.find(v => v.isActive) || LAW_VERSIONS[0];
}

/**
 * Get the selected law version (what user has chosen)
 */
export function getSelectedLawVersion(): LawVersion {
  const config = getLawVersionConfig();
  return getLawVersionById(config.selectedVersionId) || getActiveLawVersion();
}

/**
 * Get the calculation parameters for the selected law version
 */
export function getSelectedLawParameters(): LawCalculationParameters {
  return getSelectedLawVersion().parameters;
}

/**
 * Get the law version that was active at a specific date
 */
export function getLawVersionForDate(date: string): LawVersion {
  const targetDate = new Date(date);

  // Sort versions by effective date descending
  const sorted = [...LAW_VERSIONS].sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );

  // Find the first version where effectiveDate <= targetDate
  for (const version of sorted) {
    if (new Date(version.effectiveDate) <= targetDate) {
      return version;
    }
  }

  // Fallback to oldest version
  return sorted[sorted.length - 1];
}

/**
 * Compare two law versions and return the differences
 */
export function compareLawVersions(
  fromId: LawVersionId,
  toId: LawVersionId
): LawVersionComparison | null {
  const fromVersion = getLawVersionById(fromId);
  const toVersion = getLawVersionById(toId);

  if (!fromVersion || !toVersion) return null;

  const changes: LawVersionChange[] = [];
  const from = fromVersion.parameters;
  const to = toVersion.parameters;

  // Compare key parameters
  if (from.retirementAge !== to.retirementAge) {
    changes.push({
      parameter: 'retirementAge',
      label: 'lawVersions.comparison.retirementAge',
      oldValue: from.retirementAge,
      newValue: to.retirementAge,
      impact: to.retirementAge > from.retirementAge ? 'negative' : 'positive',
    });
  }

  if (from.minimumContributionYears !== to.minimumContributionYears) {
    changes.push({
      parameter: 'minimumContributionYears',
      label: 'lawVersions.comparison.minimumContributionYears',
      oldValue: from.minimumContributionYears,
      newValue: to.minimumContributionYears,
      impact: to.minimumContributionYears > from.minimumContributionYears ? 'negative' : 'positive',
    });
  }

  if (from.completeContributionYears !== to.completeContributionYears) {
    changes.push({
      parameter: 'completeContributionYears',
      label: 'lawVersions.comparison.completeContributionYears',
      oldValue: from.completeContributionYears,
      newValue: to.completeContributionYears,
      impact: to.completeContributionYears > from.completeContributionYears ? 'negative' : 'positive',
    });
  }

  if (from.vprValue !== to.vprValue) {
    changes.push({
      parameter: 'vprValue',
      label: 'lawVersions.comparison.vprValue',
      oldValue: `${from.vprValue} RON`,
      newValue: `${to.vprValue} RON`,
      impact: to.vprValue > from.vprValue ? 'positive' : 'negative',
    });
  }

  if (from.earlyRetirementPenaltyPerYear !== to.earlyRetirementPenaltyPerYear) {
    changes.push({
      parameter: 'earlyRetirementPenaltyPerYear',
      label: 'lawVersions.comparison.earlyRetirementPenalty',
      oldValue: `${from.earlyRetirementPenaltyPerYear}%`,
      newValue: `${to.earlyRetirementPenaltyPerYear}%`,
      impact: to.earlyRetirementPenaltyPerYear > from.earlyRetirementPenaltyPerYear ? 'negative' : 'positive',
    });
  }

  if (from.minimumEarlyRetirementAge !== to.minimumEarlyRetirementAge) {
    changes.push({
      parameter: 'minimumEarlyRetirementAge',
      label: 'lawVersions.comparison.minimumEarlyRetirementAge',
      oldValue: from.minimumEarlyRetirementAge,
      newValue: to.minimumEarlyRetirementAge,
      impact: to.minimumEarlyRetirementAge > from.minimumEarlyRetirementAge ? 'negative' : 'positive',
    });
  }

  return {
    fromVersion,
    toVersion,
    changes,
  };
}
