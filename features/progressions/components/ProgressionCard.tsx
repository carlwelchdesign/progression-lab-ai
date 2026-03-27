'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import type { Progression } from '../../../lib/types';
import { playProgression } from '../../../domain/audio/audio';
import type { AudioInstrument } from '../../../domain/audio/audio';
import { getTagChipSx } from '../../../lib/tagMetadata';
import {
  getProgressionAutoResetMs,
  usePlaybackToggle,
} from '../../generator/hooks/usePlaybackToggle';
import PlaybackToggleButton from '../../generator/components/PlaybackToggleButton';

type ProgressionCardProps = {
  progression: Progression;
  onDelete?: (id: string) => void;
  onEdit?: (progression: Progression) => void;
  onOpen?: (progression: Progression) => void;
  canDelete?: boolean;
  canEdit?: boolean;
  isDeleting?: boolean;
  instrument: AudioInstrument;
};

export default function ProgressionCard({
  progression,
  onDelete,
  onEdit,
  onOpen,
  canDelete = true,
  canEdit = true,
  isDeleting = false,
  instrument,
}: ProgressionCardProps) {
  const [copied, setCopied] = useState(false);
  const { playingId, initializingId, handlePlayToggle } = usePlaybackToggle();
  const playId = `progression-card-${progression.id}`;
  const isPlaying = playingId === playId;
  const isInitializingAudio = initializingId === playId;

  const canPlay = Array.isArray(progression.pianoVoicings) && progression.pianoVoicings.length > 0;

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/p/${progression.shareId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handlePlay = async () => {
    if (!canPlay) {
      return;
    }

    await handlePlayToggle(
      playId,
      () =>
        playProgression(progression.pianoVoicings!, undefined, undefined, undefined, undefined, {
          instrument,
        }),
      getProgressionAutoResetMs(progression.pianoVoicings?.length ?? 0, 100),
    );
  };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex' }}>
        <Stack sx={{ width: '100%', height: '100%' }}>
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            {/* Title and chords */}
            <Box>
              <Typography variant="h6" gutterBottom>
                {progression.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: 'primary.main',
                }}
              >
                {progression.chords?.length > 0
                  ? (progression.chords as Array<{ name: string }>).map((c) => c.name).join(' → ')
                  : 'No chords'}
              </Typography>
            </Box>

            {/* Meta info */}
            <Stack spacing={1}>
              {progression.scale && (
                <Typography variant="body2">
                  <strong>Scale:</strong> {progression.scale}
                </Typography>
              )}
              {progression.feel && (
                <Typography variant="body2">
                  <strong>Feel:</strong> {progression.feel}
                </Typography>
              )}
              {progression.notes && (
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {progression.notes}
                </Typography>
              )}
            </Stack>

            {/* Tags */}
            {progression.tags && progression.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {progression.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="filled"
                    sx={getTagChipSx(tag)}
                  />
                ))}
              </Box>
            )}

            {/* Status */}
            <Typography variant="caption" color="text.secondary">
              {progression.isPublic ? '🌍 Public' : '🔒 Private'} •{' '}
              {new Date(progression.createdAt).toLocaleDateString()}
            </Typography>
          </Stack>

          {/* Actions container fixed to bottom */}
          <Box sx={{ pt: 1, mt: 'auto' }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <PlaybackToggleButton
                playTitle="Play"
                stopTitle="Stop"
                isPlaying={isPlaying}
                isInitializing={isInitializingAudio}
                onClick={() => {
                  void handlePlay();
                }}
                disabled={!canPlay}
              />

              {onOpen && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => onOpen(progression)}
                >
                  Open
                </Button>
              )}

              {progression.isPublic && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileCopyIcon />}
                  onClick={handleCopyShareLink}
                >
                  {copied ? 'Copied!' : 'Share'}
                </Button>
              )}

              {canEdit && onEdit && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(progression)}
                >
                  Edit
                </Button>
              )}

              {canDelete && onDelete && (
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={
                    isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />
                  }
                  onClick={() => onDelete(progression.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
