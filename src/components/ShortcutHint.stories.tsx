import type { Meta, StoryObj } from '@storybook/react-vite';
import ShortcutHint from './ShortcutHint';
import React from 'react';

const meta = {
  title: 'Components/ShortcutHint',
  component: ShortcutHint,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Keyboard shortcut hint badge component. Displays a keyboard shortcut in a styled badge (kbd element) or as inline text. Used alongside buttons and controls to indicate available keyboard shortcuts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    shortcutId: {
      control: 'text',
      description: 'ID of the keyboard shortcut from the shortcuts configuration',
    },
    inline: {
      control: 'boolean',
      description:
        'If true, renders as inline text in parentheses. If false, renders as a styled kbd badge.',
    },
  },
} satisfies Meta<typeof ShortcutHint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BadgeStyle: Story = {
  args: {
    shortcutId: 'toggleLanguage',
    inline: false,
  },
};

export const InlineStyle: Story = {
  args: {
    shortcutId: 'toggleLanguage',
    inline: true,
  },
};

export const WithButton: Story = {
  args: {
    shortcutId: 'toggleLanguage',
    inline: false,
  },
  render: (args) =>
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement(
        'button',
        {
          className:
            'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
        },
        'Toggle Language'
      ),
      React.createElement(ShortcutHint, args)
    ),
  parameters: {
    docs: {
      description: {
        story: 'ShortcutHint displayed alongside a button to indicate the keyboard shortcut.',
      },
    },
  },
};
