import type { Meta, StoryObj } from '@storybook/react';
import Tabs from './Tabs.enhanced';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Enhanced Tabs Component

Sprint 1 implementation featuring:
- 🌊 Spring physics animations
- 💫 Material Design ripple effects
- ⌨️ Keyboard shortcuts (Ctrl+1-9)
- ♿ WCAG 2.4.13 AAA focus indicators
- 🎨 Multi-layered elevation shadows

## Accessibility
- Full keyboard navigation (Arrow keys, Home, End, Ctrl+1-9)
- ARIA-compliant tab roles
- Screen reader announcements
- Respects \`prefers-reduced-motion\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const sampleTabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <BarChart3 size={16} />,
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: <TrendingUp size={16} />,
    count: 3,
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: <Calendar size={16} />,
  },
];

export const Default: Story = {
  args: {
    tabs: sampleTabs,
    activeTab: 'overview',
    onChange: (tabId: string) => console.log('Tab changed to:', tabId),
    children: (
      <div className="p-6 bg-white dark:bg-dark-bg-secondary rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Tab Content</h3>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          This is the content for the selected tab. Try clicking different tabs
          to see the spring physics in action!
        </p>
      </div>
    ),
  },
};

export const WithBadges: Story = {
  args: {
    tabs: [
      {
        id: 'all',
        label: 'All Items',
        count: 42,
      },
      {
        id: 'active',
        label: 'Active',
        count: 12,
      },
      {
        id: 'archived',
        label: 'Archived',
        count: 30,
      },
    ],
    activeTab: 'all',
    onChange: (tabId: string) => console.log('Tab changed to:', tabId),
    children: (
      <div className="p-6 bg-white dark:bg-dark-bg-secondary rounded-lg">
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Badge counts animate with spring physics when they change.
        </p>
      </div>
    ),
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: [
      { id: '1', label: 'Tab 1' },
      { id: '2', label: 'Tab 2' },
      { id: '3', label: 'Tab 3' },
      { id: '4', label: 'Tab 4' },
      { id: '5', label: 'Tab 5' },
      { id: '6', label: 'Tab 6' },
      { id: '7', label: 'Tab 7' },
      { id: '8', label: 'Tab 8' },
    ],
    activeTab: '1',
    onChange: (tabId: string) => console.log('Tab changed to:', tabId),
    children: (
      <div className="p-6 bg-white dark:bg-dark-bg-secondary rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Many Tabs Demo</h3>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          Try using keyboard shortcuts to navigate:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-dark-text-secondary">
          <li><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Ctrl+1</kbd> to <kbd>Ctrl+8</kbd> - Jump to tab</li>
          <li><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">←</kbd> <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">→</kbd> - Navigate left/right</li>
          <li><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Home</kbd> - First tab</li>
          <li><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">End</kbd> - Last tab</li>
        </ul>
      </div>
    ),
  },
};

export const FocusDemo: Story = {
  args: {
    tabs: sampleTabs,
    activeTab: 'overview',
    onChange: (tabId: string) => console.log('Tab changed to:', tabId),
    children: (
      <div className="p-6 bg-white dark:bg-dark-bg-secondary rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Focus Indicator Demo</h3>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Tab</kbd> to see
          the enhanced WCAG 2.4.13 AAA-compliant focus ring:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-dark-text-secondary">
          <li>3px thick outline</li>
          <li>3:1 contrast ratio minimum</li>
          <li>Subtle pulsing animation</li>
          <li>Layered glow effect</li>
        </ul>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Animation is disabled if <code>prefers-reduced-motion</code> is set.
        </p>
      </div>
    ),
  },
};

export const RippleDemo: Story = {
  args: {
    tabs: sampleTabs,
    activeTab: 'overview',
    onChange: (tabId: string) => console.log('Tab changed to:', tabId),
    children: (
      <div className="p-6 bg-white dark:bg-dark-bg-secondary rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Ripple Effect Demo</h3>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Click on different tabs and watch the Material Design ripple effect
          emanate from your exact click position. Try clicking different areas
          of each tab to see the ripple origin change!
        </p>
      </div>
    ),
  },
};

export const DarkMode: Story = {
  args: {
    tabs: sampleTabs,
    activeTab: 'overview',
    onChange: (tabId: string) => console.log('Tab changed to:', tabId),
    children: (
      <div className="p-6 bg-dark-bg-secondary rounded-lg">
        <h3 className="text-lg font-semibold text-dark-text mb-2">Dark Mode</h3>
        <p className="text-dark-text-secondary">
          All animations, shadows, and focus indicators are optimized for dark mode.
        </p>
      </div>
    ),
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};
