'use client';

import { useState } from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { getCircleOfFifthsNeighborSemitones } from '../../../domain/music/circleOfFifths';
import { COF_KEYS } from '../data/circleOfFifthsData';
import type { CofKeyData } from '../data/circleOfFifthsData';
import CircleOfFifthsSvg from './CircleOfFifthsSvg';
import CircleOfFifthsKeyPanel from './CircleOfFifthsKeyPanel';

const INTRO_PARAGRAPHS = [
  'The Circle of Fifths is a map of all 12 musical keys arranged so that each key is a perfect fifth away from its neighbours. Moving clockwise adds one sharp to the key signature; moving counter-clockwise adds one flat.',
  'Keys that are adjacent on the circle share six of their seven notes — they are closely related and transition smoothly in a song. Keys that are opposite each other share very few notes and sound distant or surprising when juxtaposed.',
  'Click any key to explore its diatonic chords, relative minor, and key signature. The highlighted neighbours show the closest related keys.',
];

export default function CircleOfFifthsLesson() {
  const [selectedKey, setSelectedKey] = useState<CofKeyData | null>(null);

  const highlightedSemitones =
    selectedKey !== null
      ? getCircleOfFifthsNeighborSemitones(selectedKey.semitone)
      : new Set<number>();

  const handleKeySelect = (key: CofKeyData) => {
    setSelectedKey((prev) => (prev?.semitone === key.semitone ? null : key));
  };

  return (
    <Stack spacing={3}>
      {/* Intro text */}
      <Stack spacing={1.5}>
        {INTRO_PARAGRAPHS.map((p, i) => (
          <Typography key={i} variant="body2" color="text.secondary">
            {p}
          </Typography>
        ))}
      </Stack>

      <Divider />

      {/* SVG + key panel */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: { xs: 'center', md: 'flex-start' },
        }}
      >
        <Box sx={{ flexShrink: 0, width: { xs: '100%', md: '55%' }, maxWidth: 380 }}>
          <CircleOfFifthsSvg
            selectedSemitone={selectedKey?.semitone ?? null}
            highlightedSemitones={highlightedSemitones}
            onKeySelect={handleKeySelect}
          />
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            Click a key to explore it. Highlighted segments are closely related keys.
          </Typography>
        </Box>

        <Box sx={{ flex: 1, width: '100%' }}>
          {selectedKey ? (
            <CircleOfFifthsKeyPanel selectedKey={selectedKey} />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                borderStyle: 'dashed',
              }}
            >
              <Typography variant="body2" color="text.disabled">
                Select a key to see its chords and key signature
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* How to use section */}
      <Divider />
      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          How to use the Circle of Fifths for songwriting
        </Typography>
        <Stack spacing={1} component="ul" sx={{ pl: 2, mt: 0 }}>
          {[
            'Keys next to each other on the circle make smooth modulations — move one step clockwise or counter-clockwise to shift the mood while keeping it familiar.',
            'The V chord of any key is the key one step clockwise. This is why G7 resolves so naturally to C.',
            'Minor keys sit in the inner ring, directly inside their relative major. A minor and C major share all seven notes.',
            'Opposite keys (e.g. C and F#) are maximally distant — use them for dramatic key changes or unexpected colour.',
            'Try the I–IV–V–vi of any key in the generator by clicking a key and pressing "Try in Generator".',
          ].map((tip, i) => (
            <Typography key={i} component="li" variant="body2" color="text.secondary">
              {tip}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
