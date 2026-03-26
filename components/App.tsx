import type { ReactNode } from 'react';

import AppThemeProvider from './AppThemeProvider';
import { AppSnackbarProvider } from './providers/AppSnackbarProvider';
import { AuthProvider } from './providers/AuthProvider';
import AppWrapper from './AppWrapper';

type Props = {
  children: ReactNode;
};

export default function App({ children }: Props) {
  return (
    <AppThemeProvider>
      <AppSnackbarProvider>
        <AuthProvider>
          <AppWrapper>{children}</AppWrapper>
        </AuthProvider>
      </AppSnackbarProvider>
    </AppThemeProvider>
  );
}
