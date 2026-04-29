import { ContributionPeriod, PensionInputs } from '../types/pensionTypes';
import { hashContributionPeriods } from './memoization';

// Cache for validation results to avoid recalculating on every render
const validationCache = new Map<string, FormValidationResult>();
const VALIDATION_CACHE_MAX_SIZE = 20;

export interface ValidationError {
  field: string;
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface PeriodValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  periodErrors: Map<number, ValidationError[]>;
  hasOverlaps: boolean;
  overlappingPeriods: [number, number][];
}

// Date validation helpers
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isDateInFuture = (dateString: string): boolean => {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};

export const isDateInPast = (dateString: string): boolean => {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const isEndDateAfterStartDate = (startDate: string, endDate: string): boolean => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
  return new Date(endDate) > new Date(startDate);
};

export const isDateTooOld = (dateString: string, maxYearsAgo: number = 100): boolean => {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - maxYearsAgo);
  return date < minDate;
};

// Check if two periods overlap
export const doPeriodsOverlap = (period1: ContributionPeriod, period2: ContributionPeriod): boolean => {
  if (!isValidDate(period1.fromDate) || !isValidDate(period1.toDate) ||
      !isValidDate(period2.fromDate) || !isValidDate(period2.toDate)) {
    return false;
  }

  const start1 = new Date(period1.fromDate);
  const end1 = new Date(period1.toDate);
  const start2 = new Date(period2.fromDate);
  const end2 = new Date(period2.toDate);

  // Periods overlap if one starts before the other ends
  return start1 <= end2 && start2 <= end1;
};

/**
 * Pre-processed period with cached timestamp values for efficient comparison
 */
interface ProcessedPeriodForOverlap {
  index: number;
  start: number;
  end: number;
  isValid: boolean;
}

/**
 * Find all overlapping periods using optimized interval overlap detection
 * Uses sorting and sweep line approach for O(n log n) complexity instead of O(n²)
 */
export const findOverlappingPeriods = (periods: ContributionPeriod[]): [number, number][] => {
  const overlaps: [number, number][] = [];

  if (periods.length < 2) {
    return overlaps;
  }

  // Pre-process periods: parse dates once and filter invalid ones
  const processedPeriods: ProcessedPeriodForOverlap[] = periods.map((period, index) => {
    const isValidPeriod = isValidDate(period.fromDate) && isValidDate(period.toDate);
    return {
      index,
      start: isValidPeriod ? new Date(period.fromDate).getTime() : 0,
      end: isValidPeriod ? new Date(period.toDate).getTime() : 0,
      isValid: isValidPeriod
    };
  });

  // Filter to only valid periods
  const validPeriods = processedPeriods.filter(p => p.isValid);

  if (validPeriods.length < 2) {
    return overlaps;
  }

  // Sort by start time for efficient overlap detection
  validPeriods.sort((a, b) => a.start - b.start);

  // Check consecutive periods and nearby ones for overlaps
  // Since we're sorted by start time, we only need to check forward
  for (let i = 0; i < validPeriods.length; i++) {
    const current = validPeriods[i];

    // Check against all subsequent periods until we find one that starts after current ends
    for (let j = i + 1; j < validPeriods.length; j++) {
      const next = validPeriods[j];

      // If next starts after current ends, no more overlaps possible for current
      if (next.start > current.end) {
        break;
      }

      // They overlap: current.start <= next.end && next.start <= current.end
      // Since we're sorted, next.start >= current.start, so we just need next.start <= current.end
      overlaps.push([
        Math.min(current.index, next.index),
        Math.max(current.index, next.index)
      ]);
    }
  }

  return overlaps;
};

// Salary validation
export const isValidSalary = (salary: number | undefined): boolean => {
  if (salary === undefined || salary === null) return false;
  return salary > 0;
};

export const isSalaryReasonable = (salary: number, minSalary: number = 100, maxSalary: number = 500000): boolean => {
  return salary >= minSalary && salary <= maxSalary;
};

// Retirement year validation
export const isValidRetirementYear = (year: number, birthDate: string): { valid: boolean; reason?: string } => {
  const currentYear = new Date().getFullYear();

  if (year < currentYear) {
    return { valid: false, reason: 'retirementYearInPast' };
  }

  if (year > currentYear + 100) {
    return { valid: false, reason: 'retirementYearTooFar' };
  }

  if (isValidDate(birthDate)) {
    const birthYear = new Date(birthDate).getFullYear();
    const retirementAge = year - birthYear;

    if (retirementAge < 50) {
      return { valid: false, reason: 'retirementAgeTooYoung' };
    }

    if (retirementAge > 90) {
      return { valid: false, reason: 'retirementAgeTooOld' };
    }
  }

  return { valid: true };
};

// Validate a single contribution period
export const validateContributionPeriod = (
  period: ContributionPeriod,
  index: number
): PeriodValidationResult => {
  const errors: ValidationError[] = [];

  // Check required fields based on period type
  const isNonContributive = !!period.nonContributiveType;

  // Start date validation
  if (!period.fromDate) {
    errors.push({
      field: `period_${index}_fromDate`,
      messageKey: 'validation.startDateRequired'
    });
  } else if (!isValidDate(period.fromDate)) {
    errors.push({
      field: `period_${index}_fromDate`,
      messageKey: 'validation.invalidDate'
    });
  } else if (isDateInFuture(period.fromDate)) {
    errors.push({
      field: `period_${index}_fromDate`,
      messageKey: 'validation.startDateInFuture'
    });
  } else if (isDateTooOld(period.fromDate, 100)) {
    errors.push({
      field: `period_${index}_fromDate`,
      messageKey: 'validation.dateTooOld'
    });
  }

  // End date validation
  if (!period.toDate) {
    errors.push({
      field: `period_${index}_toDate`,
      messageKey: 'validation.endDateRequired'
    });
  } else if (!isValidDate(period.toDate)) {
    errors.push({
      field: `period_${index}_toDate`,
      messageKey: 'validation.invalidDate'
    });
  } else if (isDateInFuture(period.toDate)) {
    errors.push({
      field: `period_${index}_toDate`,
      messageKey: 'validation.endDateInFuture'
    });
  }

  // Date range validation
  if (isValidDate(period.fromDate) && isValidDate(period.toDate)) {
    if (!isEndDateAfterStartDate(period.fromDate, period.toDate)) {
      errors.push({
        field: `period_${index}_dateRange`,
        messageKey: 'validation.endDateBeforeStartDate'
      });
    }
  }

  // Salary validation (only for employment periods)
  if (!isNonContributive) {
    if (!isValidSalary(period.monthlyGrossSalary)) {
      errors.push({
        field: `period_${index}_salary`,
        messageKey: 'validation.monthlyGrossSalaryRequired'
      });
    } else if (period.monthlyGrossSalary && !isSalaryReasonable(period.monthlyGrossSalary)) {
      errors.push({
        field: `period_${index}_salary`,
        messageKey: 'validation.salaryOutOfRange',
        params: { min: 100, max: 500000 }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate a cache key for validation inputs
 */
const generateValidationCacheKey = (inputs: PensionInputs): string => {
  const periodsHash = inputs.contributionPeriods
    ? hashContributionPeriods(inputs.contributionPeriods)
    : '';
  return `${inputs.birthDate}|${inputs.retirementYear}|${periodsHash}`;
};

/**
 * Clear validation cache
 * Call when you need to force revalidation
 */
export const clearValidationCache = (): void => {
  validationCache.clear();
};

// Validate the entire form with caching for performance
export const validatePensionForm = (inputs: PensionInputs): FormValidationResult => {
  // Check cache first
  const cacheKey = generateValidationCacheKey(inputs);
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }

  const errors: ValidationError[] = [];
  const periodErrors = new Map<number, ValidationError[]>();

  // Birth date validation
  if (!inputs.birthDate) {
    errors.push({
      field: 'birthDate',
      messageKey: 'validation.birthDateRequired'
    });
  } else if (!isValidDate(inputs.birthDate)) {
    errors.push({
      field: 'birthDate',
      messageKey: 'validation.invalidDate'
    });
  } else if (isDateInFuture(inputs.birthDate)) {
    errors.push({
      field: 'birthDate',
      messageKey: 'validation.birthDateInFuture'
    });
  } else if (isDateTooOld(inputs.birthDate, 120)) {
    errors.push({
      field: 'birthDate',
      messageKey: 'validation.birthDateTooOld'
    });
  }

  // Retirement year validation
  if (!inputs.retirementYear) {
    errors.push({
      field: 'retirementYear',
      messageKey: 'validation.retirementYearRequired'
    });
  } else {
    const retirementValidation = isValidRetirementYear(inputs.retirementYear, inputs.birthDate);
    if (!retirementValidation.valid && retirementValidation.reason) {
      errors.push({
        field: 'retirementYear',
        messageKey: `validation.${retirementValidation.reason}`
      });
    }
  }

  // Track overlapping periods
  let overlaps: [number, number][] = [];

  // Validate each contribution period
  if (inputs.contributionPeriods && inputs.contributionPeriods.length > 0) {
    inputs.contributionPeriods.forEach((period, index) => {
      const result = validateContributionPeriod(period, index);
      if (!result.isValid) {
        periodErrors.set(index, result.errors);
      }
    });

    // Check for overlapping periods
    overlaps = findOverlappingPeriods(inputs.contributionPeriods);
    overlaps.forEach(([i, j]) => {
      const overlapError: ValidationError = {
        field: `period_${i}_overlap`,
        messageKey: 'validation.periodsOverlap',
        params: { period1: i + 1, period2: j + 1 }
      };

      // Add overlap error to both periods
      if (!periodErrors.has(i)) {
        periodErrors.set(i, []);
      }
      periodErrors.get(i)!.push(overlapError);

      if (!periodErrors.has(j)) {
        periodErrors.set(j, []);
      }
      periodErrors.get(j)!.push({
        field: `period_${j}_overlap`,
        messageKey: 'validation.periodsOverlap',
        params: { period1: i + 1, period2: j + 1 }
      });
    });
  }

  const hasErrors = errors.length > 0 || periodErrors.size > 0;

  const result: FormValidationResult = {
    isValid: !hasErrors,
    errors,
    periodErrors,
    hasOverlaps: overlaps.length > 0,
    overlappingPeriods: overlaps
  };

  // Cache the result (with size limit to prevent memory issues)
  if (validationCache.size >= VALIDATION_CACHE_MAX_SIZE) {
    const firstKey = validationCache.keys().next().value;
    if (firstKey) {
      validationCache.delete(firstKey);
    }
  }
  validationCache.set(cacheKey, result);

  return result;
};

// Helper to check if a specific field has an error
export const hasFieldError = (
  validationResult: FormValidationResult,
  field: string
): boolean => {
  return validationResult.errors.some(e => e.field === field);
};

// Helper to get error message key for a field
export const getFieldErrorKey = (
  validationResult: FormValidationResult,
  field: string
): string | null => {
  const error = validationResult.errors.find(e => e.field === field);
  return error?.messageKey || null;
};

// Helper to get period errors
export const getPeriodErrors = (
  validationResult: FormValidationResult,
  periodIndex: number
): ValidationError[] => {
  return validationResult.periodErrors.get(periodIndex) || [];
};

// Helper to check if period has specific field error
export const hasPeriodFieldError = (
  periodErrors: ValidationError[],
  fieldSuffix: string
): boolean => {
  return periodErrors.some(e => e.field.endsWith(fieldSuffix));
};

// Helper to get period field error message key
export const getPeriodFieldErrorKey = (
  periodErrors: ValidationError[],
  fieldSuffix: string
): string | null => {
  const error = periodErrors.find(e => e.field.endsWith(fieldSuffix));
  return error?.messageKey || null;
};
