# Developer Guide

Comprehensive guide for developers working with or extending the Romanian Pension Calculator.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Data Flow](#data-flow)
4. [Core Components](#core-components)
5. [State Management](#state-management)
6. [Calculation Engine](#calculation-engine)
7. [Validation System](#validation-system)
8. [Internationalization](#internationalization)
9. [Testing](#testing)
10. [Extending the Calculator](#extending-the-calculator)

---

## Architecture Overview

The Romanian Pension Calculator is a client-side React application that performs all calculations in the browser. No backend server is required.

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.5.3 |
| Build Tool | Vite | 5.4.2 |
| Styling | Tailwind CSS | 3.4.1 |
| Charts | Chart.js + react-chartjs-2 | 4.4.7 |
| i18n | i18next | 24.2.1 |
| Testing | Jest + React Testing Library | 29.7.0 |
| Icons | Lucide React | 0.344.0 |

### Key Design Decisions

1. **Client-Side Only**: All calculations run in the browser for privacy
2. **Local Storage**: User data persists in browser localStorage
3. **No Authentication**: No user accounts or server-side data
4. **Bilingual**: Full support for Romanian and English
5. **Responsive**: Mobile-first design approach

---

## Project Structure

```
calculator_pensie/
├── src/
│   ├── components/                    # React components
│   │   ├── ContributionPeriod.tsx    # Single period input
│   │   ├── InputForm.tsx             # Main form component
│   │   ├── PensionCalculator.tsx     # Main calculator container
│   │   ├── PensionCharts.tsx         # Visualization charts
│   │   ├── PensionStats.tsx          # Results display
│   │   ├── LanguageSwitcher.tsx      # EN/RO toggle
│   │   ├── LegalDisclaimer.tsx       # Legal notices
│   │   ├── ErrorBoundary.tsx         # Error handling
│   │   ├── Tooltip.tsx               # Helper tooltips
│   │   └── pension-stats/            # Stats subcomponents
│   │       ├── ContributionSummary.tsx
│   │       ├── RetirementStatus.tsx
│   │       ├── StatusCard.tsx
│   │       └── Timeline.tsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── usePensionCalculator.ts   # Main calculation hook
│   │   ├── useLocalStorage.ts        # Persistent storage
│   │   └── useDebounce.ts            # Input debouncing
│   │
│   ├── utils/                        # Utility functions
│   │   ├── pensionCalculations.ts    # Core calculation logic
│   │   ├── dateCalculations.ts       # Date utilities
│   │   ├── validation.ts             # Form validation
│   │   └── formatters.ts             # Currency/number formatting
│   │
│   ├── types/                        # TypeScript definitions
│   │   ├── pensionTypes.ts           # Core data types
│   │   └── calculator.ts             # Additional types
│   │
│   ├── data/                         # Static data
│   │   └── historicalSalaries.ts     # Historical salary data
│   │
│   ├── i18n/                         # Internationalization
│   │   ├── config.ts                 # i18next setup
│   │   └── locales/
│   │       ├── en.json               # English translations
│   │       └── ro.json               # Romanian translations
│   │
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # Entry point
│   └── setupTests.ts                 # Jest configuration
│
├── docs/                             # Documentation
├── public/                           # Static assets
└── tests/                            # Test files
```

---

## Data Flow

### Input to Output Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    │
│  │ Birth Date  │    │ Retirement   │    │ Contribution    │    │
│  │             │    │    Year      │    │    Periods      │    │
│  └──────┬──────┘    └──────┬───────┘    └────────┬────────┘    │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          └──────────────────┼─────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VALIDATION LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  validatePensionForm()                                   │    │
│  │  - Check date validity                                   │    │
│  │  - Check salary ranges                                   │    │
│  │  - Detect overlapping periods                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CALCULATION ENGINE                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  calculateMonthlyPension()                               │    │
│  │  ├── calculateHistoricalContributionPoints()             │    │
│  │  ├── Apply working condition multipliers                 │    │
│  │  ├── calculateStabilityPoints()                          │    │
│  │  ├── Calculate non-contributive points                   │    │
│  │  └── totalPoints × REFERENCE_VALUE_2024                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         OUTPUT                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    │
│  │  Monthly    │    │   Point      │    │    Charts &     │    │
│  │  Pension    │    │  Breakdown   │    │    Timeline     │    │
│  └─────────────┘    └──────────────┘    └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    usePensionCalculator Hook                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │ useLocal     │────▶│   inputs     │────▶│  Calculation │    │
│  │ Storage      │     │   (state)    │     │    Engine    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         ▲                    │                    │              │
│         │                    │                    ▼              │
│         │                    │            ┌──────────────┐      │
│         │                    │            │  Pension     │      │
│         │                    │            │  Details     │      │
│         │                    │            └──────────────┘      │
│         │                    │                    │              │
│         │                    ▼                    │              │
│         │            ┌──────────────┐             │              │
│         └────────────│ useDebounce  │             │              │
│                      │   (500ms)    │             │              │
│                      └──────────────┘             │              │
│                                                   │              │
│  ┌────────────────────────────────────────────────┘              │
│  │                                                               │
│  ▼                                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Return: { inputs, monthlyPension, details, handlers }     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### Component Hierarchy

```
App
└── PensionCalculator
    ├── InputForm
    │   ├── Personal Info Section
    │   │   ├── Birth Date Input
    │   │   └── Retirement Year Input
    │   └── Contribution Periods Section
    │       └── ContributionPeriod (×N)
    │           ├── Date Range Inputs
    │           ├── Salary Input
    │           ├── Working Condition Select
    │           └── Non-Contributive Type Select
    │
    ├── PensionStats
    │   ├── ContributionSummary
    │   ├── RetirementStatus
    │   ├── StatusCard
    │   └── Timeline
    │
    ├── PensionCharts
    │
    └── LegalDisclaimer
```

### InputForm Component

Handles all user input collection with real-time validation.

```typescript
// Key props
interface InputFormProps {
  inputs: PensionInputs;
  onInputChange: (field: string, value: any) => void;
  validationErrors: FormValidationResult;
}

// Features
- Dynamic contribution period management (add/remove)
- Real-time validation feedback
- Period overlap detection
- Responsive grid layout
```

### PensionStats Component

Displays calculation results and breakdowns.

```typescript
// Key props
interface PensionStatsProps {
  pensionDetails: PensionDetails;
  monthlyPension: number;
  yearlyPension: number;
}

// Displays
- Monthly/yearly pension amounts
- Point breakdown (contribution, stability, non-contributive)
- Years of contribution
- Retirement timeline
- Error messages if applicable
```

---

## State Management

### Main Hook: usePensionCalculator

The `usePensionCalculator` hook manages all application state:

```typescript
function usePensionCalculator() {
  // State
  const [inputs, setInputs] = useLocalStorage<PensionInputs>('pension-inputs', defaultInputs);

  // Derived state
  const debouncedInputs = useDebounce(inputs, 500);
  const validationResult = useMemo(() => validatePensionForm(inputs), [inputs]);

  // Calculated values
  const { monthlyPension, details } = useMemo(
    () => calculateMonthlyPension(debouncedInputs.contributionPeriods, debouncedInputs.birthDate),
    [debouncedInputs]
  );

  return {
    inputs,
    handleInputChange,
    monthlyPension,
    yearlyPension: monthlyPension * 12,
    pensionDetails: details,
    averageGrossSalary: CURRENT_AVERAGE_SALARY,
    getAverageSalaryForYear,
    hasOverlaps: validationResult.hasOverlaps,
    isStorageLoaded: true,
    resetToDefaults
  };
}
```

### Local Storage Persistence

Data is automatically saved to localStorage with debouncing:

```typescript
// useLocalStorage hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue] as const;
}
```

---

## Calculation Engine

### File: `src/utils/pensionCalculations.ts`

The calculation engine implements Romanian pension law formulas.

### Main Calculation Flow

```typescript
calculateMonthlyPension(periods, birthDate)
│
├── For each period:
│   ├── If non-contributive:
│   │   └── Add non-contributive points (0.20-0.25/year)
│   │
│   └── If contributive:
│       ├── Calculate base points using historical salaries
│       ├── Apply working condition multiplier
│       └── Add to contribution points
│
├── Check if minimum years met (≥15)
│   ├── No: Return error, pension = 0
│   └── Yes: Continue
│
├── Calculate stability points
│
├── Sum all points
│
└── Return points × 81.03 (VPR)
```

### Key Functions

```typescript
// Main calculation
calculateMonthlyPension(periods, birthDate) → { monthlyPension, details }

// Contribution points
calculateHistoricalContributionPoints(salary, from, to) → number
calculateContributionPoint(salary, average) → number

// Stability points
calculateStabilityPoints(periods, birthDate) → number

// Working conditions
getWorkingConditionMultiplier(condition) → number
getWorkingConditionBonusPercentage(condition) → number

// Salary lookup
getAverageSalaryForYear(year) → number
getWeightedAverageSalaryForPeriod(from, to) → number
```

---

## Validation System

### File: `src/utils/validation.ts`

Comprehensive validation for all user inputs.

### Validation Categories

```typescript
// Date validations
isValidDate(dateString) → boolean
isDateInFuture(dateString) → boolean
isDateInPast(dateString) → boolean
isDateTooOld(dateString, maxYears) → boolean
isEndDateAfterStartDate(start, end) → boolean

// Salary validations
isValidSalary(salary) → boolean
isSalaryReasonable(salary, min, max) → boolean

// Period validations
doPeriodsOverlap(period1, period2) → boolean
findOverlappingPeriods(periods) → [number, number][]

// Complete form validation
validatePensionForm(inputs) → FormValidationResult
validateContributionPeriod(period, index) → PeriodValidationResult
```

### Validation Result Structure

```typescript
interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  periodErrors: Map<number, ValidationError[]>;
  hasOverlaps: boolean;
  overlappingPeriods: [number, number][];
}

interface ValidationError {
  field: string;
  messageKey: string;  // i18n key for translation
  params?: Record<string, string | number>;
}
```

---

## Internationalization

### File: `src/i18n/config.ts`

Uses i18next for English and Romanian support.

### Configuration

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ro: { translation: roTranslations }
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });
```

### Translation Keys Structure

```json
{
  "legal": {
    "title": "Legal Information",
    "limitations": "This calculator..."
  },
  "validation": {
    "birthDateRequired": "Birth date is required",
    "periodsOverlap": "Period {{period1}} overlaps with period {{period2}}"
  },
  "pension": {
    "personalInfo": {
      "birthDate": "Date of Birth",
      "plannedRetirementYear": "Planned Retirement Year"
    },
    "contributionPeriods": {
      "workingCondition": "Working Conditions"
    },
    "contributionAnalysis": {
      "totalPoints": "Total Points",
      "monthlyPension": "Monthly Pension"
    }
  }
}
```

### Using Translations

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('pension.personalInfo.birthDate')}</h1>
      <p>{t('validation.periodsOverlap', { period1: 1, period2: 2 })}</p>
    </div>
  );
}
```

---

## Testing

### Test Structure

```
src/
├── components/__tests__/
│   ├── InputForm.test.tsx
│   └── PensionStats.test.tsx
└── utils/__tests__/
    ├── pensionCalculations.test.ts
    └── workingConditions.test.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Categories

1. **Unit Tests**: Individual functions
   - Calculation accuracy
   - Edge cases
   - Error handling

2. **Component Tests**: React components
   - Rendering
   - User interactions
   - Validation display

3. **Integration Tests**: Full flows
   - End-to-end calculation
   - Form submission
   - Error scenarios

### Example Test

```typescript
describe('calculateMonthlyPension', () => {
  it('should calculate pension for normal working conditions', () => {
    const result = calculateMonthlyPension(
      [{
        fromDate: '2000-01-01',
        toDate: '2024-12-31',
        monthlyGrossSalary: 5000,
        workingCondition: 'normal'
      }],
      '1965-01-01'
    );

    expect(result.monthlyPension).toBeGreaterThan(0);
    expect(result.details.totalContributiveYears).toBeCloseTo(25, 1);
  });
});
```

---

## Extending the Calculator

### Adding a New Working Condition

1. **Update Types** (`src/types/pensionTypes.ts`):
```typescript
export type WorkingCondition =
  'normal' | 'groupII' | 'groupI' | 'specialConditions' | 'newCondition';
```

2. **Add Constant** (`src/utils/pensionCalculations.ts`):
```typescript
export const NEW_CONDITION_BONUS = 0.35; // 35% bonus
```

3. **Update Multiplier Function**:
```typescript
export const getWorkingConditionMultiplier = (workingCondition?: string): number => {
  switch (workingCondition) {
    // ... existing cases
    case 'newCondition':
      return 1 + NEW_CONDITION_BONUS;
    default:
      return 1.0;
  }
};
```

4. **Add Translations**:
```json
{
  "pension": {
    "contributionPeriods": {
      "workingConditions": {
        "newCondition": "New Condition Description"
      }
    }
  }
}
```

5. **Update UI** (`src/components/ContributionPeriod.tsx`):
```typescript
<option value="newCondition">{t('pension.contributionPeriods.workingConditions.newCondition')}</option>
```

### Adding a New Non-Contributive Period Type

1. **Update Type**:
```typescript
export type NonContributivePeriodType =
  'military' | 'university' | 'childCare' | 'medical' | 'newType' | '';
```

2. **Add Calculation Logic**:
```typescript
case 'newType':
  nonContributivePoints += numberOfYears * 0.30; // 0.30 points/year
  break;
```

3. **Add Translations and UI options**

### Adding New Historical Data

Update `src/data/historicalSalaries.ts`:

```typescript
export const HISTORICAL_AVERAGE_SALARIES: HistoricalSalaryData = {
  // ... existing years
  2026: 8700,  // New year
  2027: 9300,  // New year
};

// Update current average if needed
export const CURRENT_AVERAGE_SALARY = HISTORICAL_AVERAGE_SALARIES[2026];
```

### Updating the Reference Value (VPR)

When the Romanian government updates the VPR:

```typescript
// src/utils/pensionCalculations.ts
export const REFERENCE_VALUE_2024 = 81.03; // Update this value
// Consider renaming to REFERENCE_VALUE_2025 or make it configurable
```

---

## Development Workflow

### Setup

```bash
# Clone repository
git clone https://github.com/username/calculator_pensie.git

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:5173
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Deployment

The project auto-deploys to GitHub Pages via GitHub Actions on push to main:

1. Push changes to main branch
2. GitHub Actions builds the project
3. Deploys to GitHub Pages
4. Available at `https://username.github.io/calculator_pensie/`

---

## Best Practices

### Code Style

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use meaningful variable names
- Add JSDoc comments for complex functions
- Keep components small and focused

### Performance

- Use `useMemo` for expensive calculations
- Debounce user inputs before calculations
- Lazy load charts and heavy components
- Use production builds for deployment

### Accessibility

- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers

### Security

- No server-side data storage (privacy by design)
- Sanitize all user inputs
- Validate data before calculations
- No external API calls with user data
