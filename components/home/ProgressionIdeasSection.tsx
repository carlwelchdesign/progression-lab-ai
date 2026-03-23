'use client';

import { Box, Button, Divider, Stack, Typography } from '@mui/material';

import GuitarChordDiagram from '../GuitarChordDiagram';
import PianoChordDiagram from '../PianoChordDiagram';
import Card from '../ui/Card';
import MidiDownloadButton from '../ui/MidiDownloadButton';
import PdfDownloadButton from '../ui/PdfDownloadButton';
import { playChordVoicing, playProgression } from '../../lib/audio';
import type { AudioInstrument, PlaybackRegister, PlaybackStyle } from '../../lib/audio';
import {
  getGuitarDiagramFromChord,
  getGuitarShapeTextFromDiagram,
} from '../../lib/guitarDiagramUtils';
import { downloadChordMidi, downloadProgressionMidi } from '../../lib/midi';
import type { ChordItem, ChordSuggestionResponse } from '../../lib/types';
import type { ProgressionDiagramInstrument } from './types';

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
  showTitle?: boolean;
  resolvedGenreForSave: string;
  scale?: string;
  onRequestSaveProgression: (payload: {
    chords: ChordItem[];
    pianoVoicings: ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'];
    feel: string;
    genre: string;
  }) => void;
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
  showTitle = true,
  resolvedGenreForSave,
  scale,
  onRequestSaveProgression,
}: ProgressionIdeasSectionProps) {
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
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
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
                          },
                        )
                      }
                    >
                      Play progression
                    </Button>
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
                          chord,
                          pianoVoicing: idea.pianoVoicings[i] ?? null,
                          guitarVoicingText: getGuitarShapeTextFromDiagram(
                            getGuitarDiagramFromChord(chord),
                          ),
                          guitarDiagram: getGuitarDiagramFromChord(chord),
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
                  const guitarDiagram = getGuitarDiagramFromChord(chord);

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
                        ) : progressionDiagramInstrument === 'guitar' && guitarDiagram ? (
                          <Stack spacing={1} sx={{ pt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Common Chord Examples
                            </Typography>
                            <Typography variant="body2">
                              {chord}: {getGuitarShapeTextFromDiagram(guitarDiagram)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <GuitarChordDiagram
                                title={guitarDiagram.title}
                                position={guitarDiagram.position}
                                fingers={guitarDiagram.fingers}
                              />
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
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {progressionDiagramInstrument === 'piano'
                              ? 'No piano voicing available.'
                              : 'No guitar diagram available.'}
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
