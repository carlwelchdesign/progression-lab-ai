import type { PaletteMode, ThemeOptions } from '@mui/material/styles';

type ThemeTokens = {
  palette: ThemeOptions['palette'];
  shape: ThemeOptions['shape'];
  typography: ThemeOptions['typography'];
  components: ThemeOptions['components'];
};

const sharedTokens: Omit<ThemeTokens, 'palette'> = {
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'].join(','),
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderWidth: 1,
          borderStyle: 'solid',
        },
      },
    },
  },
};

const lightPalette: ThemeOptions['palette'] = {
  mode: 'light',
  primary: {
    main: '#2563eb',
  },
  background: {
    default: '#f5f7fb',
    paper: '#ffffff',
  },
};

const darkPalette: ThemeOptions['palette'] = {
  mode: 'dark',
  primary: {
    main: '#60a5fa',
  },
  background: {
    default: '#0f1115',
    paper: '#171a21',
  },
};

export function getThemeTokens(mode: PaletteMode): ThemeTokens {
  return {
    palette: mode === 'light' ? lightPalette : darkPalette,
    ...sharedTokens,
  };
}
