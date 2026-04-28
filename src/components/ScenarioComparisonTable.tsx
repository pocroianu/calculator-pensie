/**
 * Scenario Comparison Table Component
 *
 * Displays a side-by-side comparison of multiple scenarios in a table format.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { WhatIfScenario, ScenarioComparisonResult } from '../types/pensionTypes';
import { formatCurrency, formatPoints, formatPercentage } from '../utils/formatters';

interface ScenarioComparisonTableProps {
  /** The baseline scenario */
  baseline: WhatIfScenario;
  /** Array of scenarios to compare */
  scenarios: WhatIfScenario[];
  /** Comparison results for each scenario */
  comparisons: ScenarioComparisonResult[];
}

const ScenarioComparisonTable: React.FC<ScenarioComparisonTableProps> = ({
  baseline,
  scenarios,
  comparisons,
}) => {
  const { t } = useTranslation();

  // All scenarios including baseline for display
  const allScenarios = [baseline, ...scenarios];

  // Get comparison for a scenario (null for baseline)
  const getComparison = (scenarioId: string): ScenarioComparisonResult | null => {
    if (scenarioId === 'baseline') return null;
    return comparisons.find(c => c.scenario.id === scenarioId) || null;
  };

  const renderDifference = (
    value: number,
    format: 'currency' | 'points' | 'percent' = 'currency'
  ) => {
    if (value === 0) {
      return (
        <span className="text-gray-400 dark:text-dark-text-muted">
          <Minus className="w-3 h-3 inline" />
        </span>
      );
    }

    const isPositive = value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

    let formattedValue = '';
    switch (format) {
      case 'currency':
        formattedValue = formatCurrency(Math.abs(value));
        break;
      case 'points':
        formattedValue = formatPoints(Math.abs(value));
        break;
      case 'percent':
        formattedValue = formatPercentage(Math.abs(value));
        break;
    }

    return (
      <span className={`flex items-center justify-center gap-0.5 text-xs ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span>
          {isPositive ? '+' : '-'}
          {formattedValue}
        </span>
      </span>
    );
  };

  if (allScenarios.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-dark-bg">
              <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-dark-text-secondary border-b border-gray-200 dark:border-dark-border sticky left-0 bg-gray-50 dark:bg-dark-bg z-10">
                {t('scenarios.comparison.metric')}
              </th>
              {allScenarios.map((scenario) => (
                <th
                  key={scenario.id}
                  className="text-center py-3 px-4 font-medium text-gray-900 dark:text-dark-text border-b border-gray-200 dark:border-dark-border min-w-[140px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    {scenario.isBaseline ? (
                      <div className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-gray-500" />
                        <span>{t('scenarios.currentSituation')}</span>
                      </div>
                    ) : (
                      <span
                        className="inline-flex items-center"
                        style={{ color: scenario.color }}
                      >
                        <span
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: scenario.color }}
                        />
                        {scenario.name}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Monthly Pension */}
            <tr className="border-b border-gray-100 dark:border-dark-border">
              <td className="py-3 px-4 text-gray-600 dark:text-dark-text-secondary font-medium sticky left-0 bg-white dark:bg-dark-bg-secondary">
                {t('pension.stats.pensionEstimate.monthlyPension')}
              </td>
              {allScenarios.map((scenario) => {
                const comparison = getComparison(scenario.id);
                return (
                  <td key={scenario.id} className="py-3 px-4 text-center">
                    <div className="font-semibold text-gray-900 dark:text-dark-text">
                      {formatCurrency(scenario.monthlyPension)}
                    </div>
                    {comparison && (
                      <div className="mt-1">
                        {renderDifference(comparison.monthlyPensionDiff, 'currency')}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Yearly Pension */}
            <tr className="border-b border-gray-100 dark:border-dark-border">
              <td className="py-3 px-4 text-gray-600 dark:text-dark-text-secondary font-medium sticky left-0 bg-white dark:bg-dark-bg-secondary">
                {t('pension.stats.pensionEstimate.yearlyPension')}
              </td>
              {allScenarios.map((scenario) => {
                const comparison = getComparison(scenario.id);
                return (
                  <td key={scenario.id} className="py-3 px-4 text-center">
                    <div className="text-gray-900 dark:text-dark-text">
                      {formatCurrency(scenario.yearlyPension)}
                    </div>
                    {comparison && (
                      <div className="mt-1">
                        {renderDifference(comparison.yearlyPensionDiff, 'currency')}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Total Points */}
            <tr className="border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50">
              <td className="py-3 px-4 text-gray-600 dark:text-dark-text-secondary font-medium sticky left-0 bg-gray-50/50 dark:bg-dark-bg/50">
                {t('pension.stats.pointsBreakdown.totalPoints')}
              </td>
              {allScenarios.map((scenario) => {
                const comparison = getComparison(scenario.id);
                return (
                  <td key={scenario.id} className="py-3 px-4 text-center">
                    <div className="font-medium text-blue-600 dark:text-blue-400">
                      {formatPoints(scenario.results.totalPoints)}
                    </div>
                    {comparison && (
                      <div className="mt-1">
                        {renderDifference(comparison.totalPointsDiff, 'points')}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Contribution Points */}
            <tr className="border-b border-gray-100 dark:border-dark-border">
              <td className="py-3 px-4 text-gray-500 dark:text-dark-text-muted pl-6 sticky left-0 bg-white dark:bg-dark-bg-secondary">
                {t('pension.stats.pointsBreakdown.contribution')}
              </td>
              {allScenarios.map((scenario) => {
                const comparison = getComparison(scenario.id);
                return (
                  <td key={scenario.id} className="py-3 px-4 text-center text-gray-600 dark:text-dark-text-secondary">
                    {formatPoints(scenario.results.contributionPoints)}
                    {comparison && comparison.contributionPointsDiff !== 0 && (
                      <div className="mt-1">
                        {renderDifference(comparison.contributionPointsDiff, 'points')}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Stability Points */}
            <tr className="border-b border-gray-100 dark:border-dark-border">
              <td className="py-3 px-4 text-gray-500 dark:text-dark-text-muted pl-6 sticky left-0 bg-white dark:bg-dark-bg-secondary">
                {t('pension.stats.pointsBreakdown.stability')}
              </td>
              {allScenarios.map((scenario) => {
                const comparison = getComparison(scenario.id);
                return (
                  <td key={scenario.id} className="py-3 px-4 text-center text-gray-600 dark:text-dark-text-secondary">
                    {formatPoints(scenario.results.stabilityPoints)}
                    {comparison && comparison.stabilityPointsDiff !== 0 && (
                      <div className="mt-1">
                        {renderDifference(comparison.stabilityPointsDiff, 'points')}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Non-contributive Points */}
            <tr className="border-b border-gray-100 dark:border-dark-border">
              <td className="py-3 px-4 text-gray-500 dark:text-dark-text-muted pl-6 sticky left-0 bg-white dark:bg-dark-bg-secondary">
                {t('pension.stats.pointsBreakdown.nonContributive')}
              </td>
              {allScenarios.map((scenario) => {
                const comparison = getComparison(scenario.id);
                return (
                  <td key={scenario.id} className="py-3 px-4 text-center text-gray-600 dark:text-dark-text-secondary">
                    {formatPoints(scenario.results.nonContributivePoints || 0)}
                    {comparison && comparison.nonContributivePointsDiff !== 0 && (
                      <div className="mt-1">
                        {renderDifference(comparison.nonContributivePointsDiff, 'points')}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Percentage Change */}
            <tr className="bg-blue-50/50 dark:bg-blue-900/10">
              <td className="py-3 px-4 text-gray-600 dark:text-dark-text-secondary font-medium sticky left-0 bg-blue-50/50 dark:bg-blue-900/10">
                {t('scenarios.percentChange')}
              </td>
              {allScenarios.map((scenario) => {
                const comparison = getComparison(scenario.id);
                return (
                  <td key={scenario.id} className="py-3 px-4 text-center">
                    {scenario.isBaseline ? (
                      <span className="text-gray-400 dark:text-dark-text-muted">—</span>
                    ) : comparison ? (
                      <div className="font-medium">
                        {renderDifference(comparison.monthlyPensionDiffPercent, 'percent')}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-dark-text-muted">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScenarioComparisonTable;
