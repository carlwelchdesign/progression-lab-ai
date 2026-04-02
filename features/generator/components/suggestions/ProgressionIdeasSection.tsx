'use client';

import { Suspense, lazy } from 'react';
import { Box, Button, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import Card from '../../../../components/ui/Card';
import MidiDownloadButton from '../../../../components/ui/MidiDownloadButton';
import PdfDownloadButton from '../../../../components/ui/PdfDownloadButton';
import { playChordVoicing, playProgression } from '../../../../domain/audio/audio';
import type {
  AudioInstrument,
  PlaybackRegister,
  PlaybackStyle,
  PadPattern,
} from '../../../../domain/audio/audio';
import type { TimeSignature } from '../../../../domain/audio/audio';
import {
  getGuitarDiagramFromChord,
  getGuitarShapeTextFromDiagram,
  getGuitarShapeTextFromVoicing,
} from '../../../../domain/music/guitarDiagramUtils';
import { downloadChordMidi, downloadProgressionMidi } from '../../../../lib/midi';
import type { ChordItem, ChordSuggestionResponse, GuitarVoicing } from '../../../../lib/types';
import PlaybackToggleButton from '../playback/PlaybackToggleButton';
import type { ProgressionDiagramInstrument } from '../../types';
import { getProgressionAutoResetMs, usePlaybackToggle } from '../../hooks/usePlaybackToggle';

const GuitarChordDiagram = lazy(() => import('../diagrams/GuitarChordDiagram'));
const PianoChordDiagram = lazy(() => import('../diagrams/PianoChordDiagram'));

function ChartLoadingFallback({ kind }: { kind: 'guitar' | 'piano' }) {
  return kind === 'guitar' ? (
    <Box sx={{ width: 220 }}>
      <Skeleton variant="rounded" height={160} animation="wave" />
    </Box>
  ) : (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '800px' } }}>
      <Skeleton variant="rounded" height={132} animation="wave" />
    </Box>
  );
}

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
  timeSignature?: TimeSignature;
  metronomeEnabled?: boolean;
  metronomeVolume?: number;
  metronomeSource?: 'click' | 'drum';
  metronomeDrumPath?: string | null;
  showTitle?: boolean;
  resolvedGenreForSave: string;
  scale?: string;
  guitarVoicingByChord?: Partial<Record<string, GuitarVoicing>>;
  onRequestSaveProgression?: (payload: {
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
  timeSignature,
  metronomeEnabled,
  metronomeVolume,
  metronomeSource,
  metronomeDrumPath,
  showTitle = true,
  resolvedGenreForSave,
  scale,
  guitarVoicingByChord,
  onRequestSaveProgression,
}: ProgressionIdeasSectionProps) {
  const { t } = useTranslation('generator');
  const { playingId, initializingId, handlePlayToggle } = usePlaybackToggle();

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
            {t('ui.sectionTitles.progressionIdeas')}
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
                    <PlaybackToggleButton
                      isPlaying={playingId === idea.label}
                      isInitializing={initializingId === idea.label}
                      onClick={() => {
                        void handlePlayToggle(
                          idea.label,
                          () =>
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
                                timeSignature,
                                metronomeEnabled,
                                metronomeVolume,
                                metronomeSource,
                                metronomeDrumPath,
                              },
                            ),
                          getProgressionAutoResetMs(idea.pianoVoicings.length, tempoBpm),
                        );
                      }}
                    />
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
                    {onRequestSaveProgression ? (
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
                        {t('ui.buttons.save')}
                      </Button>
                    ) : null}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {t('ui.labels.tempoBpmLabel', { tempo: tempoBpm })}
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
                                  {t('ui.labels.leftHandShort')}
                                </Box>{' '}
                                {voicing.leftHand.join(', ')}
                              </Typography>

                              <Typography variant="body2">
                                <Box component="span" sx={{ fontWeight: 700 }}>
                                  {t('ui.labels.rightHandShort')}
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
                                <Suspense fallback={<ChartLoadingFallback kind="piano" />}>
                                  <PianoChordDiagram
                                    leftHand={voicing.leftHand}
                                    rightHand={voicing.rightHand}
                                  />
                                </Suspense>
                              </Box>
                            </Box>

                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              <PlaybackToggleButton
                                playTitle={t('ui.buttons.playChord')}
                                stopTitle={t('ui.buttons.stopChord')}
                                isPlaying={playingId === `${idea.label}-${chord}-${index}-piano`}
                                isInitializing={
                                  initializingId === `${idea.label}-${chord}-${index}-piano`
                                }
                                onClick={() => {
                                  void handlePlayToggle(
                                    `${idea.label}-${chord}-${index}-piano`,
                                    () =>
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
                                      }),
                                    getProgressionAutoResetMs(1, tempoBpm),
                                  );
                                }}
                              />
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
                              {t('ui.labels.commonChordExamples')}
                            </Typography>
                            <Typography variant="body2">
                              {chord}:{' '}
                              {suggestedGuitarVoicing
                                ? getGuitarShapeTextFromVoicing(suggestedGuitarVoicing)
                                : getGuitarShapeTextFromDiagram(fallbackGuitarDiagram)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              {suggestedGuitarVoicing ? (
                                <Suspense fallback={<ChartLoadingFallback kind="guitar" />}>
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
                                </Suspense>
                              ) : fallbackGuitarDiagram ? (
                                <Suspense fallback={<ChartLoadingFallback kind="guitar" />}>
                                  <GuitarChordDiagram
                                    title={fallbackGuitarDiagram.title}
                                    position={fallbackGuitarDiagram.position}
                                    fingers={fallbackFingers ?? fallbackGuitarDiagram.fingers}
                                    barres={fallbackBarres}
                                  />
                                </Suspense>
                              ) : null}
                            </Box>
                            {voicing ? (
                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                <PlaybackToggleButton
                                  playTitle={t('ui.buttons.playChord')}
                                  stopTitle={t('ui.buttons.stopChord')}
                                  isPlaying={playingId === `${idea.label}-${chord}-${index}-guitar`}
                                  isInitializing={
                                    initializingId === `${idea.label}-${chord}-${index}-guitar`
                                  }
                                  onClick={() => {
                                    void handlePlayToggle(
                                      `${idea.label}-${chord}-${index}-guitar`,
                                      () =>
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
                                        }),
                                      getProgressionAutoResetMs(1, tempoBpm),
                                    );
                                  }}
                                />
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
                            {t('ui.messages.noGuitarDiagram')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t('ui.messages.noPianoVoicing')}
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
