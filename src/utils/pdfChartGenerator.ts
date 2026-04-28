/**
 * PDF Chart Generator
 *
 * Generates chart images for PDF export by rendering Chart.js charts
 * on offscreen canvases and converting them to base64 PNG data URLs.
 *
 * This module replicates the chart configurations from the React components
 * (PensionCharts, CumulativePointsChart, SalaryHistoryChart) but renders
 * them statically for PDF embedding.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartConfiguration,
} from 'chart.js';
import { ContributionPeriod, WorkingCondition } from '../types/pensionTypes';
import { getAverageSalaryForYear } from '../data/historicalSalaries';
import { getWorkingConditionMultiplier } from './pensionCalculations';
import { formatCurrency } from './formatters';

// Ensure Chart.js components are registered
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Translation function type
 */
type TranslateFunction = (key: string, options?: Record<string, any>) => string;

/**
 * Chart image data returned by generators
 */
export interface ChartImageData {
  /** Base64 data URL of the chart image (PNG) */
  dataUrl: string;
  /** Width of the chart in pixels */
  width: number;
  /** Height of the chart in pixels */
  height: number;
}

/**
 * All chart images for PDF export
 */
export interface PdfChartImages {
  /** Cumulative points line chart */
  cumulativePointsChart?: ChartImageData;
  /** Contribution type pie chart */
  contributionTypePieChart?: ChartImageData;
  /** Period type pie chart */
  periodTypePieChart?: ChartImageData;
  /** Salary history line chart */
  salaryHistoryChart?: ChartImageData;
}

// Non-contributive points per year for each type
const NON_CONTRIBUTIVE_POINTS_PER_YEAR: Record<string, number> = {
  military: 0.25,
  university: 0.25,
  childCare: 0.25,
  medical: 0.20,
};

// Stability points configuration
const MINIMUM_CONTRIBUTION_YEARS = 15;
const TIER1_POINTS = 0.50;
const TIER2_POINTS = 0.75;
const TIER3_POINTS = 1.00;

/**
 * Renders a Chart.js chart to an offscreen canvas and returns the image as base64
 */
function renderChartToImage(
  config: ChartConfiguration,
  width: number,
  height: number
): ChartImageData | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const chart = new ChartJS(ctx, {
      ...config,
      options: {
        ...config.options,
        responsive: false,
        animation: false,
        devicePixelRatio: 2,
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);

    // Clean up
    chart.destroy();

    return {
      dataUrl,
      width,
      height,
    };
  } catch (error) {
    console.error('Failed to render chart to image:', error);
    return null;
  }
}

/**
 * Generate cumulative points line chart image
 */
export function generateCumulativePointsChart(
  contributionPeriods: ContributionPeriod[],
  birthDate: string,
  t: TranslateFunction
): ChartImageData | null {
  const validPeriods = contributionPeriods.filter(
    period => period.fromDate && period.toDate
  );

  if (validPeriods.length === 0) return null;

  // Find the date range
  const allDates = validPeriods.flatMap(p => [
    new Date(p.fromDate),
    new Date(p.toDate)
  ]);
  const minYear = Math.min(...allDates.map(d => d.getFullYear()));
  const maxYear = Math.max(...allDates.map(d => d.getFullYear()));

  // Calculate points accumulation per year
  const yearlyData: Map<number, {
    contributionPoints: number;
    stabilityPoints: number;
    nonContributivePoints: number;
    contributiveYears: number;
  }> = new Map();

  for (let year = minYear; year <= maxYear; year++) {
    yearlyData.set(year, {
      contributionPoints: 0,
      stabilityPoints: 0,
      nonContributivePoints: 0,
      contributiveYears: 0,
    });
  }

  // Process each period
  validPeriods.forEach(period => {
    const startDate = new Date(period.fromDate);
    const endDate = new Date(period.toDate);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      if (!yearlyData.has(year)) continue;

      let monthsInYear: number;
      if (year === startYear && year === endYear) {
        monthsInYear = endDate.getMonth() - startDate.getMonth() + 1;
      } else if (year === startYear) {
        monthsInYear = 12 - startDate.getMonth();
      } else if (year === endYear) {
        monthsInYear = endDate.getMonth() + 1;
      } else {
        monthsInYear = 12;
      }

      const yearFraction = monthsInYear / 12;
      const current = yearlyData.get(year)!;

      if (period.nonContributiveType) {
        const pointsPerYear = NON_CONTRIBUTIVE_POINTS_PER_YEAR[period.nonContributiveType] || 0;
        current.nonContributivePoints += pointsPerYear * yearFraction;
      } else if (period.monthlyGrossSalary) {
        const averageSalary = getAverageSalaryForYear(year);
        const basePoints = (period.monthlyGrossSalary / averageSalary) * yearFraction;
        const multiplier = getWorkingConditionMultiplier(period.workingCondition);
        current.contributionPoints += basePoints * multiplier;
        current.contributiveYears += yearFraction;
      }

      yearlyData.set(year, current);
    }
  });

  // Build cumulative totals
  let cumulativeContribution = 0;
  let cumulativeStability = 0;
  let cumulativeNonContributive = 0;
  let cumulativeContributiveYears = 0;
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : 1980;

  const labels: string[] = [];
  const totalPoints: number[] = [];
  const contributionPoints: number[] = [];
  const stabilityPoints: number[] = [];
  const nonContributivePoints: number[] = [];

  for (let year = minYear; year <= maxYear; year++) {
    const yearData = yearlyData.get(year)!;

    cumulativeContribution += yearData.contributionPoints;
    cumulativeNonContributive += yearData.nonContributivePoints;
    cumulativeContributiveYears += yearData.contributiveYears;

    if (cumulativeContributiveYears > MINIMUM_CONTRIBUTION_YEARS) {
      const age = year - birthYear;
      let yearStabilityPoints = 0;

      if (age >= 26 && age <= 30) {
        yearStabilityPoints = yearData.contributiveYears * TIER1_POINTS;
      } else if (age >= 31 && age <= 35) {
        yearStabilityPoints = yearData.contributiveYears * TIER2_POINTS;
      } else if (age >= 36) {
        yearStabilityPoints = yearData.contributiveYears * TIER3_POINTS;
      }

      cumulativeStability += yearStabilityPoints;
    }

    labels.push(year.toString());
    contributionPoints.push(Math.round(cumulativeContribution * 100) / 100);
    stabilityPoints.push(Math.round(cumulativeStability * 100) / 100);
    nonContributivePoints.push(Math.round(cumulativeNonContributive * 100) / 100);
    totalPoints.push(
      Math.round((cumulativeContribution + cumulativeStability + cumulativeNonContributive) * 100) / 100
    );
  }

  if (labels.length === 0) return null;

  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('pension.pointsAccumulation.totalPoints'),
          data: totalPoints,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 3,
        },
        {
          label: t('pension.pointsAccumulation.contributionPoints'),
          data: contributionPoints,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 1,
          borderWidth: 2,
        },
        {
          label: t('pension.pointsAccumulation.stabilityPoints'),
          data: stabilityPoints,
          borderColor: 'rgba(139, 92, 246, 1)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 1,
          borderWidth: 2,
        },
        {
          label: t('pension.pointsAccumulation.nonContributivePoints'),
          data: nonContributivePoints,
          borderColor: 'rgba(236, 72, 153, 1)',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 1,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            font: { size: 10 },
          },
        },
        title: {
          display: true,
          text: t('pension.pointsAccumulation.title'),
          font: { size: 14, weight: 'bold' },
          padding: { bottom: 15 },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: t('pension.pointsAccumulation.year'),
            font: { size: 10 },
          },
          ticks: { font: { size: 9 }, maxRotation: 45 },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: t('pension.pointsAccumulation.points'),
            font: { size: 10 },
          },
          ticks: { font: { size: 9 } },
          beginAtZero: true,
        },
      },
    },
  };

  return renderChartToImage(config, 700, 350);
}

/**
 * Generate contribution type pie chart image
 */
export function generateContributionTypePieChart(
  contributionPeriods: ContributionPeriod[],
  t: TranslateFunction
): ChartImageData | null {
  const data = {
    normal: 0,
    special: 0,
    nonContributive: 0,
  };

  contributionPeriods.forEach(period => {
    if (!period.fromDate || !period.toDate) return;
    const years = (new Date(period.toDate).getTime() - new Date(period.fromDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (period.nonContributiveType) {
      data.nonContributive += years;
    } else if (
      period.workingCondition === 'specialConditions' ||
      period.workingCondition === 'groupI' ||
      period.workingCondition === 'groupII'
    ) {
      data.special += years;
    } else {
      data.normal += years;
    }
  });

  // Filter out zero values
  const filteredLabels: string[] = [];
  const filteredData: number[] = [];
  const filteredBgColors: string[] = [];
  const filteredBorderColors: string[] = [];

  const allLabels = [
    t('pdfExport.charts.normalEmployment'),
    t('pdfExport.charts.specialConditions'),
    t('pdfExport.charts.nonContributive'),
  ];
  const allData = [data.normal, data.special, data.nonContributive];
  const bgColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
  ];
  const borderColors = [
    'rgba(59, 130, 246, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
  ];

  allData.forEach((val, idx) => {
    if (val > 0) {
      filteredLabels.push(allLabels[idx]);
      filteredData.push(Math.round(val * 10) / 10);
      filteredBgColors.push(bgColors[idx]);
      filteredBorderColors.push(borderColors[idx]);
    }
  });

  if (filteredData.length === 0) return null;

  const config: ChartConfiguration = {
    type: 'pie',
    data: {
      labels: filteredLabels,
      datasets: [{
        data: filteredData,
        backgroundColor: filteredBgColors,
        borderColor: filteredBorderColors,
        borderWidth: 1,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            usePointStyle: true,
            font: { size: 10 },
          },
        },
        title: {
          display: true,
          text: t('pdfExport.charts.contributionTypeTitle'),
          font: { size: 12, weight: 'bold' },
          padding: { bottom: 10 },
        },
      },
    },
  };

  return renderChartToImage(config, 320, 320);
}

/**
 * Generate period type pie chart image
 */
export function generatePeriodTypePieChart(
  contributionPeriods: ContributionPeriod[],
  t: TranslateFunction
): ChartImageData | null {
  const periodData: Record<string, { years: number; label: string }> = {};

  contributionPeriods.forEach(period => {
    if (!period.fromDate || !period.toDate) return;
    const years = (new Date(period.toDate).getTime() - new Date(period.fromDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    let key: string;
    let label: string;

    if (period.nonContributiveType) {
      if (period.nonContributiveType === 'university') {
        key = `university_${period.company || 'Unknown'}`;
        label = `${t('pension.contributionPeriods.nonContributivePeriod.university')} - ${period.company || 'Unknown'}`;
      } else if (period.nonContributiveType === 'military') {
        key = 'military_service';
        label = t('pension.contributionPeriods.nonContributivePeriod.military');
      } else if (period.nonContributiveType === 'childCare') {
        key = 'child_care';
        label = t('pension.contributionPeriods.nonContributivePeriod.childCare');
      } else if (period.nonContributiveType === 'medical') {
        key = 'medical_leave';
        label = t('pension.contributionPeriods.nonContributivePeriod.medical');
      } else {
        key = period.nonContributiveType;
        label = period.nonContributiveType;
      }
    } else {
      key = `employment_${period.company || 'Unknown'}`;
      label = period.company || 'Unknown';
    }

    if (!periodData[key]) {
      periodData[key] = { years: 0, label };
    }
    periodData[key].years += years;
  });

  const entries = Object.values(periodData);
  if (entries.length === 0) return null;

  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(75, 85, 99, 0.8)',
    'rgba(55, 48, 163, 0.8)',
    'rgba(180, 83, 9, 0.8)',
    'rgba(4, 120, 87, 0.8)',
  ];

  const config: ChartConfiguration = {
    type: 'pie',
    data: {
      labels: entries.map(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label),
      datasets: [{
        data: entries.map(d => Math.round(d.years * 10) / 10),
        backgroundColor: colors.slice(0, entries.length),
        borderColor: colors.slice(0, entries.length).map(c => c.replace('0.8', '1')),
        borderWidth: 1,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            usePointStyle: true,
            font: { size: 10 },
          },
        },
        title: {
          display: true,
          text: t('pdfExport.charts.periodTypeTitle'),
          font: { size: 12, weight: 'bold' },
          padding: { bottom: 10 },
        },
      },
    },
  };

  return renderChartToImage(config, 320, 320);
}

/**
 * Generate salary history line chart image
 */
export function generateSalaryHistoryChart(
  contributionPeriods: ContributionPeriod[],
  t: TranslateFunction
): ChartImageData | null {
  const yearlyUserSalaries: Map<number, { totalSalary: number; monthCount: number }> = new Map();

  contributionPeriods.forEach(period => {
    if (!period.fromDate || !period.toDate || !period.monthlyGrossSalary || period.nonContributiveType) {
      return;
    }

    const startDate = new Date(period.fromDate);
    const endDate = new Date(period.toDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      let monthsInYear: number;
      if (year === startYear && year === endYear) {
        monthsInYear = endDate.getMonth() - startDate.getMonth() + 1;
      } else if (year === startYear) {
        monthsInYear = 12 - startDate.getMonth();
      } else if (year === endYear) {
        monthsInYear = endDate.getMonth() + 1;
      } else {
        monthsInYear = 12;
      }

      const existing = yearlyUserSalaries.get(year) || { totalSalary: 0, monthCount: 0 };
      yearlyUserSalaries.set(year, {
        totalSalary: existing.totalSalary + (period.monthlyGrossSalary * monthsInYear),
        monthCount: existing.monthCount + monthsInYear,
      });
    }
  });

  if (yearlyUserSalaries.size === 0) return null;

  const years = Array.from(yearlyUserSalaries.keys()).sort((a, b) => a - b);
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const labels: string[] = [];
  const userSalaries: (number | null)[] = [];
  const nationalAverages: number[] = [];

  for (let year = minYear; year <= maxYear; year++) {
    const userData = yearlyUserSalaries.get(year);
    const userSalary = userData ? userData.totalSalary / userData.monthCount : null;
    const nationalAverage = getAverageSalaryForYear(year);

    labels.push(year.toString());
    userSalaries.push(userSalary);
    nationalAverages.push(nationalAverage);
  }

  if (labels.length === 0) return null;

  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('pension.salaryHistory.yourSalary'),
          data: userSalaries,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
          spanGaps: true,
        },
        {
          label: t('pension.salaryHistory.nationalAverage'),
          data: nationalAverages,
          borderColor: 'rgba(156, 163, 175, 1)',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            font: { size: 10 },
          },
        },
        title: {
          display: true,
          text: t('pension.salaryHistory.title'),
          font: { size: 14, weight: 'bold' },
          padding: { bottom: 15 },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: t('pension.salaryHistory.year'),
            font: { size: 10 },
          },
          ticks: { font: { size: 9 }, maxRotation: 45 },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: t('pension.salaryHistory.salaryRON'),
            font: { size: 10 },
          },
          ticks: { font: { size: 9 } },
          beginAtZero: false,
        },
      },
    },
  };

  return renderChartToImage(config, 700, 350);
}

/**
 * Generate all chart images for PDF export
 *
 * This function creates all chart visualizations that will be embedded
 * in the PDF report. It generates charts on offscreen canvases and
 * returns their base64 image data.
 *
 * @param contributionPeriods - The user's contribution periods
 * @param birthDate - The user's birth date
 * @param t - Translation function for labels
 * @returns Object containing all chart images
 */
export function generateAllChartImages(
  contributionPeriods: ContributionPeriod[],
  birthDate: string,
  t: TranslateFunction
): PdfChartImages {
  return {
    cumulativePointsChart: generateCumulativePointsChart(contributionPeriods, birthDate, t),
    contributionTypePieChart: generateContributionTypePieChart(contributionPeriods, t),
    periodTypePieChart: generatePeriodTypePieChart(contributionPeriods, t),
    salaryHistoryChart: generateSalaryHistoryChart(contributionPeriods, t),
  };
}
