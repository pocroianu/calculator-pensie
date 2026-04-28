/**
 * Currency and number formatting utilities for Romanian locale
 * Handles Romanian Lei (RON) currency formatting with proper locale-specific
 * number formatting, thousands separators, and decimal handling.
 */

/**
 * Formats a number as Romanian Lei (RON) currency
 * Uses Romanian locale formatting (ro-RO) with:
 * - Period (.) as thousands separator
 * - Comma (,) as decimal separator
 * - RON currency symbol after the number
 *
 * @param amount - The numeric amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "10.000 RON")
 */
export const formatCurrency = (
  amount: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showDecimals?: boolean;
  } = {}
): string => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    showDecimals = false,
  } = options;

  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: showDecimals ? minimumFractionDigits : 0,
    maximumFractionDigits: showDecimals ? maximumFractionDigits : 0,
  }).format(amount);
};

/**
 * Formats a number as Romanian Lei with decimals (for precise values)
 * Useful for displaying reference values like REFERENCE_VALUE_2024 (81.03 Lei)
 *
 * @param amount - The numeric amount to format
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted currency string with decimals (e.g., "81,03 RON")
 */
export const formatCurrencyWithDecimals = (
  amount: number,
  decimalPlaces: number = 2
): string => {
  return formatCurrency(amount, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    showDecimals: true,
  });
};

/**
 * Formats a number using Romanian locale conventions
 * Uses period (.) as thousands separator and comma (,) as decimal separator
 *
 * @param value - The numeric value to format
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted number string (e.g., "10.000,50")
 */
export const formatNumber = (
  value: number,
  decimalPlaces: number = 2
): string => {
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
};

/**
 * Formats a number as points (pension calculation points)
 * Uses Romanian locale with 2 decimal places
 *
 * @param points - The points value to format
 * @returns Formatted points string (e.g., "25,50")
 */
export const formatPoints = (points: number): string => {
  return formatNumber(points, 2);
};

/**
 * Formats a number as years with Romanian locale
 * Uses 1 decimal place by default
 *
 * @param years - The years value to format
 * @param decimalPlaces - Number of decimal places (default: 1)
 * @returns Formatted years string (e.g., "15,5")
 */
export const formatYears = (years: number, decimalPlaces: number = 1): string => {
  return formatNumber(years, decimalPlaces);
};

/**
 * Formats a percentage with Romanian locale
 *
 * @param value - The percentage value (e.g., 25 for 25%)
 * @param decimalPlaces - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "25,0%")
 */
export const formatPercentage = (
  value: number,
  decimalPlaces: number = 1
): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value / 100);
};

/**
 * Formats a salary value for display in input fields or summaries
 * Shows the value without decimal places unless explicitly needed
 *
 * @param salary - The salary amount
 * @returns Formatted salary string (e.g., "6.789 RON")
 */
export const formatSalary = (salary: number): string => {
  return formatCurrency(salary);
};
