'use client';

import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import type { MidiStatus } from '../hooks/useMidiInput';

type Props = {
  status: MidiStatus;
  lastNote?: string | null;
  lastNoteNumber?: number | null;
  transposeSemitones?: number;
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
  lastNoteNumber,
  transposeSemitones = 0,
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
          {/* Last note received — diagnostic */}
          <Typography variant="caption" color="text.disabled">
            Last note:{' '}
            <Box
              component="span"
              sx={{ fontFamily: 'monospace', color: lastNote ? 'text.primary' : 'text.disabled' }}
            >
              {lastNote ?? '—'}
            </Box>
            {lastNoteNumber != null && (
              <Box
                component="span"
                sx={{ fontFamily: 'monospace', color: 'text.disabled', ml: 0.5 }}
              >
                (MIDI {lastNoteNumber})
              </Box>
            )}
          </Typography>

          {/* Semitone transpose */}
          {onTransposeChange && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title="Shift notes down 1 semitone">
                <IconButton
                  size="small"
                  onClick={() => onTransposeChange(transposeSemitones - 1)}
                  disabled={transposeSemitones <= -12}
                  sx={{ width: 22, height: 22 }}
                >
                  <RemoveIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Tooltip
                title={
                  transposeSemitones === 0
                    ? 'No transpose'
                    : `${transposeSemitones > 0 ? '+' : ''}${transposeSemitones} semitones`
                }
              >
                <Typography
                  variant="caption"
                  sx={{
                    minWidth: 36,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    cursor: transposeSemitones !== 0 ? 'pointer' : 'default',
                    color: transposeSemitones !== 0 ? 'warning.main' : 'text.disabled',
                  }}
                  onClick={() => transposeSemitones !== 0 && onTransposeChange(0)}
                >
                  {transposeSemitones >= 0 ? '+' : ''}
                  {transposeSemitones}st
                </Typography>
              </Tooltip>
              <Tooltip title="Shift notes up 1 semitone">
                <IconButton
                  size="small"
                  onClick={() => onTransposeChange(transposeSemitones + 1)}
                  disabled={transposeSemitones >= 12}
                  sx={{ width: 22, height: 22 }}
                >
                  <AddIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
