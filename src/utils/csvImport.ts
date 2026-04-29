import { ContributionPeriod, WorkingCondition, NonContributivePeriodType } from '../types/pensionTypes';
import { isValidDate, isEndDateAfterStartDate } from './validation';

/**
 * CSV Import Utility for Contribution Periods
 * Supports importing contribution periods from CSV files exported from payroll systems
 */

export const CSV_VERSION = '1.0';

/**
 * Column mapping configuration for CSV import
 */
export interface CSVColumnMapping {
  fromDate: string | null;
  toDate: string | null;
  company: string | null;
  monthlyGrossSalary: string | null;
  workingCondition: string | null;
  nonContributiveType: string | null;
}

/**
 * Result of CSV parsing
 */
export interface CSVParseResult {
  success: boolean;
  headers: string[];
  rows: string[][];
  error?: string;
  errorKey?: string;
}

/**
 * Validation error for a specific row
 */
export interface CSVRowError {
  row: number;
  field: string;
  messageKey: string;
  params?: Record<string, string | number>;
}

/**
 * Result of CSV import operation
 */
export interface CSVImportResult {
  success: boolean;
  periods?: ContributionPeriod[];
  errors?: CSVRowError[];
  errorKey?: string;
  totalRows?: number;
  validRows?: number;
}

/**
 * Preview data for mapping confirmation
 */
export interface CSVPreviewData {
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
}

/**
 * Common column name mappings for auto-detection
 */
const COLUMN_ALIASES: Record<keyof CSVColumnMapping, string[]> = {
  fromDate: ['fromdate', 'from_date', 'startdate', 'start_date', 'start', 'data_inceput', 'data_start', 'begin', 'from'],
  toDate: ['todate', 'to_date', 'enddate', 'end_date', 'end', 'data_sfarsit', 'data_end', 'until', 'to'],
  company: ['company', 'employer', 'angajator', 'companie', 'firma', 'organization', 'org'],
  monthlyGrossSalary: ['salary', 'monthlygrosssalary', 'monthly_gross_salary', 'gross_salary', 'salariu', 'salariu_brut', 'wage', 'pay'],
  workingCondition: ['workingcondition', 'working_condition', 'condition', 'conditie', 'conditii_munca', 'work_type'],
  nonContributiveType: ['noncontributivetype', 'non_contributive_type', 'noncontributive', 'type', 'tip', 'tip_perioada']
};

/**
 * Valid working conditions mapping from common values
 */
const WORKING_CONDITION_ALIASES: Record<string, WorkingCondition> = {
  'normal': 'normal',
  'normale': 'normal',
  'standard': 'normal',
  'groupii': 'groupII',
  'group_ii': 'groupII',
  'group2': 'groupII',
  'grupa2': 'groupII',
  'grupaii': 'groupII',
  'difficult': 'groupII',
  'dificile': 'groupII',
  'groupi': 'groupI',
  'group_i': 'groupI',
  'group1': 'groupI',
  'grupa1': 'groupI',
  'grupai': 'groupI',
  'verydifficult': 'groupI',
  'foarte_dificile': 'groupI',
  'specialconditions': 'specialConditions',
  'special_conditions': 'specialConditions',
  'special': 'specialConditions',
  'speciale': 'specialConditions',
  'conditii_speciale': 'specialConditions'
};

/**
 * Valid non-contributive type mapping from common values
 */
const NON_CONTRIBUTIVE_ALIASES: Record<string, NonContributivePeriodType> = {
  'military': 'military',
  'militar': 'military',
  'stagiu_militar': 'military',
  'army': 'military',
  'university': 'university',
  'universitate': 'university',
  'facultate': 'university',
  'studii': 'university',
  'education': 'university',
  'childcare': 'childCare',
  'child_care': 'childCare',
  'ingrijire_copil': 'childCare',
  'parental': 'childCare',
  'maternity': 'childCare',
  'maternitate': 'childCare',
  'medical': 'medical',
  'concediu_medical': 'medical',
  'sick_leave': 'medical',
  'boala': 'medical',
  '': ''
};

/**
 * Parse CSV string into rows and columns
 */
export function parseCSV(csvString: string): CSVParseResult {
  try {
    const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) {
      return {
        success: false,
        headers: [],
        rows: [],
        errorKey: 'csvImport.error.emptyFile'
      };
    }

    // Parse header row
    const headers = parseCSVRow(lines[0]);

    if (headers.length === 0) {
      return {
        success: false,
        headers: [],
        rows: [],
        errorKey: 'csvImport.error.noHeaders'
      };
    }

    // Parse data rows
    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length > 0) {
        rows.push(row);
      }
    }

    if (rows.length === 0) {
      return {
        success: false,
        headers,
        rows: [],
        errorKey: 'csvImport.error.noDataRows'
      };
    }

    return {
      success: true,
      headers,
      rows
    };
  } catch {
    return {
      success: false,
      headers: [],
      rows: [],
      errorKey: 'csvImport.error.parseError'
    };
  }
}

/**
 * Parse a single CSV row, handling quoted values and commas
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}

/**
 * Auto-detect column mapping based on header names
 */
export function autoDetectMapping(headers: string[]): CSVColumnMapping {
  const mapping: CSVColumnMapping = {
    fromDate: null,
    toDate: null,
    company: null,
    monthlyGrossSalary: null,
    workingCondition: null,
    nonContributiveType: null
  };

  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[\s-]/g, '_'));

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalizedHeader = normalizedHeaders[i];
      if (aliases.some(alias => normalizedHeader === alias || normalizedHeader.includes(alias))) {
        mapping[field as keyof CSVColumnMapping] = headers[i];
        break;
      }
    }
  }

  return mapping;
}

/**
 * Validate column mapping has required fields
 */
export function validateMapping(mapping: CSVColumnMapping): { valid: boolean; missingFields: string[] } {
  const requiredFields: (keyof CSVColumnMapping)[] = ['fromDate', 'toDate'];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!mapping[field]) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Parse date from various formats
 */
function parseDateValue(value: string): string | null {
  if (!value || value.trim() === '') return null;

  const cleaned = value.trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try MM/DD/YYYY
  const mdyMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (mdyMatch) {
    // Assume DD/MM/YYYY format first (more common in Romania)
    const day = mdyMatch[1].padStart(2, '0');
    const month = mdyMatch[2].padStart(2, '0');
    const year = mdyMatch[3];
    // Basic validation - if day > 12, it's probably DD/MM/YYYY
    if (parseInt(mdyMatch[1], 10) > 12) {
      return `${year}-${month}-${day}`;
    }
    // Otherwise assume DD/MM/YYYY anyway for Romanian context
    return `${year}-${month}-${day}`;
  }

  // Try YYYY/MM/DD
  const ymdMatch = cleaned.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Try parsing as Date object
  const date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Parse salary value from string
 */
function parseSalaryValue(value: string): number | undefined {
  if (!value || value.trim() === '') return undefined;

  // Remove currency symbols, spaces, and thousands separators
  const cleaned = value
    .replace(/[RON€$£\s]/gi, '')
    .replace(/,/g, '.');  // Handle European decimal separator

  // If there are multiple dots, remove all but the last (thousands separator)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    const decimal = parts.pop();
    const integer = parts.join('');
    const num = parseFloat(`${integer}.${decimal}`);
    return isNaN(num) ? undefined : num;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse working condition from string
 */
function parseWorkingCondition(value: string): WorkingCondition | undefined {
  if (!value || value.trim() === '') return undefined;

  const normalized = value.toLowerCase().replace(/[\s-]/g, '');
  return WORKING_CONDITION_ALIASES[normalized] || undefined;
}

/**
 * Parse non-contributive type from string
 */
function parseNonContributiveType(value: string): NonContributivePeriodType | undefined {
  if (!value || value.trim() === '') return undefined;

  const normalized = value.toLowerCase().replace(/[\s-]/g, '_');
  return NON_CONTRIBUTIVE_ALIASES[normalized];
}

/**
 * Get value from row by column name
 */
function getRowValue(row: string[], headers: string[], columnName: string | null): string {
  if (!columnName) return '';
  const index = headers.indexOf(columnName);
  return index >= 0 && index < row.length ? row[index] : '';
}

/**
 * Transform CSV rows into ContributionPeriods using column mapping
 */
export function transformToContributionPeriods(
  rows: string[][],
  headers: string[],
  mapping: CSVColumnMapping
): CSVImportResult {
  const periods: ContributionPeriod[] = [];
  const errors: CSVRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 because row 1 is headers and we're 1-indexed

    // Parse required fields
    const fromDateRaw = getRowValue(row, headers, mapping.fromDate);
    const toDateRaw = getRowValue(row, headers, mapping.toDate);

    const fromDate = parseDateValue(fromDateRaw);
    const toDate = parseDateValue(toDateRaw);

    // Validate required fields
    if (!fromDate) {
      errors.push({
        row: rowNumber,
        field: 'fromDate',
        messageKey: 'csvImport.error.invalidDate',
        params: { row: rowNumber, field: 'fromDate', value: fromDateRaw }
      });
      continue;
    }

    if (!toDate) {
      errors.push({
        row: rowNumber,
        field: 'toDate',
        messageKey: 'csvImport.error.invalidDate',
        params: { row: rowNumber, field: 'toDate', value: toDateRaw }
      });
      continue;
    }

    if (!isValidDate(fromDate)) {
      errors.push({
        row: rowNumber,
        field: 'fromDate',
        messageKey: 'csvImport.error.invalidDate',
        params: { row: rowNumber, field: 'fromDate', value: fromDateRaw }
      });
      continue;
    }

    if (!isValidDate(toDate)) {
      errors.push({
        row: rowNumber,
        field: 'toDate',
        messageKey: 'csvImport.error.invalidDate',
        params: { row: rowNumber, field: 'toDate', value: toDateRaw }
      });
      continue;
    }

    if (!isEndDateAfterStartDate(fromDate, toDate)) {
      errors.push({
        row: rowNumber,
        field: 'dateRange',
        messageKey: 'csvImport.error.endDateBeforeStartDate',
        params: { row: rowNumber }
      });
      continue;
    }

    // Parse optional fields
    const company = getRowValue(row, headers, mapping.company) || undefined;
    const salaryRaw = getRowValue(row, headers, mapping.monthlyGrossSalary);
    const monthlyGrossSalary = parseSalaryValue(salaryRaw);
    const workingConditionRaw = getRowValue(row, headers, mapping.workingCondition);
    const workingCondition = parseWorkingCondition(workingConditionRaw) || 'normal';
    const nonContributiveTypeRaw = getRowValue(row, headers, mapping.nonContributiveType);
    const nonContributiveType = parseNonContributiveType(nonContributiveTypeRaw);

    // Validate salary for non-contributive periods
    const isNonContributive = !!nonContributiveType;
    if (!isNonContributive && (monthlyGrossSalary === undefined || monthlyGrossSalary <= 0)) {
      errors.push({
        row: rowNumber,
        field: 'monthlyGrossSalary',
        messageKey: 'csvImport.error.salaryRequired',
        params: { row: rowNumber }
      });
      continue;
    }

    // Create contribution period
    const period: ContributionPeriod = {
      fromDate,
      toDate,
      company,
      monthlyGrossSalary: isNonContributive ? 0 : monthlyGrossSalary,
      workingCondition: isNonContributive ? 'normal' : workingCondition,
      nonContributiveType: nonContributiveType || ''
    };

    periods.push(period);
  }

  return {
    success: errors.length === 0,
    periods,
    errors: errors.length > 0 ? errors : undefined,
    totalRows: rows.length,
    validRows: periods.length
  };
}

/**
 * Read file as text
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
 * Import contribution periods from a CSV file
 */
export async function importFromCSVFile(file: File): Promise<{ parseResult: CSVParseResult; preview?: CSVPreviewData }> {
  // Validate file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return {
      parseResult: {
        success: false,
        headers: [],
        rows: [],
        errorKey: 'csvImport.error.invalidFileType'
      }
    };
  }

  // Validate file size (max 5MB for CSV)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      parseResult: {
        success: false,
        headers: [],
        rows: [],
        errorKey: 'csvImport.error.fileTooLarge'
      }
    };
  }

  try {
    const contents = await readFileAsText(file);
    const parseResult = parseCSV(contents);

    if (!parseResult.success) {
      return { parseResult };
    }

    // Create preview data
    const preview: CSVPreviewData = {
      headers: parseResult.headers,
      sampleRows: parseResult.rows.slice(0, 5),
      totalRows: parseResult.rows.length
    };

    return { parseResult, preview };
  } catch {
    return {
      parseResult: {
        success: false,
        headers: [],
        rows: [],
        errorKey: 'csvImport.error.readError'
      }
    };
  }
}
