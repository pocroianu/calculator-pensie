import type { Meta, StoryObj } from '@storybook/react-vite';
import LoadingSpinner, {
  ModalLoadingFallback,
  PanelLoadingFallback,
  ChartLoadingFallback,
} from './LoadingSpinner';
import React from 'react';

const meta = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading spinner component with multiple size variants and contextual fallback components. Uses Lucide Loader2 icon with CSS animation. Includes specialized fallbacks for modals, panels, and charts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the spinner icon',
    },
    message: {
      control: 'text',
      description: 'Optional message displayed below the spinner',
    },
  },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const WithMessage: Story = {
  args: {
    size: 'md',
    message: 'Loading your pension data...',
  },
};

export const LargeWithMessage: Story = {
  args: {
    size: 'lg',
    message: 'Calculating pension details...',
  },
};

export const PanelFallback: StoryObj = {
  render: () => React.createElement(
    'div',
    { className: 'w-96 border border-gray-200 rounded-lg' },
    React.createElement(PanelLoadingFallback, { message: 'Loading panel content...' })
  ),
  parameters: {
    docs: {
      description: {
        story: 'Panel-specific loading fallback for lazy-loaded panel components.',
      },
    },
  },
};

export const ChartFallback: StoryObj = {
  render: () => React.createElement(
    'div',
    { className: 'w-[600px]' },
    React.createElement(ChartLoadingFallback)
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Chart-specific loading fallback with skeleton UI that mimics the chart layout while content loads.',
      },
    },
  },
};

export const ModalFallback: StoryObj = {
  render: () => React.createElement(
    'div',
    { className: 'relative w-full h-64' },
    React.createElement(ModalLoadingFallback, { message: 'Loading modal...' })
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Modal-specific loading fallback with backdrop overlay. Used for lazy-loaded modal components like VPRAdmin and KeyboardShortcutsHelp.',
      },
    },
  },
};
