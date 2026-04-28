import type { Meta, StoryObj } from '@storybook/react-vite';
import ThemeToggle from './ThemeToggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Theme toggle component that switches between light, dark, and system themes. Supports a simple toggle variant (light/dark) and a dropdown variant (light/dark/system). Integrates with ThemeContext and analytics tracking.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['toggle', 'dropdown'],
      description:
        'Toggle shows a simple light/dark switch. Dropdown includes a system theme option.',
    },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Toggle: Story = {
  args: {
    variant: 'toggle',
  },
};

export const Dropdown: Story = {
  args: {
    variant: 'dropdown',
  },
};
