'use client';

import { useState } from 'react';
import { Box, Button, Chip, Stack, Typography, CircularProgress } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AudioFileIcon from '@mui/icons-material/AudioFile';

import type { Progression } from '../../../lib/types';
import { playProgression } from '../../../domain/audio/audio';
import type { AudioInstrument } from '../../../domain/audio/audio';
import { getTagChipSx } from '../../../lib/tagMetadata';
import {
  getProgressionAutoResetMs,
  usePlaybackToggle,
} from '../../generator/hooks/usePlaybackToggle';
import PlaybackToggleButton from '../../generator/components/PlaybackToggleButton';
import { downloadSessionPdf } from '../../../lib/pdf';
import { downloadProgressionMidi } from '../../../lib/midi';
import { progressionToPdfOptions, getProgressionFileName } from '../utils/progressionDownloadUtils';
import GenericCard from './GenericCard';
import CardStatus from './CardStatus';

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingMidi, setIsDownloadingMidi] = useState(false);
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

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const pdfOptions = progressionToPdfOptions(progression);
      await downloadSessionPdf(pdfOptions);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadMidi = () => {
    try {
      setIsDownloadingMidi(true);
      if (Array.isArray(progression.pianoVoicings) && progression.pianoVoicings.length > 0) {
        const fileName = getProgressionFileName(progression.title);
        downloadProgressionMidi(fileName, progression.pianoVoicings, 100);
      }
    } catch (error) {
      console.error('Failed to download MIDI:', error);
    } finally {
      setIsDownloadingMidi(false);
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

  const contentSection = (
    <>
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
            <Chip key={tag} label={tag} size="small" variant="filled" sx={getTagChipSx(tag)} />
          ))}
        </Box>
      )}
    </>
  );

  const statusSection = (
    <CardStatus
      primary={progression.isPublic ? '🌍 Public' : '🔒 Private'}
      secondary={new Date(progression.createdAt).toLocaleDateString()}
    />
  );

  const actionsSection = (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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

      <Button
        size="small"
        variant="outlined"
        startIcon={
          isDownloadingPdf ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />
        }
        onClick={handleDownloadPdf}
        disabled={isDownloadingPdf}
        title="Download as PDF chart"
      >
        {isDownloadingPdf ? 'PDF...' : 'PDF'}
      </Button>

      <Button
        size="small"
        variant="outlined"
        startIcon={
          isDownloadingMidi ? <CircularProgress size={16} color="inherit" /> : <AudioFileIcon />
        }
        onClick={handleDownloadMidi}
        disabled={isDownloadingMidi || !canPlay}
        title="Download as MIDI file"
      >
        {isDownloadingMidi ? 'MIDI...' : 'MIDI'}
      </Button>

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
          startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          onClick={() => onDelete(progression.id)}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      )}
    </Stack>
  );

  return <GenericCard content={contentSection} status={statusSection} actions={actionsSection} />;
}
