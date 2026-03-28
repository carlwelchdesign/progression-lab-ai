import { createTheme, type PaletteMode } from '@mui/material/styles';

import { getThemeTokens } from './themeTokens';
import type { ThemePreset } from './themeMode';
import type { AppTextDirection } from './i18n/locales';

/**
 * Creates the Material UI theme instance for the selected color mode.
 */
export function createAppTheme(
  mode: PaletteMode,
  preset: ThemePreset,
  direction: AppTextDirection,
) {
  const tokens = getThemeTokens(mode, preset);
  return createTheme({
    ...tokens,
    direction,
  });
}
