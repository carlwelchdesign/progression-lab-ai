'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import MicIcon from '@mui/icons-material/Mic';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, IconButton, Slider, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import type { VocalTake } from '../../../../lib/types';

type VocalTrackLaneProps = {
  takes: VocalTake[];
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isRecording: boolean;
  selectedTakeId: string | null;
  onSelectTake: (takeId: string | null) => void;
  onDeleteTake: (takeId: string) => void;
  onToggleMuteTake: (takeId: string) => void;
  onTakeGainChange: (takeId: string, gain: number) => void;
};

const PIXELS_PER_STEP = 18;
const LANE_HEIGHT = 74;
const LABEL_COLUMN_WIDTH = 112;

export default function VocalTrackLane({
  takes,
  currentStep,
  totalSteps,
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

  const selectedTake = takes.find((take) => take.id === selectedTakeId) ?? null;
  const timelineWidth = Math.max(1, totalSteps) * PIXELS_PER_STEP;
  const playheadStep = Math.max(0, Math.min(totalSteps - 1, currentStep));

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1,
        borderRadius: 1.5,
        bgcolor: appColors.surface.translucentPanel,
        border: `1px solid ${appColors.surface.translucentPanelBorder}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Box
          sx={{
            width: LABEL_COLUMN_WIDTH,
            px: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <MicIcon fontSize="small" color="error" />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Vocal
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowX: 'auto' }}>
          <Box
            sx={{
              position: 'relative',
              width: timelineWidth,
              minHeight: LANE_HEIGHT,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
              bgcolor: alpha(theme.palette.common.black, 0.12),
              cursor: 'pointer',
            }}
            onClick={() => onSelectTake(null)}
          >
            {Array.from({ length: Math.max(1, totalSteps) }).map((_, stepIndex) => {
              const isBarBoundary = stepIndex % 16 === 0;
              const isBeatBoundary = stepIndex % 4 === 0;

              return (
                <Box
                  key={`vocal-grid-${stepIndex}`}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: stepIndex * PIXELS_PER_STEP,
                    width: 1,
                    bgcolor: isBarBoundary
                      ? alpha(theme.palette.primary.main, 0.25)
                      : isBeatBoundary
                        ? alpha(theme.palette.common.white, 0.12)
                        : alpha(theme.palette.common.white, 0.06),
                  }}
                />
              );
            })}

            {takes.map((take) => {
              const left = take.startStep * PIXELS_PER_STEP;
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
                    top: 14,
                    height: 44,
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

            {isPlaying ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: playheadStep * PIXELS_PER_STEP,
                  width: 2,
                  bgcolor: theme.palette.warning.main,
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.warning.main, 0.36)}`,
                }}
              />
            ) : null}

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
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  REC
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>

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
