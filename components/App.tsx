import type { ReactNode } from 'react';

import AppThemeProvider from './providers/AppThemeProvider';
import { AppSnackbarProvider } from './providers/AppSnackbarProvider';
import { AuthProvider } from './providers/AuthProvider';
import { AuthModalProvider } from './providers/AuthModalProvider';
import { LocaleProvider } from './providers/LocaleProvider';
import AppWrapper from './AppWrapper';

type Props = {
  children: ReactNode;
};

export default function App({ children }: Props) {
  return (
    <LocaleProvider>
      <AppThemeProvider>
        <AppSnackbarProvider>
          <AuthProvider>
            <AuthModalProvider>
              <AppWrapper>{children}</AppWrapper>
            </AuthModalProvider>
          </AuthProvider>
        </AppSnackbarProvider>
      </AppThemeProvider>
    </LocaleProvider>
  );
}
