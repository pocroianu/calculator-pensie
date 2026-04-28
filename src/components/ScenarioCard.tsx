/**
 * Scenario Card Component
 *
 * Displays a single what-if scenario with its details and comparison to baseline.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
} from 'lucide-react';
import { WhatIfScenario, ScenarioComparisonResult } from '../types/pensionTypes';
import { formatCurrency, formatPoints, formatPercentage } from '../utils/formatters';

interface ScenarioCardProps {
  /** The scenario to display */
  scenario: WhatIfScenario;
  /** Comparison result against baseline (null for baseline itself) */
  comparison: ScenarioComparisonResult | null;
  /** Whether this is the baseline scenario */
  isBaseline?: boolean;
  /** Callback when delete is clicked */
  onDelete?: (scenarioId: string) => void;
  /** Callback when edit is clicked */
  onEdit?: (scenario: WhatIfScenario) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  comparison,
  isBaseline = false,
  onDelete,
  onEdit,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const renderDifference = (
    value: number,
    format: 'currency' | 'points' | 'percent' | 'years' = 'currency'
  ) => {
    if (value === 0) {
      return (
        <span className="text-gray-500 dark:text-dark-text-muted flex items-center gap-1">
          <Minus className="w-3 h-3" />
          <span>{t('scenarios.noChange')}</span>
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
      case 'years':
        formattedValue = `${Math.abs(value)} ${t('common.years')}`;
        break;
    }

    return (
      <span className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span>
          {isPositive ? '+' : '-'}
          {formattedValue}
        </span>
      </span>
    );
  };

  const borderColor = scenario.color || '#6B7280';

  return (
    <div
      className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden"
      style={{ borderLeftColor: borderColor, borderLeftWidth: '4px' }}
      data-testid={`scenario-card-${scenario.id}`}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isBaseline && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-dark-text-secondary">
                  <Target className="w-3 h-3 mr-1" />
                  {t('scenarios.baseline')}
                </span>
              )}
              <h4 className="font-medium text-gray-900 dark:text-dark-text">
                {isBaseline ? t('scenarios.currentSituation') : scenario.name}
              </h4>
            </div>
            {scenario.description && !isBaseline && (
              <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">
                {scenario.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Pension amount */}
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-dark-text">
                {formatCurrency(scenario.monthlyPension)}
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                {t('scenarios.perMonth')}
              </div>
            </div>

            {/* Difference badge */}
            {comparison && !isBaseline && (
              <div className="ml-2">
                {renderDifference(comparison.monthlyPensionDiff, 'currency')}
              </div>
            )}

            {/* Expand/Collapse */}
            <button
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={isExpanded ? t('common.collapse') : t('common.expand')}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        {!isExpanded && comparison && !isBaseline && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-dark-text-muted">
                {t('scenarios.percentChange')}:{' '}
              </span>
              {renderDifference(comparison.monthlyPensionDiffPercent, 'percent')}
            </div>
            <div className="text-sm">
              <span className="text-gray-500 dark:text-dark-text-muted">
                {t('scenarios.pointsDiff')}:{' '}
              </span>
              {renderDifference(comparison.totalPointsDiff, 'points')}
            </div>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Modifications list */}
          {!isBaseline && scenario.modifications.length > 0 && (
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                {t('scenarios.modifications.title')}
              </h5>
              <ul className="space-y-1">
                {scenario.modifications.map((mod, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 dark:text-dark-text-secondary flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {mod.type === 'salaryChange' && (
                      <span>
                        {t('scenarios.modifications.salaryChange', {
                          percent: `${(mod.salaryChangePercent || 0) >= 0 ? '+' : ''}${mod.salaryChangePercent}`,
                        })}
                      </span>
                    )}
                    {mod.type === 'additionalYears' && (
                      <span>
                        {t('scenarios.modifications.additionalYears', {
                          years: mod.additionalYears,
                        })}
                      </span>
                    )}
                    {mod.type === 'workingConditionChange' && (
                      <span>
                        {t('scenarios.modifications.workingConditionChange', {
                          condition: t(`pension.contributionPeriods.workingCondition.${mod.newWorkingCondition}`),
                        })}
                      </span>
                    )}
                    {mod.type === 'retirementAgeChange' && (
                      <span>
                        {t('scenarios.modifications.retirementAgeChange', {
                          age: mod.targetRetirementAge,
                        })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed comparison */}
          {comparison && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  {t('scenarios.pensionDetails')}
                </h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-text-muted">
                      {t('pension.stats.pensionEstimate.monthlyPension')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-dark-text">
                      {formatCurrency(scenario.monthlyPension)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-text-muted">
                      {t('pension.stats.pensionEstimate.yearlyPension')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-dark-text">
                      {formatCurrency(scenario.yearlyPension)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  {t('pension.stats.pointsBreakdown.title')}
                </h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-text-muted">
                      {t('pension.stats.pointsBreakdown.totalPoints')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-dark-text">
                      {formatPoints(scenario.results.totalPoints)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-text-muted">
                      {t('pension.stats.pointsBreakdown.contribution')}
                    </span>
                    <span className="text-gray-600 dark:text-dark-text-secondary">
                      {formatPoints(scenario.results.contributionPoints)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-text-muted">
                      {t('pension.stats.pointsBreakdown.stability')}
                    </span>
                    <span className="text-gray-600 dark:text-dark-text-secondary">
                      {formatPoints(scenario.results.stabilityPoints)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Difference summary */}
          {comparison && !isBaseline && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <h5 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                {t('scenarios.comparedToBaseline')}
              </h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-300">
                    {t('scenarios.monthlyDiff')}
                  </span>
                  {renderDifference(comparison.monthlyPensionDiff, 'currency')}
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-300">
                    {t('scenarios.yearlyDiff')}
                  </span>
                  {renderDifference(comparison.yearlyPensionDiff, 'currency')}
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-300">
                    {t('scenarios.totalPointsDiff')}
                  </span>
                  {renderDifference(comparison.totalPointsDiff, 'points')}
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-300">
                    {t('scenarios.percentChange')}
                  </span>
                  {renderDifference(comparison.monthlyPensionDiffPercent, 'percent')}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isBaseline && (onEdit || onDelete) && (
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(scenario);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t('common.edit')}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(scenario.id);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('common.delete')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenarioCard;
