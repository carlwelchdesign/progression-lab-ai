'use client';

import { Box, Slider, Typography } from '@mui/material';

/**
 * Props for attack/decay envelope controls.
 */
type EnvelopeControlsProps = {
  attack: number;
  onAttackChange: (value: number) => void;
  decay: number;
  onDecayChange: (value: number) => void;
  direction?: 'row' | 'column';
};

/**
 * Shared attack/decay slider pair used in playback settings.
 */
export default function EnvelopeControls({
  attack,
  onAttackChange,
  decay,
  onDecayChange,
  direction = 'row',
}: EnvelopeControlsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: direction,
        gap: 2,
        alignItems: direction === 'row' ? 'center' : 'stretch',
      }}
    >
      <Box sx={{ minWidth: 120, width: direction === 'column' ? '100%' : 'auto' }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          Attack: {attack.toFixed(2)}s
        </Typography>
        <Slider
          size="small"
          value={attack}
          onChange={(_, value) => onAttackChange(value as number)}
          min={0}
          max={0.5}
          step={0.01}
          aria-label="Attack time"
        />
      </Box>
      <Box sx={{ minWidth: 120, width: direction === 'column' ? '100%' : 'auto' }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          Decay: {decay.toFixed(2)}s
        </Typography>
        <Slider
          size="small"
          value={decay}
          onChange={(_, value) => onDecayChange(value as number)}
          min={0.1}
          max={3}
          step={0.1}
          aria-label="Decay time"
        />
      </Box>
    </Box>
  );
}
