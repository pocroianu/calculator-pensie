import type { Meta, StoryObj } from '@storybook/react-vite';
import LanguageSwitcher from './LanguageSwitcher';

const meta = {
  title: 'Components/LanguageSwitcher',
  component: LanguageSwitcher,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Language switcher dropdown component that supports multiple languages (Romanian, English, French, German, Spanish). Displays the current language name with a dropdown menu for selection. Integrates with i18next and analytics tracking.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
