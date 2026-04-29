# Pension Calculation Formulas

Complete mathematical documentation of the Romanian pension calculation system as implemented in this calculator.

## Table of Contents

1. [Overview](#overview)
2. [The Master Formula](#the-master-formula)
3. [Contribution Points](#contribution-points)
4. [Working Condition Bonuses](#working-condition-bonuses)
5. [Stability Points](#stability-points)
6. [Non-Contributive Points](#non-contributive-points)
7. [Worked Examples](#worked-examples)
8. [Edge Cases](#edge-cases)

---

## Overview

The Romanian pension system calculates monthly pensions using a point-based system. The formula was updated on **September 1, 2024** with new reference values.

### Key Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONTHLY PENSION                               │
│                         =                                        │
│    Total Points × Reference Value (VPR)                         │
│                                                                  │
│  Where Total Points = Contribution + Stability + Non-Contributive│
└─────────────────────────────────────────────────────────────────┘
```

### Current Reference Value (VPR)

As of September 1, 2024:

```
VPR = Old Pension Point Value ÷ 25
VPR = 2,032 Lei ÷ 25
VPR = 81.03 Lei
```

---

## The Master Formula

### Primary Calculation

```
Monthly Pension = VPR × (CP + SP + NCP)
```

Where:
- **VPR** = Valoarea Punctului de Referință (Reference Point Value) = 81.03 Lei
- **CP** = Contribution Points (Puncte de Contributivitate)
- **SP** = Stability Points (Puncte de Stabilitate)
- **NCP** = Non-Contributive Points (Puncte Asimilate/Necontributive)

### Requirements

- **Minimum Contribution**: 15 years of actual contributive work
- **Full Contribution**: 35 years for complete pension eligibility
- **Retirement Age**: 65 years (standard)

---

## Contribution Points

Contribution points represent the salary-to-average ratio accumulated over the entire career.

### Monthly Point Calculation

For any given month:

```
Monthly Point = Individual Gross Salary / National Average Gross Salary
```

**Formula in code:**
```typescript
point = monthlyGrossSalary / averageGrossSalary
```

### Annual Point Calculation

```
Annual Points = Σ(Monthly Points) / 12
             = (Sum of 12 monthly points) / 12
```

For periods shorter than a full year:

```
Annual Points = Σ(Monthly Points for N months) / 12
```

### Multi-Year Period Calculation

For a period spanning multiple years:

```
Total Period Points = Σ(yearly points for each year)

Where yearly points = (Salary / Avg Salary for Year) × (Months in Year / 12)
```

### Historical Salary Data

The calculator uses actual historical national average salaries:

| Year | Average Salary (RON) | Year | Average Salary (RON) |
|------|---------------------|------|---------------------|
| 1990 | 30 | 2010 | 1,987 |
| 1995 | 195 | 2015 | 2,555 |
| 2000 | 620 | 2020 | 5,213 |
| 2005 | 1,282 | 2024 | 7,567 |

**Note**: Pre-2005 values have been converted from old ROL currency (1 RON = 10,000 ROL).

### Example: Contribution Point Calculation

Person earning 10,000 RON/month in 2024:

```
Monthly Point = 10,000 / 7,567 = 1.322

Interpretation: Earning 32.2% above the national average
```

If this salary was maintained for the entire year:

```
Annual Points = 1.322 × 12 / 12 = 1.322 points
```

---

## Working Condition Bonuses

Working conditions affect the **contribution points only** through multipliers.

### Bonus Multipliers

| Working Condition | Bonus % | Multiplier | Description |
|-------------------|---------|------------|-------------|
| Normal | 0% | 1.00 | Standard office/service work |
| Group II | 25% | 1.25 | Difficult conditions |
| Group I | 50% | 1.50 | Very difficult conditions |
| Special | 50% | 1.50 | Hazardous/dangerous work |

### Application Formula

```
Adjusted Contribution Points = Base Points × Working Condition Multiplier
```

### Examples by Condition Type

**Group II (25% Bonus)**:
```
Base Points = 20.00
Adjusted = 20.00 × 1.25 = 25.00 points
Bonus = 5.00 points
```

**Group I (50% Bonus)**:
```
Base Points = 20.00
Adjusted = 20.00 × 1.50 = 30.00 points
Bonus = 10.00 points
```

### Important Notes

1. Bonuses apply **only to contribution points**
2. Bonuses do **NOT** apply to stability points
3. Bonuses do **NOT** apply to non-contributive points
4. Each period is calculated separately with its own condition

---

## Stability Points

Stability points reward long-term contributors based on their age during the contribution period.

### Eligibility

- Requires **minimum 15 years** of contributive work
- Points only accrue **after** the 15-year minimum is reached
- Based on **age at time of contribution**, not current age

### Age-Based Tiers

```
┌──────────────────────────────────────────────────────────┐
│                  STABILITY POINT TIERS                    │
├──────────────────┬────────────────┬──────────────────────┤
│   Age Range      │  Points/Year   │  Max Points in Tier  │
├──────────────────┼────────────────┼──────────────────────┤
│   26-30 years    │     0.50       │   2.50 (5 years)     │
│   31-35 years    │     0.75       │   3.75 (5 years)     │
│   36+ years      │     1.00       │   Unlimited          │
└──────────────────┴────────────────┴──────────────────────┘
```

### Calculation Algorithm

```
1. Sort all contributive periods chronologically
2. Accumulate total years, tracking age at each point
3. Skip stability calculation until 15 years reached
4. For years 16+, apply tier rates based on person's age:

   If age 26-30: Add (years in range) × 0.50
   If age 31-35: Add (years in range) × 0.75
   If age 36+:   Add (years in range) × 1.00
```

### Calculation Example

Person born 1970, worked continuously 1996-2024:

```
Work period: 1996-2024 (28 years)
Ages during work: 26-54 years old

First 15 years (1996-2010): No stability points
Years 16-20 (2011-2015, ages 41-45): 5 × 1.00 = 5.00 points
Years 21-28 (2016-2024, ages 46-54): 8 × 1.00 = 8.00 points

Total Stability Points = 13.00 points
```

### Edge Case: Young Worker

Person born 1998, started working 2020:

```
Work period: 2020-2024 (4 years)
Ages during work: 22-26 years old

Total years: 4 (below 15-year minimum)
Stability Points = 0 (minimum not met)
```

---

## Non-Contributive Points

Non-contributive periods are periods that count toward pension without salary contributions.

### Point Values by Type

| Period Type | Points per Year | Annual Value |
|-------------|-----------------|--------------|
| Military Service | 0.25 | 0.25 × VPR = 20.26 Lei/month |
| University | 0.25 | 0.25 × VPR = 20.26 Lei/month |
| Child Care | 0.25 | 0.25 × VPR = 20.26 Lei/month |
| Medical Leave | 0.20 | 0.20 × VPR = 16.21 Lei/month |

### Calculation Formula

```
Non-Contributive Points = Duration (years) × Points per Year

Duration = (End Date - Start Date) / 365.25 days
```

### Example: University + Military

```
University: 4 years (2015-2019)
Military: 1 year (2019-2020)

University Points = 4 × 0.25 = 1.00 points
Military Points = 1 × 0.25 = 0.25 points

Total Non-Contributive = 1.25 points
```

### Important Notes

1. Non-contributive periods count toward total pension years
2. They do **NOT** count toward the 15-year minimum for eligibility
3. No working condition bonuses apply
4. No stability points are earned during non-contributive periods

---

## Worked Examples

### Example 1: Simple Case

**Profile:**
- Birth date: January 1, 1965
- Work period: 2000-2024 (25 years)
- Constant salary: 5,000 RON/month
- Working condition: Normal

**Step 1: Calculate Contribution Points**

Using simplified average (actual calculation uses year-by-year):

```
Average national salary over period ≈ 3,500 RON
Point per year = 5,000 / 3,500 = 1.429
Total points = 1.429 × 25 = 35.71 contribution points

(Note: Actual calculation varies by year)
```

**Step 2: Calculate Stability Points**

```
Age at start of work: 35 years
Age at end: 59 years

First 15 years (2000-2014): No stability (building minimum)
Years 16-25 (2015-2024, ages 50-59): 10 × 1.00 = 10.00 points

Total stability = 10.00 points
```

**Step 3: Calculate Monthly Pension**

```
Total Points = 35.71 + 10.00 + 0 = 45.71 points
Monthly Pension = 45.71 × 81.03 = 3,702.68 Lei
```

---

### Example 2: Mixed Conditions

**Profile:**
- Birth date: March 15, 1970
- Work history:
  - 1995-2005: Factory work, 2,000 RON, Group II
  - 2006-2015: Mining, 4,000 RON, Group I
  - 2016-2024: Office work, 8,000 RON, Normal

**Step 1: Calculate Each Period's Contribution Points**

**Period 1 (1995-2005, 10 years, Group II):**
```
Base points ≈ 2,000 / 1,500 × 10 = 13.33 points
With 25% bonus: 13.33 × 1.25 = 16.67 points
```

**Period 2 (2006-2015, 10 years, Group I):**
```
Base points ≈ 4,000 / 2,500 × 10 = 16.00 points
With 50% bonus: 16.00 × 1.50 = 24.00 points
```

**Period 3 (2016-2024, 9 years, Normal):**
```
Base points ≈ 8,000 / 5,500 × 9 = 13.09 points
No bonus: 13.09 × 1.00 = 13.09 points
```

**Total Contribution Points: 16.67 + 24.00 + 13.09 = 53.76 points**

**Step 2: Stability Points**

```
Total work years: 29 years
Ages during work: 25-53

After 15 years (at age 40), stability accrues:
Years 16-29 (ages 40-53): 14 × 1.00 = 14.00 points
```

**Step 3: Final Calculation**

```
Total Points = 53.76 + 14.00 + 0 = 67.76 points
Monthly Pension = 67.76 × 81.03 = 5,491.39 Lei
```

---

### Example 3: With Non-Contributive Periods

**Profile:**
- Birth date: August 20, 1975
- History:
  - 1994-1998: University (non-contributive)
  - 1998-1999: Military service (non-contributive)
  - 2000-2024: Software development, 12,000 RON, Normal

**Step 1: Non-Contributive Points**

```
University: 4 years × 0.25 = 1.00 points
Military: 1 year × 0.25 = 0.25 points

Total Non-Contributive = 1.25 points
```

**Step 2: Contribution Points**

```
Work period: 25 years
Average salary ratio ≈ 12,000 / 4,000 = 3.00 points/year
Total = 3.00 × 25 = 75.00 contribution points
```

**Step 3: Stability Points**

```
Only 25 years of contributive work count
Ages 25-49 during work

Years 16-25 (ages 40-49): 10 × 1.00 = 10.00 points
```

**Step 4: Final Calculation**

```
Total Points = 75.00 + 10.00 + 1.25 = 86.25 points
Monthly Pension = 86.25 × 81.03 = 6,988.84 Lei
```

---

## Edge Cases

### Case 1: Less Than Minimum Years

**Scenario:** Person with only 10 years of contribution

```
Total contributive years: 10 (< 15 minimum)

Result: Pension = 0 Lei
Error: "You need 5 more years to reach the minimum contribution period of 15 years"
```

### Case 2: Partial Year Calculations

**Scenario:** Period from July 2020 to March 2022

```
2020: 6 months (July-December)
2021: 12 months (full year)
2022: 3 months (January-March)

Total: 21 months = 1.75 years

Points calculated month-by-month with each year's average salary
```

### Case 3: Overlapping Periods

The system validates for overlapping periods and returns an error. Overlapping periods are **not allowed** and must be corrected before calculation.

### Case 4: Very High Salary

There is no cap on contribution points. Someone earning 10× the national average earns 10 points per year.

```
Salary: 75,670 RON (10× average in 2024)
Monthly point: 75,670 / 7,567 = 10.00 points
```

### Case 5: Salary Below Average

Points can be less than 1.0 for below-average earners:

```
Salary: 3,000 RON (below 2024 average of 7,567)
Monthly point: 3,000 / 7,567 = 0.396 points
```

---

## Summary Tables

### Quick Reference: Point Multipliers

| Factor | Value |
|--------|-------|
| VPR (Reference Value) | 81.03 Lei |
| Group II Bonus | ×1.25 |
| Group I Bonus | ×1.50 |
| Special Conditions Bonus | ×1.50 |

### Quick Reference: Stability Points

| Age Range | Points per Year |
|-----------|-----------------|
| Below 26 | 0.00 |
| 26-30 | 0.50 |
| 31-35 | 0.75 |
| 36+ | 1.00 |

### Quick Reference: Non-Contributive Points

| Type | Points per Year |
|------|-----------------|
| Military | 0.25 |
| University | 0.25 |
| Child Care | 0.25 |
| Medical | 0.20 |

---

## Appendix: Historical Salary Table

Complete historical average salary data used in calculations:

| Year | Avg Salary (RON) | Year | Avg Salary (RON) | Year | Avg Salary (RON) |
|------|------------------|------|------------------|------|------------------|
| 1990 | 30 | 2002 | 880 | 2014 | 2,328 |
| 1991 | 45 | 2003 | 1,020 | 2015 | 2,555 |
| 1992 | 65 | 2004 | 1,170 | 2016 | 2,809 |
| 1993 | 95 | 2005 | 1,282 | 2017 | 3,223 |
| 1994 | 140 | 2006 | 1,404 | 2018 | 4,162 |
| 1995 | 195 | 2007 | 1,612 | 2019 | 4,853 |
| 1996 | 260 | 2008 | 1,909 | 2020 | 5,213 |
| 1997 | 350 | 2009 | 1,945 | 2021 | 5,535 |
| 1998 | 450 | 2010 | 1,987 | 2022 | 6,095 |
| 1999 | 530 | 2011 | 2,058 | 2023 | 6,789 |
| 2000 | 620 | 2012 | 2,117 | 2024 | 7,567 |
| 2001 | 750 | 2013 | 2,223 | 2025* | 8,100 |

*Projected value
