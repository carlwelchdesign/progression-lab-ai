'use client';

import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
// import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import { IconButton, Stack, Tooltip } from '@mui/material';

import { useThemeMode } from '../../lib/themeMode';

/**
 * Header action button that toggles between light and dark mode.
 */
export default function ThemeModeToggle() {
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
        <IconButton
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleMode}
        >
          {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
        </IconButton>
      </Tooltip>
      {/* <Tooltip title={`Preset: ${presetLabel}. Click to cycle presets.`}>
        <IconButton aria-label={`Theme preset ${presetLabel}`} onClick={cyclePreset}>
          <LayersOutlinedIcon />
        </IconButton>
      </Tooltip> */}
    </Stack>
  );
}
