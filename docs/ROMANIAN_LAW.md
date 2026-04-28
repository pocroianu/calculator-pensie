# Romanian Pension Law Implementation

This document maps the implementation of the Romanian Pension Calculator to the relevant articles of **Romanian Law No. 263/2010** (Legea Pensiilor Publice) and subsequent modifications.

## Table of Contents

1. [Legal Framework](#legal-framework)
2. [Implemented Articles](#implemented-articles)
3. [Point-Based Calculation System](#point-based-calculation-system)
4. [Working Conditions](#working-conditions)
5. [Non-Contributive Periods](#non-contributive-periods)
6. [Minimum Requirements](#minimum-requirements)
7. [September 2024 Reform](#september-2024-reform)
8. [Implementation Notes](#implementation-notes)

---

## Legal Framework

### Primary Legislation

- **Law No. 263/2010** - Public Pension System Law (Legea privind sistemul unitar de pensii publice)
- **Law No. 127/2019** - Pension Law Modifications
- **Government Emergency Ordinance 163/2022** - Updates to pension calculation
- **Law No. 360/2023** - Pension System Reform effective September 1, 2024

### Effective Date

This calculator implements the pension formula as effective from **September 1, 2024**.

---

## Implemented Articles

### Article 47 - Contribution Period Requirements

**Romanian Text (Summary):**
> Stagiul minim de cotizare este de 15 ani. Stagiul complet de cotizare este de 35 de ani.

**English Translation:**
> The minimum contribution period is 15 years. The complete contribution period is 35 years.

**Implementation:**

```typescript
// src/utils/pensionCalculations.ts
export const MINIMUM_CONTRIBUTION_YEARS = 15;  // Stagiul minim de cotizare
export const COMPLETE_CONTRIBUTION_YEARS = 35; // Stagiul complet de cotizare
```

**Calculator Behavior:**
- Pension = 0 if contributive years < 15
- Error message displays years needed to reach minimum
- Stability points only accrue after 15 years reached

---

### Articles 48-50 - Retirement Age

**Romanian Text (Summary):**
> Vârsta standard de pensionare este de 65 de ani pentru bărbați și 63 de ani pentru femei (cu creștere graduală).

**Implementation:**

```typescript
export const RETIREMENT_AGE = 65; // Standard retirement age
```

**Note:** The current implementation uses 65 as the standard age. The gradual increase schedule for women is not implemented in the current version.

---

### Articles 94-96 - Contribution Points Calculation

**Romanian Text (Summary):**
> Punctajul lunar se determină prin raportarea venitului brut lunar al asiguratului la câștigul salarial mediu brut pe economie din luna respectivă.

**English Translation:**
> The monthly score is determined by relating the insured's gross monthly income to the average gross wage in the economy for that month.

**Implementation:**

```typescript
// src/utils/pensionCalculations.ts
export const calculateContributionPoint = (
  monthlyGrossSalary: number,
  averageGrossSalary: number
): number => {
  return monthlyGrossSalary / averageGrossSalary;
};
```

**Formula:**
```
Monthly Point = Individual Salary / National Average Salary
Annual Points = Sum of 12 Monthly Points / 12
```

---

### Articles 100-103 - Total Pension Points

**Romanian Text (Summary):**
> Numărul total de puncte se determină prin însumarea punctajelor anuale realizate în perioada de cotizare.

**Implementation:**

The calculator sums:
1. Contribution points (from salary-based periods)
2. Stability points (bonus for long-term contribution)
3. Non-contributive points (military, university, etc.)

```typescript
totalPoints = contributionPoints + stabilityPoints + nonContributivePoints;
```

---

### Article 47, Section 1 - Stability Points

**Romanian Text (Summary):**
> Asigurații care au realizat stagii de cotizare mai mari decât stagiul minim beneficiază de puncte de stabilitate.

**Implementation:**

```typescript
// Stability point tiers based on age
const TIER1_POINTS = 0.50;  // Ages 26-30: 0.50 points/year
const TIER2_POINTS = 0.75;  // Ages 31-35: 0.75 points/year
const TIER3_POINTS = 1.00;  // Ages 36+: 1.00 point/year
```

**Calculation Logic:**
1. Only applies after minimum 15 years reached
2. Points awarded based on person's age during contribution
3. Separate from working condition bonuses

---

### Articles 30-33 - Working Conditions

**Romanian Text (Summary):**
> Persoanele care au desfășurat activități în condiții speciale sau deosebite beneficiază de majorări ale punctajului.

**Implementation:**

| Condition Type | Romanian Name | Bonus | Article Reference |
|----------------|---------------|-------|-------------------|
| Normal | Condiții normale | 0% | - |
| Group II | Grupa II (condiții dificile) | 25% | Art. 30 |
| Group I | Grupa I (condiții foarte dificile) | 50% | Art. 31 |
| Special | Condiții speciale | 50% | Art. 33 |

```typescript
export const GROUP_II_BONUS = 0.25;           // 25% bonus
export const GROUP_I_BONUS = 0.50;            // 50% bonus
export const SPECIAL_CONDITIONS_BONUS = 0.50; // 50% bonus
```

---

### Articles 38-41 - Non-Contributive Periods

**Romanian Text (Summary):**
> Perioadele necontributive asimilate stagiului de cotizare se punctează diferențiat.

**English Translation:**
> Non-contributive periods assimilated to the contribution period are scored differently.

**Implementation:**

| Period Type | Romanian Name | Points/Year | Article |
|-------------|---------------|-------------|---------|
| Military Service | Stagiu militar | 0.25 | Art. 38 |
| University | Studii universitare | 0.25 | Art. 39 |
| Child Care | Concediu creștere copil | 0.25 | Art. 40 |
| Medical Leave | Concediu medical | 0.20 | Art. 41 |

```typescript
switch (period.nonContributiveType) {
  case 'military':
  case 'university':
  case 'childCare':
    nonContributivePoints += numberOfYears * 0.25;
    break;
  case 'medical':
    nonContributivePoints += numberOfYears * 0.20;
    break;
}
```

---

## Point-Based Calculation System

### Pre-2024 System

Before September 2024, pensions were calculated using:
```
Pension = Punctaj Total × Valoarea Punctului de Pensie
```

Where the pension point value was periodically updated by law.

### Post-September 2024 System

The new system uses a reference value (VPR):

```
Pension = Total Points × VPR (Valoarea Punctului de Referință)
```

**Implementation:**

```typescript
// VPR calculation (September 2024)
// VPR = Old Pension Point Value / 25
// VPR = 2,032 Lei / 25 = 81.03 Lei

export const REFERENCE_VALUE_2024 = 81.03;

// Final calculation
const monthlyPension = totalPoints * REFERENCE_VALUE_2024;
```

---

## Working Conditions

### Legal Definitions

**Group II - Difficult Conditions (Condiții Dificile):**
- Elevated physical or psychological stress
- Exposure to harmful but not dangerous substances
- Examples: Factory work, construction, night shifts

**Group I - Very Difficult Conditions (Condiții Foarte Dificile):**
- High risk to health
- Significant exposure to harmful substances
- Examples: Mining, chemical industry, nuclear facilities

**Special Conditions (Condiții Speciale):**
- Immediate danger to life
- Regulated by special laws
- Examples: Deep underground mining, asbestos work

### Application Rules

1. **Bonuses apply only to contribution points** - not to stability or non-contributive points
2. **Each period calculated separately** - different periods can have different conditions
3. **Documentation required** - actual pension applications require proof of working conditions
4. **No stacking** - only one condition type per period

---

## Non-Contributive Periods

### Eligibility

Non-contributive periods count toward total pension time but:
- Do NOT count toward the 15-year minimum for eligibility
- Do NOT generate stability points
- Are NOT affected by working condition bonuses

### Period Types

**Military Service (Stagiul Militar):**
- Mandatory military service before 2006
- Includes reserve officer training
- Points: 0.25 per year

**University Studies (Studii Universitare):**
- Full-time higher education
- Maximum 6 years typically recognized
- Points: 0.25 per year

**Child Care Leave (Concediu Creștere Copil):**
- Parental leave for child care
- Legal leave periods only
- Points: 0.25 per year

**Medical Leave (Concediu Medical):**
- Extended sick leave
- Certified medical periods
- Points: 0.20 per year

---

## Minimum Requirements

### Eligibility Threshold

| Requirement | Value | Article |
|-------------|-------|---------|
| Minimum Contribution Years | 15 years | Art. 47 |
| Complete Contribution | 35 years | Art. 47 |
| Standard Retirement Age | 65 years | Art. 48 |

### Calculator Enforcement

```typescript
if (totalContributiveYears < MINIMUM_CONTRIBUTION_YEARS) {
  error = `You need ${Math.ceil(MINIMUM_CONTRIBUTION_YEARS - totalContributiveYears)}
           more years to reach the minimum contribution period of ${MINIMUM_CONTRIBUTION_YEARS} years`;
  return {
    monthlyPension: 0,
    details: { ...details, error }
  };
}
```

---

## September 2024 Reform

### Key Changes

1. **New Reference Value (VPR)**
   - Replaced the old pension point value
   - VPR = 81.03 Lei (starting September 1, 2024)
   - Derived from: Old Value (2,032) / 25

2. **Stability Points System**
   - Age-based bonus points for long-term contributors
   - Three tiers: 26-30, 31-35, 36+
   - Only after 15-year minimum

3. **Working Condition Recognition**
   - Standardized bonus percentages
   - Group II: 25%, Group I: 50%, Special: 50%

4. **Formula Simplification**
   - Single formula for all pensioners
   - Clear point-to-pension conversion

### Timeline

```
Before 2024:  Pension = Points × Pension Point Value
              (Point value varied, ~2,032 Lei)

After Sept 2024: Pension = Points × VPR
                 (VPR = 81.03 Lei, derived from old system)
```

---

## Implementation Notes

### Data Sources

**Historical Salaries:**
- Source: National Institute of Statistics (INS)
- Romanian National Bank historical data
- Currency conversion for pre-2005 values (ROL to RON)

**Average Salary Updates:**
- Updated annually based on official statistics
- Projections for future years are estimates
- Calculator uses most recent official data when available

### Limitations

1. **Simplified Model**
   - Does not account for all special cases
   - Assumes consistent salary within each period
   - Does not implement gender-based retirement age differences

2. **Not Official**
   - For estimation purposes only
   - Official pension determined by Casa Națională de Pensii
   - Actual pension may vary based on documentation

3. **Future Projections**
   - Future salary averages are estimates
   - VPR may be updated by future legislation
   - Working condition classifications may change

### Verification

For official pension calculations, contact:
- **Casa Națională de Pensii Publice (CNPP)**
- Local pension office (Casa Județeană de Pensii)
- Website: www.cnpp.ro

---

## Glossary

| Romanian Term | English Translation | Description |
|---------------|---------------------|-------------|
| Stagiu de cotizare | Contribution period | Years of pension contributions |
| Punctaj | Points | Pension calculation units |
| VPR | Reference Point Value | Multiplication factor for points |
| Condiții normale | Normal conditions | Standard working environment |
| Condiții dificile | Difficult conditions | Group II work classification |
| Condiții speciale | Special conditions | High-risk work classification |
| Perioadă asimilată | Assimilated period | Non-contributive but recognized time |
| Vârstă de pensionare | Retirement age | Legal age for pension eligibility |
| CNPP | National Public Pension House | Government pension authority |

---

## References

1. **Legea nr. 263/2010** - Legea privind sistemul unitar de pensii publice
   - Published: Monitorul Oficial nr. 852/20.12.2010

2. **Legea nr. 127/2019** - Pentru modificarea și completarea Legii nr. 263/2010
   - Published: Monitorul Oficial nr. 549/04.07.2019

3. **OUG nr. 163/2022** - Privind modificarea Legii nr. 263/2010
   - Published: Monitorul Oficial nr. 1167/06.12.2022

4. **Legea nr. 360/2023** - Legea pensiilor
   - Published: Monitorul Oficial nr. 1146/19.12.2023
   - Effective: September 1, 2024

5. **CNPP Official Website**
   - https://www.cnpp.ro

6. **INS Statistical Data**
   - https://insse.ro/cms/ro/content/castiguri-salariale
