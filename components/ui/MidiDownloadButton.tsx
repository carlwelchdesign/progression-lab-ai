'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Button, type ButtonProps } from '@mui/material';

/**
 * Shared props for MIDI download trigger buttons.
 */
type MidiDownloadButtonProps = Omit<ButtonProps, 'children' | 'startIcon'>;

/**
 * Standardized MIDI download button used across suggestion/progression cards.
 */
export default function MidiDownloadButton(props: MidiDownloadButtonProps) {
  return (
    <Button startIcon={<FileDownloadOutlinedIcon />} {...props}>
      MIDI
    </Button>
  );
}
