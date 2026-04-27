'use client';

import {
  Box,
  Card,
  CardContent,
  Chip,
  Fade,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import type { ChordSuggestion, MoodTag } from '../types';
import MiniChordKeyboard from './MiniChordKeyboard';
import ScaleBadgeList from './ScaleBadgeList';

type Props = {
  suggestion: ChordSuggestion;
  isBeingPlayed?: boolean;
};

const MOOD_COLORS: Record<MoodTag, string> = {
  stable: '#4caf50',
  bright: '#ffeb3b',
  dark: '#7b1fa2',
  tense: '#f44336',
  resolved: '#2196f3',
  dreamy: '#ab47bc',
  cinematic: '#1565c0',
  jazzy: '#ff6f00',
};

export default function ChordSuggestionCard({ suggestion, isBeingPlayed = false }: Props) {
  const { name, romanNumeral, explanation, pianoVoicing, scales, mood, confidence, sharedTones } =
    suggestion;

  const moodColor = MOOD_COLORS[mood];

  return (
    <Fade in timeout={350}>
      <Card
        variant="outlined"
        sx={{
          borderColor: isBeingPlayed ? 'success.main' : 'divider',
          boxShadow: isBeingPlayed
            ? (theme) => `0 0 0 1px ${theme.palette.success.main}55`
            : 'none',
          background: isBeingPlayed ? 'rgba(76, 175, 80, 0.07)' : 'rgba(255,255,255,0.02)',
          transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
          '&:hover': {
            borderColor: isBeingPlayed ? 'success.light' : 'primary.main',
            boxShadow: (theme) =>
              isBeingPlayed
                ? `0 0 0 1px ${theme.palette.success.main}88`
                : `0 0 0 1px ${theme.palette.primary.main}22`,
          },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            pb: '16px !important',
          }}
        >
          {/* Header row */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}
              >
                {name}
              </Typography>
              {romanNumeral && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                >
                  {romanNumeral}
                </Typography>
              )}
            </Box>
            <Stack alignItems="flex-end" spacing={0.5}>
              {isBeingPlayed && (
                <Chip
                  label="Playing"
                  size="small"
                  sx={{
                    fontSize: '0.6rem',
                    height: 18,
                    bgcolor: 'success.dark',
                    color: '#fff',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}
              <Chip
                label={mood}
                size="small"
                sx={{
                  fontSize: '0.6rem',
                  height: 18,
                  bgcolor: `${moodColor}22`,
                  color: moodColor,
                  border: `1px solid ${moodColor}44`,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              />
              {sharedTones > 0 && (
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
                  {sharedTones} shared tone{sharedTones !== 1 ? 's' : ''}
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* Mini keyboard */}
          <Box
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <MiniChordKeyboard voicing={pianoVoicing} />
          </Box>

          {/* Explanation */}
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontSize: '0.75rem', lineHeight: 1.5, flex: 1 }}
          >
            {explanation}
          </Typography>

          {/* Scales */}
          <ScaleBadgeList scales={scales} />

          {/* Confidence bar */}
          <Box>
            <LinearProgress
              variant="determinate"
              value={confidence * 100}
              sx={{
                height: 2,
                borderRadius: 1,
                bgcolor: 'action.disabledBackground',
                '& .MuiLinearProgress-bar': { borderRadius: 1 },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}
