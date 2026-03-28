'use client';

import '../../lib/i18n/init';

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

import { createAppTheme } from '../../lib/theme';
import { ThemeModeContext, type ThemeMode, type ThemePreset } from '../../lib/themeMode';
import { useAppLocale } from './LocaleProvider';

type Props = {
  children: ReactNode;
};

export default function AppThemeProvider({ children }: Props) {
  const { direction } = useAppLocale();
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [preset, setPreset] = useState<ThemePreset>('default');

  useEffect(() => {
    const storedMode = localStorage.getItem('app-theme-mode');
    const storedPreset = localStorage.getItem('app-theme-preset');

    if (storedMode === 'light' || storedMode === 'dark') {
      setMode(storedMode);
    }

    if (storedPreset === 'default' || storedPreset === 'solid' || storedPreset === 'dry') {
      setPreset(storedPreset);
    }
  }, []);

  const toggleMode = () => {
    setMode((current) => {
      const nextMode = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app-theme-mode', nextMode);
      return nextMode;
    });
  };

  const cyclePreset = () => {
    setPreset((current) => {
      const nextPreset: ThemePreset =
        current === 'default' ? 'solid' : current === 'solid' ? 'dry' : 'default';
      localStorage.setItem('app-theme-preset', nextPreset);
      return nextPreset;
    });
  };

  const theme = useMemo(() => createAppTheme(mode, preset, direction), [mode, preset, direction]);

  const emotionCache = useMemo(
    () =>
      createCache({
        key: direction === 'rtl' ? 'mui-rtl' : 'mui',
        stylisPlugins: direction === 'rtl' ? [prefixer, rtlPlugin] : [prefixer],
      }),
    [direction],
  );

  const contextValue = useMemo(() => ({ mode, toggleMode, preset, cyclePreset }), [mode, preset]);

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </ThemeModeContext.Provider>
  );
}
