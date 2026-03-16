import { createTheme, type PaletteMode } from '@mui/material/styles';

import { getThemeTokens } from './themeTokens';

export function createAppTheme(mode: PaletteMode) {
  const tokens = getThemeTokens(mode);
  return createTheme(tokens);
}
