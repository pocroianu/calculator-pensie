import React, { useState, useMemo } from 'react';
import { Calendar, TrendingDown, AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EarlyRetirementAnalysis } from '../types/pensionTypes';
import { calculateEarlyRetirementScenarios } from '../utils/pensionCalculations';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface Props {
  monthlyPension: number;
  currentAge: number;
  totalContributiveYears: number;
}

const EarlyRetirementScenarios: React.FC<Props> = ({
  monthlyPension,
  currentAge,
  totalContributiveYears
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate early retirement scenarios
  const analysis: EarlyRetirementAnalysis = useMemo(() => {
    return calculateEarlyRetirementScenarios(monthlyPension, currentAge, totalContributiveYears);
  }, [monthlyPension, currentAge, totalContributiveYears]);

  // Don't render if no pension calculated yet
  if (monthlyPension <= 0) {
    return null;
  }

  const eligibleScenarios = analysis.scenarios.filter(s => s.isEligible);
  const hasEligibleScenarios = eligibleScenarios.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-testid="early-retirement-scenarios">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <h3 className="font-medium text-gray-900">
              {t('pension.earlyRetirement.title')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {hasEligibleScenarios ? (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {t('pension.earlyRetirement.scenariosAvailable', { count: eligibleScenarios.length })}
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {t('pension.earlyRetirement.notEligible')}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Info Banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">{t('pension.earlyRetirement.infoTitle')}</p>
                <p className="mt-1">
                  {t('pension.earlyRetirement.infoDescription', {
                    penalty: analysis.penaltyPerYearEarly,
                    minAge: analysis.minimumEarlyRetirementAge
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Eligibility Check */}
          {!analysis.canRetireEarly && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Clock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium">{t('pension.earlyRetirement.eligibilityRequired')}</p>
                  <p className="mt-1">
                    {t('pension.earlyRetirement.completeContributionRequired', {
                      required: 35,
                      current: Math.round(totalContributiveYears)
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Standard Retirement Reference */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  {t('pension.earlyRetirement.standardRetirement')}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  {t('pension.earlyRetirement.atAge', { age: analysis.standardRetirementAge })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(analysis.standardMonthlyPension)}
                </p>
                <p className="text-xs text-blue-500">
                  {t('pension.earlyRetirement.perMonth')}
                </p>
              </div>
            </div>
          </div>

          {/* Scenarios Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">
                    {t('pension.earlyRetirement.retireAt')}
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-gray-600">
                    {t('pension.earlyRetirement.yearsEarly')}
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-gray-600">
                    {t('pension.earlyRetirement.penalty')}
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">
                    {t('pension.earlyRetirement.monthlyPension')}
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">
                    {t('pension.earlyRetirement.monthlyLoss')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.scenarios.map((scenario) => (
                  <tr
                    key={scenario.yearsEarly}
                    className={`border-b border-gray-100 ${
                      scenario.isEligible ? '' : 'opacity-50'
                    }`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${scenario.isEligible ? 'text-gray-900' : 'text-gray-500'}`}>
                          {scenario.retirementAge} {t('common.years')}
                        </span>
                        {!scenario.isEligible && (
                          <span className="text-xs text-gray-400">
                            ({t(`pension.earlyRetirement.reasons.${scenario.eligibilityReason}`)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        -{scenario.yearsEarly}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-red-600 font-medium">
                        -{formatPercentage(scenario.penaltyPercentage)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {scenario.isEligible ? (
                        <span className="font-medium text-gray-900">
                          {formatCurrency(scenario.reducedMonthlyPension)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {scenario.isEligible ? (
                        <div className="flex items-center justify-end gap-1">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <span className="text-red-600 font-medium">
                            -{formatCurrency(scenario.monthlyPensionLoss)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary for eligible scenarios */}
          {hasEligibleScenarios && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('pension.earlyRetirement.earliestOption')}:</span>{' '}
                {t('pension.earlyRetirement.earliestOptionDetails', {
                  age: analysis.earliestRetirementAge,
                  pension: formatCurrency(eligibleScenarios[eligibleScenarios.length - 1]?.reducedMonthlyPension || 0),
                  penalty: eligibleScenarios[eligibleScenarios.length - 1]?.penaltyPercentage || 0
                })}
              </p>
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 italic">
              {t('pension.earlyRetirement.disclaimer')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarlyRetirementScenarios;
