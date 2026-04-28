import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import FAQ from './FAQ';

const meta = {
  title: 'Components/FAQ',
  component: FAQ,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Expandable FAQ accordion component. Displays common questions about the Romanian pension system with collapsible answers. Each item can be independently toggled. Features a gradient header with help icon.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        { className: 'w-[600px]' },
        React.createElement(Story)
      ),
  ],
} satisfies Meta<typeof FAQ>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  args: {
    className: 'shadow-lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'FAQ with additional custom shadow styling.',
      },
    },
  },
};
