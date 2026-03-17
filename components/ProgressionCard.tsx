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
} from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import type { Progression } from '@/lib/types';

type ProgressionCardProps = {
  progression: Progression;
  onDelete?: (id: string) => void;
  onEdit?: (progression: Progression) => void;
  onOpen?: (progression: Progression) => void;
  canDelete?: boolean;
  canEdit?: boolean;
};

export default function ProgressionCard({
  progression,
  onDelete,
  onEdit,
  onOpen,
  canDelete = true,
  canEdit = true,
}: ProgressionCardProps) {
  const [copied, setCopied] = useState(false);

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

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          {/* Title and chords */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {progression.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {progression.chords?.length > 0
                ? (progression.chords as Array<{ name: string }>)
                  .map((c) => c.name)
                  .join(' → ')
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
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}

          {/* Status */}
          <Typography variant="caption" color="text.secondary">
            {progression.isPublic ? '🌍 Public' : '🔒 Private'} •{' '}
            {new Date(progression.createdAt).toLocaleDateString()}
          </Typography>

          {/* Actions */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end', pt: 1 }}
          >
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
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(progression.id)}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
