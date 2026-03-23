import { createTheme, type PaletteMode } from '@mui/material/styles';

import { getThemeTokens } from './themeTokens';

/**
 * Creates the Material UI theme instance for the selected color mode.
 */
export function createAppTheme(mode: PaletteMode) {
  const tokens = getThemeTokens(mode);
  return createTheme(tokens);
}
