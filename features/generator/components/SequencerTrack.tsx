'use client';

import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent } from 'react';

import { Box, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ArrangementEvent } from '../../../lib/types';
import { readPadKeyFromDataTransfer } from './padDragPayload';

type SequencerTrackProps = {
  currentStep: number;
  totalSteps: number;
  stepsPerBar: number;
  beatsPerBar: number;
  tempoBpm: number;
  isPlaying: boolean;
  loopLengthBars: number;
  leadInBars?: number;
  scrollToStep?: number;
  scrollRequestKey?: number;
  events?: ArrangementEvent[];
  /** The original (non-display-offset) stepIndex of the currently selected clip, or null. */
  selectedStepIndex?: number | null;
  /** Called when the user clicks a clip (sourceStepIndex) or the empty lane area (null). */
  onClipClick?: (sourceStepIndex: number | null) => void;
  /** Called when the user drag-moves a clip to a new quantized step. */
  onClipMove?: (sourceStepIndex: number, newStepIndex: number) => void;
  /** Called when a chord pad is dropped onto the lane. */
  onPadDropAtStep?: (padKey: string, stepIndex: number) => void;
  /** Called when the user taps/clicks an empty lane position. */
  onLaneClickStep?: (stepIndex: number) => void;
  /** Optional helper text rendered when the timeline is empty. */
  emptyTimelineHint?: string;
};

type RenderedClip = ArrangementEvent & {
  width: number;
  color: string;
  label: string;
  /** Original stepIndex before lead-in offset is applied. Used as the clip's stable key. */
  sourceStepIndex: number;
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
  leadInBars = 0,
  scrollToStep,
  scrollRequestKey,
  events = [],
  selectedStepIndex = null,
  onClipClick,
  onClipMove,
  onPadDropAtStep,
  onLaneClickStep,
  emptyTimelineHint,
}: SequencerTrackProps) {
  const theme = useTheme();
  const isCompactLabels = useMediaQuery(theme.breakpoints.down('sm'));
  const { appColors } = theme.palette;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const playheadRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const rulerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const laneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const clipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStepRef = useRef(currentStep);
  const stepTickStartedAtRef = useRef(performance.now());
  const previousStepRef = useRef(currentStep);
  const [viewportWidth, setViewportWidth] = useState(0);
  const dragSourceStepRef = useRef<number | null>(null);
  const [dragGhostStep, setDragGhostStep] = useState<number | null>(null);
  const [padDropPreviewStep, setPadDropPreviewStep] = useState<number | null>(null);
  const stepsPerBeat = stepsPerBar / beatsPerBar;
  const normalizedLeadInBars = Math.max(0, leadInBars);
  const leadInSteps = normalizedLeadInBars * stepsPerBar;
  const displayCurrentStep = !isPlaying && currentStep === 0 ? 0 : currentStep + leadInSteps;
  const displayTotalSteps = totalSteps + leadInSteps;
  const stepDurationMs = Math.max(45, 60_000 / Math.max(tempoBpm, 1) / Math.max(stepsPerBeat, 1));
  const totalWidth = Math.max(displayTotalSteps * PIXELS_PER_STEP, 360);
  const playheadAnchorPx = viewportWidth * PLAYHEAD_ANCHOR_RATIO;
  const extendedTrackWidth = totalWidth + playheadAnchorPx;
  const playheadCenterPx = displayCurrentStep * PIXELS_PER_STEP + PIXELS_PER_STEP / 2;
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
  const loopSummary = `${loopLengthBars} bar${loopLengthBars === 1 ? '' : 's'}`;

  const stepDelta = displayCurrentStep - previousStepRef.current;
  const isLoopWrapJump = stepDelta < 0;
  previousStepRef.current = displayCurrentStep;

  const setPlayheadTransform = (step: number) => {
    if (!playheadRef.current) {
      return;
    }

    playheadRef.current.style.transform = `translate3d(${step * PIXELS_PER_STEP}px, 0, 0)`;
  };

  useEffect(() => {
    currentStepRef.current = displayCurrentStep;
    stepTickStartedAtRef.current = performance.now();
  }, [displayCurrentStep]);

  useEffect(() => {
    if (isPlaying && !isLoopWrapJump) {
      return;
    }

    setPlayheadTransform(displayCurrentStep);
  }, [displayCurrentStep, isLoopWrapJump, isPlaying]);

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
    if (!isLoopWrapJump) {
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const desiredScrollLeft = Math.max(0, Math.min(maxScrollLeft, centeredDesiredScroll));
    container.scrollLeft = desiredScrollLeft;
  }, [centeredDesiredScroll, isLoopWrapJump, maxScrollLeft]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || scrollToStep === undefined) {
      return;
    }

    const step = Math.max(0, Math.min(displayTotalSteps, scrollToStep));
    const desiredScrollLeft = Math.max(
      0,
      Math.min(maxScrollLeft, step * PIXELS_PER_STEP - playheadAnchorPx),
    );
    container.scrollLeft = desiredScrollLeft;
  }, [displayTotalSteps, maxScrollLeft, playheadAnchorPx, scrollRequestKey, scrollToStep]);

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
      setPlayheadTransform(interpolatedStep);
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
      Array.from({ length: normalizedLeadInBars + loopLengthBars }, (_, index) => ({
        index,
        startStep: index * stepsPerBar,
      })),
    [loopLengthBars, normalizedLeadInBars, stepsPerBar],
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

      for (let step = 1; step < displayTotalSteps; step += 1) {
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
      for (let barIndex = 0; barIndex < normalizedLeadInBars + loopLengthBars; barIndex += 1) {
        if (barIndex % 2 !== 0) {
          continue;
        }

        const barStart = barIndex * stepsPerBar * PIXELS_PER_STEP;
        ctx.fillStyle = alpha(theme.palette.common.white, isDarkMode ? 0.025 : 0.14);
        ctx.fillRect(barStart, 0, stepsPerBar * PIXELS_PER_STEP, height);
      }

      for (let step = 1; step < displayTotalSteps; step += 1) {
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
    displayTotalSteps,
    loopLengthBars,
    normalizedLeadInBars,
    stepLineColor,
    stepsPerBar,
    stepsPerBeat,
    theme.palette.common.white,
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
      const [firstEvent] = stepEvents;
      const explicitDurationSteps = stepEvents.reduce<number | null>((current, event) => {
        if (!Number.isFinite(event.durationSteps)) {
          return current;
        }

        const normalized = Math.max(1, Math.floor(event.durationSteps ?? 1));
        if (current === null) {
          return normalized;
        }

        return Math.max(current, normalized);
      }, null);
      const spanSteps = explicitDurationSteps ?? Math.max(1, nextStepIndex - stepIndex);
      const uniqueChordNames = [...new Set(stepEvents.map((stepEvent) => stepEvent.chord))];
      const label =
        uniqueChordNames.length <= 2
          ? uniqueChordNames.join(' / ')
          : `${uniqueChordNames[0]} +${uniqueChordNames.length - 1}`;
      const displayStepIndex = stepIndex + leadInSteps;

      return {
        ...firstEvent,
        stepIndex: displayStepIndex,
        sourceStepIndex: stepIndex,
        label,
        width: Math.max(spanSteps * PIXELS_PER_STEP - 2, PIXELS_PER_STEP * 1.5),
        color: getClipTone(firstEvent.chord, appColors.accent.chordSuggestionBorders),
      };
    });
  }, [appColors.accent.chordSuggestionBorders, events, leadInSteps, totalSteps]);

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

  const handleClipPointerDown = (clip: RenderedClip, event: ReactPointerEvent<HTMLElement>) => {
    if (isPlaying) return;

    if (event.pointerType === 'touch') {
      event.preventDefault();
    }

    event.stopPropagation();
    const sourceStep = clip.sourceStepIndex;
    const startX = event.clientX;
    onClipClick?.(sourceStep);
    dragSourceStepRef.current = sourceStep;

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = Math.round((moveEvent.clientX - startX) / PIXELS_PER_STEP);
      const next = Math.max(0, Math.min(totalSteps - 1, sourceStep + delta));
      setDragGhostStep(next);
    };

    const handleUp = (endEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      dragSourceStepRef.current = null;
      const delta = Math.round((endEvent.clientX - startX) / PIXELS_PER_STEP);
      const next = Math.max(0, Math.min(totalSteps - 1, sourceStep + delta));
      setDragGhostStep(null);
      if (next !== sourceStep) {
        onClipMove?.(sourceStep, next);
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp, { passive: false });
    window.addEventListener('pointercancel', handleUp, { passive: false });
  };

  const getLaneStepFromClientX = (clientX: number, lane: HTMLDivElement): number => {
    const rect = lane.getBoundingClientRect();
    const relativeX = Math.max(0, clientX - rect.left);
    const displayStep = Math.floor(relativeX / PIXELS_PER_STEP);
    return Math.max(0, Math.min(totalSteps - 1, displayStep - leadInSteps));
  };

  const handleLaneDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    // Always prevent default first to allow drops
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';

    // Now validate that we want this drop
    if (isPlaying || !onPadDropAtStep) {
      return;
    }

    // Check for valid pad data
    const padKey = readPadKeyFromDataTransfer(event.dataTransfer);
    if (!padKey) {
      // No valid pad data, but still consumed the drag
      return;
    }

    // Show preview of where the drop would land
    const nextStep = getLaneStepFromClientX(event.clientX, event.currentTarget);
    setPadDropPreviewStep(nextStep);
  };

  const handleLaneDragLeave = (event: ReactDragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setPadDropPreviewStep(null);
  };

  const handleLaneDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setPadDropPreviewStep(null);

    if (isPlaying || !onPadDropAtStep) {
      return;
    }

    const padKey = readPadKeyFromDataTransfer(event.dataTransfer);
    if (!padKey) {
      return;
    }

    const stepIndex = getLaneStepFromClientX(event.clientX, event.currentTarget);
    onPadDropAtStep(padKey, stepIndex);
  };

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
      {isCompactLabels ? (
        <Box
          sx={{
            px: 1.25,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
            borderBottom: `1px solid ${rulerBorder}`,
            backgroundColor: isDarkMode ? '#2B3139' : '#D0D7E0',
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.85rem',
              lineHeight: 1.1,
              color: labelColor,
            }}
          >
            Chord Track
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <Typography variant="caption" sx={{ color: metaColor, lineHeight: 1.2 }}>
              {tempoBpm} BPM
            </Typography>
            <Typography variant="caption" sx={{ color: metaColor, lineHeight: 1.2 }}>
              {loopSummary}
            </Typography>
            {normalizedLeadInBars > 0 ? (
              <Typography variant="caption" sx={{ color: metaColor, lineHeight: 1.2 }}>
                +{normalizedLeadInBars} bar lead-in
              </Typography>
            ) : null}
          </Box>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isCompactLabels
            ? 'minmax(0, 1fr)'
            : `${LABEL_COLUMN_WIDTH}px minmax(0, 1fr)`,
          alignItems: 'stretch',
        }}
      >
        {isCompactLabels ? null : (
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
                  {loopSummary}
                </Typography>
                {normalizedLeadInBars > 0 ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: metaColor,
                      lineHeight: 1.2,
                    }}
                  >
                    +{normalizedLeadInBars} bar lead-in
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Box>
        )}

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
                  const barLabel =
                    bar.index < normalizedLeadInBars
                      ? 'L'
                      : String(bar.index - normalizedLeadInBars + 1);
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
                      {barLabel}
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
                onDragOver={handleLaneDragOver}
                onDragLeave={handleLaneDragLeave}
                onDrop={handleLaneDrop}
                aria-label="Chord timeline lane"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onLaneClickStep?.(getLaneStepFromClientX(e.clientX, e.currentTarget));
                    onClipClick?.(null);
                  }
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

                {clips.map((clip, index) => {
                  const isSelected = selectedStepIndex === clip.sourceStepIndex;
                  const isDraggingThis =
                    dragSourceStepRef.current === clip.sourceStepIndex && dragGhostStep !== null;
                  return (
                    <Box
                      key={`${clip.padKey}-${clip.sourceStepIndex}-${index}`}
                      title={`${clip.label} at step ${clip.sourceStepIndex + 1}`}
                      aria-label={`${clip.label} at step ${clip.sourceStepIndex + 1}`}
                      onPointerDown={(event) => handleClipPointerDown(clip, event)}
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
                        outline: isSelected ? `2px solid ${alpha(clip.color, 0.9)}` : 'none',
                        outlineOffset: '-2px',
                        backgroundColor: isSelected ? alpha(clip.color, 0.1) : 'transparent',
                        cursor: isPlaying ? 'default' : 'grab',
                        zIndex: 3,
                        opacity: isDraggingThis ? 0.35 : 1,
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        touchAction: 'none',
                      }}
                    />
                  );
                })}
                {/* Drag ghost – renders at the target position while the user is dragging */}
                {dragGhostStep !== null &&
                  dragSourceStepRef.current !== null &&
                  (() => {
                    const draggingClip = clips.find(
                      (c) => c.sourceStepIndex === dragSourceStepRef.current,
                    );
                    if (!draggingClip) return null;
                    const ghostDisplayStep = dragGhostStep + leadInSteps;
                    return (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: ghostDisplayStep * PIXELS_PER_STEP + 1,
                          top: laneTop,
                          width: Math.min(
                            draggingClip.width,
                            totalWidth - ghostDisplayStep * PIXELS_PER_STEP - 2,
                          ),
                          minWidth: 28,
                          height: CLIP_HEIGHT,
                          borderRadius: 0.5,
                          border: `2px dashed ${alpha(draggingClip.color, 0.7)}`,
                          backgroundColor: alpha(draggingClip.color, 0.12),
                          zIndex: 5,
                          pointerEvents: 'none',
                        }}
                      />
                    );
                  })()}

                {padDropPreviewStep !== null ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: (padDropPreviewStep + leadInSteps) * PIXELS_PER_STEP + 1,
                      top: laneTop,
                      width: Math.max(28, PIXELS_PER_STEP - 2),
                      height: CLIP_HEIGHT,
                      borderRadius: 0.5,
                      border: `2px dashed ${alpha(playheadColor, 0.72)}`,
                      backgroundColor: alpha(playheadColor, 0.18),
                      zIndex: 5,
                      pointerEvents: 'none',
                    }}
                  />
                ) : null}

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
                      {emptyTimelineHint ??
                        'Drag pads or record chords to place regions on the timeline'}
                    </Typography>
                  </Box>
                ) : null}

                <Box
                  ref={playheadRef}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    transform: `translate3d(${displayCurrentStep * PIXELS_PER_STEP}px, 0, 0)`,
                    willChange: isPlaying ? 'transform' : 'auto',
                    backgroundColor: playheadColor,
                    boxShadow: `0 0 0 1px ${alpha(playheadColor, 0.28)}, 0 0 14px ${alpha(playheadColor, 0.36)}`,
                    zIndex: 5,
                    opacity: isCenteredOverlayActive ? 0 : 1,
                    pointerEvents: 'none',
                    transition: 'none',
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
