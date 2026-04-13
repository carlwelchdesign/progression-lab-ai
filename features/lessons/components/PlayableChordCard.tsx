'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import { playChordVoicing } from '../../../domain/audio/audio';
import LessonPianoChordDiagram from './LessonPianoChordDiagram';

type Props = {
  chord: string;
  label?: string; // e.g. "I", "ii", "V7"
};

export default function PlayableChordCard({ chord, label }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const voicing = useMemo(() => createPianoVoicingFromChordSymbol(chord), [chord]);

  const handlePlay = async () => {
    if (!voicing || isPlaying) return;
    setIsPlaying(true);
    try {
      await playChordVoicing({
        leftHand: voicing.leftHand,
        rightHand: voicing.rightHand,
        tempoBpm: 80,
        playbackStyle: 'block',
        instrument: 'piano',
        duration: '1n',
      });
    } finally {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  };

  if (!voicing) return null;

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: '12px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box>
            {label ? (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'text.disabled',
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  lineHeight: 1.2,
                }}
              >
                {label}
              </Typography>
            ) : null}
            <Typography variant="subtitle2" fontWeight={600}>
              {chord}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handlePlay}
            disabled={isPlaying}
            aria-label={`Play ${chord}`}
            color="primary"
          >
            {isPlaying ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
          </IconButton>
        </Stack>
        <LessonPianoChordDiagram notes={voicing.rightHand} />
      </CardContent>
    </Card>
  );
}
