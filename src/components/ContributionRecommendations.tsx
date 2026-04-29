import React, { useMemo, useState } from 'react';
import {
  Lightbulb,
  Target,
  TrendingUp,
  Award,
  Briefcase,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PensionDetails, PensionInputs } from '../types/pensionTypes';
import {
  generateContributionRecommendations,
  ContributionRecommendation,
  RecommendationCategory,
  RecommendationPriority,
} from '../utils/contributionRecommendations';
import { formatCurrency, formatPoints } from '../utils/formatters';

interface Props {
  inputs: PensionInputs;
  pensionDetails: PensionDetails;
}

/**
 * Get the icon for a recommendation category
 */
const getCategoryIcon = (category: RecommendationCategory) => {
  switch (category) {
    case 'milestone':
      return <Target className="w-5 h-5" />;
    case 'stability':
      return <Award className="w-5 h-5" />;
    case 'salary':
      return <TrendingUp className="w-5 h-5" />;
    case 'condition':
      return <Briefcase className="w-5 h-5" />;
    case 'retirement':
      return <Clock className="w-5 h-5" />;
    default:
      return <Lightbulb className="w-5 h-5" />;
  }
};

/**
 * Get color classes for priority levels
 */
const getPriorityStyles = (priority: RecommendationPriority) => {
  switch (priority) {
    case 'high':
      return {
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        border: 'border-l-red-500',
        icon: 'text-red-500 dark:text-red-400',
        bg: 'bg-red-50/50 dark:bg-red-900/10',
      };
    case 'medium':
      return {
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        border: 'border-l-amber-500',
        icon: 'text-amber-500 dark:text-amber-400',
        bg: 'bg-amber-50/50 dark:bg-amber-900/10',
      };
    case 'low':
      return {
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        border: 'border-l-blue-500',
        icon: 'text-blue-500 dark:text-blue-400',
        bg: 'bg-blue-50/50 dark:bg-blue-900/10',
      };
  }
};

/**
 * Single recommendation card component
 */
const RecommendationCard: React.FC<{
  recommendation: ContributionRecommendation;
}> = ({ recommendation }) => {
  const { t } = useTranslation();
  const styles = getPriorityStyles(recommendation.priority);

  return (
    <div
      className={`border-l-4 ${styles.border} ${styles.bg} rounded-r-lg p-4 transition-all duration-200 hover:shadow-sm`}
      data-testid={`recommendation-${recommendation.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`} aria-hidden="true">
          {getCategoryIcon(recommendation.category)}
        </div>

        <div className="flex-grow min-w-0">
          {/* Title and Priority Badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text">
              {t(recommendation.titleKey)}
            </h4>
            <span
              className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${styles.badge}`}
            >
              {t(`pension.recommendations.priority.${recommendation.priority}`)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-2">
            {t(recommendation.descriptionKey, recommendation.descriptionParams)}
          </p>

          {/* Progress bar (if applicable) */}
          {recommendation.progress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-dark-text-muted mb-1">
                <span>
                  {recommendation.progress.current} / {recommendation.progress.target}{' '}
                  {t(recommendation.progress.unit)}
                </span>
                <span>
                  {Math.round(
                    (recommendation.progress.current / recommendation.progress.target) * 100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-bg rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    recommendation.priority === 'high'
                      ? 'bg-red-500'
                      : recommendation.priority === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (recommendation.progress.current / recommendation.progress.target) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Impact section (if applicable) */}
          {recommendation.impact &&
            (recommendation.impact.additionalMonthlyPension ||
              recommendation.impact.additionalPoints) && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {recommendation.impact.additionalPoints !== undefined &&
                  recommendation.impact.additionalPoints > 0 && (
                    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                      <Zap className="w-3 h-3" aria-hidden="true" />
                      +{formatPoints(recommendation.impact.additionalPoints)}{' '}
                      {t('common.points')}
                    </span>
                  )}
                {recommendation.impact.additionalMonthlyPension !== undefined &&
                  recommendation.impact.additionalMonthlyPension > 0 && (
                    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                      <TrendingUp className="w-3 h-3" aria-hidden="true" />
                      +{formatCurrency(recommendation.impact.additionalMonthlyPension)}
                      {t('pension.recommendations.perMonth')}
                    </span>
                  )}
                {recommendation.impact.yearsNeeded !== undefined &&
                  recommendation.impact.yearsNeeded > 0 && (
                    <span className="inline-flex items-center gap-1 text-gray-500 dark:text-dark-text-muted">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {recommendation.impact.yearsNeeded} {t('common.years')}
                    </span>
                  )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

/**
 * ContributionRecommendations - Main component
 *
 * Analyzes user's contribution history and provides personalized
 * recommendations to maximize their pension.
 */
const ContributionRecommendations: React.FC<Props> = ({ inputs, pensionDetails }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Generate recommendations
  const result = useMemo(
    () => generateContributionRecommendations(inputs, pensionDetails),
    [inputs, pensionDetails]
  );

  // Initially show up to 3 recommendations, expand to show all
  const MAX_INITIAL = 3;
  const visibleRecommendations = showAll
    ? result.recommendations
    : result.recommendations.slice(0, MAX_INITIAL);
  const hasMore = result.recommendations.length > MAX_INITIAL;

  // Don't render if no recommendations
  if (result.recommendations.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden"
      data-testid="contribution-recommendations"
      role="region"
      aria-labelledby="recommendations-heading"
    >
      {/* Header */}
      <button
        className="w-full p-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 cursor-pointer hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="recommendations-content"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h3
              id="recommendations-heading"
              className="font-medium text-gray-900 dark:text-dark-text"
            >
              {t('pension.recommendations.title')}
            </h3>
            {result.summary.highPriority > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {result.summary.highPriority}{' '}
                {t('pension.recommendations.highPriorityCount')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-dark-text-muted">
              {result.summary.totalRecommendations}{' '}
              {t('pension.recommendations.recommendationCount', {
                count: result.summary.totalRecommendations,
              })}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400 dark:text-dark-text-muted" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-dark-text-muted" aria-hidden="true" />
            )}
          </div>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div id="recommendations-content" className="p-4 space-y-4">
          {/* Summary Card */}
          {result.summary.potentialAdditionalMonthlyPension > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  {t('pension.recommendations.potentialGain')}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-green-700 dark:text-green-400">
                <span>
                  +{formatCurrency(result.summary.potentialAdditionalMonthlyPension)}{' '}
                  {t('pension.recommendations.perMonth')}
                </span>
                <span>
                  +{formatPoints(result.summary.potentialAdditionalPoints)}{' '}
                  {t('common.points')}
                </span>
              </div>
            </div>
          )}

          {/* Recommendation Cards */}
          <div className="space-y-3">
            {visibleRecommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>

          {/* Show More / Show Less */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {showAll
                ? t('pension.recommendations.showLess')
                : t('pension.recommendations.showMore', {
                    count: result.recommendations.length - MAX_INITIAL,
                  })}
            </button>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 dark:text-dark-text-muted mt-2 pt-2 border-t border-gray-100 dark:border-dark-border">
            {t('pension.recommendations.disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContributionRecommendations;
