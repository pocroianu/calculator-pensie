import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import Timeline from './Timeline';

const meta = {
  title: 'Components/PensionStats/Timeline',
  component: Timeline,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Timeline visualization showing current age, retirement age, and contribution progress. Displays a progress bar indicating how close the user is to the complete contribution period (35 years).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentAge: {
      control: { type: 'number', min: 18, max: 80 },
      description: 'Current age of the person',
    },
    retirementAge: {
      control: { type: 'number', min: 50, max: 75 },
      description: 'Retirement age',
    },
    totalContributiveYears: {
      control: { type: 'number', min: 0, max: 50 },
      description: 'Total years of contributions',
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        { className: 'w-[450px]' },
        React.createElement(Story)
      ),
  ],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MidCareer: Story = {
  args: {
    currentAge: 45,
    retirementAge: 65,
    totalContributiveYears: 20,
  },
};

export const NearRetirement: Story = {
  args: {
    currentAge: 62,
    retirementAge: 65,
    totalContributiveYears: 33,
  },
  parameters: {
    docs: {
      description: {
        story: 'Worker close to retirement with almost full contribution period.',
      },
    },
  },
};

export const YoungWorker: Story = {
  args: {
    currentAge: 25,
    retirementAge: 65,
    totalContributiveYears: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Young worker with few years of contributions.',
      },
    },
  },
};

export const FullContribution: Story = {
  args: {
    currentAge: 58,
    retirementAge: 65,
    totalContributiveYears: 35,
  },
  parameters: {
    docs: {
      description: {
        story: 'Worker who has already completed the full 35-year contribution period.',
      },
    },
  },
};

export const RetirementReached: Story = {
  args: {
    currentAge: 65,
    retirementAge: 65,
    totalContributiveYears: 40,
  },
  parameters: {
    docs: {
      description: {
        story: 'Worker at retirement age with contributions exceeding the minimum.',
      },
    },
  },
};
