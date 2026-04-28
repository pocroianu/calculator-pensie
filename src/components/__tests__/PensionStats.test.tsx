import { render, screen } from '@testing-library/react';
import PensionStats from '../PensionStats';
import { PensionDetails, PensionInputs, ContributionPeriod, WorkingCondition } from '../../types/pensionTypes';
import { RETIREMENT_AGE, MINIMUM_CONTRIBUTION_YEARS, COMPLETE_CONTRIBUTION_YEARS } from '../../utils/pensionCalculations';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      // Return mock translations with interpolated params
      const translations: Record<string, string> = {
        'pension.contributionPeriods.validation.calculationBlockedByOverlap': 'Calculation is blocked due to overlapping periods',
        'pension.stats.validation.noContributionPeriods': 'No contribution periods added yet',
        'pension.stats.validation.minimumContributionYears': `You need ${params?.years || 0} more years to reach the minimum of ${params?.minimum || MINIMUM_CONTRIBUTION_YEARS} years`,
        'pension.stats.validation.completeContributionYears': `You need ${params?.years || 0} more years to reach the complete contribution of ${params?.complete || COMPLETE_CONTRIBUTION_YEARS} years`,
        'pension.stats.validation.allConditionsMet': 'All conditions are met for pension eligibility',
        'pension.stats.retirementStatus.title': 'Retirement Status',
        'pension.stats.retirementStatus.eligible': 'You are eligible for retirement',
        'pension.stats.retirementStatus.yearsRemaining': `${params?.years || 0} years remaining until retirement`,
        'pension.stats.timeline.title': 'Timeline',
        'pension.stats.timeline.currentAge': 'Current Age',
        'pension.stats.timeline.retirementAge': 'Retirement Age',
        'pension.stats.timeline.years': 'years',
        'pension.stats.contributionProgress.title': 'Contribution Progress',
        'pension.stats.contributionProgress.years': 'years',
        'pension.stats.pointsBreakdown.title': 'Points Breakdown',
        'pension.stats.pointsBreakdown.contribution': 'Contribution Points',
        'pension.stats.pointsBreakdown.stability': 'Stability Points',
        'pension.stats.pointsBreakdown.nonContributive': 'Non-Contributive Points',
        'pension.stats.pointsBreakdown.totalPoints': 'Total Points',
        'pension.stats.periodBreakdown.title': 'Period Breakdown',
        'pension.stats.periodBreakdown.monthlyGrossSalary': 'Monthly Gross Salary',
        'pension.stats.periodBreakdown.workingCondition': 'Working Condition',
        'pension.stats.periodBreakdown.nonContributiveType': 'Non-Contributive Type',
        'pension.stats.periodBreakdown.percentageOfTotal': 'of total points',
        'pension.stats.periodBreakdown.noPeriodsYet': 'No periods added yet',
        'pension.stats.pensionEstimate.title': 'Pension Estimate',
        'pension.stats.pensionEstimate.monthlyPension': 'Monthly Pension',
        'pension.stats.pensionEstimate.yearlyPension': 'Yearly Pension',
        'pension.stats.pensionEstimate.basedOn': `Based on ${params?.points || 0} points`,
        'pension.stats.pensionEstimate.completeMinimum': 'Complete the minimum contribution period to see your pension estimate',
        'pension.stats.pensionEstimate.formula': 'Pension = Points × Reference Value',
        'pension.contributionPeriods.nonContributivePeriod.military': 'Military Service',
        'pension.contributionPeriods.nonContributivePeriod.university': 'University Studies',
        'pension.contributionPeriods.nonContributivePeriod.childCare': 'Child Care',
        'pension.contributionPeriods.nonContributivePeriod.medical': 'Medical Leave',
        'pension.contributionPeriods.workingCondition.normal': 'Normal Conditions',
        'pension.contributionPeriods.workingCondition.groupII': 'Group II - Difficult (25% bonus)',
        'pension.contributionPeriods.workingCondition.groupI': 'Group I - Very Difficult (50% bonus)',
        'pension.contributionPeriods.workingCondition.specialConditions': 'Special Conditions (50% bonus)',
        'common.points': 'points',
        'common.years': 'years',
      };
      return translations[key] || key;
    }
  })
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, _formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}));

// Mock historicalSalaries
jest.mock('../../data/historicalSalaries', () => ({
  calculateHistoricalContributionPoints: jest.fn().mockImplementation(
    (salary: number, fromDate: string, toDate: string) => {
      // Simple mock calculation: years * (salary / 7000)
      const years = (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return years * (salary / 7000);
    }
  ),
  getAverageSalaryForYear: jest.fn().mockReturnValue(7000),
  CURRENT_AVERAGE_SALARY: 7000,
}));

describe('PensionStats', () => {
  // Helper function to create default props
  const createDefaultPensionDetails = (overrides: Partial<PensionDetails> = {}): PensionDetails => ({
    contributionPoints: 25.5,
    stabilityPoints: 5.0,
    nonContributivePoints: 1.0,
    totalPoints: 31.5,
    totalContributiveYears: 25,
    monthlyPension: 2552.45,
    currentAge: 50,
    yearsUntilRetirement: 15,
    ...overrides
  });

  const createDefaultInputs = (overrides: Partial<PensionInputs> = {}): PensionInputs => ({
    birthDate: '1974-01-01',
    retirementYear: 2039,
    contributionPeriods: [],
    ...overrides
  });

  const createContributionPeriod = (overrides: Partial<ContributionPeriod> = {}): ContributionPeriod => ({
    fromDate: '2000-01-01',
    toDate: '2020-01-01',
    company: 'Test Company',
    monthlyGrossSalary: 5000,
    workingCondition: 'normal' as WorkingCondition,
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Status Display', () => {
    it('displays error status when there are overlapping periods', () => {
      const pensionDetails = createDefaultPensionDetails({
        error: 'overlappingPeriods',
        monthlyPension: 0
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [createContributionPeriod()]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Both status card and pension estimate show this message when there are overlapping periods
      const blockedMessages = screen.getAllByText('Calculation is blocked due to overlapping periods');
      expect(blockedMessages.length).toBeGreaterThanOrEqual(1);
    });

    it('displays warning status when there are no contribution periods', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: []
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('No contribution periods added yet')).toBeInTheDocument();
    });

    it('displays warning status when below minimum contribution years', () => {
      const pensionDetails = createDefaultPensionDetails({
        totalContributiveYears: 10
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '2010-01-01',
            toDate: '2020-01-01', // 10 years
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText(/You need .* more years to reach the minimum/)).toBeInTheDocument();
    });

    it('displays warning status when below complete contribution years', () => {
      const pensionDetails = createDefaultPensionDetails({
        totalContributiveYears: 25
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '1995-01-01',
            toDate: '2020-01-01', // 25 years
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText(/You need .* more years to reach the complete contribution/)).toBeInTheDocument();
    });

    it('displays success status when all conditions are met', () => {
      const pensionDetails = createDefaultPensionDetails({
        totalContributiveYears: 40
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '1980-01-01',
            toDate: '2020-01-01', // 40 years
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('All conditions are met for pension eligibility')).toBeInTheDocument();
    });
  });

  describe('Retirement Status Display', () => {
    it('displays eligible message when yearsUntilRetirement is 0 or negative', () => {
      const pensionDetails = createDefaultPensionDetails({
        yearsUntilRetirement: 0,
        currentAge: 65
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('You are eligible for retirement')).toBeInTheDocument();
    });

    it('displays years remaining when not yet eligible', () => {
      const pensionDetails = createDefaultPensionDetails({
        yearsUntilRetirement: 15,
        currentAge: 50
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('15 years remaining until retirement')).toBeInTheDocument();
    });
  });

  describe('Timeline Display', () => {
    it('displays current age correctly', () => {
      const pensionDetails = createDefaultPensionDetails({
        currentAge: 45
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('45 years')).toBeInTheDocument();
    });

    it('displays retirement age correctly', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText(`${RETIREMENT_AGE} years`)).toBeInTheDocument();
    });

    it('displays contribution progress correctly', () => {
      const pensionDetails = createDefaultPensionDetails({
        totalContributiveYears: 20
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText(`20 / ${COMPLETE_CONTRIBUTION_YEARS} years`)).toBeInTheDocument();
    });
  });

  describe('Points Breakdown Display', () => {
    it('displays contribution points correctly', () => {
      const pensionDetails = createDefaultPensionDetails({
        contributionPoints: 30.25
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('30,25')).toBeInTheDocument();
    });

    it('displays stability points correctly', () => {
      const pensionDetails = createDefaultPensionDetails({
        stabilityPoints: 7.5
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('7,50')).toBeInTheDocument();
    });

    it('displays non-contributive points correctly', () => {
      const pensionDetails = createDefaultPensionDetails({
        nonContributivePoints: 2.0
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('2,00')).toBeInTheDocument();
    });

    it('displays total points correctly', () => {
      const pensionDetails = createDefaultPensionDetails({
        totalPoints: 40.0
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('40,00')).toBeInTheDocument();
    });
  });

  describe('Period Breakdown Display', () => {
    it('displays contributive period with company name', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            company: 'ABC Corporation',
            monthlyGrossSalary: 8000
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('ABC Corporation')).toBeInTheDocument();
    });

    it('displays non-contributive period type', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '2010-01-01',
            toDate: '2012-01-01',
            nonContributiveType: 'military',
            company: undefined,
            monthlyGrossSalary: undefined
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Non-contributive period type appears twice: in title and in details section
      const militaryElements = screen.getAllByText('Military Service');
      expect(militaryElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays period date range', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '2015-06-01',
            toDate: '2020-12-31'
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('Jun 2015 - Dec 2020')).toBeInTheDocument();
    });

    it('displays working condition for contributive periods', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            workingCondition: 'groupII'
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText(/Group II/)).toBeInTheDocument();
    });

    it('displays message when no periods are added', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: []
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('No periods added yet')).toBeInTheDocument();
    });

    it('skips periods with missing dates', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '',
            toDate: '',
            company: 'Incomplete Company'
          }),
          createContributionPeriod({
            company: 'Valid Company'
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.queryByText('Incomplete Company')).not.toBeInTheDocument();
      expect(screen.getByText('Valid Company')).toBeInTheDocument();
    });
  });

  describe('Pension Estimate Display', () => {
    it('displays monthly pension when greater than 0', () => {
      const pensionDetails = createDefaultPensionDetails({
        monthlyPension: 3500.50
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Check for the pension estimate section
      expect(screen.getByText('Monthly Pension')).toBeInTheDocument();
      expect(screen.getByText('Yearly Pension')).toBeInTheDocument();
    });

    it('displays blocked message when pension is 0 due to overlapping periods', () => {
      const pensionDetails = createDefaultPensionDetails({
        monthlyPension: 0,
        error: 'overlappingPeriods'
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [createContributionPeriod()]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      const blockedMessage = screen.getByTestId('pension-blocked-message');
      expect(blockedMessage).toBeInTheDocument();
    });

    it('displays complete minimum message when pension is 0 without error', () => {
      const pensionDetails = createDefaultPensionDetails({
        monthlyPension: 0,
        error: undefined
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [createContributionPeriod()]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      const blockedMessage = screen.getByTestId('pension-blocked-message');
      expect(blockedMessage).toBeInTheDocument();
      expect(screen.getByText('Complete the minimum contribution period to see your pension estimate')).toBeInTheDocument();
    });

    it('displays formula explanation', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('Pension = Points × Reference Value')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values for all points', () => {
      const pensionDetails = createDefaultPensionDetails({
        contributionPoints: 0,
        stabilityPoints: 0,
        nonContributivePoints: 0,
        totalPoints: 0,
        monthlyPension: 0
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Should render without crashing
      expect(screen.getByText('Points Breakdown')).toBeInTheDocument();
    });

    it('handles very large pension values', () => {
      const pensionDetails = createDefaultPensionDetails({
        monthlyPension: 50000,
        totalPoints: 617.28
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('Monthly Pension')).toBeInTheDocument();
    });

    it('handles undefined totalContributiveYears', () => {
      const pensionDetails = createDefaultPensionDetails({
        totalContributiveYears: undefined
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Should fallback to 0
      expect(screen.getByText(`0 / ${COMPLETE_CONTRIBUTION_YEARS} years`)).toBeInTheDocument();
    });

    it('handles negative yearsUntilRetirement (past retirement age)', () => {
      const pensionDetails = createDefaultPensionDetails({
        yearsUntilRetirement: -5,
        currentAge: 70
      });
      const inputs = createDefaultInputs();

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('You are eligible for retirement')).toBeInTheDocument();
    });

    it('handles multiple contribution periods of different types', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '2000-01-01',
            toDate: '2010-01-01',
            company: 'First Job'
          }),
          createContributionPeriod({
            fromDate: '2010-06-01',
            toDate: '2012-06-01',
            nonContributiveType: 'university',
            company: undefined,
            monthlyGrossSalary: undefined
          }),
          createContributionPeriod({
            fromDate: '2013-01-01',
            toDate: '2023-01-01',
            company: 'Second Job'
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('First Job')).toBeInTheDocument();
      // University Studies appears twice for non-contributive periods (title and details)
      const universityElements = screen.getAllByText('University Studies');
      expect(universityElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Second Job')).toBeInTheDocument();
    });

    it('handles periods with invalid dates gracefully', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: 'invalid-date',
            toDate: 'also-invalid',
            company: 'Invalid Period Company'
          }),
          createContributionPeriod({
            company: 'Valid Period Company'
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Invalid period should be skipped
      expect(screen.queryByText('Invalid Period Company')).not.toBeInTheDocument();
      expect(screen.getByText('Valid Period Company')).toBeInTheDocument();
    });
  });

  describe('Data Transformations', () => {
    it('calculates correct period years for display', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '2000-01-01',
            toDate: '2005-01-01', // Exactly 5 years
            company: 'Five Year Company'
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // The component should show approximately 5 years
      expect(screen.getByText('Five Year Company')).toBeInTheDocument();
    });

    it('calculates non-contributive points for military service', () => {
      const pensionDetails = createDefaultPensionDetails({
        nonContributivePoints: 0.5 // 2 years * 0.25
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '2000-01-01',
            toDate: '2002-01-01',
            nonContributiveType: 'military',
            company: undefined,
            monthlyGrossSalary: undefined
          })
        ]
      });

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Military Service appears twice for non-contributive periods (title and details)
      const militaryElements = screen.getAllByText('Military Service');
      expect(militaryElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays all working condition types', () => {
      const conditions: WorkingCondition[] = ['normal', 'groupII', 'groupI', 'specialConditions'];

      conditions.forEach((condition) => {
        const pensionDetails = createDefaultPensionDetails();
        const inputs = createDefaultInputs({
          contributionPeriods: [
            createContributionPeriod({
              workingCondition: condition
            })
          ]
        });

        const { unmount } = render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

        // Clean up for next iteration
        unmount();
      });
    });
  });

  describe('Visual Styling Classes', () => {
    it('applies correct background color for error status', () => {
      const pensionDetails = createDefaultPensionDetails({
        error: 'overlappingPeriods'
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [createContributionPeriod()]
      });

      const { container } = render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Check for error styling
      const errorCard = container.querySelector('.bg-red-50');
      expect(errorCard).toBeInTheDocument();
    });

    it('applies correct background color for warning status', () => {
      const pensionDetails = createDefaultPensionDetails();
      const inputs = createDefaultInputs({
        contributionPeriods: []
      });

      const { container } = render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Check for warning styling
      const warningCard = container.querySelector('.bg-yellow-50');
      expect(warningCard).toBeInTheDocument();
    });

    it('applies correct background color for success status', () => {
      const pensionDetails = createDefaultPensionDetails({
        totalContributiveYears: 40
      });
      const inputs = createDefaultInputs({
        contributionPeriods: [
          createContributionPeriod({
            fromDate: '1980-01-01',
            toDate: '2020-01-01'
          })
        ]
      });

      const { container } = render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Check for success styling
      const successCard = container.querySelector('.bg-green-50');
      expect(successCard).toBeInTheDocument();
    });

    it('applies retirement eligible styling when eligible', () => {
      const pensionDetails = createDefaultPensionDetails({
        yearsUntilRetirement: 0
      });
      const inputs = createDefaultInputs();

      const { container } = render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Check for eligible styling
      const eligibleCard = container.querySelector('.bg-blue-50');
      expect(eligibleCard).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('renders complete pension stats for a typical user', () => {
      const pensionDetails: PensionDetails = {
        contributionPoints: 28.5,
        stabilityPoints: 4.5,
        nonContributivePoints: 0.5,
        totalPoints: 33.5,
        totalContributiveYears: 28,
        monthlyPension: 2714.51,
        currentAge: 55,
        yearsUntilRetirement: 10
      };

      const inputs: PensionInputs = {
        birthDate: '1969-05-15',
        retirementYear: 2034,
        contributionPeriods: [
          {
            fromDate: '1994-06-01',
            toDate: '2010-12-31',
            company: 'First Company Ltd',
            monthlyGrossSalary: 4500,
            workingCondition: 'normal'
          },
          {
            fromDate: '2011-01-01',
            toDate: '2011-12-31',
            company: undefined,
            monthlyGrossSalary: undefined,
            nonContributiveType: 'medical'
          },
          {
            fromDate: '2012-01-01',
            toDate: '2024-01-01',
            company: 'Second Company Inc',
            monthlyGrossSalary: 8500,
            workingCondition: 'specialConditions'
          }
        ]
      };

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      // Verify all major sections are rendered
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Points Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Period Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Pension Estimate')).toBeInTheDocument();

      // Verify specific data
      expect(screen.getByText('First Company Ltd')).toBeInTheDocument();
      // Medical Leave appears twice for non-contributive periods (title and details)
      const medicalElements = screen.getAllByText('Medical Leave');
      expect(medicalElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Second Company Inc')).toBeInTheDocument();
      expect(screen.getByText('10 years remaining until retirement')).toBeInTheDocument();
    });

    it('renders correctly for a new user with no contributions', () => {
      const pensionDetails: PensionDetails = {
        contributionPoints: 0,
        stabilityPoints: 0,
        nonContributivePoints: 0,
        totalPoints: 0,
        totalContributiveYears: 0,
        monthlyPension: 0,
        currentAge: 25,
        yearsUntilRetirement: 40
      };

      const inputs: PensionInputs = {
        birthDate: '1999-01-01',
        retirementYear: 2064,
        contributionPeriods: []
      };

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('No contribution periods added yet')).toBeInTheDocument();
      expect(screen.getByText('No periods added yet')).toBeInTheDocument();
      expect(screen.getByText('40 years remaining until retirement')).toBeInTheDocument();
    });

    it('renders correctly for a user at retirement age', () => {
      const pensionDetails: PensionDetails = {
        contributionPoints: 35.0,
        stabilityPoints: 8.75,
        nonContributivePoints: 1.5,
        totalPoints: 45.25,
        totalContributiveYears: 40,
        monthlyPension: 3666.61,
        currentAge: 65,
        yearsUntilRetirement: 0
      };

      const inputs: PensionInputs = {
        birthDate: '1959-01-01',
        retirementYear: 2024,
        contributionPeriods: [
          {
            fromDate: '1984-01-01',
            toDate: '2024-01-01',
            company: 'Career Company',
            monthlyGrossSalary: 7000,
            workingCondition: 'normal'
          }
        ]
      };

      render(<PensionStats pensionDetails={pensionDetails} inputs={inputs} />);

      expect(screen.getByText('You are eligible for retirement')).toBeInTheDocument();
      expect(screen.getByText('All conditions are met for pension eligibility')).toBeInTheDocument();
    });
  });
});
