/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  base: '/calculator_pensie/',
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and reduced initial bundle size
        manualChunks: {
          // Vendor chunks - heavy libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-i18n': ['react-i18next', 'i18next'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          // Component chunks for lazy-loaded components
          'chunk-vpr-admin': ['./src/components/VPRAdmin.tsx'],
          'chunk-charts': ['./src/components/PensionCharts.tsx'],
          'chunk-guided-tour': ['./src/components/GuidedTour.tsx'],
          'chunk-import-export': ['./src/components/ImportExportPanel.tsx'],
          'chunk-keyboard-shortcuts': ['./src/components/KeyboardShortcutsHelp.tsx']
        }
      }
    },
    // Generate source maps for better debugging
    sourcemap: false,
    // Increase chunk size warning limit for vendor chunks
    chunkSizeWarningLimit: 500
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  }
});