'use client';

import { Chip } from '@mui/material';
import UsbIcon from '@mui/icons-material/Usb';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { MidiConnectionStatus } from '../types';

type Props = {
  status: MidiConnectionStatus;
};

const STATUS_CONFIG: Record<
  MidiConnectionStatus,
  { label: string; color: 'default' | 'success' | 'error' | 'warning'; icon: React.ReactElement }
> = {
  connecting: {
    label: 'Waiting for MIDI…',
    color: 'default',
    icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} />,
  },
  connected: {
    label: 'MIDI Connected',
    color: 'success',
    icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
  },
  unavailable: {
    label: 'MIDI Unavailable',
    color: 'error',
    icon: <ErrorIcon sx={{ fontSize: 16 }} />,
  },
  denied: {
    label: 'Access Denied',
    color: 'warning',
    icon: <UsbIcon sx={{ fontSize: 16 }} />,
  },
};

export default function MidiStatusIndicator({ status }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <Chip
      size="small"
      icon={config.icon}
      label={config.label}
      color={config.color}
      variant="outlined"
      sx={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}
    />
  );
}
