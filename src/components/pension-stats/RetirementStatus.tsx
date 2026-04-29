import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  yearsUntilRetirement: number;
}

const RetirementStatus: React.FC<Props> = ({ yearsUntilRetirement }) => {
  const { t } = useTranslation();

  return (
    <div className={`${yearsUntilRetirement <= 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} p-4 rounded-xl border`}>
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-500" />
        <div>
          <h3 className="font-medium">{t('pension.stats.retirementStatus.title')}</h3>
          <p className="text-sm">
            {yearsUntilRetirement <= 0
              ? t('pension.stats.retirementStatus.eligible')
              : t('pension.stats.retirementStatus.yearsRemaining', { years: yearsUntilRetirement })
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetirementStatus;
