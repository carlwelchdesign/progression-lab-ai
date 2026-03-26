'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AlertColor } from '@mui/material';

import StatusSnackbar from '../ui/StatusSnackbar';

type SnackbarOptions = {
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
};

type AppSnackbarContextValue = {
  showSnackbar: (options: SnackbarOptions) => void;
  showSuccess: (message: string, autoHideDuration?: number) => void;
  showError: (message: string, autoHideDuration?: number) => void;
  showInfo: (message: string, autoHideDuration?: number) => void;
  showWarning: (message: string, autoHideDuration?: number) => void;
  hideSnackbar: () => void;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: AlertColor;
  autoHideDuration: number;
};

const DEFAULT_AUTO_HIDE_DURATION = 6000;

const AppSnackbarContext = createContext<AppSnackbarContextValue | undefined>(undefined);

export function AppSnackbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
    autoHideDuration: DEFAULT_AUTO_HIDE_DURATION,
  });

  const hideSnackbar = useCallback(() => {
    setState((previous) => ({ ...previous, open: false }));
  }, []);

  const showSnackbar = useCallback((options: SnackbarOptions) => {
    setState({
      open: true,
      message: options.message,
      severity: options.severity ?? 'success',
      autoHideDuration: options.autoHideDuration ?? DEFAULT_AUTO_HIDE_DURATION,
    });
  }, []);

  const showSuccess = useCallback(
    (message: string, autoHideDuration?: number) => {
      showSnackbar({ message, severity: 'success', autoHideDuration });
    },
    [showSnackbar],
  );

  const showError = useCallback(
    (message: string, autoHideDuration?: number) => {
      showSnackbar({ message, severity: 'error', autoHideDuration });
    },
    [showSnackbar],
  );

  const showInfo = useCallback(
    (message: string, autoHideDuration?: number) => {
      showSnackbar({ message, severity: 'info', autoHideDuration });
    },
    [showSnackbar],
  );

  const showWarning = useCallback(
    (message: string, autoHideDuration?: number) => {
      showSnackbar({ message, severity: 'warning', autoHideDuration });
    },
    [showSnackbar],
  );

  const value = useMemo(
    () => ({
      showSnackbar,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      hideSnackbar,
    }),
    [showSnackbar, showSuccess, showError, showInfo, showWarning, hideSnackbar],
  );

  return (
    <AppSnackbarContext.Provider value={value}>
      {children}
      <StatusSnackbar
        open={state.open}
        message={state.message}
        severity={state.severity}
        autoHideDuration={state.autoHideDuration}
        onClose={hideSnackbar}
      />
    </AppSnackbarContext.Provider>
  );
}

export function useAppSnackbar() {
  const context = useContext(AppSnackbarContext);

  if (!context) {
    throw new Error('useAppSnackbar must be used within AppSnackbarProvider');
  }

  return context;
}
