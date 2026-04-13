'use client';

import { useRef, useState } from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import { playChordVoicing } from '../../../domain/audio/audio';
import type { CofKeyData } from '../data/circleOfFifthsData';
import CircleOfFifthsSvg from './CircleOfFifthsSvg';
import CircleOfFifthsKeyPanel from './CircleOfFifthsKeyPanel';

// ── Colour legend ─────────────────────────────────────────────────────────────

const COLOR_LEGEND = [
  {
    swatch: 'linear-gradient(135deg, hsl(60,82%,52%) 0%, hsl(30,82%,52%) 100%)',
    label: 'Selected key',
    description: 'The key you are exploring.',
  },
  {
    swatch: 'linear-gradient(135deg, hsl(90,65%,36%) 0%, hsl(30,65%,36%) 100%)',
    label: 'Closely related (P4 / P5)',
    description:
      'One perfect fifth clockwise or one perfect fourth counter-clockwise. These keys share 6 of 7 notes and feel harmonically near.',
  },
  {
    swatch:
      'repeating-linear-gradient(135deg, hsl(0,0%,26%) 0px, hsl(0,0%,26%) 6px, transparent 6px, transparent 12px)',
    border: '#f59e0b',
    label: 'Tritone (amber border)',
    description:
      'The key directly opposite — 6 semitones away. The tritone is the most harmonically distant interval; its complementary colour on the wheel reflects that maximum tension.',
  },
];

export default function CircleOfFifthsLesson() {
  const [selectedKey, setSelectedKey] = useState<CofKeyData | null>(null);
  const playingRef = useRef(false);

  const handleKeySelect = async (key: CofKeyData) => {
    // Toggle off if same key
    const isSame = selectedKey?.semitone === key.semitone;
    setSelectedKey(isSame ? null : key);

    if (isSame || playingRef.current) return;

    // Play the I chord (tonic) for the selected key
    const voicing = createPianoVoicingFromChordSymbol(key.diatonicChords[0]);
    if (!voicing) return;

    playingRef.current = true;
    try {
      await playChordVoicing({
        leftHand: voicing.leftHand,
        rightHand: voicing.rightHand,
        tempoBpm: 72,
        playbackStyle: 'block',
        instrument: 'piano',
        duration: '2n',
      });
    } finally {
      setTimeout(() => {
        playingRef.current = false;
      }, 1000);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Intro */}
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          The Circle of Fifths arranges all 12 musical keys so that each is a perfect fifth from its
          neighbours. Moving clockwise adds one sharp to the key signature; counter-clockwise adds
          one flat.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Each colour represents a key&apos;s harmonic identity.</strong> Adjacent keys
          share similar hues — because they share similar notes. The key directly opposite always
          lands on the complementary colour, reflecting maximum harmonic distance (the tritone). The
          further apart two keys sit on the colour wheel, the more surprising the transition between
          them will sound.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Click any key to hear its tonic chord</strong> and explore its diatonic chords,
          relative minor, and key signature. Closely related keys glow alongside it; the tritone
          gets an amber border.
        </Typography>
      </Stack>

      <Divider />

      {/* Diagram + panel */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: { xs: 'center', md: 'flex-start' },
        }}
      >
        {/* SVG column */}
        <Box sx={{ flexShrink: 0, width: { xs: '100%', md: '52%' }, maxWidth: 400 }}>
          <CircleOfFifthsSvg
            selectedSemitone={selectedKey?.semitone ?? null}
            onKeySelect={handleKeySelect}
          />

          {/* Colour legend */}
          <Stack spacing={1} sx={{ mt: 2 }}>
            {COLOR_LEGEND.map((item) => (
              <Stack key={item.label} direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 28,
                    height: 18,
                    borderRadius: '3px',
                    background: item.swatch,
                    border: item.border
                      ? `2px solid ${item.border}`
                      : '1px solid rgba(255,255,255,0.12)',
                    mt: '2px',
                  }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ display: 'block', lineHeight: 1.3 }}
                  >
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.3 }}>
                    {item.description}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Key panel column */}
        <Box sx={{ flex: 1, width: '100%' }}>
          {selectedKey ? (
            <CircleOfFifthsKeyPanel selectedKey={selectedKey} />
          ) : (
            <Box
              sx={{
                height: '100%',
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                py: 4,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                borderStyle: 'dashed',
              }}
            >
              <Typography variant="body2" color="text.disabled" textAlign="center">
                Click any key on the circle
              </Typography>
              <Typography variant="caption" color="text.disabled" textAlign="center">
                Hear its tonic chord and explore its diatonic chords
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Songwriting tips */}
      <Divider />
      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Using the Circle of Fifths for songwriting
        </Typography>
        <Stack spacing={1} component="ul" sx={{ pl: 2, mt: 0 }}>
          {[
            'Adjacent keys (one step clockwise or counter-clockwise) make seamless key changes — their similar colours signal their harmonic closeness.',
            'The V chord of any key is the key one step clockwise. This is why G7 resolves so naturally to C.',
            'Moving counter-clockwise gives you the IV chord — the other essential cadential chord.',
            'The tritone (amber border) is the most harmonically tense point. Use a tritone substitution to create surprising but satisfying progressions.',
            'Minor keys sit in the middle ring, inside their relative major. A minor and C major are the same key signature — same colour, same notes.',
            'Long-range modulations (e.g. C → Ab, three steps counter-clockwise) create dramatic mood shifts. The further apart on the wheel, the bigger the surprise.',
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
