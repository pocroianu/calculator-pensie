import { useState, useEffect } from 'react';
import { PensionInputs } from '../types/pensionTypes';
import { 
  calculateMonthlyPension, 
} from '../utils/pensionCalculations';
import { isRetired } from '../utils/dateCalculations';

const REFERENCE_VALUE_2024 = 81.03;
const AVERAGE_GROSS_SALARY_2024 = 6789; // Romanian average gross salary 2024

export interface PensionDetails {
  contributionPoints: number;
  stabilityPoints: number;
  totalPoints: number;
}

export const usePensionCalculator = () => {
  const currentYear = new Date().getFullYear();
  
  const [inputs, setInputs] = useState<PensionInputs>({
    birthDate: '1996-08-26',
    retirementYear: 65,
    contributionPeriods: [
      {
        fromDate: '2015-09-01' ,
        toDate: '2019-06-30',
        nonContributiveType: 'university',
      },
      {
        fromDate: '2018-01-01' ,
        toDate: '2020-12-31',
        company: 'ISoftbet',
        monthlyGrossSalary: 6000,
        workingCondition: 'normal'
      },
      {
        fromDate: '2021-01-01' ,
        toDate: '2060-12-31',
        company: 'Elektrobit',
        monthlyGrossSalary: 10000,
        workingCondition: 'normal'
      }
    ]
  });

  const [monthlyPension, setMonthlyPension] = useState<number>(0);
  const [yearlyPension, setYearlyPension] = useState<number>(0);
  const [pensionDetails, setPensionDetails] = useState<PensionDetails>({
    contributionPoints: 0,
    stabilityPoints: 0,
    totalPoints: 0
  });

  useEffect(() => {
    // Calculate pension
    const result = calculateMonthlyPension(
      inputs.contributionPeriods,
      inputs.birthDate,
    );

    setMonthlyPension(result.monthlyPension);
    setYearlyPension(result.monthlyPension * 12);
    setPensionDetails(result.details);
  }, [inputs]);

  const handleInputChange = (field: keyof PensionInputs, value: any) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    inputs,
    handleInputChange,
    monthlyPension,
    yearlyPension,
    pensionDetails,
    averageGrossSalary: AVERAGE_GROSS_SALARY_2024
  };
};