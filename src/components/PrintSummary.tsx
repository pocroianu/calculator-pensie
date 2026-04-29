import React from 'react';
import { useTranslation } from 'react-i18next';
import { PensionDetails, PensionInputs } from '../types/pensionTypes';
import { formatCurrency, formatPoints, formatYears } from '../utils/formatters';
import { RETIREMENT_AGE, COMPLETE_CONTRIBUTION_YEARS } from '../utils/pensionCalculations';

interface PrintSummaryProps {
  pensionDetails: PensionDetails;
  inputs: PensionInputs;
}

/**
 * PrintSummary component - Only visible when printing.
 * Provides a concise, at-a-glance summary of all key pension calculation results
 * formatted for standard paper sizes (A4 and US Letter).
 */
const PrintSummary: React.FC<PrintSummaryProps> = ({ pensionDetails, inputs }) => {
  const { t } = useTranslation();

  const totalPeriods = inputs.contributionPeriods?.length || 0;
  const contributivePeriods = inputs.contributionPeriods?.filter(p => !p.nonContributiveType).length || 0;
  const nonContributivePeriods = totalPeriods - contributivePeriods;

  return (
    <div
      className="hidden print-summary"
      aria-hidden="true"
      data-testid="print-summary"
    >
      <div className="print-summary-title">
        {t('print.summaryTitle')}
      </div>

      <div className="print-summary-grid">
        {/* Monthly Pension */}
        <div className="print-summary-item" style={{ gridColumn: '1 / -1' }}>
          <span className="print-summary-label">{t('print.monthlyPension')}</span>
          <span className="print-summary-highlight">
            {pensionDetails.monthlyPension > 0
              ? formatCurrency(pensionDetails.monthlyPension)
              : '—'}
          </span>
        </div>

        {/* Yearly Pension */}
        <div className="print-summary-item" style={{ gridColumn: '1 / -1' }}>
          <span className="print-summary-label">{t('print.yearlyPension')}</span>
          <span className="print-summary-value">
            {pensionDetails.monthlyPension > 0
              ? formatCurrency(pensionDetails.monthlyPension * 12)
              : '—'}
          </span>
        </div>

        {/* Total Points */}
        <div className="print-summary-item">
          <span className="print-summary-label">{t('print.totalPoints')}</span>
          <span className="print-summary-value">{formatPoints(pensionDetails.totalPoints)}</span>
        </div>

        {/* Contribution Points */}
        <div className="print-summary-item">
          <span className="print-summary-label">{t('print.contributionPoints')}</span>
          <span className="print-summary-value">{formatPoints(pensionDetails.contributionPoints)}</span>
        </div>

        {/* Stability Points */}
        <div className="print-summary-item">
          <span className="print-summary-label">{t('print.stabilityPoints')}</span>
          <span className="print-summary-value">{formatPoints(pensionDetails.stabilityPoints)}</span>
        </div>

        {/* Non-Contributive Points */}
        <div className="print-summary-item">
          <span className="print-summary-label">{t('print.nonContributivePoints')}</span>
          <span className="print-summary-value">{formatPoints(pensionDetails.nonContributivePoints || 0)}</span>
        </div>

        {/* Contributive Years */}
        <div className="print-summary-item">
          <span className="print-summary-label">{t('print.contributiveYears')}</span>
          <span className="print-summary-value">
            {formatYears(pensionDetails.totalContributiveYears || 0)} / {COMPLETE_CONTRIBUTION_YEARS}
          </span>
        </div>

        {/* Current Age */}
        <div className="print-summary-item">
          <span className="print-summary-label">{t('print.currentAge')}</span>
          <span className="print-summary-value">
            {pensionDetails.currentAge || '—'} / {RETIREMENT_AGE}
          </span>
        </div>

        {/* Total Periods */}
        <div className="print-summary-item">
          <span className="print-summary-label">{t('print.totalPeriods')}</span>
          <span className="print-summary-value">
            {contributivePeriods} + {nonContributivePeriods} {t('print.nonContributive')}
          </span>
        </div>

        {/* Birth Date */}
        {inputs.birthDate && (
          <div className="print-summary-item">
            <span className="print-summary-label">{t('print.birthDate')}</span>
            <span className="print-summary-value">
              {new Date(inputs.birthDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintSummary;
