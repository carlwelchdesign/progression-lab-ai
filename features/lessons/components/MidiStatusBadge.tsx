'use client';

import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import type { MidiStatus } from '../hooks/useMidiInput';

type Props = {
  status: MidiStatus;
  lastNote?: string | null;
  transposeOctaves?: number;
  onTransposeChange?: (value: number) => void;
};

const STATUS_CONFIG: Record<
  MidiStatus,
  { label: string; color: 'success' | 'warning' | 'default'; icon?: boolean }
> = {
  connected: { label: 'MIDI keyboard connected', color: 'success', icon: true },
  'no-device': { label: 'No MIDI device detected', color: 'default' },
  pending: { label: 'Checking for MIDI…', color: 'default' },
  unsupported: { label: 'MIDI not supported in this browser', color: 'warning' },
};

export default function MidiStatusBadge({
  status,
  lastNote,
  transposeOctaves = 0,
  onTransposeChange,
}: Props) {
  const { label, color, icon } = STATUS_CONFIG[status];

  return (
    <Stack spacing={1}>
      <Chip
        size="small"
        label={label}
        color={color}
        icon={icon ? <KeyboardIcon /> : undefined}
        variant="outlined"
      />

      {status === 'connected' && (
        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
          {/* Last note diagnostic */}
          {lastNote ? (
            <Typography variant="caption" color="text.disabled">
              Last note:{' '}
              <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                {lastNote}
              </Box>
            </Typography>
          ) : (
            <Typography variant="caption" color="text.disabled">
              Press a key to test mapping
            </Typography>
          )}

          {/* Octave transpose */}
          {onTransposeChange && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title="Shift MIDI notes down one octave">
                <IconButton
                  size="small"
                  onClick={() => onTransposeChange(transposeOctaves - 1)}
                  disabled={transposeOctaves <= -3}
                  sx={{ width: 22, height: 22 }}
                >
                  <RemoveIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Typography
                variant="caption"
                sx={{ minWidth: 48, textAlign: 'center', fontFamily: 'monospace' }}
              >
                Oct {transposeOctaves >= 0 ? '+' : ''}
                {transposeOctaves}
              </Typography>
              <Tooltip title="Shift MIDI notes up one octave">
                <IconButton
                  size="small"
                  onClick={() => onTransposeChange(transposeOctaves + 1)}
                  disabled={transposeOctaves >= 3}
                  sx={{ width: 22, height: 22 }}
                >
                  <AddIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              {transposeOctaves !== 0 && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => onTransposeChange(0)}
                >
                  reset
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
