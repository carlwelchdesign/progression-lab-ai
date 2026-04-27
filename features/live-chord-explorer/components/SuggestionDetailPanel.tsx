'use client';

import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import type { ChordSuggestion, DetectedChord, MoodTag } from '../types';
import MiniChordKeyboard from './MiniChordKeyboard';
import ScaleBadgeList from './ScaleBadgeList';

type Props = {
  suggestion: ChordSuggestion | null;
  harmonicAnchor?: DetectedChord;
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

const PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
};
const NOTE_TO_PC: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

function noteName(note: string): string {
  return note.match(/^[A-G](?:#|b)?/)?.[0] ?? note;
}

function notePitchClass(note: string): number | null {
  const parsed = noteName(note);
  return NOTE_TO_PC[parsed] ?? NOTE_TO_PC[FLAT_TO_SHARP[parsed]] ?? null;
}

function formatPitchClass(pc: number): string {
  return PITCH_CLASS_NAMES[((pc % 12) + 12) % 12] ?? '';
}

function buildVoiceLeading(anchor: DetectedChord, suggestion: ChordSuggestion): string[] {
  if (!anchor) return [];

  const source = anchor.pitchClasses;
  const target = [...suggestion.pianoVoicing.leftHand, ...suggestion.pianoVoicing.rightHand]
    .map(notePitchClass)
    .filter((pc): pc is number => pc !== null);
  const uniqueTarget = Array.from(new Set(target));

  return source.slice(0, 4).map((pc) => {
    if (uniqueTarget.includes(pc)) return `${formatPitchClass(pc)} stays common`;

    const nearest = uniqueTarget.reduce(
      (best, targetPc) => {
        const up = (targetPc - pc + 12) % 12;
        const distance = up > 6 ? 12 - up : up;
        return distance < best.distance ? { pc: targetPc, distance } : best;
      },
      { pc: uniqueTarget[0] ?? pc, distance: 12 },
    );

    return `${formatPitchClass(pc)} moves to ${formatPitchClass(nearest.pc)}`;
  });
}

export default function SuggestionDetailPanel({ suggestion, harmonicAnchor = null }: Props) {
  if (!suggestion) {
    return (
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: { xs: 220, md: 310 },
          p: 3,
          color: 'text.disabled',
          borderColor: 'divider',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <Stack alignItems="center" spacing={0.5}>
          <MusicNoteIcon sx={{ opacity: 0.25, fontSize: 32 }} />
          <Typography variant="body2">Select a suggestion to inspect the next chord</Typography>
        </Stack>
      </Paper>
    );
  }

  const { name, romanNumeral, mood, explanation, pianoVoicing, scales, sharedTones, confidence } =
    suggestion;
  const moodColor = MOOD_COLORS[mood];
  const suggestionPitchClasses = new Set(
    [...pianoVoicing.leftHand, ...pianoVoicing.rightHand]
      .map(notePitchClass)
      .filter((pc): pc is number => pc !== null),
  );
  const sharedPreviewNotes = harmonicAnchor
    ? [...pianoVoicing.leftHand, ...pianoVoicing.rightHand].filter((note) => {
        const pc = notePitchClass(note);
        return pc !== null && harmonicAnchor.pitchClasses.includes(pc);
      })
    : [];
  const commonToneNames = harmonicAnchor
    ? harmonicAnchor.pitchClasses
        .filter((pc) => suggestionPitchClasses.has(pc))
        .map(formatPitchClass)
    : [];
  const voiceLeading = buildVoiceLeading(harmonicAnchor, suggestion);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2 },
        borderColor: 'divider',
        background: 'rgba(255,255,255,0.012)',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.25 }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
            Next chord inspector
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}
            >
              {name}
            </Typography>
            {romanNumeral && (
              <Chip
                label={romanNumeral}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', height: 22, borderColor: 'divider' }}
              />
            )}
            <Chip
              label={mood}
              size="small"
              sx={{
                height: 22,
                bgcolor: `${moodColor}22`,
                color: moodColor,
                border: `1px solid ${moodColor}44`,
                fontWeight: 700,
              }}
            />
          </Stack>
        </Box>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip label={`${sharedTones} shared tones`} size="small" variant="outlined" />
          <Chip
            label={`${Math.round(confidence * 100)}% confidence`}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>

      <Box
        sx={{
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          mb: 1.25,
          maxWidth: { md: 720 },
          mx: 'auto',
          width: '100%',
        }}
      >
        <MiniChordKeyboard
          voicing={pianoVoicing}
          specialHighlightedNotes={sharedPreviewNotes}
          startOctave={2}
          endOctave={6}
          minHeight={96}
        />
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ minHeight: 0 }}>
        <Box sx={{ flex: '1 1 55%', minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.55, mb: 1 }}>
            {explanation}
          </Typography>
          <ScaleBadgeList scales={scales.slice(0, 5)} />
        </Box>
        <Stack spacing={1} sx={{ flex: '1 1 45%', minWidth: 0 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>
              Common tones
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap sx={{ mt: 0.5 }}>
              {(commonToneNames.length ? commonToneNames : ['None']).map((tone) => (
                <Chip
                  key={tone}
                  label={tone}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: tone === 'None' ? undefined : 'warning.dark',
                    color: tone === 'None' ? undefined : 'warning.contrastText',
                  }}
                />
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>
              Voice-leading
            </Typography>
            <Stack spacing={0.25} sx={{ mt: 0.5 }}>
              {(voiceLeading.length
                ? voiceLeading
                : ['Play an anchor chord to compare motion.']
              ).map((line) => (
                <Typography key={line} variant="caption" sx={{ color: 'text.secondary' }}>
                  {line}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
