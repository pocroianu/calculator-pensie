import React, { useState, useMemo } from 'react';
import { Shield, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContributionPeriod, SpecialRetirementAnalysis } from '../types/pensionTypes';
import { calculateSpecialRetirementEligibility, RETIREMENT_AGE } from '../utils/pensionCalculations';
import { formatYears } from '../utils/formatters';

interface Props {
  contributionPeriods: ContributionPeriod[];
  birthDate: string;
  totalContributiveYears: number;
}

const SpecialRetirementEligibility: React.FC<Props> = ({
  contributionPeriods,
  birthDate,
  totalContributiveYears
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate special retirement eligibility
  const analysis: SpecialRetirementAnalysis = useMemo(() => {
    return calculateSpecialRetirementEligibility(contributionPeriods, birthDate, totalContributiveYears);
  }, [contributionPeriods, birthDate, totalContributiveYears]);

  // Filter to only show categories with some years worked
  const relevantCategories = analysis.eligibilities.filter(e => e.yearsInSpecialConditions > 0);

  // Don't render if no special condition periods
  if (!analysis.hasSpecialConditionPeriods || relevantCategories.length === 0) {
    return null;
  }

  const hasEligibleCategories = relevantCategories.some(e => e.meetsMinimumYearsRequirement);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-testid="special-retirement-eligibility">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <h3 className="font-medium text-gray-900">
              {t('pension.specialRetirement.title')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {analysis.earliestSpecialRetirementAge !== null ? (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {t('pension.specialRetirement.earliestAge', { age: analysis.earliestSpecialRetirementAge })}
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {t('pension.specialRetirement.standardAge')}
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-800">
                <p className="font-medium">{t('pension.specialRetirement.infoTitle')}</p>
                <p className="mt-1">
                  {t('pension.specialRetirement.infoDescription')}
                </p>
              </div>
            </div>
          </div>

          {/* Standard Retirement Reference */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  {t('pension.specialRetirement.standardRetirement')}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  {t('pension.specialRetirement.withoutSpecialConditions')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700">
                  {RETIREMENT_AGE} {t('common.years')}
                </p>
              </div>
            </div>
          </div>

          {/* Special Conditions Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              {t('pension.specialRetirement.yourCategories')}
            </h4>

            {relevantCategories.map((eligibility, index) => {
              const { category, yearsInSpecialConditions, meetsMinimumYearsRequirement, eligibleRetirementAge, yearsUntilEligibility, isCurrentlyEligible, meetsMinimumContribution } = eligibility;

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    meetsMinimumYearsRequirement
                      ? 'border-green-200 bg-green-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {meetsMinimumYearsRequirement ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {t(`pension.specialRetirement.categories.${category.workingCondition}.name`)}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {t(`pension.specialRetirement.categories.${category.workingCondition}.description`)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-lg font-bold text-gray-900">
                        {eligibleRetirementAge} {t('common.years')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('pension.specialRetirement.retirementAge')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t('pension.specialRetirement.yearsWorked')}:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatYears(yearsInSpecialConditions)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('pension.specialRetirement.yearsRequired')}:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {category.minimumSpecialWorkYears} {t('common.years')}
                      </span>
                    </div>
                  </div>

                  {/* Status Messages */}
                  <div className="mt-3 text-sm">
                    {isCurrentlyEligible ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <Award className="w-4 h-4" />
                        <span>{t('pension.specialRetirement.currentlyEligible')}</span>
                      </div>
                    ) : yearsUntilEligibility > 0 ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {t('pension.specialRetirement.yearsUntilEligible', { years: yearsUntilEligibility })}
                        </span>
                      </div>
                    ) : null}

                    {!meetsMinimumContribution && (
                      <div className="flex items-center gap-2 text-yellow-700 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{t('pension.specialRetirement.needsMinimumContribution')}</span>
                      </div>
                    )}

                    {!meetsMinimumYearsRequirement && yearsInSpecialConditions > 0 && (
                      <div className="flex items-center gap-2 text-yellow-700 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          {t('pension.specialRetirement.needsMoreYearsInCondition', {
                            needed: Math.ceil(category.minimumSpecialWorkYears - yearsInSpecialConditions)
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t('pension.specialRetirement.progressToMinimum')}</span>
                      <span>{Math.min(100, Math.round((yearsInSpecialConditions / category.minimumSpecialWorkYears) * 100))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          meetsMinimumYearsRequirement ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (yearsInSpecialConditions / category.minimumSpecialWorkYears) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {analysis.earliestSpecialRetirementAge !== null && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">{t('pension.specialRetirement.bestOption')}</span>
                </div>
                <p className="text-sm text-purple-100">
                  {t('pension.specialRetirement.bestOptionDetails', {
                    age: analysis.earliestSpecialRetirementAge,
                    reduction: RETIREMENT_AGE - analysis.earliestSpecialRetirementAge
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 italic">
              {t('pension.specialRetirement.disclaimer')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialRetirementEligibility;
