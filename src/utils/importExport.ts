import { PensionInputs, ContributionPeriod, WorkingCondition, NonContributivePeriodType } from '../types/pensionTypes';

/**
 * Export data schema version
 * Increment when making breaking changes to the export format
 */
export const EXPORT_VERSION = '1.0';

/**
 * Interface for exported data file
 */
export interface ExportData {
  version: string;
  exportDate: string;
  appName: string;
  inputs: PensionInputs;
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean;
  data?: PensionInputs;
  error?: string;
  errorKey?: string;
}

/**
 * Valid working conditions
 */
const VALID_WORKING_CONDITIONS: WorkingCondition[] = ['normal', 'groupII', 'groupI', 'specialConditions'];

/**
 * Valid non-contributive period types
 */
const VALID_NON_CONTRIBUTIVE_TYPES: NonContributivePeriodType[] = ['military', 'university', 'childCare', 'medical', ''];

/**
 * Validate a contribution period object
 */
function isValidContributionPeriod(period: unknown): period is ContributionPeriod {
  if (typeof period !== 'object' || period === null) {
    return false;
  }
  const candidate = period as Partial<ContributionPeriod>;

  // Required fields
  if (typeof candidate.fromDate !== 'string' || typeof candidate.toDate !== 'string') {
    return false;
  }

  // Optional fields validation
  if (candidate.company !== undefined && typeof candidate.company !== 'string') {
    return false;
  }

  if (candidate.monthlyGrossSalary !== undefined && typeof candidate.monthlyGrossSalary !== 'number') {
    return false;
  }

  if (candidate.workingCondition !== undefined && !VALID_WORKING_CONDITIONS.includes(candidate.workingCondition)) {
    return false;
  }

  if (candidate.nonContributiveType !== undefined && !VALID_NON_CONTRIBUTIVE_TYPES.includes(candidate.nonContributiveType)) {
    return false;
  }

  return true;
}

/**
 * Validate pension inputs structure
 */
function isValidPensionInputs(inputs: unknown): inputs is PensionInputs {
  if (typeof inputs !== 'object' || inputs === null) {
    return false;
  }
  const candidate = inputs as Partial<PensionInputs>;

  // Required fields
  if (typeof candidate.birthDate !== 'string') {
    return false;
  }

  if (typeof candidate.retirementYear !== 'number') {
    return false;
  }

  if (!Array.isArray(candidate.contributionPeriods)) {
    return false;
  }

  // Validate each contribution period
  for (const period of candidate.contributionPeriods) {
    if (!isValidContributionPeriod(period)) {
      return false;
    }
  }

  return true;
}

/**
 * Validate export data structure
 */
function isValidExportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const candidate = data as Partial<ExportData>;

  if (typeof candidate.version !== 'string') {
    return false;
  }

  if (typeof candidate.exportDate !== 'string') {
    return false;
  }

  if (!isValidPensionInputs(candidate.inputs)) {
    return false;
  }

  return true;
}

/**
 * Export pension inputs to a JSON file
 * @param inputs The pension inputs to export
 * @param filename Optional custom filename (without extension)
 */
export function exportToJson(inputs: PensionInputs, filename?: string): void {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    appName: 'Romanian Pension Calculator',
    inputs: inputs
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Generate default filename with date
  const date = new Date().toISOString().split('T')[0];
  const defaultFilename = `pension-data-${date}`;
  const finalFilename = filename || defaultFilename;

  // Create download link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${finalFilename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate imported JSON data
 * @param jsonString The JSON string to parse
 * @returns ImportResult with validated data or error
 */
export function parseImportData(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString);

    // Check if it's a valid export data structure
    if (!isValidExportData(data)) {
      return {
        success: false,
        errorKey: 'importExport.error.invalidFormat'
      };
    }

    // Version compatibility check
    const [majorVersion] = data.version.split('.').map(Number);
    const [currentMajorVersion] = EXPORT_VERSION.split('.').map(Number);

    if (majorVersion > currentMajorVersion) {
      return {
        success: false,
        errorKey: 'importExport.error.newerVersion'
      };
    }

    return {
      success: true,
      data: data.inputs
    };
  } catch {
    return {
      success: false,
      errorKey: 'importExport.error.parseError'
    };
  }
}

/**
 * Read a file and return its contents as a string
 * @param file The file to read
 * @returns Promise resolving to the file contents
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Import pension data from a JSON file
 * @param file The file to import
 * @returns Promise resolving to ImportResult
 */
export async function importFromJsonFile(file: File): Promise<ImportResult> {
  // Validate file type
  if (!file.name.endsWith('.json')) {
    return {
      success: false,
      errorKey: 'importExport.error.invalidFileType'
    };
  }

  // Validate file size (max 1MB)
  const maxSize = 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    return {
      success: false,
      errorKey: 'importExport.error.fileTooLarge'
    };
  }

  try {
    const contents = await readFileAsText(file);
    return parseImportData(contents);
  } catch {
    return {
      success: false,
      errorKey: 'importExport.error.readError'
    };
  }
}
