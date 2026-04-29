/**
 * Period Templates Types
 *
 * This module defines the types for reusable period templates
 * that allow users to quickly add common period types (standard employment,
 * university, military service, etc.) and save custom templates.
 */

import { WorkingCondition, NonContributivePeriodType } from './pensionTypes';

/**
 * Template category for organizing templates
 */
export type TemplateCategory = 'employment' | 'nonContributive' | 'custom';

/**
 * Period template definition
 * Contains all fields except dates (which user fills in when applying)
 */
export interface PeriodTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  isBuiltIn: boolean;

  // Period data (without dates)
  company?: string;
  monthlyGrossSalary?: number;
  workingCondition?: WorkingCondition;
  nonContributiveType?: NonContributivePeriodType;

  // Metadata
  createdAt: string;
  updatedAt?: string;
}

/**
 * Library of period templates with built-in and custom templates
 */
export interface PeriodTemplateLibrary {
  version: string;
  lastUpdated: string;
  builtInTemplates: PeriodTemplate[];
  customTemplates: PeriodTemplate[];
}

/**
 * Input for creating a new custom template
 */
export interface CreateTemplateInput {
  name: string;
  description?: string;
  company?: string;
  monthlyGrossSalary?: number;
  workingCondition?: WorkingCondition;
  nonContributiveType?: NonContributivePeriodType;
}

/**
 * Default built-in template IDs for reference
 */
export const BUILT_IN_TEMPLATE_IDS = {
  STANDARD_EMPLOYMENT: 'builtin-standard-employment',
  DIFFICULT_CONDITIONS: 'builtin-difficult-conditions',
  VERY_DIFFICULT_CONDITIONS: 'builtin-very-difficult-conditions',
  SPECIAL_CONDITIONS: 'builtin-special-conditions',
  UNIVERSITY: 'builtin-university',
  MILITARY: 'builtin-military',
  CHILD_CARE: 'builtin-child-care',
  MEDICAL_LEAVE: 'builtin-medical-leave',
} as const;
