import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Toast from './Toast';
import { Toast as ToastType } from '../../contexts/ToastContext';
import React from 'react';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toast notification component with WCAG AA compliant color schemes. Supports success, error, warning, and info variants. Features animated entrance/exit, keyboard dismissal (Escape/Enter/Space), and focus management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    toast: {
      description: 'The toast data object containing type, message key, and optional params',
    },
    onDismiss: {
      description: 'Callback fired when the toast is dismissed',
    },
  },
  args: {
    onDismiss: fn(),
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

const createToast = (
  type: ToastType['type'],
  messageKey: string,
  id?: string
): ToastType => ({
  id: id || `toast-${type}`,
  type,
  messageKey,
  duration: 4000,
});

export const Success: Story = {
  args: {
    toast: createToast('success', 'Data saved successfully'),
  },
};

export const Error: Story = {
  args: {
    toast: createToast('error', 'An error occurred while saving'),
  },
};

export const Warning: Story = {
  args: {
    toast: createToast('warning', 'Your session is about to expire'),
  },
};

export const Info: Story = {
  args: {
    toast: createToast('info', 'New updates are available'),
  },
};

export const AllVariants: StoryObj = {
  render: () =>
    React.createElement(
      'div',
      { className: 'space-y-3 w-96' },
      React.createElement(Toast, {
        toast: createToast('success', 'Data saved successfully', 'success-1'),
        onDismiss: fn(),
      }),
      React.createElement(Toast, {
        toast: createToast('error', 'An error occurred while saving', 'error-1'),
        onDismiss: fn(),
      }),
      React.createElement(Toast, {
        toast: createToast('warning', 'Your session is about to expire', 'warning-1'),
        onDismiss: fn(),
      }),
      React.createElement(Toast, {
        toast: createToast('info', 'New updates are available', 'info-1'),
        onDismiss: fn(),
      })
    ),
  parameters: {
    docs: {
      description: {
        story: 'All toast variants displayed together showing the different color schemes and icons.',
      },
    },
  },
};
