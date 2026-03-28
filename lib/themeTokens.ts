import { alpha, type PaletteMode, type ThemeOptions } from '@mui/material/styles';
import type { ThemePreset } from './themeMode';

type AppSurfaceColors = {
  translucentOverlay: string;
  translucentOverlaySoft: string;
  translucentPanel: string;
  translucentPanelBorder: string;
  glassInlineButton: string;
  chordPlaygroundDialogGradient: string;
  chordPlaygroundDialogBorder: string;
  chordPadGridBackground: string;
  chordPadDefaultBackground: string;
  chordPadBodyGradient: string;
  chordPadBodyGradientHover: string;
  chordPadActiveGradient: string;
  chordPadEditGradient: string;
  chordPadEditGradientHover: string;
  chordPadEditGradientActive: string;
  chordPadShadowRest: string;
  chordPadShadowPressed: string;
  chordPadEditGlow: string;
  chordPadEditGlowHover: string;
};

type AppAccentColors = {
  chordPadActiveBorder: string;
  chordPadEditBorder: string;
  chordPadCofBorder: string;
  chordPadCofGlow: string;
  chordCloseIcon: string;
  chordSuggestionBorders: string[];
};

type AppTagColors = {
  genre: string[];
  feeling: string[];
  custom: string[];
  chord: string[];
  mood: string[];
  chipText: string;
  chipBorder: string;
};

type AppColorTokens = {
  surface: AppSurfaceColors;
  accent: AppAccentColors;
  tags: AppTagColors;
};

declare module '@mui/material/styles' {
  interface Palette {
    appColors: AppColorTokens;
  }

  interface PaletteOptions {
    appColors?: AppColorTokens;
  }
}

/**
 * Typed subset of MUI theme options used by this app.
 */
type ThemeTokens = {
  palette: ThemeOptions['palette'];
  shape: ThemeOptions['shape'];
  typography: ThemeOptions['typography'];
  components: ThemeOptions['components'];
};

const darkAppColors: AppColorTokens = {
  surface: {
    translucentOverlay: '#0F172A59',
    translucentOverlaySoft: '#FFFFFF80',
    translucentPanel: '#171B2073',
    translucentPanelBorder: '#BCC2C933',
    glassInlineButton: '#0F172A59',
    chordPlaygroundDialogGradient:
      'linear-gradient(160deg, #5F656DF5 0%, #31363DFA 52%, #20242AFA 100%)',
    chordPlaygroundDialogBorder: '#BEC4CC47',
    chordPadGridBackground: '#171B2080',
    chordPadDefaultBackground: '#2E3136',
    chordPadBodyGradient: 'linear-gradient(180deg, #545457F7 0%, #2C2D31FC 100%)',
    chordPadBodyGradientHover: 'linear-gradient(180deg, #626266FA 0%, #34353AFC 100%)',
    chordPadActiveGradient: 'linear-gradient(180deg, #747579FC 0%, #3F4045FC 100%)',
    chordPadEditGradient: 'linear-gradient(180deg, #FF4D9D33 0%, #3C2635F2 100%)',
    chordPadEditGradientHover: 'linear-gradient(180deg, #FF4D9D42 0%, #442A3CF7 100%)',
    chordPadEditGradientActive: 'linear-gradient(180deg, #FF4D9D4D 0%, #482C40FA 100%)',
    chordPadShadowRest: '#14171CD1',
    chordPadShadowPressed: '#14171CEB',
    chordPadEditGlow: '#FF4D9D73',
    chordPadEditGlowHover: '#FF4D9D99',
  },
  accent: {
    chordPadActiveBorder: '#FACC15',
    chordPadEditBorder: '#FF4D9D',
    chordPadCofBorder: '#4ADE80',
    chordPadCofGlow: '#4ADE8066',
    chordCloseIcon: '#CBD5E1',
    chordSuggestionBorders: ['#F97316', '#22D3EE', '#A3E635', '#F43F5E', '#F59E0B', '#60A5FA'],
  },
  tags: {
    genre: ['#1565C0', '#0D47A1', '#283593', '#2E7D32', '#00695C', '#455A64', '#6A1B9A', '#0277BD'],
    feeling: [
      '#AD1457',
      '#6A1B9A',
      '#D81B60',
      '#7B1FA2',
      '#C2185B',
      '#8E24AA',
      '#4A148C',
      '#880E4F',
    ],
    custom: ['#37474F', '#4E342E', '#3E2723', '#424242', '#5D4037', '#263238'],
    chord: [
      '#0277BD',
      '#1565C0',
      '#283593',
      '#6A1B9A',
      '#AD1457',
      '#C41C3B',
      '#E74C3C',
      '#F39C12',
      '#27AE60',
      '#1ABC9C',
    ],
    mood: [
      '#00838F',
      '#0D47A1',
      '#512DA8',
      '#7B1FA2',
      '#C2185B',
      '#D32F2F',
      '#F57C00',
      '#FBC02D',
      '#388E3C',
      '#00796B',
    ],
    chipText: '#FFFFFF',
    chipBorder: '#FFFFFF59',
  },
};

const lightAppColors: AppColorTokens = {
  surface: {
    translucentOverlay: '#FFFFFFA6',
    translucentOverlaySoft: '#FFFFFFCC',
    translucentPanel: '#F8FAFFB8',
    translucentPanelBorder: '#A8B4CC40',
    glassInlineButton: '#FFFFFFA6',
    chordPlaygroundDialogGradient:
      'linear-gradient(160deg, #EEF4FFE6 0%, #E3ECF9F0 52%, #D6E0EFF5 100%)',
    chordPlaygroundDialogBorder: '#90A4C266',
    chordPadGridBackground: '#F5F8FFCC',
    chordPadDefaultBackground: '#E8EEF7',
    chordPadBodyGradient: 'linear-gradient(180deg, #F4F8FF 0%, #DCE6F4 100%)',
    chordPadBodyGradientHover: 'linear-gradient(180deg, #FFFFFF 0%, #E4EDF8 100%)',
    chordPadActiveGradient: 'linear-gradient(180deg, #E7F0FF 0%, #CFDDF0 100%)',
    chordPadEditGradient: 'linear-gradient(180deg, #FF4D9D33 0%, #FFE6F2F2 100%)',
    chordPadEditGradientHover: 'linear-gradient(180deg, #FF4D9D42 0%, #FFE9F4F7 100%)',
    chordPadEditGradientActive: 'linear-gradient(180deg, #FF4D9D4D 0%, #FFE1F0FA 100%)',
    chordPadShadowRest: '#3E4B5C52',
    chordPadShadowPressed: '#3E4B5C78',
    chordPadEditGlow: '#FF4D9D73',
    chordPadEditGlowHover: '#FF4D9D99',
  },
  accent: {
    chordPadActiveBorder: '#CA8A04',
    chordPadEditBorder: '#D61F7A',
    chordPadCofBorder: '#16A34A',
    chordPadCofGlow: '#16A34A55',
    chordCloseIcon: '#475569',
    chordSuggestionBorders: ['#EA580C', '#0EA5E9', '#65A30D', '#E11D48', '#D97706', '#2563EB'],
  },
  tags: {
    genre: ['#1565C0', '#0D47A1', '#283593', '#2E7D32', '#00695C', '#455A64', '#6A1B9A', '#0277BD'],
    feeling: [
      '#AD1457',
      '#6A1B9A',
      '#D81B60',
      '#7B1FA2',
      '#C2185B',
      '#8E24AA',
      '#4A148C',
      '#880E4F',
    ],
    custom: ['#37474F', '#4E342E', '#3E2723', '#424242', '#5D4037', '#263238'],
    chord: [
      '#0277BD',
      '#1565C0',
      '#283593',
      '#6A1B9A',
      '#AD1457',
      '#C41C3B',
      '#E74C3C',
      '#F39C12',
      '#27AE60',
      '#1ABC9C',
    ],
    mood: [
      '#00838F',
      '#0D47A1',
      '#512DA8',
      '#7B1FA2',
      '#C2185B',
      '#D32F2F',
      '#F57C00',
      '#FBC02D',
      '#388E3C',
      '#00796B',
    ],
    chipText: '#FFFFFF',
    chipBorder: '#FFFFFF59',
  },
};

function getPresetPrimary(mode: PaletteMode, preset: ThemePreset): string {
  if (preset === 'solid') {
    return mode === 'dark' ? '#3B82F6' : '#1D4ED8';
  }

  if (preset === 'dry') {
    return mode === 'dark' ? '#94A3B8' : '#475569';
  }

  return mode === 'dark' ? '#60A5FA' : '#2563EB';
}

function getPresetAppColors(mode: PaletteMode, preset: ThemePreset): AppColorTokens {
  const base = mode === 'dark' ? darkAppColors : lightAppColors;

  if (preset === 'solid') {
    return {
      ...base,
      surface: {
        ...base.surface,
        chordPadBodyGradient:
          mode === 'dark'
            ? 'linear-gradient(180deg, #334155 0%, #1E293B 100%)'
            : 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%)',
        chordPadBodyGradientHover:
          mode === 'dark'
            ? 'linear-gradient(180deg, #475569 0%, #334155 100%)'
            : 'linear-gradient(180deg, #F1F5F9 0%, #DCE5F0 100%)',
      },
    };
  }

  if (preset === 'dry') {
    return {
      ...base,
      surface: {
        ...base.surface,
        chordPadEditGradient:
          mode === 'dark'
            ? 'linear-gradient(180deg, #94A3B833 0%, #1E293BF2 100%)'
            : 'linear-gradient(180deg, #64748B33 0%, #E2E8F0F2 100%)',
        chordPadEditGradientHover:
          mode === 'dark'
            ? 'linear-gradient(180deg, #94A3B844 0%, #334155F7 100%)'
            : 'linear-gradient(180deg, #64748B44 0%, #E2E8F0F7 100%)',
        chordPadEditGradientActive:
          mode === 'dark'
            ? 'linear-gradient(180deg, #94A3B84D 0%, #334155FA 100%)'
            : 'linear-gradient(180deg, #64748B4D 0%, #CBD5E1FA 100%)',
      },
      accent: {
        ...base.accent,
        chordPadEditBorder: mode === 'dark' ? '#94A3B8' : '#64748B',
      },
      tags: {
        ...base.tags,
        custom: ['#475569', '#52525B', '#3F3F46', '#4B5563', '#64748B', '#334155'],
      },
    };
  }

  return base;
}

const sharedTokens: Omit<ThemeTokens, 'palette'> = {
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        ':root': {
          '--app-font-family': theme.typography.fontFamily,
          '--app-bg-default': theme.palette.background.default,
          '--app-text-primary': theme.palette.text.primary,
          '--app-text-muted': theme.palette.text.secondary,
          '--app-panel-bg': theme.palette.background.paper,
          '--app-panel-border': alpha(theme.palette.divider, 0.9),
          '--app-input-bg': alpha(
            theme.palette.background.default,
            theme.palette.mode === 'dark' ? 0.96 : 0.7,
          ),
          '--app-input-border': alpha(theme.palette.divider, 0.95),
          '--app-primary': theme.palette.primary.main,
          '--app-danger': theme.palette.error.main,
          '--app-card-bg': alpha(
            theme.palette.background.paper,
            theme.palette.mode === 'dark' ? 0.78 : 0.96,
          ),
          '--app-card-border': alpha(theme.palette.divider, 0.9),
          '--app-surface-muted': alpha(
            theme.palette.background.paper,
            theme.palette.mode === 'dark' ? 0.62 : 0.88,
          ),
        },
      }),
    },
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

function createPalette(mode: PaletteMode, preset: ThemePreset): ThemeOptions['palette'] {
  const appColors = getPresetAppColors(mode, preset);

  return {
    mode,
    primary: {
      main: getPresetPrimary(mode, preset),
    },
    appColors,
    background:
      mode === 'dark'
        ? {
            default: '#0f1115',
            paper: '#171a21',
          }
        : {
            default: '#f5f7fb',
            paper: '#ffffff',
          },
  };
}

/**
 * Returns mode-aware theme tokens merged with shared design tokens.
 */
export function getThemeTokens(mode: PaletteMode, preset: ThemePreset): ThemeTokens {
  return {
    palette: createPalette(mode, preset),
    ...sharedTokens,
  };
}
