import React from 'react';
import { Scale, Check, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LawVersion, LawVersionId } from '../types/lawVersionTypes';

interface LawVersionTimelineProps {
  versions: LawVersion[];
  selectedVersionId: LawVersionId;
  onSelectVersion: (versionId: LawVersionId) => void;
}

/**
 * Visual timeline showing the progression of Romanian pension law versions.
 * Each law is displayed as a node on the timeline with its effective dates and key info.
 */
const LawVersionTimeline: React.FC<LawVersionTimelineProps> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
}) => {
  const { t } = useTranslation();

  // Sort versions by effective date (oldest first for timeline)
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  };

  return (
    <div
      className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden"
      data-testid="law-version-timeline"
    >
      <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" aria-hidden="true" />
          <h3 className="font-medium text-gray-900 dark:text-dark-text">
            {t('lawVersions.timeline.title')}
          </h3>
        </div>
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-dark-border"
            aria-hidden="true"
          />

          {/* Timeline nodes */}
          <div className="space-y-6">
            {sortedVersions.map((version, index) => {
              const isSelected = version.id === selectedVersionId;
              const isActive = version.isActive;

              return (
                <button
                  key={version.id}
                  onClick={() => onSelectVersion(version.id)}
                  className={`relative flex items-start gap-4 w-full text-left pl-0 group transition-colors ${
                    isSelected ? '' : 'hover:bg-gray-50/50 dark:hover:bg-dark-bg-tertiary/50'
                  } rounded-lg p-2 -ml-2`}
                  aria-label={`${version.name} - ${t(`lawVersions.descriptions.${version.id}`)}${
                    isActive ? ` (${t('lawVersions.current')})` : ''
                  }`}
                  data-testid={`timeline-node-${version.id}`}
                >
                  {/* Node circle */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400'
                        : isActive
                        ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/30'
                        : 'border-gray-300 bg-white dark:border-dark-border dark:bg-dark-bg-secondary group-hover:border-gray-400'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4 text-white" aria-hidden="true" />
                    ) : isActive ? (
                      <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-dark-border group-hover:bg-gray-400" />
                    )}
                  </div>

                  {/* Node content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-dark-text'
                        }`}
                      >
                        {version.name}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {t('lawVersions.current')}
                        </span>
                      )}
                      {isSelected && !isActive && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {t('lawVersions.selected')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">
                      {formatDate(version.effectiveDate)}
                      {version.supersededDate && (
                        <span> — {formatDate(version.supersededDate)}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-dark-text-muted mt-1">
                      VPR: {version.parameters.vprValue} RON | {t('lawVersions.paramLabels.retirementAge')}: {version.parameters.retirementAge}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 mt-1 transition-colors ${
                      isSelected
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-300 dark:text-dark-border group-hover:text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawVersionTimeline;
