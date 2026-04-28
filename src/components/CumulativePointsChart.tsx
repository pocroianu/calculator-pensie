import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ContributionPeriod } from '../types/pensionTypes';
import { getAverageSalaryForYear } from '../data/historicalSalaries';
import { getWorkingConditionMultiplier } from '../utils/pensionCalculations';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

// Register Chart.js components for Line chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  contributionPeriods: ContributionPeriod[];
  birthDate: string;
}

interface YearlyAccumulation {
  year: number;
  contributionPoints: number;
  stabilityPoints: number;
  nonContributivePoints: number;
  totalPoints: number;
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
const TIER1_POINTS = 0.50; // Years 26-30
const TIER2_POINTS = 0.75; // Years 31-35
const TIER3_POINTS = 1.00; // Years 36+

const CumulativePointsChart: React.FC<Props> = ({ contributionPeriods, birthDate }) => {
  const { t } = useTranslation();

  // Calculate cumulative points data by year
  const chartData = React.useMemo(() => {
    // Get all periods with valid dates
    const validPeriods = contributionPeriods.filter(
      period => period.fromDate && period.toDate
    );

    if (validPeriods.length === 0) {
      return null;
    }

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

    // Initialize all years
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
          // Non-contributive period
          const pointsPerYear = NON_CONTRIBUTIVE_POINTS_PER_YEAR[period.nonContributiveType] || 0;
          current.nonContributivePoints += pointsPerYear * yearFraction;
        } else if (period.monthlyGrossSalary) {
          // Contributive period
          const averageSalary = getAverageSalaryForYear(year);
          const basePoints = (period.monthlyGrossSalary / averageSalary) * yearFraction;
          const multiplier = getWorkingConditionMultiplier(period.workingCondition);
          current.contributionPoints += basePoints * multiplier;
          current.contributiveYears += yearFraction;
        }

        yearlyData.set(year, current);
      }
    });

    // Calculate stability points based on cumulative contributive years
    // and build cumulative totals
    let cumulativeContribution = 0;
    let cumulativeStability = 0;
    let cumulativeNonContributive = 0;
    let cumulativeContributiveYears = 0;

    const birthYear = birthDate ? new Date(birthDate).getFullYear() : 1980;

    const result: YearlyAccumulation[] = [];

    for (let year = minYear; year <= maxYear; year++) {
      const yearData = yearlyData.get(year)!;

      // Accumulate contribution points
      cumulativeContribution += yearData.contributionPoints;
      cumulativeNonContributive += yearData.nonContributivePoints;

      // Track contributive years for stability calculation
      cumulativeContributiveYears += yearData.contributiveYears;

      // Calculate stability points for this year
      // Based on total years of contribution and age at time of work
      if (cumulativeContributiveYears > MINIMUM_CONTRIBUTION_YEARS) {
        const age = year - birthYear;
        let yearStabilityPoints = 0;

        // Stability points are earned based on age during work
        if (age >= 26 && age <= 30) {
          yearStabilityPoints = yearData.contributiveYears * TIER1_POINTS;
        } else if (age >= 31 && age <= 35) {
          yearStabilityPoints = yearData.contributiveYears * TIER2_POINTS;
        } else if (age >= 36) {
          yearStabilityPoints = yearData.contributiveYears * TIER3_POINTS;
        }

        cumulativeStability += yearStabilityPoints;
      }

      result.push({
        year,
        contributionPoints: Math.round(cumulativeContribution * 100) / 100,
        stabilityPoints: Math.round(cumulativeStability * 100) / 100,
        nonContributivePoints: Math.round(cumulativeNonContributive * 100) / 100,
        totalPoints: Math.round((cumulativeContribution + cumulativeStability + cumulativeNonContributive) * 100) / 100,
      });
    }

    return result;
  }, [contributionPeriods, birthDate]);

  // If no data, show placeholder
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900">{t('pension.pointsAccumulation.title')}</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>{t('pension.pointsAccumulation.noData')}</p>
        </div>
      </div>
    );
  }

  // Get final totals for display
  const finalData = chartData[chartData.length - 1];

  // Prepare chart data
  const lineChartData: ChartData<'line'> = {
    labels: chartData.map(d => d.year.toString()),
    datasets: [
      {
        label: t('pension.pointsAccumulation.totalPoints'),
        data: chartData.map(d => d.totalPoints),
        borderColor: 'rgba(16, 185, 129, 1)', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 3,
      },
      {
        label: t('pension.pointsAccumulation.contributionPoints'),
        data: chartData.map(d => d.contributionPoints),
        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: t('pension.pointsAccumulation.stabilityPoints'),
        data: chartData.map(d => d.stabilityPoints),
        borderColor: 'rgba(139, 92, 246, 1)', // purple-500
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: t('pension.pointsAccumulation.nonContributivePoints'),
        data: chartData.map(d => d.nonContributivePoints),
        borderColor: 'rgba(236, 72, 153, 1)', // pink-500
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw as number;
            if (value === null || value === undefined) return '';
            return `${label}: ${value.toFixed(2)} ${t('common.points')}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('pension.pointsAccumulation.year'),
          font: {
            size: 11,
          },
        },
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: t('pension.pointsAccumulation.points'),
          font: {
            size: 11,
          },
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function(value) {
            return (value as number).toFixed(1);
          },
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="font-medium text-gray-900">{t('pension.pointsAccumulation.title')}</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">{t('pension.pointsAccumulation.description')}</p>
      </div>

      <div className="p-6">
        {/* Summary Statistics - WCAG AA Compliant */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-a11y-emerald-bg rounded-lg">
            <div className="text-lg font-semibold text-a11y-emerald-text">
              {finalData.totalPoints.toFixed(2)}
            </div>
            <div className="text-xs text-a11y-neutral-text-muted">{t('pension.pointsAccumulation.totalPointsLabel')}</div>
          </div>

          <div className="text-center p-3 bg-a11y-info-bg rounded-lg">
            <div className="text-lg font-semibold text-a11y-info-text">
              {finalData.contributionPoints.toFixed(2)}
            </div>
            <div className="text-xs text-a11y-neutral-text-muted">{t('pension.pointsAccumulation.contributionLabel')}</div>
          </div>

          <div className="text-center p-3 bg-a11y-purple-bg rounded-lg">
            <div className="text-lg font-semibold text-a11y-purple-text">
              {finalData.stabilityPoints.toFixed(2)}
            </div>
            <div className="text-xs text-a11y-neutral-text-muted">{t('pension.pointsAccumulation.stabilityLabel')}</div>
          </div>

          <div className="text-center p-3 bg-a11y-pink-bg rounded-lg">
            <div className="text-lg font-semibold text-a11y-pink-text">
              {finalData.nonContributivePoints.toFixed(2)}
            </div>
            <div className="text-xs text-a11y-neutral-text-muted">{t('pension.pointsAccumulation.nonContributiveLabel')}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <Line data={lineChartData} options={options} />
        </div>

        {/* Legend explanation */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>{t('pension.pointsAccumulation.legendTotal')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>{t('pension.pointsAccumulation.legendContribution')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span>{t('pension.pointsAccumulation.legendStability')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500"></span>
              <span>{t('pension.pointsAccumulation.legendNonContributive')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CumulativePointsChart;
