'use client';

import { Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

import GuitarChordDiagram from '../GuitarChordDiagram';
import PianoChordDiagram from '../PianoChordDiagram';
import Card from '../ui/Card';
import MidiDownloadButton from '../ui/MidiDownloadButton';
import PdfDownloadButton from '../ui/PdfDownloadButton';
import { playChordVoicing, playProgression } from '../../lib/audio';
import type { AudioInstrument, PlaybackRegister, PlaybackStyle, PadPattern } from '../../lib/audio';
import {
  getGuitarDiagramFromChord,
  getGuitarShapeTextFromDiagram,
  getGuitarShapeTextFromVoicing,
} from '../../lib/guitarDiagramUtils';
import { downloadChordMidi, downloadProgressionMidi } from '../../lib/midi';
import type { ChordItem, ChordSuggestionResponse, GuitarVoicing } from '../../lib/types';
import type { ProgressionDiagramInstrument } from './types';
import { usePlaybackToggle } from './usePlaybackToggle';

/**
 * Props for progression idea cards and interaction callbacks.
 */
type ProgressionIdeasSectionProps = {
  progressionIdeas: ChordSuggestionResponse['progressionIdeas'];
  isLoadedFromSavedProgression: boolean;
  progressionDiagramInstrument: ProgressionDiagramInstrument;
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
  showTitle?: boolean;
  resolvedGenreForSave: string;
  scale?: string;
  guitarVoicingByChord?: Partial<Record<string, GuitarVoicing>>;
  onRequestSaveProgression: (payload: {
    chords: ChordItem[];
    pianoVoicings: ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'];
    feel: string;
    genre: string;
  }) => void;
};

type DiagramFinger = [number, number | 'x'];
type LabeledDiagramFinger = [number, number | 'x', string?];

export const inferFallbackFingerLabels = (fingers: DiagramFinger[]): LabeledDiagramFinger[] => {
  const fretted = fingers.filter(([, fret]) => typeof fret === 'number' && fret > 0) as Array<
    [number, number]
  >;

  if (fretted.length === 0) {
    return fingers.map(([stringNumber, fret]) => [stringNumber, fret]);
  }

  const minFret = Math.min(...fretted.map(([, fret]) => fret));
  const hasBarre = fretted.filter(([, fret]) => fret === minFret).length >= 2;
  const remainingFrets = Array.from(
    new Set(fretted.map(([, fret]) => fret).filter((fret) => !(hasBarre && fret === minFret))),
  ).sort((a, b) => a - b);

  const labelByFret = new Map<number, string>();
  if (hasBarre) {
    labelByFret.set(minFret, '1');
  }

  const baseFinger = hasBarre ? 2 : 1;
  remainingFrets.forEach((fret, index) => {
    const fingerNumber = Math.min(4, baseFinger + index);
    labelByFret.set(fret, String(fingerNumber));
  });

  return fingers.map(([stringNumber, fret]) => {
    if (typeof fret !== 'number' || fret <= 0) {
      return [stringNumber, fret];
    }

    const text = labelByFret.get(fret);
    return text ? [stringNumber, fret, text] : [stringNumber, fret];
  });
};

export const inferFallbackBarres = (
  fingers: DiagramFinger[],
): Array<{ fromString: number; toString: number; fret: number }> => {
  const fretted = fingers.filter(([, fret]) => typeof fret === 'number' && fret > 0) as Array<
    [number, number]
  >;
  if (fretted.length === 0) {
    return [];
  }

  const minFret = Math.min(...fretted.map(([, fret]) => fret));
  const barreStrings = fretted
    .filter(([, fret]) => fret === minFret)
    .map(([stringNumber]) => stringNumber);

  if (barreStrings.length < 2) {
    return [];
  }

  const fromString = Math.min(...barreStrings);
  const toString = Math.max(...barreStrings);

  return [{ fromString, toString, fret: minFret }];
};

/**
 * Displays progression ideas with voicings, playback, export, and save actions.
 */
export default function ProgressionIdeasSection({
  progressionIdeas,
  isLoadedFromSavedProgression,
  progressionDiagramInstrument,
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
  showTitle = true,
  resolvedGenreForSave,
  scale,
  guitarVoicingByChord,
  onRequestSaveProgression,
}: ProgressionIdeasSectionProps) {
  const { playingId, handlePlayToggle } = usePlaybackToggle();

  return (
    <Box component="section" id="progressions">
      {showTitle ? (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" component="h2">
            Progression ideas
          </Typography>
        </Stack>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: isLoadedFromSavedProgression ? '1fr' : 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {progressionIdeas.map((idea) => (
          <Card key={idea.label}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {idea.label}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                  }}
                >
                  {idea.chords.join(' -> ')}
                </Typography>
              </Box>

              <Typography variant="body2">{idea.feel}</Typography>

              {idea.performanceTip ? (
                <Typography variant="body2" color="text.secondary">
                  {idea.performanceTip}
                </Typography>
              ) : null}

              {idea.pianoVoicings.length > 0 ? (
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <IconButton
                      title={playingId === idea.label ? 'Stop' : 'Play'}
                      onClick={() =>
                        handlePlayToggle(idea.label, () => {
                          playProgression(
                            idea.pianoVoicings,
                            tempoBpm,
                            playbackStyle,
                            attack,
                            decay,
                            {
                              humanize,
                              gate,
                              inversionRegister,
                              instrument,
                              octaveShift,
                              padPattern,
                            },
                          );
                        })
                      }
                      size="small"
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        color: 'inherit',
                      }}
                    >
                      {playingId === idea.label ? <StopIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <MidiDownloadButton
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        downloadProgressionMidi(idea.label, idea.pianoVoicings, tempoBpm)
                      }
                    />
                    <PdfDownloadButton
                      variant="outlined"
                      size="small"
                      chartOptions={{
                        title: idea.label,
                        scale,
                        genre: resolvedGenreForSave,
                        tempoBpm,
                        feel: idea.feel,
                        performanceTip: idea.performanceTip,
                        chords: idea.chords.map((chord, i) => ({
                          // Prefer API voicing when available so finger labels are preserved.
                          guitarVoicing: guitarVoicingByChord?.[chord] ?? null,
                          chord,
                          pianoVoicing: idea.pianoVoicings[i] ?? null,
                          guitarVoicingText: guitarVoicingByChord?.[chord]
                            ? getGuitarShapeTextFromVoicing(guitarVoicingByChord[chord])
                            : getGuitarShapeTextFromDiagram(getGuitarDiagramFromChord(chord)),
                          guitarDiagram: guitarVoicingByChord?.[chord]
                            ? {
                                position: guitarVoicingByChord[chord]?.position ?? null,
                                fingers: (guitarVoicingByChord[chord]?.fingers ?? []).map(
                                  (finger) => [finger.string, finger.fret],
                                ),
                              }
                            : getGuitarDiagramFromChord(chord),
                        })),
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        onRequestSaveProgression({
                          chords: idea.chords.map((chord) => ({ name: chord, beats: 1 })),
                          pianoVoicings: idea.pianoVoicings,
                          feel: idea.feel,
                          genre: resolvedGenreForSave,
                        });
                      }}
                    >
                      Save
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Tempo: {tempoBpm} BPM
                  </Typography>
                </Stack>
              ) : null}

              <Stack spacing={2}>
                {idea.chords.map((chord, index) => {
                  const voicing = idea.pianoVoicings[index];
                  const suggestedGuitarVoicing = guitarVoicingByChord?.[chord] ?? null;
                  const fallbackGuitarDiagram = getGuitarDiagramFromChord(chord);
                  const fallbackFingers = fallbackGuitarDiagram
                    ? inferFallbackFingerLabels(fallbackGuitarDiagram.fingers)
                    : null;
                  const fallbackBarres = fallbackGuitarDiagram
                    ? inferFallbackBarres(fallbackGuitarDiagram.fingers)
                    : [];

                  return (
                    <Box key={`${idea.label}-${chord}-${index}`}>
                      {index > 0 ? <Divider sx={{ mb: 2 }} /> : null}

                      <Stack spacing={1.5}>
                        <Typography variant="subtitle1" component="h4">
                          {chord}
                        </Typography>

                        {progressionDiagramInstrument === 'piano' && voicing ? (
                          <>
                            <Stack spacing={0.5}>
                              <Typography variant="body2">
                                <Box component="span" sx={{ fontWeight: 700 }}>
                                  LH:
                                </Box>{' '}
                                {voicing.leftHand.join(', ')}
                              </Typography>

                              <Typography variant="body2">
                                <Box component="span" sx={{ fontWeight: 700 }}>
                                  RH:
                                </Box>{' '}
                                {voicing.rightHand.join(', ')}
                              </Typography>
                            </Stack>

                            <Box
                              sx={{
                                pt: 1,
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                              }}
                            >
                              <Box
                                sx={{
                                  width: '100%',
                                  maxWidth: { xs: '100%', md: '800px' },
                                }}
                              >
                                <PianoChordDiagram
                                  leftHand={voicing.leftHand}
                                  rightHand={voicing.rightHand}
                                />
                              </Box>
                            </Box>

                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() =>
                                  playChordVoicing({
                                    leftHand: voicing.leftHand,
                                    rightHand: voicing.rightHand,
                                    tempoBpm,
                                    playbackStyle,
                                    attack,
                                    decay,
                                    humanize,
                                    gate,
                                    inversionRegister,
                                    instrument,
                                    octaveShift,
                                  })
                                }
                              >
                                Play chord
                              </Button>
                              <MidiDownloadButton
                                variant="outlined"
                                size="small"
                                onClick={() => downloadChordMidi(chord, voicing, tempoBpm)}
                              />
                            </Stack>
                          </>
                        ) : progressionDiagramInstrument === 'guitar' &&
                          (suggestedGuitarVoicing || fallbackGuitarDiagram) ? (
                          <Stack spacing={1} sx={{ pt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Common Chord Examples
                            </Typography>
                            <Typography variant="body2">
                              {chord}:{' '}
                              {suggestedGuitarVoicing
                                ? getGuitarShapeTextFromVoicing(suggestedGuitarVoicing)
                                : getGuitarShapeTextFromDiagram(fallbackGuitarDiagram)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              {suggestedGuitarVoicing ? (
                                <GuitarChordDiagram
                                  title={suggestedGuitarVoicing.title}
                                  position={
                                    typeof suggestedGuitarVoicing.position === 'number' &&
                                    suggestedGuitarVoicing.position >= 1
                                      ? suggestedGuitarVoicing.position
                                      : 1
                                  }
                                  fingers={suggestedGuitarVoicing.fingers.map((finger) =>
                                    finger.finger
                                      ? [finger.string, finger.fret, finger.finger]
                                      : [finger.string, finger.fret],
                                  )}
                                  barres={suggestedGuitarVoicing.barres.map((barre) => ({
                                    fromString: barre.fromString,
                                    toString: barre.toString,
                                    fret: barre.fret,
                                    text: barre.text ?? undefined,
                                  }))}
                                />
                              ) : fallbackGuitarDiagram ? (
                                <GuitarChordDiagram
                                  title={fallbackGuitarDiagram.title}
                                  position={fallbackGuitarDiagram.position}
                                  fingers={fallbackFingers ?? fallbackGuitarDiagram.fingers}
                                  barres={fallbackBarres}
                                />
                              ) : null}
                            </Box>
                            {voicing ? (
                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() =>
                                    playChordVoicing({
                                      leftHand: voicing.leftHand,
                                      rightHand: voicing.rightHand,
                                      tempoBpm,
                                      playbackStyle,
                                      attack,
                                      decay,
                                      humanize,
                                      gate,
                                      inversionRegister,
                                    })
                                  }
                                >
                                  Play chord
                                </Button>
                                <MidiDownloadButton
                                  variant="outlined"
                                  size="small"
                                  onClick={() => downloadChordMidi(chord, voicing, tempoBpm)}
                                />
                              </Stack>
                            ) : null}
                          </Stack>
                        ) : progressionDiagramInstrument === 'guitar' ? (
                          <Typography variant="body2" color="text.secondary">
                            No guitar diagram available.
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No piano voicing available.
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
