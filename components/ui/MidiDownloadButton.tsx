'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Button, type ButtonProps } from '@mui/material';

type MidiDownloadButtonProps = Omit<ButtonProps, 'children' | 'startIcon'>;

export default function MidiDownloadButton(props: MidiDownloadButtonProps) {
  return (
    <Button startIcon={<FileDownloadOutlinedIcon />} {...props}>
      MIDI
    </Button>
  );
}
