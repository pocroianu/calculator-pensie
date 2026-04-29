/**
 * What-If Scenario Panel Component
 *
 * Main panel for creating, managing, and comparing what-if scenarios.
 * Allows users to explore different assumptions about their pension.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Layers,
  ChevronDown,
  ChevronUp,
  Table,
  LayoutList,
  Trash2,
  Lightbulb,
  AlertCircle,
  X,
} from 'lucide-react';
import { useScenarios, UseScenariosProps } from '../hooks/useScenarios';
import { ScenarioModification, WorkingCondition, SCENARIO_CONFIG } from '../types/pensionTypes';
import ScenarioCard from './ScenarioCard';
import ScenarioComparisonTable from './ScenarioComparisonTable';

interface WhatIfScenarioPanelProps extends UseScenariosProps {
  /** Additional class name */
  className?: string;
}

type ViewMode = 'cards' | 'table';

const WhatIfScenarioPanel: React.FC<WhatIfScenarioPanelProps> = ({
  currentInputs,
  pensionDetails,
  monthlyPension,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Form state for creating new scenario
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDescription, setNewScenarioDescription] = useState('');
  const [selectedModType, setSelectedModType] = useState<ScenarioModification['type']>('salaryChange');
  const [salaryChangePercent, setSalaryChangePercent] = useState(10);
  const [additionalYears, setAdditionalYears] = useState(2);
  const [newWorkingCondition, setNewWorkingCondition] = useState<WorkingCondition>('groupII');
  const [targetRetirementAge, setTargetRetirementAge] = useState(65);
  const [modifications, setModifications] = useState<ScenarioModification[]>([]);

  const {
    scenarios,
    scenarioCount,
    isAtCapacity,
    baseline,
    createNewScenario,
    createFromTemplate,
    deleteScenario,
    compareToBaseline,
    compareAllToBaseline,
    clearAllScenarios,
    templates,
  } = useScenarios({
    currentInputs,
    pensionDetails,
    monthlyPension,
  });

  // Get all comparisons for table view
  const allComparisons = useMemo(() => compareAllToBaseline(), [compareAllToBaseline]);

  // Can we create scenarios?
  const canCreateScenario = monthlyPension > 0 && currentInputs.contributionPeriods?.length > 0;

  // Add a modification to the list
  const addModification = () => {
    const mod: ScenarioModification = { type: selectedModType };

    switch (selectedModType) {
      case 'salaryChange':
        mod.salaryChangePercent = salaryChangePercent;
        break;
      case 'additionalYears':
        mod.additionalYears = additionalYears;
        break;
      case 'workingConditionChange':
        mod.newWorkingCondition = newWorkingCondition;
        break;
      case 'retirementAgeChange':
        mod.targetRetirementAge = targetRetirementAge;
        break;
    }

    setModifications([...modifications, mod]);
  };

  // Remove a modification from the list
  const removeModification = (index: number) => {
    setModifications(modifications.filter((_, i) => i !== index));
  };

  // Create the scenario
  const handleCreateScenario = () => {
    if (!newScenarioName.trim() || modifications.length === 0) return;

    const scenario = createNewScenario(
      newScenarioName.trim(),
      modifications,
      newScenarioDescription.trim() || undefined
    );

    if (scenario) {
      // Reset form
      setNewScenarioName('');
      setNewScenarioDescription('');
      setModifications([]);
      setShowCreateForm(false);
    }
  };

  // Create from template
  const handleCreateFromTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const scenario = createFromTemplate(templateId, t(template.nameKey));
    if (scenario) {
      setShowTemplates(false);
    }
  };

  // Render modification badge
  const renderModificationBadge = (mod: ScenarioModification, index: number) => {
    let label = '';
    switch (mod.type) {
      case 'salaryChange':
        label = `${(mod.salaryChangePercent || 0) >= 0 ? '+' : ''}${mod.salaryChangePercent}% ${t('scenarios.salary')}`;
        break;
      case 'additionalYears':
        label = `+${mod.additionalYears} ${t('common.years')}`;
        break;
      case 'workingConditionChange':
        label = t(`pension.contributionPeriods.workingCondition.${mod.newWorkingCondition}Short`);
        break;
      case 'retirementAgeChange':
        label = `${t('scenarios.retireAt')} ${mod.targetRetirementAge}`;
        break;
    }

    return (
      <span
        key={index}
        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
      >
        {label}
        <button
          onClick={() => removeModification(index)}
          className="hover:text-blue-900 dark:hover:text-blue-100"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  };

  // User scenarios (excluding baseline)
  const userScenarios = scenarios.filter(s => !s.isBaseline);

  return (
    <div
      className={`bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden ${className}`}
      data-testid="what-if-scenario-panel"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <h3 className="font-medium text-gray-900 dark:text-dark-text">
              {t('scenarios.title')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {scenarioCount > 0 && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full">
                {t('scenarios.count', { count: scenarioCount })}
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
          {/* Introduction for new users */}
          {scenarioCount === 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex gap-3">
                <Lightbulb className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-800 dark:text-purple-300">
                    {t('scenarios.intro.title')}
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                    {t('scenarios.intro.description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cannot create warning */}
          {!canCreateScenario && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t('scenarios.needContributions')}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {canCreateScenario && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={isAtCapacity}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {t('scenarios.createNew')}
              </button>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={isAtCapacity}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                {t('scenarios.quickScenarios')}
              </button>

              {/* View mode toggle */}
              {scenarioCount > 0 && (
                <div className="ml-auto flex items-center gap-1 bg-gray-100 dark:bg-dark-bg-tertiary rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-dark-bg-secondary shadow-sm text-gray-900 dark:text-dark-text'
                        : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text'
                    }`}
                    title={t('scenarios.viewCards')}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-dark-bg-secondary shadow-sm text-gray-900 dark:text-dark-text'
                        : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text'
                    }`}
                    title={t('scenarios.viewTable')}
                  >
                    <Table className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Capacity warning */}
          {isAtCapacity && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>{t('scenarios.atCapacity', { max: SCENARIO_CONFIG.MAX_SCENARIOS })}</span>
            </div>
          )}

          {/* Quick scenarios (templates) */}
          {showTemplates && (
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-dark-text text-sm">
                {t('scenarios.templates.title')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateFromTemplate(template.id)}
                    className="text-left p-3 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all"
                  >
                    <div className="font-medium text-gray-900 dark:text-dark-text text-sm">
                      {t(template.nameKey)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
                      {t(template.descriptionKey)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create new scenario form */}
          {showCreateForm && (
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-dark-text text-sm">
                {t('scenarios.createForm.title')}
              </h4>

              {/* Name input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  {t('scenarios.createForm.name')} *
                </label>
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder={t('scenarios.createForm.namePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Description input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  {t('scenarios.createForm.description')}
                  <span className="text-gray-400 ml-1">({t('common.optional')})</span>
                </label>
                <input
                  type="text"
                  value={newScenarioDescription}
                  onChange={(e) => setNewScenarioDescription(e.target.value)}
                  placeholder={t('scenarios.createForm.descriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Modifications section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                  {t('scenarios.createForm.modifications')}
                </label>

                {/* Current modifications */}
                {modifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {modifications.map((mod, index) => renderModificationBadge(mod, index))}
                  </div>
                )}

                {/* Add modification form */}
                <div className="flex flex-wrap items-end gap-2 p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-gray-500 dark:text-dark-text-muted mb-1">
                      {t('scenarios.createForm.modificationType')}
                    </label>
                    <select
                      value={selectedModType}
                      onChange={(e) => setSelectedModType(e.target.value as ScenarioModification['type'])}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text text-sm"
                    >
                      <option value="salaryChange">{t('scenarios.modTypes.salaryChange')}</option>
                      <option value="additionalYears">{t('scenarios.modTypes.additionalYears')}</option>
                      <option value="workingConditionChange">{t('scenarios.modTypes.workingConditionChange')}</option>
                      <option value="retirementAgeChange">{t('scenarios.modTypes.retirementAgeChange')}</option>
                    </select>
                  </div>

                  {/* Dynamic input based on modification type */}
                  {selectedModType === 'salaryChange' && (
                    <div className="w-32">
                      <label className="block text-xs text-gray-500 dark:text-dark-text-muted mb-1">
                        {t('scenarios.createForm.percentChange')}
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={salaryChangePercent}
                          onChange={(e) => setSalaryChangePercent(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text text-sm"
                        />
                        <span className="ml-1 text-gray-500">%</span>
                      </div>
                    </div>
                  )}

                  {selectedModType === 'additionalYears' && (
                    <div className="w-32">
                      <label className="block text-xs text-gray-500 dark:text-dark-text-muted mb-1">
                        {t('scenarios.createForm.yearsToAdd')}
                      </label>
                      <input
                        type="number"
                        value={additionalYears}
                        onChange={(e) => setAdditionalYears(parseInt(e.target.value) || 0)}
                        min={1}
                        max={20}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text text-sm"
                      />
                    </div>
                  )}

                  {selectedModType === 'workingConditionChange' && (
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs text-gray-500 dark:text-dark-text-muted mb-1">
                        {t('scenarios.createForm.newCondition')}
                      </label>
                      <select
                        value={newWorkingCondition}
                        onChange={(e) => setNewWorkingCondition(e.target.value as WorkingCondition)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text text-sm"
                      >
                        <option value="normal">{t('pension.contributionPeriods.workingCondition.normal')}</option>
                        <option value="groupII">{t('pension.contributionPeriods.workingCondition.groupII')}</option>
                        <option value="groupI">{t('pension.contributionPeriods.workingCondition.groupI')}</option>
                        <option value="specialConditions">{t('pension.contributionPeriods.workingCondition.specialConditions')}</option>
                      </select>
                    </div>
                  )}

                  {selectedModType === 'retirementAgeChange' && (
                    <div className="w-32">
                      <label className="block text-xs text-gray-500 dark:text-dark-text-muted mb-1">
                        {t('scenarios.createForm.targetAge')}
                      </label>
                      <input
                        type="number"
                        value={targetRetirementAge}
                        onChange={(e) => setTargetRetirementAge(parseInt(e.target.value) || 65)}
                        min={55}
                        max={70}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text text-sm"
                      />
                    </div>
                  )}

                  <button
                    onClick={addModification}
                    className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Create button */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewScenarioName('');
                    setNewScenarioDescription('');
                    setModifications([]);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text transition-colors text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateScenario}
                  disabled={!newScenarioName.trim() || modifications.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {t('scenarios.createScenario')}
                </button>
              </div>
            </div>
          )}

          {/* Scenarios display */}
          {baseline && scenarioCount > 0 && (
            <>
              {viewMode === 'cards' ? (
                <div className="space-y-3">
                  {/* Baseline card */}
                  <ScenarioCard
                    scenario={baseline}
                    comparison={null}
                    isBaseline
                  />

                  {/* User scenario cards */}
                  {userScenarios.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      comparison={compareToBaseline(scenario.id)}
                      onDelete={deleteScenario}
                    />
                  ))}
                </div>
              ) : (
                <ScenarioComparisonTable
                  baseline={baseline}
                  scenarios={userScenarios}
                  comparisons={allComparisons}
                />
              )}

              {/* Clear all button */}
              {scenarioCount > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                  <button
                    onClick={clearAllScenarios}
                    className="inline-flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('scenarios.clearAll')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty state with baseline only */}
          {baseline && scenarioCount === 0 && !showCreateForm && !showTemplates && (
            <div className="space-y-3">
              <ScenarioCard
                scenario={baseline}
                comparison={null}
                isBaseline
              />
              <p className="text-sm text-gray-500 dark:text-dark-text-muted text-center py-4">
                {t('scenarios.noScenarios')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatIfScenarioPanel;
