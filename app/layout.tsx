import './globals.css';
import type { ReactNode } from 'react';

import AppShell from '../components/AppShell';
import AppThemeProvider from '../components/AppThemeProvider';

export const metadata = {
  title: 'Music Chord App',
  description: 'AI chord continuation and progression ideas'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppThemeProvider>
          <AppShell>{children}</AppShell>
        </AppThemeProvider>
      </body>
    </html>
  );
}