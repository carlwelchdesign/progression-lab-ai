'use client';

import { useEffect, useMemo, useRef } from 'react';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, IconButton, Slider, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import type { VocalTake } from '../../../../lib/types';
import TimelineTrackSurface, {
  TRACK_LANE_HEIGHT,
  TRACK_PIXELS_PER_STEP,
  TRACK_RULER_HEIGHT,
  type TimelineTrackBar,
} from './TimelineTrackSurface';
import useTimelinePlaybackMotion from './useTimelinePlaybackMotion';

type VocalTrackLaneProps = {
  takes: VocalTake[];
  currentStep: number;
  totalSteps: number;
  stepsPerBar: number;
  beatsPerBar: number;
  tempoBpm: number;
  loopLengthBars: number;
  leadInBars?: number;
  scrollToStep?: number;
  scrollRequestKey?: number;
  isPlaying: boolean;
  isRecording: boolean;
  selectedTakeId: string | null;
  onSelectTake: (takeId: string | null) => void;
  onDeleteTake: (takeId: string) => void;
  onToggleMuteTake: (takeId: string) => void;
  onTakeGainChange: (takeId: string, gain: number) => void;
};

const PIXELS_PER_STEP = TRACK_PIXELS_PER_STEP;
const CLIP_HEIGHT = 44;

export default function VocalTrackLane({
  takes,
  currentStep,
  totalSteps,
  stepsPerBar,
  beatsPerBar,
  tempoBpm,
  loopLengthBars,
  leadInBars = 0,
  scrollToStep,
  scrollRequestKey,
  isPlaying,
  isRecording,
  selectedTakeId,
  onSelectTake,
  onDeleteTake,
  onToggleMuteTake,
  onTakeGainChange,
}: VocalTrackLaneProps) {
  const theme = useTheme();
  const { appColors } = theme.palette;
  const isDesktopPointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const isDarkMode = theme.palette.mode === 'dark';
  const {
    scrollRef,
    playheadRef,
    normalizedLeadInBars,
    leadInSteps,
    displayCurrentStep,
    displayTotalSteps,
    extendedTrackWidth,
    playheadAnchorPx,
    isCenteredOverlayActive,
  } = useTimelinePlaybackMotion({
    currentStep,
    totalSteps,
    stepsPerBar,
    beatsPerBar,
    tempoBpm,
    isPlaying,
    leadInBars,
    scrollToStep,
    scrollRequestKey,
    pixelsPerStep: PIXELS_PER_STEP,
  });
  const rulerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const laneCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedTake = takes.find((take) => take.id === selectedTakeId) ?? null;
  const stepsPerBeat = stepsPerBar / beatsPerBar;
  const clipTop = (TRACK_LANE_HEIGHT - CLIP_HEIGHT) / 2;
  const playheadColor = appColors.accent.chordPadActiveBorder;
  const loopSummary = `${loopLengthBars} bar${loopLengthBars === 1 ? '' : 's'}`;
  const barLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.18 : 0.28);
  const beatLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.16);
  const stepLineColor = alpha(theme.palette.common.white, isDarkMode ? 0.035 : 0.08);

  const bars = useMemo<TimelineTrackBar[]>(
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

      if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) {
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

    drawCanvas(rulerCanvasRef.current, TRACK_RULER_HEIGHT, (ctx, width, height) => {
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

    drawCanvas(laneCanvasRef.current, TRACK_LANE_HEIGHT, (ctx, width, height) => {
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
    displayTotalSteps,
    extendedTrackWidth,
    isDarkMode,
    loopLengthBars,
    normalizedLeadInBars,
    stepLineColor,
    stepsPerBar,
    stepsPerBeat,
    theme.palette.common.white,
  ]);

  return (
    <Box>
      <TimelineTrackSurface
        title="Vocal Track"
        sectionLabel="Layer"
        metaLines={[
          `${tempoBpm} BPM`,
          loopSummary,
          `${takes.length} take${takes.length === 1 ? '' : 's'}`,
          ...(normalizedLeadInBars > 0 ? [`+${normalizedLeadInBars} bar lead-in`] : []),
        ]}
        bars={bars}
        normalizedLeadInBars={normalizedLeadInBars}
        displayCurrentStep={displayCurrentStep}
        displayTotalSteps={displayTotalSteps}
        extendedTrackWidth={extendedTrackWidth}
        playheadAnchorPx={playheadAnchorPx}
        playheadColor={playheadColor}
        isCenteredOverlayActive={isCenteredOverlayActive}
        scrollRef={scrollRef}
        playheadRef={playheadRef}
        rulerCanvasRef={rulerCanvasRef}
        laneCanvasRef={laneCanvasRef}
        laneAriaLabel="Vocal timeline lane"
        onLaneClick={(event) => {
          if (event.target === event.currentTarget) {
            onSelectTake(null);
          }
        }}
      >
        {takes.map((take) => {
          const displayStartStep = take.startStep + leadInSteps;
          const left = displayStartStep * PIXELS_PER_STEP;
          const width = Math.max(PIXELS_PER_STEP, take.durationSteps * PIXELS_PER_STEP);
          const isSelected = take.id === selectedTakeId;

          return (
            <Box
              key={take.id}
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onSelectTake(take.id);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectTake(take.id);
                }
              }}
              sx={{
                position: 'absolute',
                left,
                top: clipTop,
                height: CLIP_HEIGHT,
                width,
                borderRadius: 1,
                px: 0.75,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                overflow: 'hidden',
                border: `1px solid ${isSelected ? alpha(theme.palette.error.main, 0.75) : alpha(theme.palette.common.white, 0.2)}`,
                bgcolor: take.isMuted
                  ? alpha(theme.palette.grey[700], 0.65)
                  : alpha(theme.palette.error.main, isSelected ? 0.35 : 0.22),
                zIndex: 3,
              }}
            >
              <GraphicEqIcon sx={{ fontSize: 14 }} />
              <Typography
                variant="caption"
                sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                Take {takes.findIndex((candidate) => candidate.id === take.id) + 1}
              </Typography>
            </Box>
          );
        })}

        {isRecording ? (
          <Box
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              px: 0.75,
              py: 0.2,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.error.main, 0.2),
              border: `1px solid ${alpha(theme.palette.error.main, 0.5)}`,
              zIndex: 6,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              REC
            </Typography>
          </Box>
        ) : null}

        {takes.length === 0 ? (
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
                color: alpha(theme.palette.common.white, 0.38),
                letterSpacing: 0.2,
              }}
            >
              No vocal takes yet. Record a take to layer vocals on your arrangement.
            </Typography>
          </Box>
        ) : null}
      </TimelineTrackSurface>

      {selectedTake ? (
        <Box
          sx={{
            mt: 1,
            px: 1,
            py: 0.75,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.common.black, 0.18),
            border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 108 }}>
            <Typography variant="caption" color="text.secondary">
              Gain
            </Typography>
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.01}
              value={selectedTake.gainValue}
              onChange={(_event, value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                onTakeGainChange(selectedTake.id, nextValue);
              }}
              sx={{ maxWidth: isDesktopPointer ? 150 : '100%' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: { sm: 'auto' } }}>
            <Tooltip title={selectedTake.isMuted ? 'Unmute take' : 'Mute take'}>
              <IconButton size="small" onClick={() => onToggleMuteTake(selectedTake.id)}>
                {selectedTake.isMuted ? (
                  <VolumeOffIcon fontSize="small" />
                ) : (
                  <VolumeUpIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete take">
              <IconButton size="small" color="error" onClick={() => onDeleteTake(selectedTake.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ) : null}

      {takes.length === 0 ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block', pl: 1 }}
        >
          No vocal takes yet. Record a take to layer vocals on your arrangement.
        </Typography>
      ) : null}
    </Box>
  );
}
