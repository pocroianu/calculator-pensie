import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  totalContributiveYears: number;
  totalContributiveDays: number;
}

const ContributionSummary: React.FC<Props> = ({ totalContributiveYears, totalContributiveDays }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">{t('pension.stats.contribution.title')}</h3>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">{t('pension.stats.contribution.years')}</div>
            <div className="text-lg font-medium">{Math.round(totalContributiveYears)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">{t('pension.stats.contribution.days')}</div>
            <div className="text-lg font-medium">{totalContributiveDays}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionSummary;
