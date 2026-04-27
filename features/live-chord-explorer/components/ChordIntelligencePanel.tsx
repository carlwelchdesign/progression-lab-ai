'use client';

import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import type { DetectedChord } from '../types';
import ScaleBadgeList from './ScaleBadgeList';
import { getCompatibleScales } from '../lib/scaleCompatibility';

type Props = {
  harmonicAnchor: DetectedChord;
  liveDetectedChord: DetectedChord;
  keyCenter: string | null;
  isAnchorLocked: boolean;
  compact?: boolean;
  onSetKeyCenter?: (key: string) => void;
  onClearAnchor: () => void;
  onToggleLock: () => void;
};

function LivePulseDot() {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        bgcolor: 'success.main',
        flexShrink: 0,
        animation: 'lcePulse 1.2s ease-in-out infinite',
        '@keyframes lcePulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 },
        },
      }}
    />
  );
}

export default function ChordIntelligencePanel({
  harmonicAnchor,
  liveDetectedChord,
  keyCenter,
  isAnchorLocked,
  compact = false,
  onSetKeyCenter,
  onClearAnchor,
  onToggleLock,
}: Props) {
  if (!harmonicAnchor) {
    if (liveDetectedChord) {
      return (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            height: '100%',
            minHeight: compact ? 0 : 120,
            py: compact ? 0 : 3,
          }}
        >
          <LivePulseDot />
          <Typography
            variant={compact ? 'body1' : 'h5'}
            sx={{ color: 'text.secondary', fontWeight: 500 }}
          >
            Detecting{' '}
            <Typography
              component="span"
              variant={compact ? 'body1' : 'h5'}
              sx={{ color: 'primary.main', fontWeight: 700 }}
            >
              {liveDetectedChord.name}
            </Typography>
            …
          </Typography>
        </Stack>
      );
    }

    return (
      <Box
        sx={{
          height: '100%',
          minHeight: compact ? 0 : 140,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: compact ? 'left' : 'center',
          py: compact ? 0 : 4,
          color: 'text.disabled',
        }}
      >
        {!compact && <MusicNoteIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />}
        <Typography variant={compact ? 'caption' : 'body2'}>
          Play a chord to create a harmonic anchor
        </Typography>
        {!compact && (
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.6 }}>
            Suggestions stay here so you can explore your next move
          </Typography>
        )}
      </Box>
    );
  }

  const scales = getCompatibleScales(harmonicAnchor.quality);
  const showLivePreview =
    liveDetectedChord !== null && liveDetectedChord.name !== harmonicAnchor.name;

  const chordFontSize = compact
    ? { xs: '2rem', sm: '2.25rem', md: '2.75rem' }
    : { xs: '3rem', sm: '4rem', md: '5rem' };

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Section label + lock badge */}
      <Stack direction="row" alignItems="center" spacing={1} mb={compact ? 0.25 : 0.5}>
        <Typography
          variant="overline"
          sx={{
            color: 'text.disabled',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}
        >
          Harmonic Anchor
        </Typography>
        {isAnchorLocked && (
          <Chip
            label="locked"
            size="small"
            sx={{
              height: 14,
              fontSize: '0.55rem',
              bgcolor: 'warning.dark',
              color: 'warning.contrastText',
              '& .MuiChip-label': { px: 0.625 },
            }}
          />
        )}
      </Stack>

      {/* Chord name row */}
      <Stack direction="row" alignItems="baseline" spacing={2} flexWrap="wrap" useFlexGap>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontSize: chordFontSize,
            color: 'primary.main',
          }}
        >
          {harmonicAnchor.name}
        </Typography>
        {keyCenter && (
          <Chip
            label={`Key of ${keyCenter}`}
            size="small"
            variant="outlined"
            sx={{
              alignSelf: 'center',
              height: compact ? 22 : 24,
              color: 'text.secondary',
              borderColor: 'divider',
              fontSize: compact ? '0.65rem' : '0.72rem',
            }}
          />
        )}
      </Stack>

      {/* Alternate interpretations */}
      <Box sx={{ mt: compact ? 0.75 : 1.5, minHeight: compact ? 20 : 24, overflow: 'hidden' }}>
        <Stack
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          useFlexGap
          sx={{
            visibility: harmonicAnchor.alternateInterpretations.length > 0 ? 'visible' : 'hidden',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center' }}>
            also:
          </Typography>
          {(harmonicAnchor.alternateInterpretations.length
            ? harmonicAnchor.alternateInterpretations
            : ['-']
          ).map((alt) => (
            <Chip
              key={alt}
              label={alt}
              size="small"
              variant="outlined"
              sx={{ fontSize: compact ? '0.65rem' : '0.75rem', height: compact ? 20 : 24 }}
            />
          ))}
        </Stack>
      </Box>

      {/* Live preview */}
      <Box sx={{ mt: compact ? 0.625 : 1.5, minHeight: compact ? 17 : 20, overflow: 'hidden' }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ visibility: showLivePreview ? 'visible' : 'hidden' }}
        >
          <LivePulseDot />
          <Typography variant={compact ? 'caption' : 'body2'} sx={{ color: 'text.secondary' }}>
            Live:{' '}
            <Typography
              component="span"
              variant={compact ? 'caption' : 'body2'}
              sx={{ color: 'success.main', fontWeight: 600 }}
            >
              {liveDetectedChord?.name ?? '-'}
            </Typography>
          </Typography>
        </Stack>
      </Box>

      {/* Scales + action buttons */}
      <Stack direction="row" spacing={1} mt="auto" alignItems="center" flexWrap="wrap" useFlexGap>
        <ScaleBadgeList scales={compact ? scales.slice(0, 3) : scales} />
        <Stack direction="row" spacing={0.25} alignItems="center" sx={{ ml: 'auto' }} useFlexGap>
          {onSetKeyCenter && harmonicAnchor.root && (
            <Button
              size="small"
              variant="text"
              onClick={() => onSetKeyCenter(harmonicAnchor.root)}
              sx={{ fontSize: '0.65rem', opacity: 0.65, minWidth: 'unset', px: 1 }}
            >
              Set {harmonicAnchor.root} as tonic
            </Button>
          )}
          <Tooltip
            title={
              isAnchorLocked
                ? 'Unlock — new chords update the anchor'
                : 'Lock — keep suggestions while auditioning'
            }
          >
            <IconButton
              size="small"
              onClick={onToggleLock}
              color={isAnchorLocked ? 'warning' : 'default'}
              sx={{ opacity: 0.75, p: 0.5 }}
            >
              {isAnchorLocked ? (
                <LockIcon sx={{ fontSize: 15 }} />
              ) : (
                <LockOpenIcon sx={{ fontSize: 15 }} />
              )}
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="text"
            onClick={onClearAnchor}
            sx={{ fontSize: '0.65rem', opacity: 0.65, minWidth: 'unset', px: 1 }}
          >
            Clear
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
