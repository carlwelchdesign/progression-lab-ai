import { alpha, type PaletteMode, type ThemeOptions } from '@mui/material/styles';

/**
 * Typed subset of MUI theme options used by this app.
 */
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
    MuiButton: {
      styleOverrides: {
        outlined: ({ theme }) => ({
          borderWidth: 1.5,
          color: theme.palette.primary.main,
          borderColor: alpha(theme.palette.primary.main, 0.9),
          '&:hover': {
            borderWidth: 1.5,
            borderColor: alpha(theme.palette.primary.main, 1),
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderWidth: 1.5,
          color: theme.palette.primary.main,
          borderColor: alpha(theme.palette.primary.main, 0.45),
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.75),
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
          '&.Mui-selected': {
            color: theme.palette.primary.main,
            borderColor: alpha(theme.palette.primary.main, 0.85),
            backgroundColor: alpha(theme.palette.primary.main, 0.16),
          },
          '&.Mui-selected:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.22),
          },
        }),
      },
    },
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

/**
 * Returns mode-aware theme tokens merged with shared design tokens.
 */
export function getThemeTokens(mode: PaletteMode): ThemeTokens {
  return {
    palette: mode === 'light' ? lightPalette : darkPalette,
    ...sharedTokens,
  };
}
