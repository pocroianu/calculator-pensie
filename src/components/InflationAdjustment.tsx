import React, { useState, useMemo } from 'react';
import { TrendingDown, AlertCircle, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  calculateInflationAdjustment,
  getInflationSeverity,
  DEFAULT_INFLATION_RATE,
  MIN_INFLATION_RATE,
  MAX_INFLATION_RATE,
  DEFAULT_PROJECTION_YEARS,
  MIN_PROJECTION_YEARS,
  MAX_PROJECTION_YEARS,
  INFLATION_PRESETS,
} from '../utils/inflationCalculations';

interface Props {
  monthlyPension: number;
  yearsUntilRetirement?: number;
}

const InflationAdjustment: React.FC<Props> = ({
  monthlyPension,
  yearsUntilRetirement = 0,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inflationRate, setInflationRate] = useState<number>(DEFAULT_INFLATION_RATE);
  const [projectionYears, setProjectionYears] = useState<number>(DEFAULT_PROJECTION_YEARS);
  const [selectedPreset, setSelectedPreset] = useState<string>('moderate');
  const [showYearByYear, setShowYearByYear] = useState(false);

  // Calculate inflation projection
  const analysis = useMemo(() => {
    return calculateInflationAdjustment(
      monthlyPension,
      inflationRate,
      projectionYears,
      yearsUntilRetirement
    );
  }, [monthlyPension, inflationRate, projectionYears, yearsUntilRetirement]);

  const severity = useMemo(() => {
    return getInflationSeverity(analysis.totalPurchasingPowerLossPercent);
  }, [analysis.totalPurchasingPowerLossPercent]);

  // Don't render if no pension
  if (monthlyPension <= 0) {
    return null;
  }

  const handlePresetChange = (preset: typeof INFLATION_PRESETS[number]) => {
    setInflationRate(preset.rate);
    setSelectedPreset(preset.label);
  };

  const handleCustomRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setInflationRate(Math.max(MIN_INFLATION_RATE, Math.min(MAX_INFLATION_RATE, value)));
      setSelectedPreset('custom');
    }
  };

  const handleProjectionYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setProjectionYears(Math.max(MIN_PROJECTION_YEARS, Math.min(MAX_PROJECTION_YEARS, value)));
    }
  };

  const severityColors = {
    low: 'bg-a11y-success-bg-subtle border-a11y-success-border text-a11y-success-text',
    moderate: 'bg-a11y-warning-bg-subtle border-a11y-warning-border text-a11y-warning-text',
    high: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200',
    severe: 'bg-a11y-error-bg-subtle border-a11y-error-border text-a11y-error-text',
  };

  const severityBarColors = {
    low: 'bg-green-500',
    moderate: 'bg-yellow-500',
    high: 'bg-orange-500',
    severe: 'bg-red-500',
  };

  // Select key projection years for display (every 5 years)
  const keyProjections = analysis.projections.filter(
    (_, i) => i === 0 || i % 5 === 0 || i === analysis.projections.length - 1
  );

  const finalProjection = analysis.projections[analysis.projections.length - 1];

  return (
    <div
      className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden"
      data-testid="inflation-adjustment"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
          aria-expanded={isExpanded}
          data-testid="inflation-toggle"
        >
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-purple-500" />
            <h3 className="font-medium text-gray-900 dark:text-dark-text">
              {t('pension.inflationAdjustment.title')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${severityColors[severity]}`}>
              {t(`pension.inflationAdjustment.severity.${severity}`)}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-5">
          {/* Controls */}
          <div className="space-y-4">
            {/* Inflation Rate Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                {t('pension.inflationAdjustment.inflationRate')}
              </label>
              <div className="flex flex-wrap gap-2" data-testid="inflation-presets">
                {INFLATION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetChange(preset)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      selectedPreset === preset.label
                        ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-secondary dark:hover:bg-dark-bg-secondary'
                    }`}
                    data-testid={`preset-${preset.label}`}
                  >
                    {t(`pension.inflationAdjustment.presets.${preset.label}`)}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedPreset('custom')}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    selectedPreset === 'custom'
                      ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-dark-bg dark:border-dark-border dark:text-dark-text-secondary dark:hover:bg-dark-bg-secondary'
                  }`}
                >
                  {t('pension.inflationAdjustment.presets.custom')}
                </button>
              </div>
            </div>

            {/* Custom Rate Input */}
            {selectedPreset === 'custom' && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-dark-text-secondary whitespace-nowrap">
                  {t('pension.inflationAdjustment.inflationRate')}:
                </label>
                <input
                  type="number"
                  min={MIN_INFLATION_RATE}
                  max={MAX_INFLATION_RATE}
                  step={0.5}
                  value={inflationRate}
                  onChange={handleCustomRateChange}
                  className="w-24 px-3 py-1.5 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  data-testid="custom-inflation-rate"
                />
                <span className="text-sm text-gray-500 dark:text-dark-text-muted">%</span>
              </div>
            )}

            {/* Projection Years Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                  {t('pension.inflationAdjustment.projectionYears')}
                </label>
                <span className="text-sm text-gray-500 dark:text-dark-text-muted">
                  {projectionYears} {t('pension.inflationAdjustment.yearsLabel')}
                </span>
              </div>
              <input
                type="range"
                min={MIN_PROJECTION_YEARS}
                max={MAX_PROJECTION_YEARS}
                value={projectionYears}
                onChange={handleProjectionYearsChange}
                className="w-full h-2 bg-gray-200 dark:bg-dark-bg rounded-lg appearance-none cursor-pointer accent-purple-500"
                data-testid="projection-years-slider"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-dark-text-muted mt-1">
                <span>{MIN_PROJECTION_YEARS}</span>
                <span>{MAX_PROJECTION_YEARS}</span>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className={`rounded-lg border p-4 ${severityColors[severity]}`} data-testid="inflation-summary">
            <div className="flex gap-2 mb-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                {t('pension.inflationAdjustment.summary', {
                  years: projectionYears,
                  rate: formatNumber(inflationRate, 1),
                  pension: formatCurrency(monthlyPension),
                  realValue: formatCurrency(finalProjection.realPurchasingPower),
                  lossPercent: formatNumber(finalProjection.purchasingPowerLossPercent, 1),
                })}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Pension */}
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                  {t('pension.inflationAdjustment.currentPension')}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-dark-text">
                {formatCurrency(monthlyPension)}
              </div>
              <div className="text-xs text-gray-400 dark:text-dark-text-muted">
                {t('pension.inflationAdjustment.perMonth')}
              </div>
            </div>

            {/* Future Purchasing Power */}
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                  {t('pension.inflationAdjustment.afterYears', { years: projectionYears })}
                </span>
              </div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="future-value">
                {formatCurrency(finalProjection.realPurchasingPower)}
              </div>
              <div className="text-xs text-red-500">
                -{formatNumber(finalProjection.purchasingPowerLossPercent, 1)}%
              </div>
            </div>
          </div>

          {/* Purchasing Power Loss Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-dark-text-secondary">
                {t('pension.inflationAdjustment.purchasingPowerLoss')}
              </span>
              <span className="font-medium text-gray-900 dark:text-dark-text">
                -{formatCurrency(finalProjection.purchasingPowerLoss)}
                <span className="text-gray-400 dark:text-dark-text-muted text-xs ml-1">
                  {t('pension.inflationAdjustment.perMonth')}
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-dark-bg rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${severityBarColors[severity]}`}
                style={{
                  width: `${Math.min(100, finalProjection.purchasingPowerLossPercent)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-dark-text-muted mt-1">
              <span>{t('pension.inflationAdjustment.nominalValue')}: {formatCurrency(monthlyPension)}</span>
              <span>{t('pension.inflationAdjustment.realValue')}: {formatCurrency(finalProjection.realPurchasingPower)}</span>
            </div>
          </div>

          {/* Average Annual Loss */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700 dark:text-purple-200 font-medium">
                {t('pension.inflationAdjustment.averageAnnualLoss')}
              </span>
              <span className="text-sm font-bold text-purple-800 dark:text-purple-100">
                -{formatCurrency(analysis.averageAnnualLoss)}{t('pension.inflationAdjustment.perMonth')}
              </span>
            </div>
          </div>

          {/* Year-by-Year Toggle */}
          <div>
            <button
              onClick={() => setShowYearByYear(!showYearByYear)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 dark:text-dark-text-secondary bg-gray-50 dark:bg-dark-bg rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              data-testid="year-by-year-toggle"
            >
              <span>{t('pension.inflationAdjustment.yearByYear')}</span>
              {showYearByYear ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showYearByYear && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm" data-testid="year-by-year-table">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-border">
                      <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-dark-text-secondary">
                        {t('pension.inflationAdjustment.year')}
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-dark-text-secondary">
                        {t('pension.inflationAdjustment.realPurchasingPower')}
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-dark-text-secondary">
                        {t('pension.inflationAdjustment.loss')}
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-dark-text-secondary">
                        {t('pension.inflationAdjustment.lossPercent')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyProjections.map((projection) => (
                      <tr
                        key={projection.year}
                        className="border-b border-gray-100 dark:border-dark-border/50"
                      >
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-dark-text">
                          {projection.year}
                        </td>
                        <td className="py-2 px-2 text-right text-gray-900 dark:text-dark-text">
                          {formatCurrency(projection.realPurchasingPower)}
                        </td>
                        <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                          {projection.purchasingPowerLoss > 0
                            ? `-${formatCurrency(projection.purchasingPowerLoss)}`
                            : '—'}
                        </td>
                        <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                          {projection.purchasingPowerLossPercent > 0
                            ? `-${formatNumber(projection.purchasingPowerLossPercent, 1)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-200">
                {t('pension.inflationAdjustment.note')}
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="pt-3 border-t border-gray-200 dark:border-dark-border">
            <p className="text-xs text-gray-500 dark:text-dark-text-muted italic">
              {t('pension.inflationAdjustment.disclaimer')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InflationAdjustment;
