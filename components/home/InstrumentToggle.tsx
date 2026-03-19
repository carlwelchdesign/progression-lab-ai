'use client';

import { alpha, ToggleButton, ToggleButtonGroup } from '@mui/material';

import type { ProgressionDiagramInstrument } from './types';

type InstrumentToggleProps = {
  value: ProgressionDiagramInstrument;
  onChange: (value: ProgressionDiagramInstrument) => void;
};

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
        const selectedGradient = isLight
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.86)} 0%, ${alpha(theme.palette.info.main, 0.8)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.7)} 0%, ${alpha(theme.palette.info.main, 0.62)} 100%)`;

        return {
          mr: '16px',
          backdropFilter: 'blur(10px)',
          backgroundColor: isLight
            ? alpha(theme.palette.common.black, 0.24)
            : alpha(theme.palette.background.paper, 0.48),
          border: 'none',
          borderRadius: '4px',
          boxShadow: isLight
            ? `0 2px 12px ${alpha(theme.palette.common.black, 0.2)}`
            : `0 2px 12px ${alpha(theme.palette.common.black, 0.45)}`,
          '& .MuiToggleButton-root': {
            border: 'none',
            color: alpha(theme.palette.common.white, isLight ? 0.88 : 0.78),
            '&.Mui-selected': {
              backgroundImage: selectedGradient,
              color: theme.palette.common.white,
              fontWeight: 700,
              boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, isLight ? 0.24 : 0.16)}`,
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, isLight ? 0.22 : 0.24),
              color: theme.palette.common.white,
            },
            '&.Mui-selected:hover': {
              backgroundImage: selectedGradient,
              filter: 'brightness(1.05)',
            },
          },
        };
      }}
    >
      <ToggleButton value="piano">Piano Charts</ToggleButton>
      <ToggleButton value="guitar">Guitar Charts</ToggleButton>
    </ToggleButtonGroup>
  );
}
