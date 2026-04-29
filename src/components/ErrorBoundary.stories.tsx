import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import React from 'react';
import ErrorBoundary from './ErrorBoundary';

// A component that throws an error for testing
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error: Something went wrong in the component');
  }
  return React.createElement(
    'div',
    { className: 'p-6 bg-green-50 rounded-lg border border-green-200 text-center' },
    React.createElement('p', { className: 'text-green-800 font-medium' }, 'Component rendered successfully!'),
    React.createElement('p', { className: 'text-sm text-green-600 mt-1' }, 'No errors occurred.')
  );
};

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Error boundary component that catches JavaScript errors in child components. Displays a user-friendly error UI with retry and reload options. Logs errors to sessionStorage for debugging. Supports custom fallback UI, titles, and descriptions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onReset: { description: 'Callback fired when the user clicks the retry button' },
    title: { control: 'text', description: 'Custom error title' },
    description: { control: 'text', description: 'Custom error description' },
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithError: Story = {
  args: {
    onReset: fn(),
    children: React.createElement(ErrorThrowingComponent, { shouldThrow: true }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error boundary displaying the default error UI after catching an error from a child component.',
      },
    },
  },
};

export const WithCustomTitle: Story = {
  args: {
    onReset: fn(),
    title: 'Calculation Error',
    description: 'We encountered a problem while calculating your pension. Please try again.',
    children: React.createElement(ErrorThrowingComponent, { shouldThrow: true }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error boundary with custom title and description for domain-specific errors.',
      },
    },
  },
};

export const NoError: Story = {
  args: {
    children: React.createElement(ErrorThrowingComponent, { shouldThrow: false }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no error occurs, the ErrorBoundary simply renders its children without any error UI.',
      },
    },
  },
};

export const WithCustomFallback: Story = {
  args: {
    fallback: React.createElement(
      'div',
      { className: 'p-8 bg-yellow-50 rounded-lg border border-yellow-200 text-center max-w-md' },
      React.createElement('p', { className: 'text-yellow-800 font-semibold text-lg' }, 'Custom Error UI'),
      React.createElement(
        'p',
        { className: 'text-yellow-600 mt-2 text-sm' },
        'This is a completely custom fallback UI provided to the ErrorBoundary.'
      ),
      React.createElement(
        'button',
        {
          className: 'mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors',
          onClick: () => window.location.reload(),
        },
        'Reload Application'
      )
    ),
    children: React.createElement(ErrorThrowingComponent, { shouldThrow: true }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error boundary with a completely custom fallback UI provided via the fallback prop.',
      },
    },
  },
};
