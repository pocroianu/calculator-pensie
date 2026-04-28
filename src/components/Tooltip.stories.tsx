import type { Meta, StoryObj } from '@storybook/react-vite';
import Tooltip, { FieldTooltip } from './Tooltip';
import React from 'react';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tooltip component built on Radix UI primitives. Supports help and info variants with configurable positioning. Used throughout the app for contextual help.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Text content displayed in the tooltip',
    },
    variant: {
      control: 'select',
      options: ['help', 'info'],
      description: 'Visual variant - help shows a question mark, info shows an info icon',
    },
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Which side the tooltip appears on',
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HelpVariant: Story = {
  args: {
    content: 'This is a help tooltip explaining a feature.',
    variant: 'help',
    side: 'top',
  },
};

export const InfoVariant: Story = {
  args: {
    content: 'This is an informational tooltip with additional context.',
    variant: 'info',
    side: 'top',
  },
};

export const PositionRight: Story = {
  args: {
    content: 'Tooltip positioned on the right side.',
    variant: 'help',
    side: 'right',
  },
};

export const PositionBottom: Story = {
  args: {
    content: 'Tooltip positioned on the bottom.',
    variant: 'info',
    side: 'bottom',
  },
};

export const PositionLeft: Story = {
  args: {
    content: 'Tooltip positioned on the left.',
    variant: 'help',
    side: 'left',
  },
};

export const WithCustomTrigger: Story = {
  args: {
    content: 'Tooltip with a custom trigger element.',
    variant: 'help',
    side: 'top',
  },
  render: (args) =>
    React.createElement(Tooltip, args,
      React.createElement(
        'button',
        {
          className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
        },
        'Hover me for help'
      )
    ),
};

export const LongContent: Story = {
  args: {
    content:
      'This tooltip contains a longer description that wraps across multiple lines to demonstrate how the component handles extended text content gracefully.',
    variant: 'info',
    side: 'top',
  },
};
