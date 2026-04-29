import React from 'react';
import { COMPLETE_CONTRIBUTION_YEARS } from '../../utils/pensionCalculations';
import StatusCard from './StatusCard';
import Timeline from './Timeline';
import ContributionSummary from './ContributionSummary';
import RetirementStatus from './RetirementStatus';

interface Props {
  currentAge: number;
  retirementAge: number;
  totalContributiveYears: number;
  totalContributiveDays: number;
  yearsUntilRetirement: number;
}

const PensionStats: React.FC<Props> = ({
  currentAge,
  retirementAge,
  totalContributiveYears,
  totalContributiveDays,
  yearsUntilRetirement,
}) => {
  const isEligible = totalContributiveYears >= COMPLETE_CONTRIBUTION_YEARS;

  return (
    <div className="space-y-6">
      <StatusCard isEligible={isEligible} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Timeline
          currentAge={currentAge}
          retirementAge={retirementAge}
          totalContributiveYears={totalContributiveYears}
        />
        <ContributionSummary
          totalContributiveYears={totalContributiveYears}
          totalContributiveDays={totalContributiveDays}
        />
      </div>

      <RetirementStatus yearsUntilRetirement={yearsUntilRetirement} />
    </div>
  );
};

export default PensionStats;
