import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import ContributionSummary from './ContributionSummary';

const meta = {
  title: 'Components/PensionStats/ContributionSummary',
  component: ContributionSummary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Summary card displaying the total contributive years and days for a pension calculation. Part of the pension statistics breakdown.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    totalContributiveYears: {
      control: { type: 'number', min: 0, max: 50 },
      description: 'Total number of contributive years',
    },
    totalContributiveDays: {
      control: { type: 'number', min: 0, max: 18250 },
      description: 'Total number of contributive days',
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
} satisfies Meta<typeof ContributionSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    totalContributiveYears: 25,
    totalContributiveDays: 9125,
  },
};

export const FullContribution: Story = {
  args: {
    totalContributiveYears: 35,
    totalContributiveDays: 12775,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full 35-year contribution period (complete contribution for standard pension).',
      },
    },
  },
};

export const MinimalContribution: Story = {
  args: {
    totalContributiveYears: 5,
    totalContributiveDays: 1825,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal contribution period showing a few years of service.',
      },
    },
  },
};

export const ZeroContribution: Story = {
  args: {
    totalContributiveYears: 0,
    totalContributiveDays: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'No contribution period recorded.',
      },
    },
  },
};
