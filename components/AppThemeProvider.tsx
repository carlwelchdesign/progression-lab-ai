'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo, useState, useEffect, type ReactNode } from 'react';

import { createAppTheme } from '../lib/theme';
import { ThemeModeContext, type ThemeMode } from '../lib/themeMode';

type Props = {
  children: ReactNode;
};

export default function AppThemeProvider({ children }: Props) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const storedMode = localStorage.getItem('app-theme-mode');

    if (storedMode === 'light' || storedMode === 'dark') {
      setMode(storedMode);
    }
  }, []);

  const toggleMode = () => {
    setMode((current) => {
      const nextMode = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app-theme-mode', nextMode);
      return nextMode;
    });
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({ mode, toggleMode }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
