import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import RetirementStatus from './RetirementStatus';

const meta = {
  title: 'Components/PensionStats/RetirementStatus',
  component: RetirementStatus,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Status card showing retirement eligibility. Displays the number of years remaining until retirement or indicates that the user is already eligible. Changes styling based on eligibility state.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    yearsUntilRetirement: {
      control: { type: 'number', min: -10, max: 50 },
      description: 'Years until retirement (negative means already eligible)',
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        { className: 'w-96' },
        React.createElement(Story)
      ),
  ],
} satisfies Meta<typeof RetirementStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YearsRemaining: Story = {
  args: {
    yearsUntilRetirement: 20,
  },
};

export const FewYearsRemaining: Story = {
  args: {
    yearsUntilRetirement: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only a few years remaining until retirement eligibility.',
      },
    },
  },
};

export const Eligible: Story = {
  args: {
    yearsUntilRetirement: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'User has reached retirement age and is eligible for pension.',
      },
    },
  },
};

export const AlreadyPastRetirement: Story = {
  args: {
    yearsUntilRetirement: -5,
  },
  parameters: {
    docs: {
      description: {
        story: 'User is already past retirement age.',
      },
    },
  },
};
