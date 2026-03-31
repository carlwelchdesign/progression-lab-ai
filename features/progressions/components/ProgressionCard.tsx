'use client';

import { useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import { useTranslation } from 'react-i18next';

import type { Progression } from '../../../lib/types';
import { playProgression } from '../../../domain/audio/audio';
import type { AudioInstrument } from '../../../domain/audio/audio';
import { getTagChipSx } from '../../../lib/tagMetadata';
import {
  getProgressionAutoResetMs,
  usePlaybackToggle,
} from '../../generator/hooks/usePlaybackToggle';
import PlaybackToggleButton from '../../generator/components/playback/PlaybackToggleButton';
import { getProgressionFileName } from '../utils/progressionDownloadUtils';
import GenericCard from './GenericCard';
import CardStatus from './CardStatus';

type ProgressionCardProps = {
  progression: Progression;
  onDelete?: (id: string) => void;
  onEdit?: (progression: Progression) => void;
  onOpen?: (progression: Progression) => void;
  canDelete?: boolean;
  canEdit?: boolean;
  canExportMidi?: boolean;
  canExportPdf?: boolean;
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
  canExportMidi = false,
  canExportPdf = false,
  isDeleting = false,
  instrument,
}: ProgressionCardProps) {
  const { t } = useTranslation('common');
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
      const response = await fetch(`/api/progressions/${progression.id}/export/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        console.error('Failed to download PDF:', body.message);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${getProgressionFileName(progression.title)}_session_chart.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadMidi = async () => {
    try {
      setIsDownloadingMidi(true);
      const response = await fetch(`/api/progressions/${progression.id}/export/midi`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        console.error('Failed to download MIDI:', body.message);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${getProgressionFileName(progression.title)}.mid`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
            : t('progressions.card.noChords')}
        </Typography>
      </Box>

      {/* Meta info */}
      <Stack spacing={1}>
        {progression.scale && (
          <Typography variant="body2">
            <strong>{t('progressions.card.scaleLabel')}:</strong> {progression.scale}
          </Typography>
        )}
        {progression.feel && (
          <Typography variant="body2">
            <strong>{t('progressions.card.feelLabel')}:</strong> {progression.feel}
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
      primary={
        progression.isPublic ? t('progressions.card.visibilityPublic') : t('progressions.card.visibilityPrivate')
      }
      secondary={new Date(progression.createdAt).toLocaleDateString()}
    />
  );

  const actionsSection = (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      <PlaybackToggleButton
        playTitle={t('progressions.card.actions.play')}
        stopTitle={t('progressions.card.actions.stop')}
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
        startIcon={<FileDownloadIcon />}
        onClick={handleDownloadPdf}
        disabled={isDownloadingPdf || !canExportPdf}
        title={
          canExportPdf
            ? t('progressions.card.actions.downloadPdfTitle')
            : 'PDF export requires a Composer or Studio plan'
        }
      >
        {isDownloadingPdf
          ? t('progressions.card.actions.downloadingPdf')
          : t('progressions.card.actions.downloadPdf')}
      </Button>

      <Button
        size="small"
        variant="outlined"
        startIcon={<AudioFileIcon />}
        onClick={handleDownloadMidi}
        disabled={isDownloadingMidi || !canPlay || !canExportMidi}
        title={
          canExportMidi
            ? t('progressions.card.actions.downloadMidiTitle')
            : 'MIDI export requires a Composer or Studio plan'
        }
      >
        {isDownloadingMidi
          ? t('progressions.card.actions.downloadingMidi')
          : t('progressions.card.actions.downloadMidi')}
      </Button>

      {onOpen && (
        <Button
          size="small"
          variant="contained"
          startIcon={<OpenInNewIcon />}
          onClick={() => onOpen(progression)}
        >
          {t('progressions.card.actions.open')}
        </Button>
      )}

      {progression.isPublic && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileCopyIcon />}
          onClick={handleCopyShareLink}
        >
          {copied ? t('progressions.card.actions.copied') : t('progressions.card.actions.share')}
        </Button>
      )}

      {canEdit && onEdit && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => onEdit(progression)}
        >
          {t('progressions.card.actions.edit')}
        </Button>
      )}

      {canDelete && onDelete && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(progression.id)}
          disabled={isDeleting}
        >
          {isDeleting ? t('progressions.card.actions.deleting') : t('progressions.card.actions.delete')}
        </Button>
      )}
    </Stack>
  );

  return <GenericCard content={contentSection} status={statusSection} actions={actionsSection} />;
}
