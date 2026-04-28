import React, { useState, useMemo } from 'react';
import { Scale, ChevronDown, ChevronUp, AlertTriangle, Check, ArrowRight, Calendar, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LawVersion, LawVersionId } from '../types/lawVersionTypes';
import { compareLawVersions } from '../config/lawVersionsConfig';
import Tooltip from './Tooltip';

interface LawVersionSelectorProps {
  versions: LawVersion[];
  selectedVersionId: LawVersionId;
  activeVersionId: LawVersionId;
  isHistoricalVersion: boolean;
  onSelectVersion: (versionId: LawVersionId) => void;
  onResetToActive: () => void;
}

const LawVersionSelector: React.FC<LawVersionSelectorProps> = ({
  versions,
  selectedVersionId,
  activeVersionId,
  isHistoricalVersion,
  onSelectVersion,
  onResetToActive,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const selectedVersion = useMemo(
    () => versions.find(v => v.id === selectedVersionId) || versions[0],
    [versions, selectedVersionId]
  );

  // Compare selected version with the active version
  const comparison = useMemo(() => {
    if (!isHistoricalVersion) return null;
    return compareLawVersions(selectedVersionId, activeVersionId);
  }, [selectedVersionId, activeVersionId, isHistoricalVersion]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <section
      className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden"
      aria-labelledby="law-version-heading"
      data-testid="law-version-selector"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" aria-hidden="true" />
            <h2 id="law-version-heading" className="font-medium text-gray-900 dark:text-dark-text">
              {t('lawVersions.title')}
            </h2>
            <Tooltip content={t('lawVersions.tooltip')} />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? t('common.close') : t('lawVersions.expand')}
            data-testid="law-version-toggle"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Selected Version Summary (always visible) */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-dark-text" data-testid="selected-law-name">
                {selectedVersion.name}
              </span>
              {selectedVersion.isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="w-3 h-3 mr-1" aria-hidden="true" />
                  {t('lawVersions.current')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-0.5">
              {t(`lawVersions.descriptions.${selectedVersion.id}`)}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-dark-text-muted">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              <span>{t('lawVersions.effectiveFrom')}: {formatDate(selectedVersion.effectiveDate)}</span>
              {selectedVersion.supersededDate && (
                <span> — {t('lawVersions.until')}: {formatDate(selectedVersion.supersededDate)}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              VPR: {selectedVersion.parameters.vprValue} RON
            </div>
          </div>
        </div>

        {/* Historical version warning */}
        {isHistoricalVersion && (
          <div
            className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            role="alert"
            data-testid="historical-version-warning"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t('lawVersions.historicalWarning')}
                </p>
                <button
                  onClick={onResetToActive}
                  className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 underline"
                  data-testid="reset-to-active-button"
                >
                  {t('lawVersions.switchToCurrent')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded section: Version list and comparison */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-dark-border">
          {/* Version List */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
              {t('lawVersions.availableVersions')}
            </h3>
            <div className="space-y-2" role="radiogroup" aria-label={t('lawVersions.selectVersion')}>
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => onSelectVersion(version.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    version.id === selectedVersionId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                      : 'border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
                  }`}
                  role="radio"
                  aria-checked={version.id === selectedVersionId}
                  data-testid={`law-version-option-${version.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          version.id === selectedVersionId
                            ? 'border-blue-500 dark:border-blue-400'
                            : 'border-gray-300 dark:border-dark-border'
                        }`}
                      >
                        {version.id === selectedVersionId && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                          {version.name}
                        </span>
                        {version.isActive && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {t('lawVersions.current')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                      {formatDate(version.effectiveDate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 ml-6">
                    {t(`lawVersions.descriptions.${version.id}`)} — VPR: {version.parameters.vprValue} RON
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Key Changes for selected version */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border">
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              {t('lawVersions.keyChanges')}
            </h3>
            <ul className="space-y-1">
              {selectedVersion.keyChanges.map((change, idx) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-dark-text-secondary flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-blue-500 flex-shrink-0 mt-1" aria-hidden="true" />
                  <span>{t(change)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Parameters comparison */}
          {isHistoricalVersion && (
            <div className="p-4 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                data-testid="toggle-comparison"
              >
                <Info className="w-4 h-4" aria-hidden="true" />
                {showComparison ? t('lawVersions.hideComparison') : t('lawVersions.showComparison')}
              </button>

              {showComparison && comparison && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-500 dark:text-dark-text-muted mb-2">
                    {comparison.fromVersion.name} <ArrowRight className="w-3 h-3 inline" /> {comparison.toVersion.name}
                  </div>
                  {comparison.changes.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                      {t('lawVersions.noChanges')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {comparison.changes.map((change, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg text-sm ${
                            change.impact === 'positive'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                              : change.impact === 'negative'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                              : 'bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-dark-text-secondary'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{t(change.label)}</span>
                            <span>
                              {String(change.oldValue)} <ArrowRight className="w-3 h-3 inline mx-1" /> {String(change.newValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Parameter Summary */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
              {t('lawVersions.parameters')}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted">{t('lawVersions.paramLabels.retirementAge')}</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text" data-testid="param-retirement-age">
                  {selectedVersion.parameters.retirementAge} {t('common.years')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted">{t('lawVersions.paramLabels.vpr')}</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text" data-testid="param-vpr">
                  {selectedVersion.parameters.vprValue} RON
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted">{t('lawVersions.paramLabels.minContribution')}</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text">
                  {selectedVersion.parameters.minimumContributionYears} {t('common.years')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted">{t('lawVersions.paramLabels.completeContribution')}</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text">
                  {selectedVersion.parameters.completeContributionYears} {t('common.years')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted">{t('lawVersions.paramLabels.earlyPenalty')}</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text">
                  {selectedVersion.parameters.earlyRetirementPenaltyPerYear}%/{t('common.years')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted">{t('lawVersions.paramLabels.minEarlyAge')}</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-dark-text">
                  {selectedVersion.parameters.minimumEarlyRetirementAge} {t('common.years')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LawVersionSelector;
