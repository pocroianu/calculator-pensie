import React from 'react';
import { X } from 'lucide-react';
import { ContributionPeriod as ContributionPeriodType, WorkingCondition, NonContributivePeriodType } from '../types/pensionTypes';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  period: ContributionPeriodType;
  index: number;
  onUpdate: (updatedPeriod: ContributionPeriodType) => void;
  onRemove: () => void;
}

const ContributionPeriod: React.FC<Props> = ({
  period,
  index,
  onUpdate,
  onRemove,
}) => {
  const { t } = useTranslation();

  const handleChange = (field: keyof ContributionPeriodType, value: any) => {
    if (field === 'nonContributiveType') {
      // Reset salary and working condition when switching to non-contributive
      if (value) {
        onUpdate({
          ...period,
          [field]: value,
          monthlyGrossSalary: 0,
          workingCondition: 'normal'
        });
      } else {
        onUpdate({
          ...period,
          [field]: value
        });
      }
    } else {
      onUpdate({ ...period, [field]: value });
    }
  };

  const cardStyle = useMemo(() => {
    if (period.nonContributiveType) {
      return 'bg-orange-50 border-orange-200';
    }
    return 'bg-white border-gray-200';
  }, [period.nonContributiveType]);

  return (
    <div className={`${cardStyle} rounded-xl shadow-lg p-4 space-y-4 transition-colors duration-200`}>
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-medium text-gray-700">
          {period.nonContributiveType ? t('pension.contributionPeriods.nonContributivePeriod.label') : t('pension.contributionPeriods.employmentPeriod')} {index + 1}
        </h4>
        <button
          onClick={onRemove}
          aria-label="Remove period"
          className="text-red-600 hover:text-red-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Non-contributive Period Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('pension.contributionPeriods.nonContributivePeriod.label')}
        </label>
        <select
          value={period.nonContributiveType || ''}
          onChange={(e) => handleChange('nonContributiveType', e.target.value as NonContributivePeriodType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{t('common.none')}</option>
          <option value="military">{t('pension.contributionPeriods.nonContributivePeriod.military')}</option>
          <option value="university">{t('pension.contributionPeriods.nonContributivePeriod.university')}</option>
          <option value="childCare">{t('pension.contributionPeriods.nonContributivePeriod.childCare')}</option>
          <option value="medical">{t('pension.contributionPeriods.nonContributivePeriod.medical')}</option>
        </select>
      </div>

      {!period.nonContributiveType && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('pension.contributionPeriods.company')}
            </label>
            <input
              type="text"
              value={period.company || ''}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('pension.contributionPeriods.monthlyGrossSalary')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              value={period.monthlyGrossSalary || ''}
              onChange={(e) => handleChange('monthlyGrossSalary', Number(e.target.value))}
              min={0}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                !period.nonContributiveType && (!period.monthlyGrossSalary || period.monthlyGrossSalary <= 0)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {!period.nonContributiveType && (!period.monthlyGrossSalary || period.monthlyGrossSalary <= 0) && (
              <p className="mt-1 text-sm text-red-600">
                {t('pension.contributionPeriods.validation.monthlyGrossSalaryRequired')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('pension.contributionPeriods.workingCondition.label')}
            </label>
            <select
              value={period.workingCondition || 'normal'}
              onChange={(e) => handleChange('workingCondition', e.target.value as WorkingCondition)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="normal">{t('pension.contributionPeriods.workingCondition.normal')}</option>
              <option value="hard">{t('pension.contributionPeriods.workingCondition.hard')}</option>
              <option value="veryHard">{t('pension.contributionPeriods.workingCondition.veryHard')}</option>
            </select>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('pension.contributionPeriods.startDate')}
          </label>
          <input
            type="date"
            value={period.fromDate || ''}
            onChange={(e) => handleChange('fromDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('pension.contributionPeriods.endDate')}
          </label>
          <input
            type="date"
            value={period.toDate || ''}
            onChange={(e) => handleChange('toDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ContributionPeriod;