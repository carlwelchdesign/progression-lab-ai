import type { Preview } from '@storybook/nextjs-vite';
import React from 'react';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { themes } from 'storybook/theming';

import AppThemeProvider from '../components/providers/AppThemeProvider';
import { AppSnackbarProvider } from '../components/providers/AppSnackbarProvider';

initialize({ onUnhandledRequest: 'bypass' });

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <AppThemeProvider>
        <AppSnackbarProvider>
          <Story />
        </AppSnackbarProvider>
      </AppThemeProvider>
    ),
  ],
  parameters: {
    docs: {
      theme: themes.dark,
    },
    backgrounds: {
      default: 'app-dark',
      values: [
        { name: 'app-dark', value: '#12171d' },
        { name: 'app-light', value: '#f6f8fb' },
        { name: 'neutral', value: '#1e1e1e' },
      ],
    },
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
  },
};

export default preview;
