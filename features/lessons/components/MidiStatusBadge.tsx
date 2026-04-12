'use client';

import { Chip } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import type { MidiStatus } from '../hooks/useMidiInput';

type Props = {
  status: MidiStatus;
};

const CONFIG: Record<
  MidiStatus,
  { label: string; color: 'success' | 'warning' | 'default'; icon?: boolean }
> = {
  connected: { label: 'MIDI keyboard connected', color: 'success', icon: true },
  'no-device': { label: 'No MIDI device detected', color: 'default' },
  pending: { label: 'Checking for MIDI…', color: 'default' },
  unsupported: { label: 'MIDI not supported in this browser', color: 'warning' },
};

export default function MidiStatusBadge({ status }: Props) {
  const { label, color, icon } = CONFIG[status];
  return (
    <Chip
      size="small"
      label={label}
      color={color}
      icon={icon ? <KeyboardIcon /> : undefined}
      variant="outlined"
    />
  );
}
