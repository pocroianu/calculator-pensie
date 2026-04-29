import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Chart, TooltipItem } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { ContributionPeriod } from '../types/pensionTypes';
import { formatYears } from '../utils/formatters';
import { useTranslation } from 'react-i18next';
import SalaryHistoryChart from './SalaryHistoryChart';
import CumulativePointsChart from './CumulativePointsChart';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  contributionPeriods: ContributionPeriod[];
  birthDate: string;
  className?: string;
}

const PensionCharts: React.FC<Props> = ({ contributionPeriods, birthDate, className = '' }) => {
  const { t } = useTranslation();

  // Calculate data for contribution type pie chart
  const contributionTypeData = React.useMemo(() => {
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
      } else if (period.workingCondition === 'specialConditions' || period.workingCondition === 'groupI' || period.workingCondition === 'groupII') {
        data.special += years;
      } else {
        data.normal += years;
      }
    });

    return {
      labels: ['Normal Employment', 'Special Conditions', 'Non-contributive'],
      datasets: [
        {
          data: [data.normal, data.special, data.nonContributive],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)', // blue-500
            'rgba(139, 92, 246, 0.8)',  // purple-500
            'rgba(236, 72, 153, 0.8)',  // pink-500
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [contributionPeriods]);

  // Calculate data for period type pie chart
  const periodTypeData = React.useMemo(() => {
    const periodData: Record<string, { years: number; label: string }> = {};

    contributionPeriods.forEach(period => {
      if (!period.fromDate || !period.toDate) return;
      
      const years = (new Date(period.toDate).getTime() - new Date(period.fromDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      let key: string;
      let label: string;
      
      if (period.nonContributiveType) {
        if (period.nonContributiveType === 'university') {
          key = `university_${period.company || 'Unknown'}`;
          label = `University - ${period.company || 'Unknown'}`;
        } else if (period.nonContributiveType === 'military') {
          key = 'military_service';
          label = 'Military Service';
        } else if (period.nonContributiveType === 'childCare') {
          key = 'child_care';
          label = 'Child Care Leave';
        } else if (period.nonContributiveType === 'medical') {
          key = 'medical_leave';
          label = 'Medical Leave';
        } else {
          key = period.nonContributiveType;
          label = period.nonContributiveType;
        }
      } else {
        key = `employment_${period.company || 'Unknown'}`;
        label = `${period.company || 'Unknown'} (${period.workingCondition || 'normal'})`;
      }
      
      if (!periodData[key]) {
        periodData[key] = { years: 0, label };
      }
      periodData[key].years += years;
    });

    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue-500
      'rgba(236, 72, 153, 0.8)',   // pink-500
      'rgba(139, 92, 246, 0.8)',   // purple-500
      'rgba(245, 158, 11, 0.8)',   // amber-500
      'rgba(16, 185, 129, 0.8)',   // emerald-500
      'rgba(239, 68, 68, 0.8)',    // red-500
      'rgba(75, 85, 99, 0.8)',     // gray-600
      'rgba(55, 48, 163, 0.8)',    // indigo-800
      'rgba(180, 83, 9, 0.8)',     // yellow-800
      'rgba(4, 120, 87, 0.8)',     // emerald-700
    ];

    return {
      labels: Object.values(periodData).map(d => d.label),
      datasets: [
        {
          data: Object.values(periodData).map(d => d.years),
          backgroundColor: colors.slice(0, Object.keys(periodData).length),
          borderColor: colors.slice(0, Object.keys(periodData).length).map(color => 
            color.replace('0.8', '1')
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [contributionPeriods]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 11
          },
          // Wrap text if too long
          generateLabels: function(chart: Chart<'pie'>) {
            const datasets = chart.data.datasets;
            if (datasets.length === 0) {
              return [];
            }

            const {labels} = chart.data;
            return labels.map((label: string, i: number) => ({
              text: label.length > 25 ? label.substring(0, 25) + '...' : label,
              fillStyle: datasets[0].backgroundColor[i],
              strokeStyle: datasets[0].borderColor[i],
              lineWidth: datasets[0].borderWidth,
              hidden: false,
              index: i,
              datasetIndex: 0
            }));
          }
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'pie'>) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatYears(value)} years`;
          }
        }
      }
    },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cumulative Points Accumulation Chart - Line chart showing points growth over time */}
      <CumulativePointsChart contributionPeriods={contributionPeriods} birthDate={birthDate} />

      {/* Salary History Chart - Line chart comparing salary to national average */}
      <SalaryHistoryChart contributionPeriods={contributionPeriods} />

      {/* Contribution Analysis - Pie charts */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm print-chart-container">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <h3 className="font-medium text-gray-900">{t('pension.contributionAnalysis.title')}</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 text-center">Contribution Type Distribution</h4>
              <div className="w-full max-w-[300px] mx-auto">
                <Pie data={contributionTypeData} options={options} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 text-center">Period Type Distribution</h4>
              <div className="w-full max-w-[300px] mx-auto">
                <Pie data={periodTypeData} options={options} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PensionCharts;
