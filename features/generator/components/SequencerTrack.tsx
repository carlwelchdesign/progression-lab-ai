'use client';

import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef } from 'react';

import type { ArrangementEvent } from '../../../lib/types';

type SequencerTrackProps = {
  currentStep: number;
  totalSteps: number;
  stepsPerBar: number;
  beatsPerBar: number;
  tempoBpm: number;
  isPlaying: boolean;
  loopLengthBars: number;
  events?: ArrangementEvent[];
};

type RenderedClip = ArrangementEvent & {
  width: number;
  color: string;
};

const LABEL_COLUMN_WIDTH = 112;
const PIXELS_PER_STEP = 18;
const RULER_HEIGHT = 30;
const LANE_HEIGHT = 86;
const CLIP_HEIGHT = 42;

function getClipTone(chordName: string, palette: readonly string[]): string {
  if (/sus/i.test(chordName)) {
    return palette[1] ?? palette[0] ?? '#22D3EE';
  }

  if (/(?:maj9|add9|\b9\b|\b7\b|11|13)/i.test(chordName)) {
    return palette[5] ?? palette[0] ?? '#60A5FA';
  }

  if (/(?:^|[^A-Za-z])m(?!aj)|min/i.test(chordName)) {
    return palette[2] ?? palette[0] ?? '#A3E635';
  }

  if (/dim|o/i.test(chordName)) {
    return palette[3] ?? palette[0] ?? '#F43F5E';
  }

  if (/aug|\+/i.test(chordName)) {
    return palette[4] ?? palette[0] ?? '#F59E0B';
  }

  let hash = 0;
  for (const char of chordName) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
  }

  return palette[Math.abs(hash) % palette.length] ?? palette[0] ?? '#F97316';
}

export default function SequencerTrack({
  currentStep,
  totalSteps,
  stepsPerBar,
  beatsPerBar,
  tempoBpm,
  isPlaying,
  loopLengthBars,
  events = [],
}: SequencerTrackProps) {
  const theme = useTheme();
  const { appColors } = theme.palette;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stepsPerBeat = stepsPerBar / beatsPerBar;
  const totalWidth = Math.max(totalSteps * PIXELS_PER_STEP, 360);
  const laneTop = (LANE_HEIGHT - CLIP_HEIGHT) / 2;
  const isDarkMode = theme.palette.mode === 'dark';
  const frameBorder = alpha(theme.palette.common.white, isDarkMode ? 0.1 : 0.18);
  const rulerBorder = alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.14);
  const barLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.18 : 0.28);
  const beatLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.16);
  const stepLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.035 : 0.08);
  const playheadColor = appColors.accent.chordPadActiveBorder;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPlaying) {
      return;
    }

    const playheadCenter = currentStep * PIXELS_PER_STEP + PIXELS_PER_STEP / 2;
    const viewportWidth = container.clientWidth;
    const desiredScrollLeft = Math.max(0, playheadCenter - viewportWidth * 0.42);

    if (Math.abs(desiredScrollLeft - container.scrollLeft) > PIXELS_PER_STEP) {
      container.scrollLeft = desiredScrollLeft;
    }
  }, [currentStep, isPlaying]);

  const bars = useMemo(
    () =>
      Array.from({ length: loopLengthBars }, (_, index) => ({
        index,
        startStep: index * stepsPerBar,
      })),
    [loopLengthBars, stepsPerBar],
  );

  const totalBeats = useMemo(
    () => Math.max(1, Math.floor(totalSteps / Math.max(stepsPerBeat, 1))),
    [stepsPerBeat, totalSteps],
  );

  const beatMarkers = useMemo(
    () =>
      Array.from({ length: Math.max(0, totalBeats - 1) }, (_, index) => {
        const beatNumber = index + 1;
        return {
          index: beatNumber,
          left: beatNumber * stepsPerBeat * PIXELS_PER_STEP,
        };
      }),
    [stepsPerBeat, totalBeats],
  );

  const stepMarkers = useMemo(
    () =>
      Array.from({ length: Math.max(0, totalSteps - 1) }, (_, index) => {
        const stepNumber = index + 1;
        if (stepNumber % stepsPerBeat === 0) {
          return null;
        }

        return {
          index: stepNumber,
          left: stepNumber * PIXELS_PER_STEP,
        };
      }).filter((marker): marker is { index: number; left: number } => marker !== null),
    [stepsPerBeat, totalSteps],
  );

  const clips = useMemo<RenderedClip[]>(() => {
    const sortedEvents = [...events].sort((left, right) => left.stepIndex - right.stepIndex);

    return sortedEvents.map((event, index) => {
      const nextStepIndex = sortedEvents[index + 1]?.stepIndex ?? totalSteps;
      const spanSteps = Math.max(1, nextStepIndex - event.stepIndex);

      return {
        ...event,
        width: Math.max(spanSteps * PIXELS_PER_STEP - 6, PIXELS_PER_STEP * 1.6),
        color: getClipTone(event.chord, appColors.accent.chordSuggestionBorders),
      };
    });
  }, [appColors.accent.chordSuggestionBorders, events, totalSteps]);

  return (
    <Box
      sx={{
        mb: 2,
        overflow: 'hidden',
        borderRadius: 1.5,
        border: `1px solid ${frameBorder}`,
        background: isDarkMode
          ? `linear-gradient(180deg, ${alpha('#171A1F', 0.98)} 0%, ${alpha('#0F1216', 0.98)} 100%)`
          : `linear-gradient(180deg, ${alpha('#F8FAFC', 0.98)} 0%, ${alpha('#E2E8F0', 0.98)} 100%)`,
        boxShadow: isDarkMode
          ? `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.04)}, 0 18px 34px ${alpha('#000000', 0.28)}`
          : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.6)}, 0 12px 24px ${alpha('#0F172A', 0.1)}`,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `${LABEL_COLUMN_WIDTH}px minmax(0, 1fr)`,
          alignItems: 'stretch',
        }}
      >
        <Box
          sx={{
            borderRight: `1px solid ${rulerBorder}`,
            background: isDarkMode
              ? `linear-gradient(180deg, ${alpha('#21262D', 0.92)} 0%, ${alpha('#161A20', 0.92)} 100%)`
              : `linear-gradient(180deg, ${alpha('#E5E7EB', 0.95)} 0%, ${alpha('#CBD5E1', 0.9)} 100%)`,
          }}
        >
          <Box
            sx={{
              height: RULER_HEIGHT,
              px: 1.5,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${rulerBorder}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: alpha(theme.palette.common.white, isDarkMode ? 0.52 : 0.42),
              }}
            >
              Arrange
            </Typography>
          </Box>
          <Box
            sx={{
              height: LANE_HEIGHT,
              px: 1.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '0.93rem', lineHeight: 1.1 }}>
              Chord Track
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15 }}>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.common.white, isDarkMode ? 0.48 : 0.45),
                  lineHeight: 1.2,
                }}
              >
                {tempoBpm} BPM
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.common.white, isDarkMode ? 0.36 : 0.38),
                  lineHeight: 1.2,
                }}
              >
                {loopLengthBars} bar{loopLengthBars === 1 ? '' : 's'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          ref={scrollRef}
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            '&::-webkit-scrollbar': {
              height: 9,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: alpha(theme.palette.common.black, isDarkMode ? 0.24 : 0.08),
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 999,
              backgroundColor: alpha(theme.palette.common.white, isDarkMode ? 0.18 : 0.28),
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: alpha(theme.palette.common.white, isDarkMode ? 0.24 : 0.36),
            },
          }}
        >
          <Box sx={{ position: 'relative', width: totalWidth, minWidth: '100%' }}>
            <Box
              sx={{
                position: 'relative',
                height: RULER_HEIGHT,
                borderBottom: `1px solid ${rulerBorder}`,
                background: isDarkMode
                  ? `linear-gradient(180deg, ${alpha('#242A32', 0.94)} 0%, ${alpha('#171C22', 0.96)} 100%)`
                  : `linear-gradient(180deg, ${alpha('#F1F5F9', 0.96)} 0%, ${alpha('#CBD5E1', 0.92)} 100%)`,
              }}
            >
              {bars.map((bar) => {
                const barLeft = bar.startStep * PIXELS_PER_STEP;

                return (
                  <Box
                    key={`bar-ruler-fill-${bar.index}`}
                    sx={{
                      position: 'absolute',
                      left: barLeft,
                      top: 0,
                      width: stepsPerBar * PIXELS_PER_STEP,
                      height: '100%',
                      backgroundColor:
                        bar.index % 2 === 0
                          ? alpha(theme.palette.common.white, isDarkMode ? 0.018 : 0.2)
                          : 'transparent',
                    }}
                  />
                );
              })}

              {bars.map((bar) => {
                const barLeft = bar.startStep * PIXELS_PER_STEP;

                return (
                  <Box key={`bar-ruler-${bar.index}`}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: barLeft,
                        top: 0,
                        width: 2,
                        height: '100%',
                        backgroundColor: barLineColor,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        left: barLeft + 8,
                        top: 7,
                        fontWeight: 700,
                        letterSpacing: 0.35,
                        color: alpha(theme.palette.common.white, isDarkMode ? 0.72 : 0.52),
                      }}
                    >
                      {bar.index + 1}
                    </Typography>
                  </Box>
                );
              })}

              {beatMarkers.map((marker) => (
                <Box
                  key={`ruler-beat-${marker.index}`}
                  sx={{
                    position: 'absolute',
                    left: marker.left,
                    bottom: 0,
                    width: 1,
                    height: 10,
                    backgroundColor: beatLineColor,
                  }}
                />
              ))}
            </Box>

            <Box
              sx={{
                position: 'relative',
                height: LANE_HEIGHT,
                background: isDarkMode
                  ? `linear-gradient(180deg, ${alpha('#11161B', 0.98)} 0%, ${alpha('#0B0E12', 0.98)} 100%)`
                  : `linear-gradient(180deg, ${alpha('#E2E8F0', 0.92)} 0%, ${alpha('#CBD5E1', 0.82)} 100%)`,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: isDarkMode
                    ? `linear-gradient(180deg, transparent 0%, ${alpha('#000000', 0.16)} 100%)`
                    : `linear-gradient(180deg, ${alpha('#FFFFFF', 0.18)} 0%, transparent 100%)`,
                }}
              />

              {bars.map((bar) => {
                const barLeft = bar.startStep * PIXELS_PER_STEP;

                return (
                  <Box key={`bar-grid-${bar.index}`}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: barLeft,
                        top: 0,
                        width: 2,
                        height: '100%',
                        backgroundColor: barLineColor,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        left: barLeft,
                        top: 0,
                        width: stepsPerBar * PIXELS_PER_STEP,
                        height: '100%',
                        backgroundColor:
                          bar.index % 2 === 0
                            ? alpha(theme.palette.common.white, isDarkMode ? 0.02 : 0.16)
                            : 'transparent',
                      }}
                    />
                  </Box>
                );
              })}

              {beatMarkers.map((marker) => (
                <Box
                  key={`beat-grid-${marker.index}`}
                  sx={{
                    position: 'absolute',
                    left: marker.left,
                    top: 0,
                    width: 1,
                    height: '100%',
                    backgroundColor: beatLineColor,
                  }}
                />
              ))}

              {stepMarkers.map((marker) => (
                <Box
                  key={`step-grid-${marker.index}`}
                  sx={{
                    position: 'absolute',
                    left: marker.left,
                    top: 0,
                    width: 1,
                    height: '100%',
                    backgroundColor: stepLineColor,
                  }}
                />
              ))}

              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: laneTop - 8,
                  height: 1,
                  backgroundColor: alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.15),
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: laneTop - 8,
                  height: 1,
                  backgroundColor: alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.15),
                }}
              />

              {clips.map((clip, index) => (
                <Box
                  key={`${clip.padKey}-${clip.stepIndex}-${index}`}
                  title={`${clip.chord} at step ${clip.stepIndex + 1}`}
                  sx={{
                    position: 'absolute',
                    left: clip.stepIndex * PIXELS_PER_STEP + 1,
                    top: laneTop,
                    width: clip.width,
                    minWidth: 28,
                    height: CLIP_HEIGHT,
                    px: 1.1,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 0.75,
                    border: `1px solid ${alpha(clip.color, 0.84)}`,
                    background: isDarkMode
                      ? `linear-gradient(180deg, ${alpha(clip.color, 0.38)} 0%, ${alpha('#15191D', 0.92)} 100%)`
                      : `linear-gradient(180deg, ${alpha(clip.color, 0.36)} 0%, ${alpha('#F8FAFC', 0.88)} 100%)`,
                    boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.14)}, inset 4px 0 0 ${clip.color}`,
                    zIndex: 3,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      height: 1,
                      backgroundColor: alpha(theme.palette.common.white, 0.24),
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      overflow: 'hidden',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      letterSpacing: 0.24,
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: theme.palette.common.white,
                    }}
                  >
                    {clip.chord}
                  </Typography>
                </Box>
              ))}

              {clips.length === 0 ? (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 0.75,
                      border: `1px solid ${alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.16)}`,
                      backgroundColor: alpha(theme.palette.common.black, isDarkMode ? 0.18 : 0.04),
                      color: alpha(theme.palette.common.white, isDarkMode ? 0.38 : 0.38),
                      letterSpacing: 0.2,
                    }}
                  >
                    Record chords to place regions on the timeline
                  </Typography>
                </Box>
              ) : null}

              <Box
                sx={{
                  position: 'absolute',
                  left: currentStep * PIXELS_PER_STEP,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: playheadColor,
                  boxShadow: `0 0 0 1px ${alpha(playheadColor, 0.28)}, 0 0 14px ${alpha(playheadColor, 0.36)}`,
                  zIndex: 5,
                  pointerEvents: 'none',
                  transition: isPlaying ? 'none' : 'left 150ms ease-out',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `7px solid ${playheadColor}`,
                    transform: 'translateX(-50%)',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
