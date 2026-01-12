import React from 'react';
import { CalendarDays, Plus, Clock, Info } from 'lucide-react';
import { PensionInputs, ContributionPeriod as ContributionPeriodType } from '../types/pensionTypes';
import ContributionPeriod from './ContributionPeriod';
import Tooltip from './Tooltip';
import { RETIREMENT_AGE } from '../utils/pensionCalculations';
import { t } from 'i18next';

interface InputFormProps {
  inputs: PensionInputs;
  onChange: (field: keyof PensionInputs, value: any) => void;
}

const InputForm: React.FC<InputFormProps> = ({ 
  inputs, 
  onChange 
}) => {
  const handleAddPeriod = () => {
    const newPeriod: ContributionPeriodType = {
      fromDate: '',
      toDate: '',
      company: '',
      monthlyGrossSalary: 0,
      workingCondition: 'normal'
    };
    
    onChange('contributionPeriods', [...(inputs.contributionPeriods || []), newPeriod]);
  };

  const handleUpdatePeriod = (index: number, updatedPeriod: ContributionPeriodType) => {
    const newPeriods = [...(inputs.contributionPeriods || [])];
    newPeriods[index] = updatedPeriod;
    onChange('contributionPeriods', newPeriods);
  };

  const handleRemovePeriod = (index: number) => {
    const newPeriods = (inputs.contributionPeriods || []).filter((_, i) => i !== index);
    onChange('contributionPeriods', newPeriods);
  };

  // Calculate suggested retirement year based on birth date
  const calculateSuggestedRetirementYear = () => {
    if (!inputs.birthDate) return null;
    const birthYear = new Date(inputs.birthDate).getFullYear();
    return birthYear + RETIREMENT_AGE;
  };

  const suggestedRetirementYear = calculateSuggestedRetirementYear();

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <h2 className="font-medium text-gray-900">{t('pension.personalInfo.title')}</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Birth Date */}
          <div>
            <label htmlFor="birthDate" className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
              Birth Date
              <Tooltip content="Your date of birth is used to calculate retirement eligibility and pension points" />
            </label>
            <input
              id="birthDate"
              type="date"
              title="birthday"
              value={inputs.birthDate}
              onChange={(e) => onChange('birthDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Retirement Year */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
              Planned Retirement Year
              <Tooltip content={`Standard retirement age is ${RETIREMENT_AGE} years. The suggested retirement year based on your birth date is ${suggestedRetirementYear || 'not available'}`} />
            </label>
            <div className="relative">
              <input
                type="number"
                value={inputs.retirementYear}
                onChange={(e) => onChange('retirementYear', Number(e.target.value))}
                min={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {suggestedRetirementYear && inputs.retirementYear !== suggestedRetirementYear && (
                <button
                  onClick={() => onChange('retirementYear', suggestedRetirementYear)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                >
                  Use {suggestedRetirementYear}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Periods Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h2 className="font-medium text-gray-900">Contribution Periods</h2>
            </div>
            <button
              onClick={handleAddPeriod}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Period
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {(inputs.contributionPeriods || []).map((period, index) => (
              <ContributionPeriod
                key={index}
                index={index}
                period={period}
                onUpdate={(updatedPeriod: ContributionPeriodType) => handleUpdatePeriod(index, updatedPeriod)}
                onRemove={() => handleRemovePeriod(index)}
              />
            ))}

            {(!inputs.contributionPeriods || inputs.contributionPeriods.length === 0) && (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                  <Info className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No Contribution Periods</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add your employment and non-contributive periods to calculate your pension.
                </p>
                <button
                  onClick={handleAddPeriod}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Period
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputForm;