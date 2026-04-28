/**
 * Period Templates Panel Component
 *
 * A collapsible panel that displays available period templates (built-in and custom)
 * allowing users to quickly add common period types.
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Briefcase,
  GraduationCap,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Shield,
  Heart,
  Stethoscope,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PeriodTemplate, TemplateCategory } from '../types/periodTemplates';
import { usePeriodTemplates } from '../hooks/usePeriodTemplates';
import { ContributionPeriod } from '../types/pensionTypes';
import { useToast } from '../contexts/ToastContext';
import { useHapticFeedback } from '../hooks/useTouchGestures';

interface PeriodTemplatesPanelProps {
  onApplyTemplate: (period: ContributionPeriod) => void;
  onOpenSaveModal: () => void;
}

const PeriodTemplatesPanel: React.FC<PeriodTemplatesPanelProps> = ({
  onApplyTemplate,
  onOpenSaveModal,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { lightTap, success: successVibrate } = useHapticFeedback();

  const {
    getAllTemplates,
    getCustomTemplates,
    applyTemplate,
    deleteTemplate,
    isLoading,
  } = usePeriodTemplates();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  // Get all templates
  const allTemplates = useMemo(() => getAllTemplates(), [getAllTemplates]);
  const customTemplates = useMemo(() => getCustomTemplates(), [getCustomTemplates]);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') {
      return allTemplates;
    }
    return allTemplates.filter((t) => t.category === selectedCategory);
  }, [allTemplates, selectedCategory]);

  // Group templates by category for display
  const employmentTemplates = useMemo(
    () => filteredTemplates.filter((t) => t.category === 'employment'),
    [filteredTemplates]
  );
  const nonContributiveTemplates = useMemo(
    () => filteredTemplates.filter((t) => t.category === 'nonContributive'),
    [filteredTemplates]
  );
  const customFilteredTemplates = useMemo(
    () => filteredTemplates.filter((t) => t.category === 'custom'),
    [filteredTemplates]
  );

  // Get icon for template
  const getTemplateIcon = (template: PeriodTemplate) => {
    if (template.nonContributiveType) {
      switch (template.nonContributiveType) {
        case 'university':
          return <GraduationCap className="w-4 h-4" />;
        case 'military':
          return <Shield className="w-4 h-4" />;
        case 'childCare':
          return <Heart className="w-4 h-4" />;
        case 'medical':
          return <Stethoscope className="w-4 h-4" />;
        default:
          return <FileText className="w-4 h-4" />;
      }
    }

    // Employment templates
    switch (template.workingCondition) {
      case 'groupII':
        return <AlertTriangle className="w-4 h-4" />;
      case 'groupI':
        return <Zap className="w-4 h-4" />;
      case 'specialConditions':
        return <Shield className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  // Get color classes for template card
  const getTemplateColorClasses = (template: PeriodTemplate) => {
    if (template.nonContributiveType) {
      return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
    }

    switch (template.workingCondition) {
      case 'groupII':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      case 'groupI':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'specialConditions':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      default:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
  };

  // Handle applying a template
  const handleApplyTemplate = (template: PeriodTemplate) => {
    lightTap();
    const period = applyTemplate(template);
    onApplyTemplate(period);
    successVibrate();
    showToast('success', 'periodTemplates.toast.templateApplied');
  };

  // Handle deleting a custom template
  const handleDeleteTemplate = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    lightTap();
    deleteTemplate(templateId);
    showToast('info', 'periodTemplates.toast.templateDeleted');
  };

  // Get translated name (for built-in templates, name is a translation key)
  const getTemplateName = (template: PeriodTemplate) => {
    if (template.isBuiltIn) {
      return t(template.name);
    }
    return template.name;
  };

  // Get translated description
  const getTemplateDescription = (template: PeriodTemplate) => {
    if (!template.description) return null;
    if (template.isBuiltIn) {
      return t(template.description);
    }
    return template.description;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - Click to expand/collapse */}
      <button
        onClick={() => {
          lightTap();
          setIsExpanded(!isExpanded);
        }}
        className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
        data-testid="templates-panel-toggle"
      >
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-gray-900">
            {t('periodTemplates.title')}
          </span>
          <span className="text-sm text-gray-500">
            ({allTemplates.length} {t('periodTemplates.available')})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4" data-testid="templates-panel-content">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('periodTemplates.categories.all')}
            </button>
            <button
              onClick={() => setSelectedCategory('employment')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === 'employment'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('periodTemplates.categories.employment')}
            </button>
            <button
              onClick={() => setSelectedCategory('nonContributive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === 'nonContributive'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('periodTemplates.categories.nonContributive')}
            </button>
            {customTemplates.length > 0 && (
              <button
                onClick={() => setSelectedCategory('custom')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  selectedCategory === 'custom'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('periodTemplates.categories.custom')} ({customTemplates.length})
              </button>
            )}
          </div>

          {/* Employment Templates */}
          {(selectedCategory === 'all' || selectedCategory === 'employment') &&
            employmentTemplates.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('periodTemplates.categories.employment')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {employmentTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${getTemplateColorClasses(
                        template
                      )}`}
                      data-testid={`template-${template.id}`}
                    >
                      <div className="flex-shrink-0 mt-0.5 text-gray-600">
                        {getTemplateIcon(template)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {getTemplateName(template)}
                        </p>
                        {getTemplateDescription(template) && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {getTemplateDescription(template)}
                          </p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Non-contributive Templates */}
          {(selectedCategory === 'all' || selectedCategory === 'nonContributive') &&
            nonContributiveTemplates.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('periodTemplates.categories.nonContributive')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nonContributiveTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${getTemplateColorClasses(
                        template
                      )}`}
                      data-testid={`template-${template.id}`}
                    >
                      <div className="flex-shrink-0 mt-0.5 text-gray-600">
                        {getTemplateIcon(template)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {getTemplateName(template)}
                        </p>
                        {getTemplateDescription(template) && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {getTemplateDescription(template)}
                          </p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Custom Templates */}
          {(selectedCategory === 'all' || selectedCategory === 'custom') &&
            customFilteredTemplates.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('periodTemplates.categories.custom')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customFilteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-purple-50 border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        className="flex-1 flex items-start gap-3 text-left min-w-0"
                        data-testid={`template-${template.id}`}
                      >
                        <div className="flex-shrink-0 mt-0.5 text-gray-600">
                          {getTemplateIcon(template)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {getTemplateName(template)}
                          </p>
                          {getTemplateDescription(template) && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {getTemplateDescription(template)}
                            </p>
                          )}
                        </div>
                        <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTemplate(e, template.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                        aria-label={t('common.delete')}
                        data-testid={`delete-template-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Save Custom Template Button */}
          <button
            onClick={() => {
              lightTap();
              onOpenSaveModal();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 transition-colors border border-indigo-200"
            data-testid="save-template-button"
          >
            <Plus className="w-5 h-5" />
            {t('periodTemplates.saveCustomTemplate')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PeriodTemplatesPanel;
