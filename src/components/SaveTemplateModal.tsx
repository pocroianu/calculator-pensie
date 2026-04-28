/**
 * Save Template Modal Component
 *
 * Modal dialog for saving a new custom period template.
 * Allows users to specify template name, description, and configure period settings.
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Briefcase, GraduationCap, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CreateTemplateInput } from '../types/periodTemplates';
import { WorkingCondition, NonContributivePeriodType } from '../types/pensionTypes';
import { usePeriodTemplates } from '../hooks/usePeriodTemplates';
import { useToast } from '../contexts/ToastContext';
import { useHapticFeedback } from '../hooks/useTouchGestures';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { lightTap, success: successVibrate } = useHapticFeedback();
  const { createTemplate } = usePeriodTemplates();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<'employment' | 'nonContributive'>('employment');
  const [company, setCompany] = useState('');
  const [monthlyGrossSalary, setMonthlyGrossSalary] = useState<number>(0);
  const [workingCondition, setWorkingCondition] = useState<WorkingCondition>('normal');
  const [nonContributiveType, setNonContributiveType] = useState<NonContributivePeriodType>('university');

  // Validation
  const [nameError, setNameError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setTemplateType('employment');
      setCompany('');
      setMonthlyGrossSalary(0);
      setWorkingCondition('normal');
      setNonContributiveType('university');
      setNameError('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Validate form
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setNameError(t('periodTemplates.validation.nameRequired'));
      return false;
    }
    if (name.trim().length < 2) {
      setNameError(t('periodTemplates.validation.nameTooShort'));
      return false;
    }
    if (name.trim().length > 50) {
      setNameError(t('periodTemplates.validation.nameTooLong'));
      return false;
    }
    setNameError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lightTap();

    if (!validateForm()) {
      return;
    }

    const input: CreateTemplateInput = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    if (templateType === 'employment') {
      input.company = company.trim() || undefined;
      input.monthlyGrossSalary = monthlyGrossSalary || undefined;
      input.workingCondition = workingCondition;
    } else {
      input.nonContributiveType = nonContributiveType;
    }

    createTemplate(input);
    successVibrate();
    showToast('success', 'periodTemplates.toast.templateSaved');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" data-testid="save-template-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('periodTemplates.saveCustomTemplate')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('periodTemplates.form.name')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError('');
                }}
                placeholder={t('periodTemplates.form.namePlaceholder')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  nameError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                data-testid="template-name-input"
                autoFocus
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Template Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('periodTemplates.form.description')}
                <span className="text-gray-400 ml-1">({t('common.optional')})</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('periodTemplates.form.descriptionPlaceholder')}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                data-testid="template-description-input"
              />
            </div>

            {/* Template Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('periodTemplates.form.type')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateType('employment')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    templateType === 'employment'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="type-employment-button"
                >
                  <Briefcase className="w-4 h-4" />
                  {t('periodTemplates.categories.employment')}
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateType('nonContributive')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    templateType === 'nonContributive'
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="type-noncontributive-button"
                >
                  <GraduationCap className="w-4 h-4" />
                  {t('periodTemplates.categories.nonContributive')}
                </button>
              </div>
            </div>

            {/* Employment-specific fields */}
            {templateType === 'employment' && (
              <>
                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('pension.contributionPeriods.company')}
                    <span className="text-gray-400 ml-1">({t('common.optional')})</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="template-company-input"
                  />
                </div>

                {/* Monthly Gross Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('pension.contributionPeriods.monthlyGrossSalary')}
                    <span className="text-gray-400 ml-1">({t('common.optional')})</span>
                  </label>
                  <input
                    type="number"
                    value={monthlyGrossSalary || ''}
                    onChange={(e) => setMonthlyGrossSalary(Number(e.target.value))}
                    min={0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="template-salary-input"
                  />
                </div>

                {/* Working Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('pension.contributionPeriods.workingCondition.label')}
                  </label>
                  <select
                    value={workingCondition}
                    onChange={(e) => setWorkingCondition(e.target.value as WorkingCondition)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="template-condition-select"
                  >
                    <option value="normal">
                      {t('pension.contributionPeriods.workingCondition.normal')}
                    </option>
                    <option value="groupII">
                      {t('pension.contributionPeriods.workingCondition.groupII')}
                    </option>
                    <option value="groupI">
                      {t('pension.contributionPeriods.workingCondition.groupI')}
                    </option>
                    <option value="specialConditions">
                      {t('pension.contributionPeriods.workingCondition.specialConditions')}
                    </option>
                  </select>
                </div>
              </>
            )}

            {/* Non-contributive-specific fields */}
            {templateType === 'nonContributive' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('pension.contributionPeriods.nonContributivePeriod.label')}
                </label>
                <select
                  value={nonContributiveType}
                  onChange={(e) =>
                    setNonContributiveType(e.target.value as NonContributivePeriodType)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  data-testid="template-noncontributive-select"
                >
                  <option value="university">
                    {t('pension.contributionPeriods.nonContributivePeriod.university')}
                  </option>
                  <option value="military">
                    {t('pension.contributionPeriods.nonContributivePeriod.military')}
                  </option>
                  <option value="childCare">
                    {t('pension.contributionPeriods.nonContributivePeriod.childCare')}
                  </option>
                  <option value="medical">
                    {t('pension.contributionPeriods.nonContributivePeriod.medical')}
                  </option>
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                data-testid="save-template-submit"
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SaveTemplateModal;
