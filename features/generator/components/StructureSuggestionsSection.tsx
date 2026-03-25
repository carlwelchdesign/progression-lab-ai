'use client';

import { Box, Stack, Typography } from '@mui/material';

import { playProgression } from '../../../domain/audio/audio';
import type {
  AudioInstrument,
  PlaybackRegister,
  PlaybackStyle,
  PadPattern,
} from '../../../domain/audio/audio';
import type { TimeSignature } from '../../../domain/audio/audio';
import type { PdfChartOptions } from '../../../lib/pdf';
import Card from '../../../components/ui/Card';
import MidiDownloadButton from '../../../components/ui/MidiDownloadButton';
import PdfDownloadButton from '../../../components/ui/PdfDownloadButton';
import type { ChordSuggestionResponse } from '../../../lib/types';
import PlaybackToggleButton from './PlaybackToggleButton';
import { getProgressionAutoResetMs, usePlaybackToggle } from '../hooks/usePlaybackToggle';

/**
 * Props for displaying arrangement/structure suggestions.
 */
type StructureSuggestionsSectionProps = {
  structureSuggestions: ChordSuggestionResponse['structureSuggestions'];
  progressionIdeas: ChordSuggestionResponse['progressionIdeas'];
  tempoBpm: number;
  playbackStyle: PlaybackStyle;
  attack?: number;
  decay?: number;
  humanize?: number;
  gate?: number;
  inversionRegister?: PlaybackRegister;
  instrument: AudioInstrument;
  octaveShift?: number;
  padPattern?: PadPattern;
  timeSignature?: TimeSignature;
  metronomeEnabled?: boolean;
  metronomeVolume?: number;
  scale?: string;
  genre?: string;
  showTitle?: boolean;
};

const CHORD_BEATS = 2;
const BEATS_PER_BAR = 4;

const toTitleCase = (value: string): string => {
  if (!value) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1)}`;
};

const getSectionVoicings = (
  section: ChordSuggestionResponse['structureSuggestions'][number],
  idea: ChordSuggestionResponse['progressionIdeas'][number] | null,
): ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'] => {
  if (!idea || idea.pianoVoicings.length === 0) {
    return [];
  }

  const barsPerCycle = Math.max(1, Math.ceil((idea.chords.length * CHORD_BEATS) / BEATS_PER_BAR));
  const repeatCount = Math.max(1, Math.round(section.bars / barsPerCycle));

  return Array.from({ length: repeatCount }).flatMap(() => idea.pianoVoicings);
};

const buildSectionChartOptions = ({
  section,
  idea,
  scale,
  genre,
  tempoBpm,
}: {
  section: ChordSuggestionResponse['structureSuggestions'][number];
  idea: ChordSuggestionResponse['progressionIdeas'][number] | null;
  scale?: string;
  genre?: string;
  tempoBpm: number;
}): PdfChartOptions => ({
  title: `${toTitleCase(section.section)} (${section.bars} bars)`,
  scale,
  genre,
  tempoBpm,
  feel: idea?.feel,
  performanceTip: idea?.performanceTip,
  extraNotes: section.harmonicIdea,
  chords: (idea?.chords ?? []).map((chord, index) => ({
    chord,
    pianoVoicing: idea?.pianoVoicings[index] ?? null,
  })),
});

const buildArrangementChartOptions = ({
  structureSuggestions,
  progressionIdeas,
  scale,
  genre,
  tempoBpm,
}: {
  structureSuggestions: ChordSuggestionResponse['structureSuggestions'];
  progressionIdeas: ChordSuggestionResponse['progressionIdeas'];
  scale?: string;
  genre?: string;
  tempoBpm: number;
}): PdfChartOptions => {
  const chords = structureSuggestions.flatMap((section, index) => {
    const idea =
      progressionIdeas.length > 0 ? progressionIdeas[index % progressionIdeas.length] : null;

    return (idea?.chords ?? []).map((chord, chordIndex) => ({
      chord,
      voicingHint: `${toTitleCase(section.section)}: ${section.harmonicIdea}`,
      pianoVoicing: idea?.pianoVoicings[chordIndex] ?? null,
    }));
  });

  return {
    title: 'Structure Suggestions',
    scale,
    genre,
    tempoBpm,
    extraNotes: structureSuggestions
      .map(
        (section) =>
          `${toTitleCase(section.section)} (${section.bars} bars): ${section.harmonicIdea}`,
      )
      .join('\n'),
    chords,
  };
};

/**
 * Renders suggested song sections (verse/chorus/etc.) from API output.
 */
export default function StructureSuggestionsSection({
  structureSuggestions,
  progressionIdeas,
  tempoBpm,
  playbackStyle,
  attack,
  decay,
  humanize,
  gate,
  inversionRegister,
  instrument,
  octaveShift = 0,
  padPattern = 'single',
  timeSignature,
  metronomeEnabled,
  metronomeVolume,
  scale,
  genre,
  showTitle = true,
}: StructureSuggestionsSectionProps) {
  const { playingId, handlePlayToggle } = usePlaybackToggle();

  const arrangementVoicings = structureSuggestions.flatMap((section, index) => {
    const idea =
      progressionIdeas.length > 0 ? progressionIdeas[index % progressionIdeas.length] : null;
    return getSectionVoicings(section, idea);
  });

  const arrangementChartOptions = buildArrangementChartOptions({
    structureSuggestions,
    progressionIdeas,
    scale,
    genre,
    tempoBpm,
  });

  return (
    <Box component="section" id="structure">
      {showTitle ? (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" component="h2">
            Structure suggestions
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <PlaybackToggleButton
              playTitle="Play arrangement"
              stopTitle="Stop arrangement"
              isPlaying={playingId === 'arrangement'}
              disabled={arrangementVoicings.length === 0}
              onClick={() => {
                handlePlayToggle(
                  'arrangement',
                  () => {
                    playProgression(arrangementVoicings, tempoBpm, playbackStyle, attack, decay, {
                      humanize,
                      gate,
                      inversionRegister,
                      instrument,
                      octaveShift,
                      padPattern,
                      timeSignature,
                      metronomeEnabled,
                      metronomeVolume,
                    });
                  },
                  getProgressionAutoResetMs(arrangementVoicings.length, tempoBpm),
                );
              }}
            />
            <PdfDownloadButton
              variant="outlined"
              size="small"
              label="PDF"
              chartOptions={arrangementChartOptions}
            />
            <MidiDownloadButton
              variant="outlined"
              size="small"
              progressionName="Arrangement"
              voicings={arrangementVoicings}
              tempoBpm={tempoBpm}
            />
          </Stack>
        </Stack>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {structureSuggestions.map((section, index) => {
          const idea =
            progressionIdeas.length > 0 ? progressionIdeas[index % progressionIdeas.length] : null;
          const sectionVoicings = getSectionVoicings(section, idea);
          const sectionChartOptions = buildSectionChartOptions({
            section,
            idea,
            scale,
            genre,
            tempoBpm,
          });

          return (
            <Card key={`${section.section}-${section.bars}-${index}`}>
              <Stack spacing={1.25}>
                <Typography variant="h6" component="h3">
                  {section.section} · {section.bars} bars
                </Typography>

                <Typography variant="body2">{section.harmonicIdea}</Typography>

                {idea ? (
                  <Typography variant="body2" color="text.secondary">
                    Harmonic source: {idea.label}
                  </Typography>
                ) : null}

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <PlaybackToggleButton
                    playTitle="Play section"
                    stopTitle="Stop"
                    isPlaying={playingId === `section-${index}`}
                    disabled={sectionVoicings.length === 0}
                    onClick={() => {
                      handlePlayToggle(
                        `section-${index}`,
                        () => {
                          playProgression(sectionVoicings, tempoBpm, playbackStyle, attack, decay, {
                            humanize,
                            gate,
                            inversionRegister,
                            instrument,
                            octaveShift,
                            padPattern,
                            timeSignature,
                            metronomeEnabled,
                            metronomeVolume,
                          });
                        },
                        getProgressionAutoResetMs(sectionVoicings.length, tempoBpm),
                      );
                    }}
                  />
                  <PdfDownloadButton
                    variant="outlined"
                    size="small"
                    chartOptions={sectionChartOptions}
                  />
                  <MidiDownloadButton
                    variant="outlined"
                    size="small"
                    progressionName={`${toTitleCase(section.section)} (${section.bars} bars)`}
                    voicings={sectionVoicings}
                    tempoBpm={tempoBpm}
                  />
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
