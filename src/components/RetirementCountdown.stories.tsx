import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import RetirementCountdown from './RetirementCountdown';

const meta = {
  title: 'Components/RetirementCountdown',
  component: RetirementCountdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Retirement countdown component showing years, months, and days until retirement. Includes a progress bar tracking career progression, milestone markers, and motivational messages. WCAG AA compliant colors. Displays a congratulations state for those already eligible.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    birthDate: {
      control: 'text',
      description: 'Birth date in YYYY-MM-DD format',
    },
    currentAge: {
      control: { type: 'number', min: 18, max: 80 },
      description: 'Current age of the person',
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        { className: 'w-[500px]' },
        React.createElement(Story)
      ),
  ],
} satisfies Meta<typeof RetirementCountdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YoungWorker: Story = {
  args: {
    birthDate: '1995-06-15',
    currentAge: 30,
  },
  parameters: {
    docs: {
      description: {
        story: 'A 30-year-old worker with approximately 35 years until retirement.',
      },
    },
  },
};

export const MidCareer: Story = {
  args: {
    birthDate: '1980-03-20',
    currentAge: 45,
  },
  parameters: {
    docs: {
      description: {
        story: 'A 45-year-old worker in mid-career with about 20 years until retirement.',
      },
    },
  },
};

export const NearRetirement: Story = {
  args: {
    birthDate: '1965-09-10',
    currentAge: 60,
  },
  parameters: {
    docs: {
      description: {
        story: 'A 60-year-old worker nearing retirement, showing the "almost there" milestone.',
      },
    },
  },
};

export const AlreadyEligible: Story = {
  args: {
    birthDate: '1955-01-01',
    currentAge: 70,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A person who has already reached retirement age, showing the congratulations message.',
      },
    },
  },
};

export const JustStarting: Story = {
  args: {
    birthDate: '2002-12-25',
    currentAge: 23,
  },
  parameters: {
    docs: {
      description: {
        story: 'A 23-year-old worker at the beginning of their career.',
      },
    },
  },
};
