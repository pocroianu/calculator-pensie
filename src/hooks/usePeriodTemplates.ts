/**
 * usePeriodTemplates Hook
 *
 * Custom hook for managing period templates with React state.
 * Provides CRUD operations and syncs with localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  PeriodTemplate,
  PeriodTemplateLibrary,
  CreateTemplateInput,
  TemplateCategory,
} from '../types/periodTemplates';
import {
  getPeriodTemplates,
  addCustomTemplate,
  deleteCustomTemplate,
  updateCustomTemplate,
  resetToDefaults,
  DEFAULT_TEMPLATE_LIBRARY,
} from '../config/periodTemplatesConfig';
import { ContributionPeriod } from '../types/pensionTypes';

export interface UsePeriodTemplatesReturn {
  // State
  library: PeriodTemplateLibrary;
  isLoading: boolean;
  error: string | null;

  // Getters
  getAllTemplates: () => PeriodTemplate[];
  getTemplatesByCategory: (category: TemplateCategory) => PeriodTemplate[];
  getBuiltInTemplates: () => PeriodTemplate[];
  getCustomTemplates: () => PeriodTemplate[];

  // Actions
  createTemplate: (input: CreateTemplateInput) => void;
  updateTemplate: (templateId: string, input: Partial<CreateTemplateInput>) => void;
  deleteTemplate: (templateId: string) => void;
  resetTemplates: () => void;

  // Template application
  applyTemplate: (template: PeriodTemplate) => ContributionPeriod;

  // Save from existing period
  saveAsTemplate: (period: ContributionPeriod, name: string, description?: string) => void;
}

export function usePeriodTemplates(): UsePeriodTemplatesReturn {
  const [library, setLibrary] = useState<PeriodTemplateLibrary>(DEFAULT_TEMPLATE_LIBRARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    try {
      const loadedLibrary = getPeriodTemplates();
      setLibrary(loadedLibrary);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get all templates (built-in + custom)
  const getAllTemplates = useCallback((): PeriodTemplate[] => {
    return [...library.builtInTemplates, ...library.customTemplates];
  }, [library]);

  // Get templates by category
  const getTemplatesByCategory = useCallback(
    (category: TemplateCategory): PeriodTemplate[] => {
      return getAllTemplates().filter((t) => t.category === category);
    },
    [getAllTemplates]
  );

  // Get built-in templates only
  const getBuiltInTemplates = useCallback((): PeriodTemplate[] => {
    return library.builtInTemplates;
  }, [library]);

  // Get custom templates only
  const getCustomTemplates = useCallback((): PeriodTemplate[] => {
    return library.customTemplates;
  }, [library]);

  // Create a new custom template
  const createTemplate = useCallback((input: CreateTemplateInput): void => {
    try {
      const updatedLibrary = addCustomTemplate(input);
      setLibrary(updatedLibrary);
      setError(null);
    } catch (err) {
      setError('Failed to create template');
      console.error('Error creating template:', err);
    }
  }, []);

  // Update an existing custom template
  const updateTemplate = useCallback(
    (templateId: string, input: Partial<CreateTemplateInput>): void => {
      try {
        const updatedLibrary = updateCustomTemplate(templateId, input);
        setLibrary(updatedLibrary);
        setError(null);
      } catch (err) {
        setError('Failed to update template');
        console.error('Error updating template:', err);
      }
    },
    []
  );

  // Delete a custom template
  const deleteTemplate = useCallback((templateId: string): void => {
    try {
      const updatedLibrary = deleteCustomTemplate(templateId);
      setLibrary(updatedLibrary);
      setError(null);
    } catch (err) {
      setError('Failed to delete template');
      console.error('Error deleting template:', err);
    }
  }, []);

  // Reset to defaults
  const resetTemplates = useCallback((): void => {
    try {
      const defaultLibrary = resetToDefaults();
      setLibrary(defaultLibrary);
      setError(null);
    } catch (err) {
      setError('Failed to reset templates');
      console.error('Error resetting templates:', err);
    }
  }, []);

  // Apply a template to create a new ContributionPeriod
  const applyTemplate = useCallback((template: PeriodTemplate): ContributionPeriod => {
    const period: ContributionPeriod = {
      fromDate: '',
      toDate: '',
    };

    // Apply template values
    if (template.nonContributiveType) {
      period.nonContributiveType = template.nonContributiveType;
    } else {
      period.company = template.company || '';
      period.monthlyGrossSalary = template.monthlyGrossSalary || 0;
      period.workingCondition = template.workingCondition || 'normal';
    }

    return period;
  }, []);

  // Save an existing period as a template
  const saveAsTemplate = useCallback(
    (period: ContributionPeriod, name: string, description?: string): void => {
      const input: CreateTemplateInput = {
        name,
        description,
        company: period.company,
        monthlyGrossSalary: period.monthlyGrossSalary,
        workingCondition: period.workingCondition,
        nonContributiveType: period.nonContributiveType,
      };

      createTemplate(input);
    },
    [createTemplate]
  );

  return {
    library,
    isLoading,
    error,
    getAllTemplates,
    getTemplatesByCategory,
    getBuiltInTemplates,
    getCustomTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    resetTemplates,
    applyTemplate,
    saveAsTemplate,
  };
}

export default usePeriodTemplates;
