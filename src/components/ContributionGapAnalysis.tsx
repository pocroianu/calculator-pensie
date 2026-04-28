import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, Lightbulb, ChevronDown, ChevronUp, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GapAnalysisResult, ContributionGap, GapFillStrategy } from '../types/pensionTypes';
import { formatCurrency, formatPoints } from '../utils/formatters';
import { format } from 'date-fns';

interface Props {
  gapAnalysis: GapAnalysisResult;
  hasGaps: boolean;
}

const ContributionGapAnalysis: React.FC<Props> = ({ gapAnalysis, hasGaps }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showStrategies, setShowStrategies] = useState(false);

  if (!hasGaps) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-testid="gap-analysis-no-gaps">
        <div className="p-4 border-b border-gray-200 bg-a11y-neutral-bg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-a11y-success-icon" />
            <h3 className="font-medium text-a11y-neutral-text">{t('pension.gapAnalysis.title')}</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-a11y-success-bg flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-a11y-success-icon" />
          </div>
          <p className="text-a11y-neutral-text-muted">{t('pension.gapAnalysis.noGapsFound')}</p>
        </div>
      </div>
    );
  }

  const formatGapDuration = (years: number, months: number): string => {
    const parts: string[] = [];
    if (years > 0) {
      parts.push(`${years} ${t('common.years')}`);
    }
    if (months > 0) {
      parts.push(`${months} ${t('pension.gapAnalysis.months')}`);
    }
    return parts.join(', ') || `0 ${t('pension.gapAnalysis.months')}`;
  };

  // WCAG AA Compliant feasibility colors
  const getFeasibilityColor = (feasibility: GapFillStrategy['feasibility']): string => {
    switch (feasibility) {
      case 'high':
        return 'bg-a11y-success-bg text-a11y-success-text';
      case 'medium':
        return 'bg-a11y-warning-bg text-a11y-warning-text';
      case 'low':
        return 'bg-a11y-error-bg text-a11y-error-text';
      default:
        return 'bg-a11y-neutral-bg text-a11y-neutral-text';
    }
  };

  const getFeasibilityLabel = (feasibility: GapFillStrategy['feasibility']): string => {
    return t(`pension.gapAnalysis.feasibility.${feasibility}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-testid="gap-analysis-container">
      {/* Header - WCAG AA Compliant */}
      <div
        className="p-4 border-b border-a11y-warning-border bg-a11y-warning-bg-subtle cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-a11y-warning-icon" />
            <h3 className="font-medium text-a11y-neutral-text">{t('pension.gapAnalysis.title')}</h3>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-a11y-warning-bg text-a11y-warning-text">
              {gapAnalysis.gaps.length} {gapAnalysis.gaps.length === 1 ? t('pension.gapAnalysis.gap') : t('pension.gapAnalysis.gaps')}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-a11y-neutral-icon" />
          ) : (
            <ChevronDown className="w-5 h-5 text-a11y-neutral-icon" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {/* Summary Statistics - WCAG AA Compliant */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-a11y-warning-bg rounded-lg p-4 border border-a11y-warning-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-a11y-warning-icon" />
                <span className="text-sm text-a11y-warning-text font-medium">{t('pension.gapAnalysis.totalDuration')}</span>
              </div>
              <div className="text-lg font-semibold text-a11y-warning-text">
                {formatGapDuration(gapAnalysis.totalGapYears, gapAnalysis.totalGapMonths)}
              </div>
            </div>

            <div className="bg-a11y-error-bg rounded-lg p-4 border border-a11y-error-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-a11y-error-icon" />
                <span className="text-sm text-a11y-error-text font-medium">{t('pension.gapAnalysis.pointsLost')}</span>
              </div>
              <div className="text-lg font-semibold text-a11y-error-text">
                ~{formatPoints(gapAnalysis.totalImpactOnPoints)} {t('common.points')}
              </div>
            </div>

            <div className="bg-a11y-error-bg rounded-lg p-4 border border-a11y-error-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-a11y-error-icon" />
                <span className="text-sm text-a11y-error-text font-medium">{t('pension.gapAnalysis.pensionImpact')}</span>
              </div>
              <div className="text-lg font-semibold text-a11y-error-text">
                -{formatCurrency(gapAnalysis.totalImpactOnPension)}/mo
              </div>
            </div>
          </div>

          {/* Gap List */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-a11y-neutral-text mb-3">{t('pension.gapAnalysis.identifiedGaps')}</h4>
            <div className="space-y-3">
              {gapAnalysis.gaps.map((gap, index) => (
                <GapCard key={index} gap={gap} index={index} t={t} formatGapDuration={formatGapDuration} />
              ))}
            </div>
          </div>

          {/* Strategies Section - WCAG AA Compliant */}
          {gapAnalysis.strategies.length > 0 && (
            <div>
              <button
                className="flex items-center gap-2 text-sm font-medium text-a11y-info-text hover:text-a11y-info-icon mb-3"
                onClick={() => setShowStrategies(!showStrategies)}
              >
                <Lightbulb className="w-4 h-4" />
                {t('pension.gapAnalysis.viewStrategies')}
                {showStrategies ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showStrategies && (
                <div className="space-y-3 bg-a11y-info-bg rounded-lg p-4 border border-a11y-info-border">
                  <h4 className="text-sm font-medium text-a11y-info-text mb-2">
                    {t('pension.gapAnalysis.suggestedStrategies')}
                  </h4>
                  {gapAnalysis.strategies.map((strategy, index) => (
                    <StrategyCard
                      key={index}
                      strategy={strategy}
                      t={t}
                      getFeasibilityColor={getFeasibilityColor}
                      getFeasibilityLabel={getFeasibilityLabel}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface GapCardProps {
  gap: ContributionGap;
  index: number;
  t: (key: string) => string;
  formatGapDuration: (years: number, months: number) => string;
}

const GapCard: React.FC<GapCardProps> = ({ gap, index, t, formatGapDuration }) => {
  const startDate = new Date(gap.startDate);
  const endDate = new Date(gap.endDate);

  return (
    <div className="bg-a11y-neutral-bg rounded-lg p-4 border border-a11y-neutral-border" data-testid={`gap-card-${index}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-a11y-neutral-icon" />
            <span className="text-sm font-medium text-a11y-neutral-text">
              {t('pension.gapAnalysis.gapLabel')} #{index + 1}
            </span>
          </div>
          <p className="text-sm text-a11y-neutral-text-muted">
            {format(startDate, 'MMM yyyy')} - {format(endDate, 'MMM yyyy')}
          </p>
          <p className="text-xs text-a11y-neutral-text-muted mt-1">
            {formatGapDuration(gap.durationYears, gap.durationMonths)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-a11y-error-text">
            -{formatPoints(gap.impactOnPoints)} pts
          </div>
          <div className="text-xs text-a11y-neutral-text-muted">
            -{formatCurrency(gap.impactOnMonthlyPension)}/mo
          </div>
        </div>
      </div>
    </div>
  );
};

interface StrategyCardProps {
  strategy: GapFillStrategy;
  t: (key: string, params?: Record<string, any>) => string;
  getFeasibilityColor: (feasibility: GapFillStrategy['feasibility']) => string;
  getFeasibilityLabel: (feasibility: GapFillStrategy['feasibility']) => string;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  t,
  getFeasibilityColor,
  getFeasibilityLabel,
}) => {
  return (
    <div className="bg-white rounded-lg p-3 border border-a11y-info-border" data-testid={`strategy-${strategy.type}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="text-sm font-medium text-a11y-neutral-text">
            {t(`pension.gapAnalysis.strategies.${strategy.type}.title`)}
          </h5>
          <p className="text-xs text-a11y-neutral-text-muted mt-1">
            {t(`pension.gapAnalysis.strategies.${strategy.type}.description`)}
          </p>
        </div>
        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getFeasibilityColor(strategy.feasibility)}`}>
          {getFeasibilityLabel(strategy.feasibility)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-a11y-info-border">
        <div>
          <span className="text-xs text-a11y-neutral-text-muted">{t('pension.gapAnalysis.estimatedGain')}</span>
          <div className="text-sm font-medium text-a11y-success-text">
            +{formatPoints(strategy.estimatedPointGain)} {t('common.points')}
          </div>
        </div>
        <div>
          <span className="text-xs text-a11y-neutral-text-muted">{t('pension.gapAnalysis.pensionIncrease')}</span>
          <div className="text-sm font-medium text-a11y-success-text">
            +{formatCurrency(strategy.estimatedPensionIncrease)}/mo
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionGapAnalysis;
