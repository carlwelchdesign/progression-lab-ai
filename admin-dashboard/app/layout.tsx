import type { ReactNode } from 'react';
import ThemeShell from '../components/ThemeShell';

import './globals.css';

export const metadata = {
  title: 'ProgressionLab Admin',
  description: 'Admin dashboard for ProgressionLab data management',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeShell>{children}</ThemeShell>
      </body>
    </html>
  );
}
