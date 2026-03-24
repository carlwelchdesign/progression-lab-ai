'use client';

import { alpha, ToggleButton, ToggleButtonGroup } from '@mui/material';

import type { ProgressionDiagramInstrument } from './types';

/**
 * Props for toggling displayed diagram instrument.
 */
type InstrumentToggleProps = {
  value: ProgressionDiagramInstrument;
  onChange: (value: ProgressionDiagramInstrument) => void;
};

/**
 * Compact piano/guitar toggle used above result sections.
 */
export default function InstrumentToggle({ value, onChange }: InstrumentToggleProps) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_event, nextValue: ProgressionDiagramInstrument | null) => {
        if (nextValue) {
          onChange(nextValue);
        }
      }}
      sx={(theme) => {
        const isLight = theme.palette.mode === 'light';

        return {
          mr: 0,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'transparent',
          border: `1.5px solid ${alpha(theme.palette.primary.main, 0.9)}`,
          height: 32,
          borderRadius: 1,
          '& .MuiToggleButton-root': {
            border: 0,
            minHeight: 31,
            px: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            color: theme.palette.primary.main,
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, isLight ? 0.28 : 0.34),
              color: theme.palette.common.white,
              fontWeight: 700,
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, isLight ? 0.12 : 0.2),
              color: alpha(theme.palette.primary.main, 0.78),
            },
          },
        };
      }}
    >
      <ToggleButton value="piano">Piano</ToggleButton>
      <ToggleButton value="guitar">Guitar</ToggleButton>
    </ToggleButtonGroup>
  );
}
