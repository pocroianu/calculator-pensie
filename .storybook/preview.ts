import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n/config';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AnalyticsProvider } from '../src/contexts/AnalyticsContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      return React.createElement(
        I18nextProvider,
        { i18n },
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(
            AnalyticsProvider,
            null,
            React.createElement(
              ToastProvider,
              null,
              React.createElement(Story)
            )
          )
        )
      );
    },
  ],
};

export default preview;
