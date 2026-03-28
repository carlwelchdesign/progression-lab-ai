'use client';

import { useCallback, useEffect, useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import {
  Box,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import type { Arrangement } from '../../../lib/types';
import { downloadSessionPdf } from '../../../lib/pdf';
import {
  arrangementToPdfOptions,
  downloadArrangementMidi,
} from '../utils/arrangementDownloadUtils';
import { deleteArrangement, getMyArrangements } from '../api/arrangementsApi';

type Props = {
  onLoad: (arrangement: Arrangement) => void;
  refreshSignal?: number;
  onAvailabilityChange?: (hasAny: boolean) => void;
};

function timeAgo(dateStr: string | Date): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ArrangementsList({ onLoad, refreshSignal, onAvailabilityChange }: Props) {
  const theme = useTheme();
  const { showError, showSuccess } = useAppSnackbar();
  const isDarkMode = theme.palette.mode === 'dark';
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [downloadingMidiId, setDownloadingMidiId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = (await getMyArrangements()) as Arrangement[];
      setArrangements(data);
      onAvailabilityChange?.(data.length > 0);
    } catch (err) {
      setFetchError((err as Error).message || 'Failed to load arrangements');
    } finally {
      setIsLoading(false);
    }
  }, [onAvailabilityChange]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  const handleDelete = useCallback(
    async (id: string, title: string) => {
      setDeletingId(id);
      try {
        await deleteArrangement(id);
        setArrangements((prev) => {
          const next = prev.filter((a) => a.id !== id);
          onAvailabilityChange?.(next.length > 0);
          return next;
        });
        showSuccess(`Deleted "${title}"`);
      } catch (err) {
        showError((err as Error).message || 'Failed to delete arrangement');
      } finally {
        setDeletingId(null);
      }
    },
    [onAvailabilityChange, showError, showSuccess],
  );

  const handleDownloadPdf = useCallback(
    async (arrangement: Arrangement) => {
      setDownloadingPdfId(arrangement.id);
      try {
        const pdfOptions = arrangementToPdfOptions(arrangement);
        await downloadSessionPdf(pdfOptions);
      } catch (err) {
        showError((err as Error).message || 'Failed to download PDF');
      } finally {
        setDownloadingPdfId(null);
      }
    },
    [showError],
  );

  const handleDownloadMidi = useCallback(
    (arrangement: Arrangement) => {
      setDownloadingMidiId(arrangement.id);
      try {
        downloadArrangementMidi(arrangement);
      } catch (err) {
        showError((err as Error).message || 'Failed to download MIDI');
      } finally {
        setDownloadingMidiId(null);
      }
    },
    [showError],
  );

  if (isLoading) {
    return (
      <Stack spacing={1}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 1.5 }} />
        ))}
      </Stack>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="error.main">
          {fetchError}
        </Typography>
        <Tooltip title="Retry">
          <IconButton size="small" onClick={load}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  if (arrangements.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        No saved arrangements yet. Record a loop in the Chord Playground and save it.
      </Typography>
    );
  }

  const rowBg = isDarkMode
    ? alpha(theme.palette.common.white, 0.04)
    : alpha(theme.palette.common.black, 0.03);
  const rowBorder = isDarkMode
    ? alpha(theme.palette.common.white, 0.08)
    : alpha(theme.palette.common.black, 0.08);
  const rowHoverBg = isDarkMode
    ? alpha(theme.palette.common.white, 0.07)
    : alpha(theme.palette.common.black, 0.06);

  return (
    <Stack spacing={0.75}>
      {arrangements.map((arr) => {
        const isDeleting = deletingId === arr.id;
        const meta = [
          `${arr.playbackSnapshot.tempoBpm} BPM`,
          arr.playbackSnapshot.timeSignature,
          `${arr.timeline.loopLengthBars} bar${arr.timeline.loopLengthBars === 1 ? '' : 's'}`,
          `${arr.timeline.events.length} event${arr.timeline.events.length === 1 ? '' : 's'}`,
        ].join(' · ');

        return (
          <Box
            key={arr.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 1,
              borderRadius: 1.5,
              border: `1px solid ${rowBorder}`,
              backgroundColor: rowBg,
              opacity: isDeleting ? 0.5 : 1,
              transition: 'background-color 120ms ease, opacity 150ms ease',
              '&:hover': { backgroundColor: rowHoverBg },
            }}
          >
            <MusicNoteIcon
              fontSize="small"
              sx={{
                color: alpha(theme.palette.common.white, isDarkMode ? 0.35 : 0.4),
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {arr.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                {meta} · {timeAgo(arr.updatedAt)}
              </Typography>
            </Box>
            <Tooltip title="Download as PDF chart">
              <span>
                <IconButton
                  size="small"
                  onClick={() => void handleDownloadPdf(arr)}
                  disabled={deletingId === arr.id || downloadingPdfId === arr.id}
                  aria-label={`Download ${arr.title} as PDF`}
                  sx={{
                    color: theme.palette.info.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.1) },
                  }}
                >
                  {downloadingPdfId === arr.id ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <FileDownloadIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download as MIDI">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleDownloadMidi(arr)}
                  disabled={deletingId === arr.id || downloadingMidiId === arr.id}
                  aria-label={`Download ${arr.title} as MIDI`}
                  sx={{
                    color: theme.palette.success.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.1) },
                  }}
                >
                  {downloadingMidiId === arr.id ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <AudioFileIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Load in Chord Playground">
              <span>
                <IconButton
                  size="small"
                  onClick={() => onLoad(arr)}
                  disabled={isDeleting}
                  aria-label={`Load arrangement ${arr.title}`}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                  }}
                >
                  <PlayCircleOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete">
              <span>
                <IconButton
                  size="small"
                  onClick={() => void handleDelete(arr.id, arr.title)}
                  disabled={isDeleting}
                  aria-label={`Delete arrangement ${arr.title}`}
                  sx={{
                    color: theme.palette.error.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) },
                  }}
                >
                  {isDeleting ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <DeleteOutlineIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      })}
    </Stack>
  );
}
