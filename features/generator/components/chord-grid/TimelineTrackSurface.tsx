'use client';

import type { DragEventHandler, MouseEventHandler, ReactNode, RefObject } from 'react';

import { Box, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export const TRACK_LABEL_COLUMN_WIDTH = 112;
export const TRACK_PIXELS_PER_STEP = 18;
export const TRACK_RULER_HEIGHT = 30;
export const TRACK_LANE_HEIGHT = 86;

export type TimelineTrackBar = {
  index: number;
  startStep: number;
};

type TimelineTrackSurfaceProps = {
  title: string;
  sectionLabel?: string;
  metaLines?: ReactNode[];
  bars: TimelineTrackBar[];
  normalizedLeadInBars?: number;
  displayCurrentStep: number;
  displayTotalSteps: number;
  extendedTrackWidth: number;
  playheadAnchorPx?: number;
  playheadColor: string;
  isCenteredOverlayActive?: boolean;
  scrollRef?: RefObject<HTMLDivElement | null>;
  playheadRef?: RefObject<HTMLDivElement | null>;
  rulerCanvasRef?: RefObject<HTMLCanvasElement | null>;
  laneCanvasRef?: RefObject<HTMLCanvasElement | null>;
  rulerHeight?: number;
  laneHeight?: number;
  laneAriaLabel: string;
  onLaneClick?: MouseEventHandler<HTMLDivElement>;
  onLaneDragOver?: DragEventHandler<HTMLDivElement>;
  onLaneDragLeave?: DragEventHandler<HTMLDivElement>;
  onLaneDrop?: DragEventHandler<HTMLDivElement>;
  children?: ReactNode;
};

export default function TimelineTrackSurface({
  title,
  sectionLabel = 'Arrange',
  metaLines = [],
  bars,
  normalizedLeadInBars = 0,
  displayCurrentStep,
  displayTotalSteps,
  extendedTrackWidth,
  playheadAnchorPx = 0,
  playheadColor,
  isCenteredOverlayActive = false,
  scrollRef,
  playheadRef,
  rulerCanvasRef,
  laneCanvasRef,
  rulerHeight = TRACK_RULER_HEIGHT,
  laneHeight = TRACK_LANE_HEIGHT,
  laneAriaLabel,
  onLaneClick,
  onLaneDragOver,
  onLaneDragLeave,
  onLaneDrop,
  children,
}: TimelineTrackSurfaceProps) {
  const theme = useTheme();
  const isCompactLabels = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';
  const frameBorder = alpha(theme.palette.common.white, isDarkMode ? 0.1 : 0.18);
  const rulerBorder = alpha(theme.palette.common.white, isDarkMode ? 0.08 : 0.14);
  const surfaceColor = isDarkMode ? '#1E2329' : '#D8DEE6';
  const rulerColor = isDarkMode ? '#343A43' : '#C8D0DA';
  const laneColor = isDarkMode ? '#242A31' : '#E7ECF2';
  const labelColor = alpha(theme.palette.common.white, isDarkMode ? 0.92 : 0.5);
  const metaColor = alpha(theme.palette.common.white, isDarkMode ? 0.45 : 0.4);

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
            {title}
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
            {metaLines.map((line, index) => (
              <Typography
                key={`meta-line-${index}`}
                variant="caption"
                sx={{ color: metaColor, lineHeight: 1.2 }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isCompactLabels
            ? 'minmax(0, 1fr)'
            : `${TRACK_LABEL_COLUMN_WIDTH}px minmax(0, 1fr)`,
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
                height: rulerHeight,
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
                {sectionLabel}
              </Typography>
            </Box>
            <Box
              sx={{
                height: laneHeight,
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
                {title}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15 }}>
                {metaLines.map((line, index) => (
                  <Typography
                    key={`side-meta-line-${index}`}
                    variant="caption"
                    sx={{
                      color: metaColor,
                      lineHeight: 1.2,
                    }}
                  >
                    {line}
                  </Typography>
                ))}
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
                  height: rulerHeight,
                  borderBottom: `1px solid ${rulerBorder}`,
                  backgroundColor: rulerColor,
                }}
              >
                {rulerCanvasRef ? (
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
                ) : null}

                {bars.map((bar) => {
                  const barLeft = bar.startStep * TRACK_PIXELS_PER_STEP;
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
                  height: laneHeight,
                  backgroundColor: laneColor,
                }}
                onDragOver={onLaneDragOver}
                onDragLeave={onLaneDragLeave}
                onDrop={onLaneDrop}
                aria-label={laneAriaLabel}
                onClick={onLaneClick}
              >
                {laneCanvasRef ? (
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
                ) : null}

                {children}

                <Box
                  ref={playheadRef}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    transform: `translate3d(${displayCurrentStep * TRACK_PIXELS_PER_STEP}px, 0, 0)`,
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
                top: rulerHeight,
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
