/**
 * Historical average gross salaries in Romania from 1990 to present
 *
 * Data sources:
 * - National Institute of Statistics (INS) Romania
 * - Romanian National Bank historical data
 *
 * Note: Values are in Romanian Lei (RON) - pre-2005 values have been converted
 * from the old ROL currency (divided by 10,000) for consistency.
 *
 * The Romanian Leu was redenominated on July 1, 2005 (1 RON = 10,000 ROL)
 */

import { pensionCache } from '../utils/memoization';

export interface HistoricalSalaryData {
  [year: number]: number;
}

/**
 * Average gross monthly salaries by year in Romania (in RON)
 * Values before 2005 are converted to new RON for consistency
 */
export const HISTORICAL_AVERAGE_SALARIES: HistoricalSalaryData = {
  // Pre-redenomination era (values converted to new RON)
  1990: 30,      // ~300,000 ROL
  1991: 45,      // ~450,000 ROL - early transition period
  1992: 65,      // ~650,000 ROL
  1993: 95,      // ~950,000 ROL
  1994: 140,     // ~1,400,000 ROL
  1995: 195,     // ~1,950,000 ROL
  1996: 260,     // ~2,600,000 ROL
  1997: 350,     // ~3,500,000 ROL
  1998: 450,     // ~4,500,000 ROL
  1999: 530,     // ~5,300,000 ROL
  2000: 620,     // ~6,200,000 ROL
  2001: 750,     // ~7,500,000 ROL
  2002: 880,     // ~8,800,000 ROL
  2003: 1020,    // ~10,200,000 ROL
  2004: 1170,    // ~11,700,000 ROL

  // Post-redenomination era (new RON)
  2005: 1282,    // Currency redenomination July 2005
  2006: 1404,
  2007: 1612,
  2008: 1909,
  2009: 1945,    // Global financial crisis impact
  2010: 1987,
  2011: 2058,
  2012: 2117,
  2013: 2223,
  2014: 2328,
  2015: 2555,
  2016: 2809,
  2017: 3223,
  2018: 4162,
  2019: 4853,
  2020: 5213,    // COVID-19 pandemic
  2021: 5535,
  2022: 6095,
  2023: 6789,
  2024: 7567,    // Latest available data
  2025: 8100,    // Projected
};

/**
 * The current (latest) average gross salary
 * Used as fallback for future dates beyond available data
 */
export const CURRENT_AVERAGE_SALARY = HISTORICAL_AVERAGE_SALARIES[2024];

// Pre-compute available years once (static data)
const AVAILABLE_YEARS = Object.keys(HISTORICAL_AVERAGE_SALARIES)
  .map(Number)
  .sort((a, b) => a - b);

const MIN_YEAR = AVAILABLE_YEARS[0];
const MAX_YEAR = AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1];

/**
 * Internal implementation of getAverageSalaryForYear
 */
const getAverageSalaryForYearImpl = (year: number): number => {
  // If we have exact data for this year, return it (most common case)
  if (HISTORICAL_AVERAGE_SALARIES[year] !== undefined) {
    return HISTORICAL_AVERAGE_SALARIES[year];
  }

  // If year is before our data, use the earliest available
  if (year < MIN_YEAR) {
    return HISTORICAL_AVERAGE_SALARIES[MIN_YEAR];
  }

  // If year is after our data, use the latest available
  if (year > MAX_YEAR) {
    return HISTORICAL_AVERAGE_SALARIES[MAX_YEAR];
  }

  // Interpolate between available years (shouldn't happen with complete data)
  // Using binary search for performance
  let lowerYear = MIN_YEAR;
  let upperYear = MAX_YEAR;

  for (const y of AVAILABLE_YEARS) {
    if (y < year) {
      lowerYear = y;
    } else if (y > year) {
      upperYear = y;
      break;
    }
  }

  const lowerSalary = HISTORICAL_AVERAGE_SALARIES[lowerYear];
  const upperSalary = HISTORICAL_AVERAGE_SALARIES[upperYear];

  // Linear interpolation
  const ratio = (year - lowerYear) / (upperYear - lowerYear);
  return Math.round(lowerSalary + (upperSalary - lowerSalary) * ratio);
};

/**
 * Get the average gross salary for a specific year
 * Falls back to nearest available year if exact year is not in data
 * Uses caching for performance optimization
 *
 * @param year - The year to look up
 * @returns The average gross salary for that year in RON
 */
export const getAverageSalaryForYear = (year: number): number => {
  // Check cache first
  if (pensionCache.averageSalaries.has(year)) {
    return pensionCache.averageSalaries.get(year)!;
  }

  const salary = getAverageSalaryForYearImpl(year);
  pensionCache.averageSalaries.set(year, salary);
  return salary;
};

/**
 * Get the average salary for a date range, weighted by months
 * This is useful for periods that span multiple years
 *
 * @param fromDate - Start date of the period
 * @param toDate - End date of the period
 * @returns The weighted average salary for the period
 */
export const getWeightedAverageSalaryForPeriod = (
  fromDate: string,
  toDate: string
): number => {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  // If same year, just return that year's salary
  if (startYear === endYear) {
    return getAverageSalaryForYear(startYear);
  }

  // Calculate weighted average based on months in each year
  let totalMonths = 0;
  let weightedSum = 0;

  for (let year = startYear; year <= endYear; year++) {
    let monthsInYear: number;

    if (year === startYear) {
      // Months remaining in the start year
      monthsInYear = 12 - start.getMonth();
    } else if (year === endYear) {
      // Months in the end year
      monthsInYear = end.getMonth() + 1;
    } else {
      // Full year
      monthsInYear = 12;
    }

    const yearlySalary = getAverageSalaryForYear(year);
    weightedSum += yearlySalary * monthsInYear;
    totalMonths += monthsInYear;
  }

  return totalMonths > 0 ? weightedSum / totalMonths : getAverageSalaryForYear(startYear);
};

/**
 * Calculate contribution points for a period using historical salaries
 * This calculates points year by year for accuracy
 * Optimized version with pre-computed date values and cached salary lookups
 *
 * @param monthlyGrossSalary - The person's monthly gross salary during the period
 * @param fromDate - Start date of the period
 * @param toDate - End date of the period
 * @returns Total contribution points for the period
 */
export const calculateHistoricalContributionPoints = (
  monthlyGrossSalary: number,
  fromDate: string,
  toDate: string
): number => {
  // Parse dates once and extract needed values
  const start = new Date(fromDate);
  const end = new Date(toDate);

  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  // Single year optimization - most common case
  if (startYear === endYear) {
    const monthsInYear = endMonth - startMonth + 1;
    const averageSalary = getAverageSalaryForYear(startYear);
    return (monthlyGrossSalary / averageSalary) * (monthsInYear / 12);
  }

  let totalPoints = 0;

  // First year: months from start to December
  const firstYearMonths = 12 - startMonth;
  const firstYearSalary = getAverageSalaryForYear(startYear);
  totalPoints += (monthlyGrossSalary / firstYearSalary) * (firstYearMonths / 12);

  // Middle years (full years) - optimized loop
  for (let year = startYear + 1; year < endYear; year++) {
    const averageSalary = getAverageSalaryForYear(year);
    totalPoints += monthlyGrossSalary / averageSalary; // Full year = 1.0
  }

  // Last year: months from January to end month
  const lastYearMonths = endMonth + 1;
  const lastYearSalary = getAverageSalaryForYear(endYear);
  totalPoints += (monthlyGrossSalary / lastYearSalary) * (lastYearMonths / 12);

  return totalPoints;
};
