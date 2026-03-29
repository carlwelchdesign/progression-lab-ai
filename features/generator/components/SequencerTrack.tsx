'use client';

import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  label: string;
};

const LABEL_COLUMN_WIDTH = 112;
const PIXELS_PER_STEP = 18;
const RULER_HEIGHT = 30;
const LANE_HEIGHT = 86;
const CLIP_HEIGHT = 42;
const PLAYHEAD_ANCHOR_RATIO = 0.5;

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
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const rulerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const laneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const clipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStepRef = useRef(currentStep);
  const stepTickStartedAtRef = useRef(performance.now());
  const previousStepRef = useRef(currentStep);
  const [viewportWidth, setViewportWidth] = useState(0);
  const stepsPerBeat = stepsPerBar / beatsPerBar;
  const stepDurationMs = Math.max(45, 60_000 / Math.max(tempoBpm, 1) / Math.max(stepsPerBeat, 1));
  const totalWidth = Math.max(totalSteps * PIXELS_PER_STEP, 360);
  const playheadAnchorPx = viewportWidth * PLAYHEAD_ANCHOR_RATIO;
  const extendedTrackWidth = totalWidth + playheadAnchorPx;
  const playheadCenterPx = currentStep * PIXELS_PER_STEP + PIXELS_PER_STEP / 2;
  const maxScrollLeft = Math.max(0, extendedTrackWidth - viewportWidth);
  const centeredDesiredScroll = playheadCenterPx - playheadAnchorPx;
  const isCenteredOverlayActive =
    viewportWidth > 0 && centeredDesiredScroll > 0 && centeredDesiredScroll < maxScrollLeft;
  const laneTop = (LANE_HEIGHT - CLIP_HEIGHT) / 2;
  const isDarkMode = theme.palette.mode === 'dark';
  const frameBorder = alpha(theme.palette.common.white, isDarkMode ? 0.1 : 0.18);
  const rulerBorder = alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.14);
  const barLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.18 : 0.28);
  const beatLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.16);
  const stepLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.035 : 0.08);
  const playheadColor = appColors.accent.chordPadActiveBorder;
  const surfaceColor = isDarkMode ? '#1E2329' : '#D8DEE6';
  const rulerColor = isDarkMode ? '#343A43' : '#C8D0DA';
  const laneColor = isDarkMode ? '#242A31' : '#E7ECF2';
  const labelColor = alpha(theme.palette.common.white, isDarkMode ? 0.92 : 0.5);
  const metaColor = alpha(theme.palette.common.white, isDarkMode ? 0.45 : 0.4);

  const isLoopWrapJump = currentStep < previousStepRef.current;
  previousStepRef.current = currentStep;

  useEffect(() => {
    currentStepRef.current = currentStep;
    stepTickStartedAtRef.current = performance.now();
  }, [currentStep]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const updateViewportWidth = () => {
      setViewportWidth(container.clientWidth);
    };

    updateViewportWidth();

    const resizeObserver = new ResizeObserver(updateViewportWidth);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPlaying) {
      return;
    }

    const desiredScrollLeft = Math.max(0, Math.min(maxScrollLeft, centeredDesiredScroll));
    container.scrollLeft = desiredScrollLeft;
  }, [centeredDesiredScroll, isPlaying, maxScrollLeft]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPlaying) {
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }

      return;
    }

    const animateScroll = () => {
      const container = scrollRef.current;
      if (!container) {
        scrollAnimationFrameRef.current = null;
        return;
      }

      const elapsedSinceTickMs = performance.now() - stepTickStartedAtRef.current;
      const stepProgress = Math.min(1, Math.max(0, elapsedSinceTickMs / stepDurationMs));
      const interpolatedStep = currentStepRef.current + stepProgress;
      const playheadCenterPx = interpolatedStep * PIXELS_PER_STEP + PIXELS_PER_STEP / 2;
      const desiredScrollLeft = Math.max(
        0,
        Math.min(maxScrollLeft, playheadCenterPx - playheadAnchorPx),
      );

      if (!isCenteredOverlayActive) {
        container.scrollLeft = desiredScrollLeft;
      } else {
        container.scrollLeft = desiredScrollLeft;
      }

      if (isPlaying) {
        scrollAnimationFrameRef.current = requestAnimationFrame(animateScroll);
        return;
      }

      scrollAnimationFrameRef.current = null;
    };

    scrollAnimationFrameRef.current = requestAnimationFrame(animateScroll);

    return () => {
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
    };
  }, [isCenteredOverlayActive, isPlaying, maxScrollLeft, playheadAnchorPx, stepDurationMs]);

  const bars = useMemo(
    () =>
      Array.from({ length: loopLengthBars }, (_, index) => ({
        index,
        startStep: index * stepsPerBar,
      })),
    [loopLengthBars, stepsPerBar],
  );

  useEffect(() => {
    const drawCanvas = (
      canvas: HTMLCanvasElement | null,
      height: number,
      draw: (ctx: CanvasRenderingContext2D, width: number, canvasHeight: number) => void,
    ) => {
      if (!canvas || extendedTrackWidth <= 0) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(extendedTrackWidth * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${extendedTrackWidth}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, extendedTrackWidth, height);
      draw(ctx, extendedTrackWidth, height);
    };

    drawCanvas(rulerCanvasRef.current, RULER_HEIGHT, (ctx, width, height) => {
      const beatTickHeight = 10;

      for (let step = 1; step < totalSteps; step += 1) {
        if (step % stepsPerBeat !== 0) {
          continue;
        }

        const x = step * PIXELS_PER_STEP;
        if (step % stepsPerBar === 0) {
          ctx.fillStyle = barLineColor;
          ctx.fillRect(Math.round(x - 1), 0, 2, height);
        } else {
          ctx.fillStyle = beatLineColor;
          ctx.fillRect(Math.round(x), height - beatTickHeight, 1, beatTickHeight);
        }
      }

      ctx.fillStyle = barLineColor;
      ctx.fillRect(0, 0, 2, height);
      ctx.fillRect(Math.round(width - 1), 0, 2, height);
    });

    drawCanvas(laneCanvasRef.current, LANE_HEIGHT, (ctx, width, height) => {
      for (let barIndex = 0; barIndex < loopLengthBars; barIndex += 1) {
        if (barIndex % 2 !== 0) {
          continue;
        }

        const barStart = barIndex * stepsPerBar * PIXELS_PER_STEP;
        ctx.fillStyle = alpha(theme.palette.common.white, isDarkMode ? 0.025 : 0.14);
        ctx.fillRect(barStart, 0, stepsPerBar * PIXELS_PER_STEP, height);
      }

      for (let step = 1; step < totalSteps; step += 1) {
        const x = step * PIXELS_PER_STEP;
        if (step % stepsPerBar === 0) {
          ctx.fillStyle = barLineColor;
          ctx.fillRect(Math.round(x - 1), 0, 2, height);
          continue;
        }

        if (step % stepsPerBeat === 0) {
          ctx.fillStyle = beatLineColor;
          ctx.fillRect(Math.round(x), 0, 1, height);
          continue;
        }

        ctx.fillStyle = stepLineColor;
        ctx.fillRect(Math.round(x), 0, 1, height);
      }

      ctx.fillStyle = barLineColor;
      ctx.fillRect(0, 0, 2, height);
      ctx.fillRect(Math.round(width - 1), 0, 2, height);
    });
  }, [
    barLineColor,
    beatLineColor,
    extendedTrackWidth,
    isDarkMode,
    loopLengthBars,
    stepLineColor,
    stepsPerBar,
    stepsPerBeat,
    theme.palette.common.white,
    totalSteps,
  ]);

  const clips = useMemo<RenderedClip[]>(() => {
    const groupedEvents = new Map<number, ArrangementEvent[]>();

    events.forEach((event) => {
      const bucket = groupedEvents.get(event.stepIndex);
      if (bucket) {
        bucket.push(event);
        return;
      }

      groupedEvents.set(event.stepIndex, [event]);
    });

    const sortedEntries = [...groupedEvents.entries()].sort((left, right) => left[0] - right[0]);

    return sortedEntries.map(([stepIndex, stepEvents], index) => {
      const nextStepIndex = sortedEntries[index + 1]?.[0] ?? totalSteps;
      const spanSteps = Math.max(1, nextStepIndex - stepIndex);
      const [firstEvent] = stepEvents;
      const uniqueChordNames = [...new Set(stepEvents.map((stepEvent) => stepEvent.chord))];
      const label =
        uniqueChordNames.length <= 2
          ? uniqueChordNames.join(' / ')
          : `${uniqueChordNames[0]} +${uniqueChordNames.length - 1}`;

      return {
        ...firstEvent,
        stepIndex,
        label,
        width: Math.max(spanSteps * PIXELS_PER_STEP - 2, PIXELS_PER_STEP * 1.5),
        color: getClipTone(firstEvent.chord, appColors.accent.chordSuggestionBorders),
      };
    });
  }, [appColors.accent.chordSuggestionBorders, events, totalSteps]);

  useEffect(() => {
    const canvas = clipCanvasRef.current;
    if (!canvas || extendedTrackWidth <= 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(extendedTrackWidth * dpr));
    canvas.height = Math.max(1, Math.round(LANE_HEIGHT * dpr));
    canvas.style.width = `${extendedTrackWidth}px`;
    canvas.style.height = `${LANE_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, extendedTrackWidth, LANE_HEIGHT);

    const clipTop = laneTop;
    const clipRadius = 6;
    const highlightColor = alpha(theme.palette.common.white, isDarkMode ? 0.14 : 0.26);
    const clipTextColor = alpha(theme.palette.common.white, isDarkMode ? 0.95 : 0.82);
    const clipTextShadowColor = alpha(theme.palette.common.black, isDarkMode ? 0.35 : 0.24);

    const truncateLabel = (input: string, maxWidth: number): string => {
      if (maxWidth <= 0) {
        return '';
      }

      if (ctx.measureText(input).width <= maxWidth) {
        return input;
      }

      const ellipsis = '...';
      let endIndex = input.length;
      while (endIndex > 0) {
        const candidate = `${input.slice(0, endIndex)}${ellipsis}`;
        if (ctx.measureText(candidate).width <= maxWidth) {
          return candidate;
        }

        endIndex -= 1;
      }

      return ellipsis;
    };

    ctx.font = '700 11px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.textBaseline = 'middle';

    for (const clip of clips) {
      const left = clip.stepIndex * PIXELS_PER_STEP + 1;
      const width = Math.min(clip.width, totalWidth - clip.stepIndex * PIXELS_PER_STEP - 2);

      if (width <= 0) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(left + clipRadius, clipTop);
      ctx.lineTo(left + width - clipRadius, clipTop);
      ctx.quadraticCurveTo(left + width, clipTop, left + width, clipTop + clipRadius);
      ctx.lineTo(left + width, clipTop + CLIP_HEIGHT - clipRadius);
      ctx.quadraticCurveTo(
        left + width,
        clipTop + CLIP_HEIGHT,
        left + width - clipRadius,
        clipTop + CLIP_HEIGHT,
      );
      ctx.lineTo(left + clipRadius, clipTop + CLIP_HEIGHT);
      ctx.quadraticCurveTo(left, clipTop + CLIP_HEIGHT, left, clipTop + CLIP_HEIGHT - clipRadius);
      ctx.lineTo(left, clipTop + clipRadius);
      ctx.quadraticCurveTo(left, clipTop, left + clipRadius, clipTop);
      ctx.closePath();

      ctx.fillStyle = isDarkMode ? alpha(clip.color, 0.24) : alpha(clip.color, 0.2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = alpha(clip.color, 0.84);
      ctx.stroke();

      ctx.fillStyle = clip.color;
      ctx.fillRect(left + 1, clipTop + 1, 4, Math.max(0, CLIP_HEIGHT - 2));

      ctx.fillStyle = highlightColor;
      ctx.fillRect(left + 1, clipTop + 1, Math.max(0, width - 2), 1);

      const textLeft = left + 10;
      const textMaxWidth = Math.max(0, width - 16);
      const renderedLabel = truncateLabel(clip.label, textMaxWidth);
      if (renderedLabel) {
        const textY = clipTop + CLIP_HEIGHT / 2;
        ctx.fillStyle = clipTextShadowColor;
        ctx.fillText(renderedLabel, textLeft, textY + 1);
        ctx.fillStyle = clipTextColor;
        ctx.fillText(renderedLabel, textLeft, textY);
      }
    }
  }, [clips, extendedTrackWidth, isDarkMode, laneTop, theme.palette.common.white, totalWidth]);

  return (
    <Box
      sx={{
        mb: 2,
        overflow: 'hidden',
        borderRadius: 1.5,
        border: `1px solid ${frameBorder}`,
        backgroundColor: surfaceColor,
        boxShadow: isDarkMode
          ? `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.04)}`
          : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.45)}`,
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
            backgroundColor: isDarkMode ? '#2B3139' : '#D0D7E0',
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
                color: metaColor,
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
            <Typography
              sx={{ fontWeight: 700, fontSize: '0.93rem', lineHeight: 1.1, color: labelColor }}
            >
              Chord Track
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15 }}>
              <Typography
                variant="caption"
                sx={{
                  color: metaColor,
                  lineHeight: 1.2,
                }}
              >
                {tempoBpm} BPM
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: metaColor,
                  lineHeight: 1.2,
                }}
              >
                {loopLengthBars} bar{loopLengthBars === 1 ? '' : 's'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ position: 'relative' }}>
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
            <Box sx={{ position: 'relative', width: extendedTrackWidth, minWidth: '100%' }}>
              <Box
                sx={{
                  position: 'relative',
                  height: RULER_HEIGHT,
                  borderBottom: `1px solid ${rulerBorder}`,
                  backgroundColor: rulerColor,
                }}
              >
                <Box
                  component="canvas"
                  ref={rulerCanvasRef}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                />

                {bars.map((bar) => {
                  const barLeft = bar.startStep * PIXELS_PER_STEP;
                  return (
                    <Typography
                      key={`bar-ruler-label-${bar.index}`}
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        left: barLeft + 8,
                        top: 7,
                        fontWeight: 700,
                        letterSpacing: 0.35,
                        color: labelColor,
                      }}
                    >
                      {bar.index + 1}
                    </Typography>
                  );
                })}
              </Box>

              <Box
                sx={{
                  position: 'relative',
                  height: LANE_HEIGHT,
                  backgroundColor: laneColor,
                }}
              >
                <Box
                  component="canvas"
                  ref={laneCanvasRef}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                />

                <Box
                  component="canvas"
                  ref={clipCanvasRef}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                {clips.map((clip, index) => (
                  <Box
                    key={`${clip.padKey}-${clip.stepIndex}-${index}`}
                    title={`${clip.label} at step ${clip.stepIndex + 1}`}
                    aria-label={`${clip.label} at step ${clip.stepIndex + 1}`}
                    sx={{
                      position: 'absolute',
                      left: clip.stepIndex * PIXELS_PER_STEP + 1,
                      top: laneTop,
                      width: Math.min(
                        clip.width,
                        totalWidth - clip.stepIndex * PIXELS_PER_STEP - 2,
                      ),
                      minWidth: 28,
                      height: CLIP_HEIGHT,
                      borderRadius: 0.5,
                      backgroundColor: 'transparent',
                      zIndex: 3,
                    }}
                  />
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
                        backgroundColor: alpha(
                          theme.palette.common.black,
                          isDarkMode ? 0.18 : 0.04,
                        ),
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
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    transform: `translate3d(${currentStep * PIXELS_PER_STEP}px, 0, 0)`,
                    willChange: isPlaying ? 'transform' : 'auto',
                    backgroundColor: playheadColor,
                    boxShadow: `0 0 0 1px ${alpha(playheadColor, 0.28)}, 0 0 14px ${alpha(playheadColor, 0.36)}`,
                    zIndex: 5,
                    opacity: isCenteredOverlayActive ? 0 : 1,
                    pointerEvents: 'none',
                    transition:
                      isPlaying && !isLoopWrapJump
                        ? `transform ${stepDurationMs}ms linear`
                        : 'none',
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

          {isCenteredOverlayActive ? (
            <Box
              sx={{
                position: 'absolute',
                left: Math.max(0, playheadAnchorPx - 1),
                top: RULER_HEIGHT,
                bottom: 9,
                width: 2,
                backgroundColor: playheadColor,
                boxShadow: `0 0 0 1px ${alpha(playheadColor, 0.28)}, 0 0 14px ${alpha(playheadColor, 0.36)}`,
                zIndex: 7,
                pointerEvents: 'none',
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
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
