'use client';

import { Box, Typography } from '@mui/material';
import type { ChordSuggestion, MoodTag } from '../types';
import MiniChordKeyboard from './MiniChordKeyboard';

type Props = {
  suggestion: ChordSuggestion;
  isSelected: boolean;
  isBeingPlayed: boolean;
  onClick: () => void;
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

export default function SuggestionRow({ suggestion, isSelected, isBeingPlayed, onClick }: Props) {
  const { name, romanNumeral, mood, confidence, sharedTones, pianoVoicing } = suggestion;
  const moodColor = MOOD_COLORS[mood];

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.875,
        pl: 1.5,
        pr: 1,
        py: 0.75,
        cursor: 'pointer',
        borderLeft: '3px solid',
        borderLeftColor: isBeingPlayed
          ? 'success.main'
          : isSelected
            ? 'primary.main'
            : 'transparent',
        bgcolor: isBeingPlayed
          ? 'rgba(76,175,80,0.07)'
          : isSelected
            ? 'action.selected'
            : 'transparent',
        '&:hover': {
          bgcolor: isBeingPlayed ? 'rgba(76,175,80,0.12)' : 'action.hover',
        },
        borderBottom: '1px solid',
        borderBottomColor: 'rgba(255,255,255,0.04)',
        transition: 'background-color 0.12s, border-color 0.12s',
      }}
    >
      {/* Chord name */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: isSelected || isBeingPlayed ? 700 : 500,
          width: 82,
          flexShrink: 0,
          color: isBeingPlayed ? 'success.main' : 'text.primary',
          letterSpacing: '-0.01em',
          fontSize: '0.82rem',
          lineHeight: 1.2,
        }}
      >
        {name}
      </Typography>

      {/* Roman numeral */}
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontFamily: 'monospace',
          width: 34,
          flexShrink: 0,
          fontSize: '0.66rem',
          lineHeight: 1,
        }}
      >
        {romanNumeral ?? ''}
      </Typography>

      {/* Mood dot */}
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: moodColor,
          opacity: 0.85,
          flexShrink: 0,
        }}
      />

      <Box
        aria-hidden
        sx={{
          flex: 1,
          minWidth: 180,
          maxWidth: 340,
          height: 58,
          mx: 0.5,
          overflow: 'hidden',
          opacity: isSelected || isBeingPlayed ? 1 : 0.72,
          pointerEvents: 'none',
        }}
      >
        <MiniChordKeyboard voicing={pianoVoicing} startOctave={3} endOctave={5} minHeight={58} />
      </Box>

      {/* Shared tones */}
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', fontSize: '0.62rem', width: 58, textAlign: 'right' }}
      >
        {sharedTones > 0 ? `${sharedTones} shared` : 'new'}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: isSelected ? 'primary.main' : 'text.disabled',
          fontSize: '0.62rem',
          width: 34,
          textAlign: 'right',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(confidence * 100)}%
      </Typography>
    </Box>
  );
}
