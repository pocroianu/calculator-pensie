import React, { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Users, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import {
  getPensionComparison,
  getPercentileCategory,
  getPensionBenchmarks,
} from '../data/pensionBenchmarks';

interface Props {
  monthlyPension: number;
}

const PensionComparisonWidget: React.FC<Props> = ({ monthlyPension }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  const comparison = useMemo(() => {
    if (monthlyPension <= 0) return null;
    return getPensionComparison(monthlyPension);
  }, [monthlyPension]);

  const benchmarks = useMemo(() => getPensionBenchmarks(), []);

  if (!comparison || monthlyPension <= 0) {
    return null;
  }

  const percentileCategory = getPercentileCategory(comparison.percentile);

  // Get category color and icon
  const getCategoryStyles = () => {
    switch (percentileCategory) {
      case 'excellent':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          badgeColor: 'bg-green-100 text-green-800',
          icon: <Award className="w-5 h-5 text-green-500" />,
        };
      case 'good':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800',
          icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
        };
      case 'above_average':
        return {
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          textColor: 'text-teal-700',
          badgeColor: 'bg-teal-100 text-teal-800',
          icon: <TrendingUp className="w-5 h-5 text-teal-500" />,
        };
      case 'average':
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          badgeColor: 'bg-gray-100 text-gray-800',
          icon: <Minus className="w-5 h-5 text-gray-500" />,
        };
      case 'below_average':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          badgeColor: 'bg-orange-100 text-orange-800',
          icon: <TrendingDown className="w-5 h-5 text-orange-500" />,
        };
      case 'low':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          badgeColor: 'bg-red-100 text-red-800',
          icon: <TrendingDown className="w-5 h-5 text-red-500" />,
        };
    }
  };

  const styles = getCategoryStyles();

  // Calculate bar widths for visual comparison
  const maxValue = Math.max(
    monthlyPension,
    benchmarks.nationalAverage,
    benchmarks.minimumPension
  );
  const getBarWidth = (value: number) => (value / maxValue) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-testid="pension-comparison-widget">
      {/* Header */}
      <div
        className="p-4 border-b border-gray-200 bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">
              {t('pension.comparison.title')}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${styles.badgeColor}`}>
              {t(`pension.comparison.category.${percentileCategory}`)}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Percentile Ranking Card */}
          <div className={`p-4 rounded-xl ${styles.bgColor} border ${styles.borderColor}`}>
            <div className="flex items-center gap-3">
              {styles.icon}
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  {t('pension.comparison.percentileRanking')}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${styles.textColor}`}>
                    {comparison.percentile.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    {t('pension.comparison.percentileDescription')}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {t(`pension.comparison.percentileContext.${percentileCategory}`)}
            </p>
          </div>

          {/* Visual Comparison Bars */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('pension.comparison.visualComparison')}
            </h4>

            {/* Your Pension */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-900">
                  {t('pension.comparison.yourPension')}
                </span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(monthlyPension)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getBarWidth(monthlyPension)}%` }}
                />
              </div>
            </div>

            {/* National Average */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t('pension.comparison.nationalAverage')}
                </span>
                <span className="text-gray-700">
                  {formatCurrency(benchmarks.nationalAverage)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-gray-400 h-3 rounded-full"
                  style={{ width: `${getBarWidth(benchmarks.nationalAverage)}%` }}
                />
              </div>
              {/* Difference indicator */}
              <div className="flex items-center gap-1 text-xs">
                {comparison.comparison.vsAverage.isAbove ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">
                      +{formatCurrency(comparison.comparison.vsAverage.difference)} (
                      {formatPercentage(Math.abs(comparison.comparison.vsAverage.percentDifference))}
                      {' '}{t('pension.comparison.aboveAverage')})
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span className="text-red-600">
                      {formatCurrency(comparison.comparison.vsAverage.difference)} (
                      {formatPercentage(Math.abs(comparison.comparison.vsAverage.percentDifference))}
                      {' '}{t('pension.comparison.belowAverage')})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Minimum Pension */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t('pension.comparison.minimumPension')}
                </span>
                <span className="text-gray-700">
                  {formatCurrency(benchmarks.minimumPension)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-orange-300 h-3 rounded-full"
                  style={{ width: `${getBarWidth(benchmarks.minimumPension)}%` }}
                />
              </div>
              {/* Difference indicator */}
              <div className="flex items-center gap-1 text-xs">
                {comparison.comparison.vsMinimum.isAbove ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">
                      +{formatCurrency(comparison.comparison.vsMinimum.difference)} (
                      {formatPercentage(Math.abs(comparison.comparison.vsMinimum.percentDifference))}
                      {' '}{t('pension.comparison.aboveMinimum')})
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span className="text-red-600">
                      {t('pension.comparison.atMinimum')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">
                {t('pension.comparison.vsAverageLabel')}
              </div>
              <div className={`text-lg font-semibold ${
                comparison.comparison.vsAverage.isAbove ? 'text-green-600' : 'text-red-600'
              }`}>
                {comparison.comparison.vsAverage.isAbove ? '+' : ''}
                {formatPercentage(comparison.comparison.vsAverage.percentDifference)}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">
                {t('pension.comparison.vsMinimumLabel')}
              </div>
              <div className={`text-lg font-semibold ${
                comparison.comparison.vsMinimum.isAbove ? 'text-green-600' : 'text-red-600'
              }`}>
                {comparison.comparison.vsMinimum.isAbove ? '+' : ''}
                {formatPercentage(comparison.comparison.vsMinimum.percentDifference)}
              </div>
            </div>
          </div>

          {/* Source Note */}
          <div className="text-xs text-gray-400 text-center pt-2">
            {t('pension.comparison.sourceNote', { year: benchmarks.year })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PensionComparisonWidget;
