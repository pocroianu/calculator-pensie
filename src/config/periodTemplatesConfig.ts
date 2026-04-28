/**
 * Period Templates Configuration
 *
 * This module provides configuration and storage management for period templates.
 * Similar to VPR config, it handles built-in and custom templates with localStorage persistence.
 */

import {
  PeriodTemplate,
  PeriodTemplateLibrary,
  CreateTemplateInput,
  BUILT_IN_TEMPLATE_IDS,
} from '../types/periodTemplates';

// Storage key for period templates
export const PERIOD_TEMPLATES_STORAGE_KEY = 'pension_calculator_period_templates';

/**
 * Default built-in templates for common period types
 */
export const DEFAULT_BUILT_IN_TEMPLATES: PeriodTemplate[] = [
  // Employment Templates
  {
    id: BUILT_IN_TEMPLATE_IDS.STANDARD_EMPLOYMENT,
    name: 'periodTemplates.templates.standardEmployment.name',
    description: 'periodTemplates.templates.standardEmployment.description',
    category: 'employment',
    isBuiltIn: true,
    workingCondition: 'normal',
    monthlyGrossSalary: 0, // User will set this
    createdAt: new Date().toISOString(),
  },
  {
    id: BUILT_IN_TEMPLATE_IDS.DIFFICULT_CONDITIONS,
    name: 'periodTemplates.templates.difficultConditions.name',
    description: 'periodTemplates.templates.difficultConditions.description',
    category: 'employment',
    isBuiltIn: true,
    workingCondition: 'groupII',
    monthlyGrossSalary: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: BUILT_IN_TEMPLATE_IDS.VERY_DIFFICULT_CONDITIONS,
    name: 'periodTemplates.templates.veryDifficultConditions.name',
    description: 'periodTemplates.templates.veryDifficultConditions.description',
    category: 'employment',
    isBuiltIn: true,
    workingCondition: 'groupI',
    monthlyGrossSalary: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: BUILT_IN_TEMPLATE_IDS.SPECIAL_CONDITIONS,
    name: 'periodTemplates.templates.specialConditions.name',
    description: 'periodTemplates.templates.specialConditions.description',
    category: 'employment',
    isBuiltIn: true,
    workingCondition: 'specialConditions',
    monthlyGrossSalary: 0,
    createdAt: new Date().toISOString(),
  },
  // Non-contributive Templates
  {
    id: BUILT_IN_TEMPLATE_IDS.UNIVERSITY,
    name: 'periodTemplates.templates.university.name',
    description: 'periodTemplates.templates.university.description',
    category: 'nonContributive',
    isBuiltIn: true,
    nonContributiveType: 'university',
    createdAt: new Date().toISOString(),
  },
  {
    id: BUILT_IN_TEMPLATE_IDS.MILITARY,
    name: 'periodTemplates.templates.military.name',
    description: 'periodTemplates.templates.military.description',
    category: 'nonContributive',
    isBuiltIn: true,
    nonContributiveType: 'military',
    createdAt: new Date().toISOString(),
  },
  {
    id: BUILT_IN_TEMPLATE_IDS.CHILD_CARE,
    name: 'periodTemplates.templates.childCare.name',
    description: 'periodTemplates.templates.childCare.description',
    category: 'nonContributive',
    isBuiltIn: true,
    nonContributiveType: 'childCare',
    createdAt: new Date().toISOString(),
  },
  {
    id: BUILT_IN_TEMPLATE_IDS.MEDICAL_LEAVE,
    name: 'periodTemplates.templates.medicalLeave.name',
    description: 'periodTemplates.templates.medicalLeave.description',
    category: 'nonContributive',
    isBuiltIn: true,
    nonContributiveType: 'medical',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Default template library configuration
 */
export const DEFAULT_TEMPLATE_LIBRARY: PeriodTemplateLibrary = {
  version: '1.0',
  lastUpdated: new Date().toISOString(),
  builtInTemplates: DEFAULT_BUILT_IN_TEMPLATES,
  customTemplates: [],
};

/**
 * Generate a unique ID for custom templates
 */
export function generateTemplateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get period templates from localStorage or return defaults
 */
export function getPeriodTemplates(): PeriodTemplateLibrary {
  try {
    const stored = localStorage.getItem(PERIOD_TEMPLATES_STORAGE_KEY);
    if (stored) {
      const library = JSON.parse(stored) as PeriodTemplateLibrary;
      // Ensure built-in templates are always up to date
      return {
        ...library,
        builtInTemplates: DEFAULT_BUILT_IN_TEMPLATES,
      };
    }
  } catch (error) {
    console.error('Error reading period templates from localStorage:', error);
  }
  return DEFAULT_TEMPLATE_LIBRARY;
}

/**
 * Save period templates to localStorage
 */
export function savePeriodTemplates(library: PeriodTemplateLibrary): void {
  try {
    const libraryToSave: PeriodTemplateLibrary = {
      ...library,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(PERIOD_TEMPLATES_STORAGE_KEY, JSON.stringify(libraryToSave));
  } catch (error) {
    console.error('Error saving period templates to localStorage:', error);
    throw new Error('Failed to save period templates');
  }
}

/**
 * Create a new custom template
 */
export function createCustomTemplate(input: CreateTemplateInput): PeriodTemplate {
  const now = new Date().toISOString();

  // Determine category based on whether it's a non-contributive period
  const category = input.nonContributiveType ? 'nonContributive' : 'custom';

  return {
    id: generateTemplateId(),
    name: input.name,
    description: input.description,
    category: category,
    isBuiltIn: false,
    company: input.company,
    monthlyGrossSalary: input.monthlyGrossSalary,
    workingCondition: input.workingCondition || 'normal',
    nonContributiveType: input.nonContributiveType,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Add a custom template to the library
 */
export function addCustomTemplate(input: CreateTemplateInput): PeriodTemplateLibrary {
  const library = getPeriodTemplates();
  const newTemplate = createCustomTemplate(input);

  const updatedLibrary: PeriodTemplateLibrary = {
    ...library,
    customTemplates: [...library.customTemplates, newTemplate],
  };

  savePeriodTemplates(updatedLibrary);
  return updatedLibrary;
}

/**
 * Update an existing custom template
 */
export function updateCustomTemplate(
  templateId: string,
  input: Partial<CreateTemplateInput>
): PeriodTemplateLibrary {
  const library = getPeriodTemplates();

  const updatedCustomTemplates = library.customTemplates.map((template) => {
    if (template.id === templateId) {
      return {
        ...template,
        ...input,
        updatedAt: new Date().toISOString(),
      };
    }
    return template;
  });

  const updatedLibrary: PeriodTemplateLibrary = {
    ...library,
    customTemplates: updatedCustomTemplates,
  };

  savePeriodTemplates(updatedLibrary);
  return updatedLibrary;
}

/**
 * Delete a custom template
 * Cannot delete built-in templates
 */
export function deleteCustomTemplate(templateId: string): PeriodTemplateLibrary {
  const library = getPeriodTemplates();

  // Verify it's not a built-in template
  const isBuiltIn = library.builtInTemplates.some((t) => t.id === templateId);
  if (isBuiltIn) {
    throw new Error('Cannot delete built-in templates');
  }

  const updatedCustomTemplates = library.customTemplates.filter((t) => t.id !== templateId);

  const updatedLibrary: PeriodTemplateLibrary = {
    ...library,
    customTemplates: updatedCustomTemplates,
  };

  savePeriodTemplates(updatedLibrary);
  return updatedLibrary;
}

/**
 * Get a template by ID (searches both built-in and custom)
 */
export function getTemplateById(templateId: string): PeriodTemplate | undefined {
  const library = getPeriodTemplates();
  return (
    library.builtInTemplates.find((t) => t.id === templateId) ||
    library.customTemplates.find((t) => t.id === templateId)
  );
}

/**
 * Get all templates (built-in + custom)
 */
export function getAllTemplates(): PeriodTemplate[] {
  const library = getPeriodTemplates();
  return [...library.builtInTemplates, ...library.customTemplates];
}

/**
 * Reset templates to defaults (removes all custom templates)
 */
export function resetToDefaults(): PeriodTemplateLibrary {
  savePeriodTemplates(DEFAULT_TEMPLATE_LIBRARY);
  return DEFAULT_TEMPLATE_LIBRARY;
}

/**
 * Export templates as JSON
 */
export function exportTemplates(): string {
  const library = getPeriodTemplates();
  return JSON.stringify(
    {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      type: 'period_templates',
      data: {
        customTemplates: library.customTemplates,
      },
    },
    null,
    2
  );
}

/**
 * Import templates from JSON
 */
export function importTemplates(jsonString: string): PeriodTemplateLibrary {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate the import format
    if (parsed.type !== 'period_templates' || !parsed.data) {
      throw new Error('Invalid period templates format');
    }

    const importedCustomTemplates = parsed.data.customTemplates as PeriodTemplate[];

    if (!Array.isArray(importedCustomTemplates)) {
      throw new Error('Invalid custom templates format');
    }

    const library = getPeriodTemplates();

    // Merge imported templates with existing ones (avoid duplicates by ID)
    const existingIds = new Set(library.customTemplates.map((t) => t.id));
    const newTemplates = importedCustomTemplates.filter((t) => !existingIds.has(t.id));

    const updatedLibrary: PeriodTemplateLibrary = {
      ...library,
      customTemplates: [...library.customTemplates, ...newTemplates],
    };

    savePeriodTemplates(updatedLibrary);
    return updatedLibrary;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}
