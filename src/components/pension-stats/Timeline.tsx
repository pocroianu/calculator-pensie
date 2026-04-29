import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COMPLETE_CONTRIBUTION_YEARS } from '../../utils/pensionCalculations';

interface Props {
  currentAge: number;
  retirementAge: number;
  totalContributiveYears: number;
}

const Timeline: React.FC<Props> = ({ currentAge, retirementAge, totalContributiveYears }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">{t('pension.stats.timeline.title')}</h3>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">{t('pension.stats.timeline.currentAge')}</div>
            <div className="text-lg font-medium">{currentAge} {t('pension.stats.timeline.years')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">{t('pension.stats.timeline.retirementAge')}</div>
            <div className="text-lg font-medium">{retirementAge} {t('pension.stats.timeline.years')}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{t('pension.stats.contributionProgress.title')}</span>
            <span>{Math.round(totalContributiveYears)} / {COMPLETE_CONTRIBUTION_YEARS} {t('pension.stats.contributionProgress.years')}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{
                width: `${(totalContributiveYears / COMPLETE_CONTRIBUTION_YEARS) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
