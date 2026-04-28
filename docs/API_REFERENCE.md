# API Reference

Complete technical reference for the Romanian Pension Calculator's calculation engine.

## Table of Contents

1. [Core Types](#core-types)
2. [Pension Calculation Functions](#pension-calculation-functions)
3. [Historical Salary Functions](#historical-salary-functions)
4. [Validation Functions](#validation-functions)
5. [Constants](#constants)
6. [Usage Examples](#usage-examples)

---

## Core Types

### `WorkingCondition`

```typescript
type WorkingCondition = 'normal' | 'groupII' | 'groupI' | 'specialConditions';
```

Represents the working conditions during an employment period. Different conditions affect the bonus multiplier applied to contribution points.

| Value | Description | Bonus |
|-------|-------------|-------|
| `'normal'` | Standard working conditions | 0% |
| `'groupII'` | Difficult working conditions | 25% |
| `'groupI'` | Very difficult working conditions | 50% |
| `'specialConditions'` | Hazardous/special circumstances | 50% |

### `NonContributivePeriodType`

```typescript
type NonContributivePeriodType = 'military' | 'university' | 'childCare' | 'medical' | '';
```

Represents types of non-contributive periods that still count toward pension points.

| Value | Description | Points per Year |
|-------|-------------|-----------------|
| `'military'` | Mandatory military service | 0.25 |
| `'university'` | Full-time university studies | 0.25 |
| `'childCare'` | Child care leave | 0.25 |
| `'medical'` | Extended medical leave | 0.20 |
| `''` | Not a non-contributive period | N/A |

### `ContributionPeriod`

```typescript
interface ContributionPeriod {
  fromDate: string;                              // Start date (YYYY-MM-DD format)
  toDate: string;                                // End date (YYYY-MM-DD format)
  company?: string;                              // Employer name (optional)
  monthlyGrossSalary?: number;                   // Monthly gross salary in RON
  workingCondition?: WorkingCondition;           // Working condition type
  nonContributiveType?: NonContributivePeriodType; // Non-contributive period type
}
```

Represents a single contribution period in a person's work history.

**Note:** If `nonContributiveType` is set, the period is treated as non-contributive, and `monthlyGrossSalary` is ignored.

### `PensionInputs`

```typescript
interface PensionInputs {
  birthDate: string;                             // Birth date (YYYY-MM-DD format)
  retirementYear: number;                        // Expected retirement year
  contributionPeriods: ContributionPeriod[];     // Array of contribution periods
}
```

Complete input data required for pension calculation.

### `PensionDetails`

```typescript
interface PensionDetails {
  contributionPoints: number;      // Points from salary contributions
  stabilityPoints: number;         // Bonus points for long-term contributions
  nonContributivePoints: number;   // Points from non-contributive periods
  totalPoints: number;             // Sum of all points
  totalContributiveYears?: number; // Total years with salary contributions
  monthlyPension: number;          // Calculated monthly pension in RON
  currentAge?: number;             // Current age of the person
  yearsUntilRetirement?: number;   // Years remaining until retirement age (65)
  error?: string;                  // Error message if calculation failed
}
```

Detailed breakdown of pension calculation results.

---

## Pension Calculation Functions

### `calculateMonthlyPension`

Main function for calculating the monthly pension based on contribution periods.

```typescript
function calculateMonthlyPension(
  contributionPeriods: ContributionPeriod[],
  birthDate: string
): {
  monthlyPension: number;
  details: PensionDetails;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `contributionPeriods` | `ContributionPeriod[]` | Array of all contribution periods |
| `birthDate` | `string` | Birth date in YYYY-MM-DD format |

#### Returns

An object containing:
- `monthlyPension`: The calculated monthly pension in RON
- `details`: Complete breakdown of the calculation (see `PensionDetails`)

#### Example

```typescript
import { calculateMonthlyPension } from './utils/pensionCalculations';

const result = calculateMonthlyPension(
  [
    {
      fromDate: '2000-01-01',
      toDate: '2024-12-31',
      monthlyGrossSalary: 5000,
      workingCondition: 'normal'
    }
  ],
  '1960-05-15'
);

console.log(result.monthlyPension);        // 2547.23
console.log(result.details.totalPoints);   // 31.43
```

---

### `calculateContributionPoint`

Calculates a single month's contribution point.

```typescript
function calculateContributionPoint(
  monthlyGrossSalary: number,
  averageGrossSalary: number
): number
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `monthlyGrossSalary` | `number` | Individual's monthly gross salary in RON |
| `averageGrossSalary` | `number` | National average gross salary for that month |

#### Returns

The contribution point value (ratio of individual salary to national average).

#### Formula

```
Point = monthlyGrossSalary / averageGrossSalary
```

#### Example

```typescript
const point = calculateContributionPoint(10000, 7567);
console.log(point); // 1.322 (earning 32.2% above average)
```

---

### `calculateStabilityPoints`

Calculates stability bonus points based on age and contribution duration.

```typescript
function calculateStabilityPoints(
  contributionPeriods: ContributionPeriod[],
  birthDate: string
): number
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `contributionPeriods` | `ContributionPeriod[]` | Array of contributive periods only (non-contributive filtered out) |
| `birthDate` | `string` | Birth date in YYYY-MM-DD format |

#### Returns

Total stability points earned based on age tiers.

#### Age-Based Point Tiers

| Age Range | Points per Year |
|-----------|-----------------|
| 26-30 years old | 0.50 |
| 31-35 years old | 0.75 |
| 36+ years old | 1.00 |

**Note:** Stability points only accrue after the minimum 15 years of contribution have been reached.

---

### `getWorkingConditionMultiplier`

Returns the multiplier applied to contribution points based on working conditions.

```typescript
function getWorkingConditionMultiplier(
  workingCondition?: string
): number
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `workingCondition` | `string \| undefined` | The working condition type |

#### Returns

| Condition | Multiplier |
|-----------|------------|
| `'normal'` or undefined | 1.00 |
| `'groupII'` | 1.25 |
| `'groupI'` | 1.50 |
| `'specialConditions'` | 1.50 |

---

### `getWorkingConditionBonusPercentage`

Returns the bonus percentage for display purposes.

```typescript
function getWorkingConditionBonusPercentage(
  workingCondition?: string
): number
```

#### Returns

| Condition | Percentage |
|-----------|------------|
| `'normal'` or undefined | 0 |
| `'groupII'` | 25 |
| `'groupI'` | 50 |
| `'specialConditions'` | 50 |

---

## Historical Salary Functions

### `getAverageSalaryForYear`

Retrieves the national average gross salary for a specific year.

```typescript
function getAverageSalaryForYear(year: number): number
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | `number` | The year to look up (1990-2025) |

#### Returns

The average gross monthly salary in RON for that year.

#### Behavior

- Returns exact value if year is in historical data (1990-2025)
- Returns earliest available value for years before 1990
- Returns latest available value (2025 projected) for future years
- Uses linear interpolation for any gaps in data

#### Example

```typescript
getAverageSalaryForYear(2024);  // 7567
getAverageSalaryForYear(2000);  // 620
getAverageSalaryForYear(1995);  // 195
```

---

### `getWeightedAverageSalaryForPeriod`

Calculates the weighted average salary for a date range spanning multiple years.

```typescript
function getWeightedAverageSalaryForPeriod(
  fromDate: string,
  toDate: string
): number
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fromDate` | `string` | Start date (YYYY-MM-DD) |
| `toDate` | `string` | End date (YYYY-MM-DD) |

#### Returns

The weighted average salary based on months spent in each year.

---

### `calculateHistoricalContributionPoints`

Calculates contribution points for a period using year-by-year historical salary data.

```typescript
function calculateHistoricalContributionPoints(
  monthlyGrossSalary: number,
  fromDate: string,
  toDate: string
): number
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `monthlyGrossSalary` | `number` | The person's salary during this period |
| `fromDate` | `string` | Period start date (YYYY-MM-DD) |
| `toDate` | `string` | Period end date (YYYY-MM-DD) |

#### Returns

Total contribution points for the entire period.

#### Algorithm

1. Iterate through each year in the period
2. Calculate months spent in each year
3. Get the national average salary for each year
4. Calculate yearly points: `(salary / avgSalary) × (months / 12)`
5. Sum all yearly points

#### Example

```typescript
// Calculate points for someone earning 8000 RON from 2020-2024
const points = calculateHistoricalContributionPoints(
  8000,
  '2020-01-01',
  '2024-12-31'
);
console.log(points); // ~5.89 points
```

---

## Validation Functions

### `validatePensionForm`

Validates the complete pension input form.

```typescript
function validatePensionForm(
  inputs: PensionInputs
): FormValidationResult
```

#### Returns

```typescript
interface FormValidationResult {
  isValid: boolean;                              // Overall validity
  errors: ValidationError[];                     // Global form errors
  periodErrors: Map<number, ValidationError[]>;  // Per-period errors
  hasOverlaps: boolean;                          // Whether periods overlap
  overlappingPeriods: [number, number][];        // Pairs of overlapping period indices
}
```

### `validateContributionPeriod`

Validates a single contribution period.

```typescript
function validateContributionPeriod(
  period: ContributionPeriod,
  index: number
): PeriodValidationResult
```

### `findOverlappingPeriods`

Finds all pairs of overlapping contribution periods.

```typescript
function findOverlappingPeriods(
  periods: ContributionPeriod[]
): [number, number][]
```

### `doPeriodsOverlap`

Checks if two periods overlap.

```typescript
function doPeriodsOverlap(
  period1: ContributionPeriod,
  period2: ContributionPeriod
): boolean
```

---

## Constants

### Pension System Constants

```typescript
// Reference point value (VPR) as of September 1, 2024
const REFERENCE_VALUE_2024 = 81.03;  // Lei

// Working condition bonuses
const GROUP_II_BONUS = 0.25;           // 25% bonus
const GROUP_I_BONUS = 0.50;            // 50% bonus
const SPECIAL_CONDITIONS_BONUS = 0.50; // 50% bonus

// Contribution requirements (Article 47)
const MINIMUM_CONTRIBUTION_YEARS = 15;   // Minimum years to qualify
const COMPLETE_CONTRIBUTION_YEARS = 35;  // Full contribution period
const RETIREMENT_AGE = 65;               // Standard retirement age
```

### Stability Point Tiers

```typescript
// Age ranges for stability point tiers
const TIER1_START = 26;
const TIER1_END = 30;
const TIER2_START = 31;
const TIER2_END = 35;
const TIER3_START = 36;
const TIER3_END = 40;

// Points per year for each tier
const TIER1_POINTS = 0.50;  // Ages 26-30
const TIER2_POINTS = 0.75;  // Ages 31-35
const TIER3_POINTS = 1.00;  // Ages 36+
```

### Current Average Salary

```typescript
const CURRENT_AVERAGE_SALARY = 7567;  // RON (2024)
```

---

## Usage Examples

### Basic Pension Calculation

```typescript
import { calculateMonthlyPension } from './utils/pensionCalculations';

// Person born in 1970, worked from 2000-2024 with normal conditions
const result = calculateMonthlyPension(
  [
    {
      fromDate: '2000-01-01',
      toDate: '2024-12-31',
      monthlyGrossSalary: 5000,
      workingCondition: 'normal'
    }
  ],
  '1970-03-15'
);

console.log(`Monthly Pension: ${result.monthlyPension.toFixed(2)} RON`);
console.log(`Total Points: ${result.details.totalPoints.toFixed(2)}`);
console.log(`Contribution Points: ${result.details.contributionPoints.toFixed(2)}`);
console.log(`Stability Points: ${result.details.stabilityPoints.toFixed(2)}`);
```

### Multiple Periods with Different Conditions

```typescript
const result = calculateMonthlyPension(
  [
    // Early career - normal conditions
    {
      fromDate: '1995-01-01',
      toDate: '2005-12-31',
      monthlyGrossSalary: 1500,
      workingCondition: 'normal'
    },
    // Factory work - Group II conditions (25% bonus)
    {
      fromDate: '2006-01-01',
      toDate: '2015-12-31',
      monthlyGrossSalary: 3000,
      workingCondition: 'groupII'
    },
    // Mining work - Group I conditions (50% bonus)
    {
      fromDate: '2016-01-01',
      toDate: '2024-12-31',
      monthlyGrossSalary: 6000,
      workingCondition: 'groupI'
    }
  ],
  '1965-08-20'
);
```

### Including Non-Contributive Periods

```typescript
const result = calculateMonthlyPension(
  [
    // University studies (non-contributive)
    {
      fromDate: '1990-10-01',
      toDate: '1995-06-30',
      nonContributiveType: 'university'
    },
    // Military service (non-contributive)
    {
      fromDate: '1995-07-01',
      toDate: '1996-06-30',
      nonContributiveType: 'military'
    },
    // Regular employment
    {
      fromDate: '1996-09-01',
      toDate: '2024-12-31',
      monthlyGrossSalary: 4500,
      workingCondition: 'normal'
    }
  ],
  '1972-04-10'
);

console.log(`Non-Contributive Points: ${result.details.nonContributivePoints.toFixed(2)}`);
```

### Form Validation

```typescript
import { validatePensionForm } from './utils/validation';

const validationResult = validatePensionForm({
  birthDate: '1970-01-01',
  retirementYear: 2035,
  contributionPeriods: [
    {
      fromDate: '2000-01-01',
      toDate: '2024-12-31',
      monthlyGrossSalary: 5000,
      workingCondition: 'normal'
    }
  ]
});

if (!validationResult.isValid) {
  console.log('Form has errors:', validationResult.errors);
}

if (validationResult.hasOverlaps) {
  console.log('Overlapping periods:', validationResult.overlappingPeriods);
}
```

---

## Error Handling

The calculation functions return error messages in the `details.error` field when:

1. **Minimum contribution not met**: Less than 15 years of contributive periods
   - Error message includes years still needed
   - Pension amount returned as 0

2. **Invalid input data**: Missing required fields
   - Use `validatePensionForm()` to check inputs before calculation

### Example Error Handling

```typescript
const result = calculateMonthlyPension(periods, birthDate);

if (result.details.error) {
  console.error('Cannot calculate pension:', result.details.error);
  // Example: "You need 5 more years to reach the minimum contribution period of 15 years"
} else {
  console.log('Estimated pension:', result.monthlyPension);
}
```

---

## Module Exports

### From `pensionCalculations.ts`

```typescript
export {
  // Functions
  calculateMonthlyPension,
  calculateContributionPoint,
  calculateStabilityPoints,
  getWorkingConditionMultiplier,
  getWorkingConditionBonusPercentage,
  getAverageSalaryForYear,

  // Constants
  REFERENCE_VALUE_2024,
  GROUP_II_BONUS,
  GROUP_I_BONUS,
  SPECIAL_CONDITIONS_BONUS,
  MINIMUM_CONTRIBUTION_YEARS,
  COMPLETE_CONTRIBUTION_YEARS,
  RETIREMENT_AGE,
  TIER1_START,
  TIER1_END,
  TIER2_START,
  TIER2_END,
  TIER3_START,
  TIER3_END,
  TIER1_POINTS,
  TIER2_POINTS,
  TIER3_POINTS,
  CURRENT_AVERAGE_SALARY
};
```

### From `historicalSalaries.ts`

```typescript
export {
  // Data
  HISTORICAL_AVERAGE_SALARIES,
  CURRENT_AVERAGE_SALARY,

  // Functions
  getAverageSalaryForYear,
  getWeightedAverageSalaryForPeriod,
  calculateHistoricalContributionPoints,

  // Types
  HistoricalSalaryData
};
```

### From `validation.ts`

```typescript
export {
  // Functions
  validatePensionForm,
  validateContributionPeriod,
  findOverlappingPeriods,
  doPeriodsOverlap,
  isValidDate,
  isDateInFuture,
  isDateInPast,
  isEndDateAfterStartDate,
  isDateTooOld,
  isValidSalary,
  isSalaryReasonable,
  isValidRetirementYear,
  hasFieldError,
  getFieldErrorKey,
  getPeriodErrors,
  hasPeriodFieldError,
  getPeriodFieldErrorKey,

  // Types
  ValidationError,
  PeriodValidationResult,
  FormValidationResult
};
```
