import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import RestoreConfirmDialog from './RestoreConfirmDialog';
import { CalculationSnapshot } from '../types/calculationHistory';

const meta = {
  title: 'Components/RestoreConfirmDialog',
  component: RestoreConfirmDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Modal dialog for confirming the restoration of a saved calculation snapshot. Displays snapshot details including pension amount, total points, and period counts. Shows a warning about data replacement. Supports keyboard dismissal (Escape key) and backdrop click.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls dialog visibility',
    },
    onConfirm: { description: 'Callback fired when user confirms restoration' },
    onCancel: { description: 'Callback fired when user cancels or dismisses the dialog' },
  },
  args: {
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof RestoreConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSnapshot: CalculationSnapshot = {
  id: 'snapshot-1',
  name: 'My Pension Calculation',
  timestamp: new Date().toISOString(),
  inputs: {
    birthDate: '1970-05-15',
    retirementYear: 2035,
    contributionPeriods: [
      {
        fromDate: '2000-01-01',
        toDate: '2010-12-31',
        monthlyGrossSalary: 3000,
        workingCondition: 'normal' as const,
        nonContributiveType: '' as const,
      },
      {
        fromDate: '2011-01-01',
        toDate: '2024-12-31',
        monthlyGrossSalary: 5000,
        workingCondition: 'normal' as const,
        nonContributiveType: '' as const,
      },
    ],
  },
  results: {
    monthlyPension: 2850,
    yearlyPension: 34200,
    pensionDetails: {
      totalPoints: 42.5,
      contributionPoints: 35.2,
      stabilityPoints: 5.3,
      nonContributivePoints: 2.0,
      totalContributiveYears: 24,
      monthlyPension: 2850,
      yearsUntilRetirement: 11,
    },
  },
  metadata: {
    notes: 'Calculation based on current employment trajectory.',
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
    snapshot: mockSnapshot,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    snapshot: mockSnapshot,
  },
  parameters: {
    docs: {
      description: {
        story: 'When closed, the dialog renders nothing.',
      },
    },
  },
};

export const WithNotes: Story = {
  args: {
    isOpen: true,
    snapshot: {
      ...mockSnapshot,
      metadata: {
        ...mockSnapshot.metadata,
        notes: 'Important: This includes projected salary increases for the next 5 years.',
      },
    },
  },
};

export const WithNonContributivePeriods: Story = {
  args: {
    isOpen: true,
    snapshot: {
      ...mockSnapshot,
      inputs: {
        ...mockSnapshot.inputs,
        contributionPeriods: [
          ...mockSnapshot.inputs.contributionPeriods,
          {
            fromDate: '1990-01-01',
            toDate: '1992-12-31',
            monthlyGrossSalary: 0,
            workingCondition: 'normal' as const,
            nonContributiveType: 'military' as const,
          },
        ],
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dialog showing a snapshot that includes non-contributive periods (e.g., military service).',
      },
    },
  },
};
