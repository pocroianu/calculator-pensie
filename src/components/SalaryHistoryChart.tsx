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
import { getAverageSalaryForYear, HISTORICAL_AVERAGE_SALARIES } from '../data/historicalSalaries';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
}

interface YearlyData {
  year: number;
  userSalary: number | null;
  nationalAverage: number;
}

const SalaryHistoryChart: React.FC<Props> = ({ contributionPeriods }) => {
  const { t } = useTranslation();

  // Calculate yearly salary data from contribution periods
  const chartData = React.useMemo(() => {
    // Get all years from contribution periods that have salary data
    const yearlyUserSalaries: Map<number, { totalSalary: number; monthCount: number }> = new Map();

    contributionPeriods.forEach(period => {
      // Only process employment periods with salary data
      if (!period.fromDate || !period.toDate || !period.monthlyGrossSalary || period.nonContributiveType) {
        return;
      }

      const startDate = new Date(period.fromDate);
      const endDate = new Date(period.toDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      // Distribute salary across years
      for (let year = startYear; year <= endYear; year++) {
        let monthsInYear: number;

        if (year === startYear && year === endYear) {
          // Period within single year
          monthsInYear = endDate.getMonth() - startDate.getMonth() + 1;
        } else if (year === startYear) {
          // First year of multi-year period
          monthsInYear = 12 - startDate.getMonth();
        } else if (year === endYear) {
          // Last year of multi-year period
          monthsInYear = endDate.getMonth() + 1;
        } else {
          // Full year in middle
          monthsInYear = 12;
        }

        const existing = yearlyUserSalaries.get(year) || { totalSalary: 0, monthCount: 0 };
        yearlyUserSalaries.set(year, {
          totalSalary: existing.totalSalary + (period.monthlyGrossSalary * monthsInYear),
          monthCount: existing.monthCount + monthsInYear,
        });
      }
    });

    // If no salary data, return empty
    if (yearlyUserSalaries.size === 0) {
      return null;
    }

    // Get min and max years
    const years = Array.from(yearlyUserSalaries.keys()).sort((a, b) => a - b);
    const minYear = years[0];
    const maxYear = years[years.length - 1];

    // Build data array for all years in range
    const data: YearlyData[] = [];
    for (let year = minYear; year <= maxYear; year++) {
      const userData = yearlyUserSalaries.get(year);
      const userSalary = userData ? userData.totalSalary / userData.monthCount : null;
      const nationalAverage = getAverageSalaryForYear(year);

      data.push({
        year,
        userSalary,
        nationalAverage,
      });
    }

    return data;
  }, [contributionPeriods]);

  // Calculate statistics for display
  const statistics = React.useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return null;
    }

    const yearsWithSalary = chartData.filter(d => d.userSalary !== null);
    if (yearsWithSalary.length === 0) return null;

    let aboveAverageYears = 0;
    let belowAverageYears = 0;
    let totalRatio = 0;

    yearsWithSalary.forEach(d => {
      if (d.userSalary !== null) {
        const ratio = d.userSalary / d.nationalAverage;
        totalRatio += ratio;
        if (d.userSalary > d.nationalAverage) {
          aboveAverageYears++;
        } else if (d.userSalary < d.nationalAverage) {
          belowAverageYears++;
        }
      }
    });

    const avgRatio = totalRatio / yearsWithSalary.length;
    const latestYear = yearsWithSalary[yearsWithSalary.length - 1];
    const latestRatio = latestYear.userSalary! / latestYear.nationalAverage;

    return {
      aboveAverageYears,
      belowAverageYears,
      avgRatio,
      latestRatio,
      totalYears: yearsWithSalary.length,
    };
  }, [chartData]);

  // If no data, show placeholder
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900">{t('pension.salaryHistory.title')}</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>{t('pension.salaryHistory.noData')}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const lineChartData: ChartData<'line'> = {
    labels: chartData.map(d => d.year.toString()),
    datasets: [
      {
        label: t('pension.salaryHistory.yourSalary'),
        data: chartData.map(d => d.userSalary),
        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartData.map(d => {
          if (d.userSalary === null) return 'transparent';
          return d.userSalary >= d.nationalAverage
            ? 'rgba(34, 197, 94, 1)' // green-500
            : 'rgba(239, 68, 68, 1)'; // red-500
        }),
        pointBorderColor: chartData.map(d => {
          if (d.userSalary === null) return 'transparent';
          return d.userSalary >= d.nationalAverage
            ? 'rgba(34, 197, 94, 1)'
            : 'rgba(239, 68, 68, 1)';
        }),
        spanGaps: true,
      },
      {
        label: t('pension.salaryHistory.nationalAverage'),
        data: chartData.map(d => d.nationalAverage),
        borderColor: 'rgba(156, 163, 175, 1)', // gray-400
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 4,
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
            if (value === null) return '';

            const yearIndex = context.dataIndex;
            const yearData = chartData[yearIndex];

            let tooltipText = `${label}: ${formatCurrency(value)}`;

            // Add comparison info for user salary
            if (context.datasetIndex === 0 && yearData.userSalary !== null) {
              const diff = yearData.userSalary - yearData.nationalAverage;
              const percentDiff = ((yearData.userSalary / yearData.nationalAverage) - 1) * 100;
              const sign = diff >= 0 ? '+' : '';
              tooltipText += ` (${sign}${percentDiff.toFixed(1)}% ${t('pension.salaryHistory.vsAverage')})`;
            }

            return tooltipText;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('pension.salaryHistory.year'),
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
          text: t('pension.salaryHistory.salaryRON'),
          font: {
            size: 11,
          },
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function(value) {
            return formatCurrency(value as number);
          },
        },
        beginAtZero: false,
      },
    },
  };

  // Generate accessible summary of chart data
  const chartAccessibleSummary = React.useMemo(() => {
    if (!statistics) return '';
    const avgPercentage = (statistics.avgRatio * 100).toFixed(0);
    return `Salary progression chart showing ${statistics.totalYears} years of data. Average salary was ${avgPercentage}% of national average. ${statistics.aboveAverageYears} years above average, ${statistics.belowAverageYears} years below average.`;
  }, [statistics]);

  return (
    <section
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      aria-labelledby="salary-history-title"
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 id="salary-history-title" className="font-medium text-gray-900">{t('pension.salaryHistory.title')}</h3>
        <p className="text-sm text-gray-500 mt-1">{t('pension.salaryHistory.description')}</p>
      </div>

      <div className="p-6">
        {/* Statistics Summary - WCAG AA Compliant */}
        {statistics && (
          <div className="grid grid-cols-3 gap-4 mb-6" role="group" aria-label="Salary statistics">
            <div className="text-center p-3 bg-a11y-neutral-bg rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                {statistics.avgRatio >= 1 ? (
                  <TrendingUp className="w-4 h-4 text-a11y-success-icon" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-a11y-error-icon" aria-hidden="true" />
                )}
              </div>
              <div className={`text-lg font-semibold ${statistics.avgRatio >= 1 ? 'text-a11y-success-text' : 'text-a11y-error-text'}`}>
                {(statistics.avgRatio * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-a11y-neutral-text-muted">{t('pension.salaryHistory.avgRatio')}</div>
            </div>

            <div className="text-center p-3 bg-a11y-success-bg rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-a11y-success-icon" aria-hidden="true" />
              </div>
              <div className="text-lg font-semibold text-a11y-success-text">
                {statistics.aboveAverageYears}
              </div>
              <div className="text-xs text-a11y-neutral-text-muted">{t('pension.salaryHistory.yearsAbove')}</div>
            </div>

            <div className="text-center p-3 bg-a11y-error-bg rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-4 h-4 text-a11y-error-icon" aria-hidden="true" />
              </div>
              <div className="text-lg font-semibold text-a11y-error-text">
                {statistics.belowAverageYears}
              </div>
              <div className="text-xs text-a11y-neutral-text-muted">{t('pension.salaryHistory.yearsBelow')}</div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-[300px]" role="img" aria-label={chartAccessibleSummary}>
          <Line data={lineChartData} options={options} />
        </div>
        {/* Screen reader only summary */}
        <div className="sr-only" aria-live="polite">
          {chartAccessibleSummary}
        </div>

        {/* Legend explanation */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500" role="list" aria-label="Chart legend">
            <div className="flex items-center gap-2" role="listitem">
              <span className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true"></span>
              <span>{t('pension.salaryHistory.aboveAverage')}</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <span className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true"></span>
              <span>{t('pension.salaryHistory.belowAverage')}</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <span className="w-6 border-t-2 border-dashed border-gray-400" aria-hidden="true"></span>
              <span>{t('pension.salaryHistory.nationalAverageLine')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalaryHistoryChart;
