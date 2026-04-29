/**
 * Comprehensive test suite for working conditions calculations
 *
 * This test suite covers:
 * - All group types (normal, groupI, groupII, specialConditions)
 * - Bonus point multipliers (1.0, 1.25, 1.50)
 * - Edge cases and boundary conditions
 * - Bonus point accumulation across multiple periods
 * - Integration with pension calculation
 */

import {
  calculateMonthlyPension,
  calculateContributionPoint,
  getWorkingConditionMultiplier,
  getWorkingConditionBonusPercentage,
  GROUP_II_BONUS,
  GROUP_I_BONUS,
  SPECIAL_CONDITIONS_BONUS,
  REFERENCE_VALUE_2024,
  MINIMUM_CONTRIBUTION_YEARS,
} from '../pensionCalculations';
import { ContributionPeriod, WorkingCondition } from '../../types/pensionTypes';

describe('Working Conditions Calculations', () => {
  // Standard birth date for testing (person born in 1970 - will be working age for most test periods)
  const standardBirthDate = '1970-01-01';

  // Helper function to create a contribution period
  const createContributionPeriod = (
    fromDate: string,
    toDate: string,
    salary: number,
    workingCondition: WorkingCondition = 'normal'
  ): ContributionPeriod => ({
    fromDate,
    toDate,
    monthlyGrossSalary: salary,
    workingCondition,
  });

  describe('getWorkingConditionMultiplier', () => {
    describe('should return correct multipliers for all working condition types', () => {
      it('returns 1.0 for normal working conditions', () => {
        expect(getWorkingConditionMultiplier('normal')).toBe(1.0);
      });

      it('returns 1.25 for Group II working conditions', () => {
        expect(getWorkingConditionMultiplier('groupII')).toBe(1.25);
      });

      it('returns 1.50 for Group I working conditions', () => {
        expect(getWorkingConditionMultiplier('groupI')).toBe(1.50);
      });

      it('returns 1.50 for special conditions', () => {
        expect(getWorkingConditionMultiplier('specialConditions')).toBe(1.50);
      });
    });

    describe('should handle edge cases', () => {
      it('returns 1.0 for undefined working condition', () => {
        expect(getWorkingConditionMultiplier(undefined)).toBe(1.0);
      });

      it('returns 1.0 for empty string', () => {
        expect(getWorkingConditionMultiplier('')).toBe(1.0);
      });

      it('returns 1.0 for invalid working condition', () => {
        expect(getWorkingConditionMultiplier('invalid' as WorkingCondition)).toBe(1.0);
      });

      it('returns 1.0 for null (edge case)', () => {
        expect(getWorkingConditionMultiplier(null as unknown as string)).toBe(1.0);
      });
    });

    describe('should match defined bonus constants', () => {
      it('Group II multiplier equals 1 + GROUP_II_BONUS', () => {
        expect(getWorkingConditionMultiplier('groupII')).toBe(1 + GROUP_II_BONUS);
      });

      it('Group I multiplier equals 1 + GROUP_I_BONUS', () => {
        expect(getWorkingConditionMultiplier('groupI')).toBe(1 + GROUP_I_BONUS);
      });

      it('Special conditions multiplier equals 1 + SPECIAL_CONDITIONS_BONUS', () => {
        expect(getWorkingConditionMultiplier('specialConditions')).toBe(1 + SPECIAL_CONDITIONS_BONUS);
      });
    });
  });

  describe('getWorkingConditionBonusPercentage', () => {
    describe('should return correct bonus percentages for all working conditions', () => {
      it('returns 0% for normal working conditions', () => {
        expect(getWorkingConditionBonusPercentage('normal')).toBe(0);
      });

      it('returns 25% for Group II working conditions', () => {
        expect(getWorkingConditionBonusPercentage('groupII')).toBe(25);
      });

      it('returns 50% for Group I working conditions', () => {
        expect(getWorkingConditionBonusPercentage('groupI')).toBe(50);
      });

      it('returns 50% for special conditions', () => {
        expect(getWorkingConditionBonusPercentage('specialConditions')).toBe(50);
      });
    });

    describe('should handle edge cases', () => {
      it('returns 0 for undefined working condition', () => {
        expect(getWorkingConditionBonusPercentage(undefined)).toBe(0);
      });

      it('returns 0 for empty string', () => {
        expect(getWorkingConditionBonusPercentage('')).toBe(0);
      });

      it('returns 0 for invalid working condition', () => {
        expect(getWorkingConditionBonusPercentage('invalid' as WorkingCondition)).toBe(0);
      });
    });

    describe('should be consistent with multiplier function', () => {
      it('Group II: bonus percentage / 100 should equal multiplier - 1', () => {
        const percentage = getWorkingConditionBonusPercentage('groupII') / 100;
        const multiplier = getWorkingConditionMultiplier('groupII') - 1;
        expect(percentage).toBe(multiplier);
      });

      it('Group I: bonus percentage / 100 should equal multiplier - 1', () => {
        const percentage = getWorkingConditionBonusPercentage('groupI') / 100;
        const multiplier = getWorkingConditionMultiplier('groupI') - 1;
        expect(percentage).toBe(multiplier);
      });

      it('Special conditions: bonus percentage / 100 should equal multiplier - 1', () => {
        const percentage = getWorkingConditionBonusPercentage('specialConditions') / 100;
        const multiplier = getWorkingConditionMultiplier('specialConditions') - 1;
        expect(percentage).toBe(multiplier);
      });
    });
  });

  describe('Bonus Point Accumulation', () => {
    describe('should apply correct bonus multipliers to contribution points', () => {
      // Using a long period (20 years) to meet minimum contribution requirements
      const basePeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal');

      it('normal conditions should not increase points (multiplier 1.0)', () => {
        const periods: ContributionPeriod[] = [basePeriod];
        const result = calculateMonthlyPension(periods, standardBirthDate);

        expect(result.details.contributionPoints).toBeGreaterThan(0);
        expect(result.details.error).toBeUndefined();
      });

      it('Group II should increase points by 25%', () => {
        const normalPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal');
        const groupIIPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'groupII');

        const normalResult = calculateMonthlyPension([normalPeriod], standardBirthDate);
        const groupIIResult = calculateMonthlyPension([groupIIPeriod], standardBirthDate);

        const expectedRatio = 1.25;
        const actualRatio = groupIIResult.details.contributionPoints / normalResult.details.contributionPoints;

        expect(actualRatio).toBeCloseTo(expectedRatio, 2);
      });

      it('Group I should increase points by 50%', () => {
        const normalPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal');
        const groupIPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'groupI');

        const normalResult = calculateMonthlyPension([normalPeriod], standardBirthDate);
        const groupIResult = calculateMonthlyPension([groupIPeriod], standardBirthDate);

        const expectedRatio = 1.50;
        const actualRatio = groupIResult.details.contributionPoints / normalResult.details.contributionPoints;

        expect(actualRatio).toBeCloseTo(expectedRatio, 2);
      });

      it('Special conditions should increase points by 50%', () => {
        const normalPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal');
        const specialPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'specialConditions');

        const normalResult = calculateMonthlyPension([normalPeriod], standardBirthDate);
        const specialResult = calculateMonthlyPension([specialPeriod], standardBirthDate);

        const expectedRatio = 1.50;
        const actualRatio = specialResult.details.contributionPoints / normalResult.details.contributionPoints;

        expect(actualRatio).toBeCloseTo(expectedRatio, 2);
      });

      it('Group I and special conditions should produce same point increase', () => {
        const groupIPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'groupI');
        const specialPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'specialConditions');

        const groupIResult = calculateMonthlyPension([groupIPeriod], standardBirthDate);
        const specialResult = calculateMonthlyPension([specialPeriod], standardBirthDate);

        expect(groupIResult.details.contributionPoints).toBe(specialResult.details.contributionPoints);
      });
    });

    describe('should correctly accumulate points across multiple periods with different conditions', () => {
      it('should sum points from multiple periods with different working conditions', () => {
        // Create periods that together meet minimum contribution years
        const periods: ContributionPeriod[] = [
          createContributionPeriod('2000-01-01', '2005-01-01', 5000, 'normal'),      // 5 years normal
          createContributionPeriod('2005-01-01', '2010-01-01', 5000, 'groupII'),     // 5 years Group II
          createContributionPeriod('2010-01-01', '2015-01-01', 5000, 'groupI'),      // 5 years Group I
          createContributionPeriod('2015-01-01', '2020-01-01', 5000, 'specialConditions'), // 5 years special
        ];

        const result = calculateMonthlyPension(periods, standardBirthDate);

        expect(result.details.contributionPoints).toBeGreaterThan(0);
        expect(result.details.error).toBeUndefined();
        expect(result.details.totalContributiveYears).toBeCloseTo(20, 1);
      });

      it('mixed conditions should produce intermediate point totals', () => {
        // All normal
        const allNormal: ContributionPeriod[] = [
          createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal'),
        ];

        // All Group I
        const allGroupI: ContributionPeriod[] = [
          createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'groupI'),
        ];

        // Half normal, half Group I
        const mixed: ContributionPeriod[] = [
          createContributionPeriod('2000-01-01', '2010-01-01', 5000, 'normal'),
          createContributionPeriod('2010-01-01', '2020-01-01', 5000, 'groupI'),
        ];

        const normalResult = calculateMonthlyPension(allNormal, standardBirthDate);
        const groupIResult = calculateMonthlyPension(allGroupI, standardBirthDate);
        const mixedResult = calculateMonthlyPension(mixed, standardBirthDate);

        // Mixed should be between all normal and all Group I
        expect(mixedResult.details.contributionPoints).toBeGreaterThan(normalResult.details.contributionPoints);
        expect(mixedResult.details.contributionPoints).toBeLessThan(groupIResult.details.contributionPoints);
      });
    });
  });

  describe('Edge Cases', () => {
    describe('minimum contribution years boundary', () => {
      it('should return error when below minimum contribution years', () => {
        const period = createContributionPeriod('2010-01-01', '2020-01-01', 5000, 'groupI'); // Only 10 years
        const result = calculateMonthlyPension([period], standardBirthDate);

        expect(result.details.error).toBeDefined();
        expect(result.details.error).toContain('minimum contribution period');
        expect(result.monthlyPension).toBe(0);
      });

      it('should calculate pension when exactly at minimum contribution years', () => {
        const period = createContributionPeriod('2000-01-01', '2015-01-01', 5000, 'normal'); // Exactly 15 years
        const result = calculateMonthlyPension([period], standardBirthDate);

        // Should be at or above minimum
        expect(result.details.totalContributiveYears).toBeGreaterThanOrEqual(MINIMUM_CONTRIBUTION_YEARS - 0.1);
        expect(result.monthlyPension).toBeGreaterThan(0);
      });

      it('working condition bonus should apply even at minimum contribution years', () => {
        const normalPeriod = createContributionPeriod('2000-01-01', '2015-01-01', 5000, 'normal');
        const groupIIPeriod = createContributionPeriod('2000-01-01', '2015-01-01', 5000, 'groupII');

        const normalResult = calculateMonthlyPension([normalPeriod], standardBirthDate);
        const groupIIResult = calculateMonthlyPension([groupIIPeriod], standardBirthDate);

        // Group II should have 25% more contribution points
        expect(groupIIResult.details.contributionPoints).toBeGreaterThan(normalResult.details.contributionPoints);
      });
    });

    describe('salary variations', () => {
      it('should handle very low salary with working conditions', () => {
        const period = createContributionPeriod('2000-01-01', '2020-01-01', 100, 'groupI');
        const result = calculateMonthlyPension([period], standardBirthDate);

        expect(result.details.contributionPoints).toBeGreaterThan(0);
        expect(result.monthlyPension).toBeGreaterThan(0);
      });

      it('should handle high salary with working conditions', () => {
        const period = createContributionPeriod('2000-01-01', '2020-01-01', 50000, 'groupI');
        const result = calculateMonthlyPension([period], standardBirthDate);

        expect(result.details.contributionPoints).toBeGreaterThan(0);
        expect(result.monthlyPension).toBeGreaterThan(0);
      });

      it('bonus multiplier should scale proportionally with salary', () => {
        const lowSalaryNormal = createContributionPeriod('2000-01-01', '2020-01-01', 1000, 'normal');
        const lowSalaryGroupI = createContributionPeriod('2000-01-01', '2020-01-01', 1000, 'groupI');
        const highSalaryNormal = createContributionPeriod('2000-01-01', '2020-01-01', 10000, 'normal');
        const highSalaryGroupI = createContributionPeriod('2000-01-01', '2020-01-01', 10000, 'groupI');

        const lowNormalResult = calculateMonthlyPension([lowSalaryNormal], standardBirthDate);
        const lowGroupIResult = calculateMonthlyPension([lowSalaryGroupI], standardBirthDate);
        const highNormalResult = calculateMonthlyPension([highSalaryNormal], standardBirthDate);
        const highGroupIResult = calculateMonthlyPension([highSalaryGroupI], standardBirthDate);

        // The ratio between Group I and normal should be the same regardless of salary
        const lowRatio = lowGroupIResult.details.contributionPoints / lowNormalResult.details.contributionPoints;
        const highRatio = highGroupIResult.details.contributionPoints / highNormalResult.details.contributionPoints;

        expect(lowRatio).toBeCloseTo(highRatio, 2);
      });
    });

    describe('period boundaries', () => {
      it('should handle periods spanning many years with different conditions', () => {
        const periods: ContributionPeriod[] = [
          createContributionPeriod('1995-01-01', '2005-01-01', 3000, 'groupII'), // 10 years
          createContributionPeriod('2005-01-01', '2015-01-01', 5000, 'groupI'),  // 10 years
        ];

        const result = calculateMonthlyPension(periods, standardBirthDate);

        expect(result.details.totalContributiveYears).toBeCloseTo(20, 1);
        expect(result.details.contributionPoints).toBeGreaterThan(0);
      });

      it('should handle short periods with different working conditions', () => {
        // Many short periods that together meet minimum
        const periods: ContributionPeriod[] = [
          createContributionPeriod('2000-01-01', '2002-01-01', 5000, 'normal'),
          createContributionPeriod('2002-01-01', '2004-01-01', 5000, 'groupII'),
          createContributionPeriod('2004-01-01', '2006-01-01', 5000, 'groupI'),
          createContributionPeriod('2006-01-01', '2008-01-01', 5000, 'specialConditions'),
          createContributionPeriod('2008-01-01', '2010-01-01', 5000, 'normal'),
          createContributionPeriod('2010-01-01', '2012-01-01', 5000, 'groupII'),
          createContributionPeriod('2012-01-01', '2014-01-01', 5000, 'groupI'),
          createContributionPeriod('2014-01-01', '2016-01-01', 5000, 'normal'),
        ];

        const result = calculateMonthlyPension(periods, standardBirthDate);

        expect(result.details.totalContributiveYears).toBeCloseTo(16, 1);
        expect(result.monthlyPension).toBeGreaterThan(0);
      });
    });

    describe('missing or invalid working condition', () => {
      it('should treat undefined working condition as normal', () => {
        const periodWithCondition = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal');
        const periodWithoutCondition: ContributionPeriod = {
          fromDate: '2000-01-01',
          toDate: '2020-01-01',
          monthlyGrossSalary: 5000,
          // workingCondition is undefined
        };

        const withResult = calculateMonthlyPension([periodWithCondition], standardBirthDate);
        const withoutResult = calculateMonthlyPension([periodWithoutCondition], standardBirthDate);

        expect(withResult.details.contributionPoints).toBe(withoutResult.details.contributionPoints);
      });
    });
  });

  describe('Pension Calculation Integration', () => {
    describe('working conditions should affect final pension amount', () => {
      it('Group I pension should be 50% higher than normal (contribution points)', () => {
        const normalPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal');
        const groupIPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'groupI');

        const normalResult = calculateMonthlyPension([normalPeriod], standardBirthDate);
        const groupIResult = calculateMonthlyPension([groupIPeriod], standardBirthDate);

        // Since pension = totalPoints * REFERENCE_VALUE_2024, and contribution points are 50% higher
        // The difference in pension should reflect the bonus in contribution points
        // Note: stability points are the same, so total ratio won't be exactly 1.5
        expect(groupIResult.details.contributionPoints).toBeCloseTo(normalResult.details.contributionPoints * 1.5, 1);
      });

      it('Group II pension should be 25% higher than normal (contribution points)', () => {
        const normalPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal');
        const groupIIPeriod = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'groupII');

        const normalResult = calculateMonthlyPension([normalPeriod], standardBirthDate);
        const groupIIResult = calculateMonthlyPension([groupIIPeriod], standardBirthDate);

        expect(groupIIResult.details.contributionPoints).toBeCloseTo(normalResult.details.contributionPoints * 1.25, 1);
      });

      it('pension formula should use REFERENCE_VALUE_2024', () => {
        const period = createContributionPeriod('2000-01-01', '2020-01-01', 5000, 'normal');
        const result = calculateMonthlyPension([period], standardBirthDate);

        // monthlyPension should equal totalPoints * REFERENCE_VALUE_2024
        const expectedPension = result.details.totalPoints * REFERENCE_VALUE_2024;
        expect(result.monthlyPension).toBeCloseTo(expectedPension, 2);
      });
    });

    describe('stability points should not be affected by working condition', () => {
      it('stability points should be the same regardless of working condition', () => {
        const normalPeriod = createContributionPeriod('1996-01-01', '2030-01-01', 5000, 'normal');
        const groupIPeriod = createContributionPeriod('1996-01-01', '2030-01-01', 5000, 'groupI');
        const groupIIPeriod = createContributionPeriod('1996-01-01', '2030-01-01', 5000, 'groupII');

        const normalResult = calculateMonthlyPension([normalPeriod], standardBirthDate);
        const groupIResult = calculateMonthlyPension([groupIPeriod], standardBirthDate);
        const groupIIResult = calculateMonthlyPension([groupIIPeriod], standardBirthDate);

        // Stability points should be equal across all conditions
        expect(groupIResult.details.stabilityPoints).toBe(normalResult.details.stabilityPoints);
        expect(groupIIResult.details.stabilityPoints).toBe(normalResult.details.stabilityPoints);
      });
    });
  });

  describe('Non-contributive Periods', () => {
    it('non-contributive periods should not have working condition bonus applied', () => {
      const contributivePeriod = createContributionPeriod('2000-01-01', '2018-01-01', 5000, 'groupI');
      const nonContributivePeriod: ContributionPeriod = {
        fromDate: '2018-01-01',
        toDate: '2020-01-01',
        nonContributiveType: 'university',
      };

      const result = calculateMonthlyPension([contributivePeriod, nonContributivePeriod], standardBirthDate);

      // Non-contributive points should be 0.25 per year for university
      const expectedNonContributivePoints = 2 * 0.25; // 2 years * 0.25 points/year
      expect(result.details.nonContributivePoints).toBeCloseTo(expectedNonContributivePoints, 2);
    });

    it('mixed contributive and non-contributive periods should calculate correctly', () => {
      const periods: ContributionPeriod[] = [
        createContributionPeriod('2000-01-01', '2015-01-01', 5000, 'groupII'), // 15 years contributive
        {
          fromDate: '2015-01-01',
          toDate: '2017-01-01',
          nonContributiveType: 'military',
        },
      ];

      const result = calculateMonthlyPension(periods, standardBirthDate);

      expect(result.details.contributionPoints).toBeGreaterThan(0);
      expect(result.details.nonContributivePoints).toBeGreaterThan(0);
      expect(result.monthlyPension).toBeGreaterThan(0);
    });
  });

  describe('Constants Verification', () => {
    it('GROUP_II_BONUS should be 0.25 (25%)', () => {
      expect(GROUP_II_BONUS).toBe(0.25);
    });

    it('GROUP_I_BONUS should be 0.50 (50%)', () => {
      expect(GROUP_I_BONUS).toBe(0.50);
    });

    it('SPECIAL_CONDITIONS_BONUS should be 0.50 (50%)', () => {
      expect(SPECIAL_CONDITIONS_BONUS).toBe(0.50);
    });

    it('REFERENCE_VALUE_2024 should be 81.03', () => {
      expect(REFERENCE_VALUE_2024).toBe(81.03);
    });

    it('MINIMUM_CONTRIBUTION_YEARS should be 15', () => {
      expect(MINIMUM_CONTRIBUTION_YEARS).toBe(15);
    });
  });

  describe('Calculation Point Function', () => {
    describe('calculateContributionPoint', () => {
      it('should return 1 when salary equals average salary', () => {
        expect(calculateContributionPoint(5000, 5000)).toBe(1);
      });

      it('should return 2 when salary is double the average', () => {
        expect(calculateContributionPoint(10000, 5000)).toBe(2);
      });

      it('should return 0.5 when salary is half the average', () => {
        expect(calculateContributionPoint(2500, 5000)).toBe(0.5);
      });

      it('should handle decimal results correctly', () => {
        const result = calculateContributionPoint(7500, 5000);
        expect(result).toBe(1.5);
      });
    });
  });

  describe('Working Condition Ranking', () => {
    it('should have Group I >= Special Conditions >= Group II > Normal for multipliers', () => {
      const normalMultiplier = getWorkingConditionMultiplier('normal');
      const groupIIMultiplier = getWorkingConditionMultiplier('groupII');
      const groupIMultiplier = getWorkingConditionMultiplier('groupI');
      const specialMultiplier = getWorkingConditionMultiplier('specialConditions');

      expect(normalMultiplier).toBe(1.0);
      expect(groupIIMultiplier).toBeGreaterThan(normalMultiplier);
      expect(groupIMultiplier).toBeGreaterThanOrEqual(groupIIMultiplier);
      expect(specialMultiplier).toBeGreaterThanOrEqual(groupIIMultiplier);
      expect(groupIMultiplier).toBe(specialMultiplier);
    });
  });
});
