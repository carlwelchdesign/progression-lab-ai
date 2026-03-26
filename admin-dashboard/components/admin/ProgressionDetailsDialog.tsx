'use client';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import type { ProgressionDetail } from './types';

type ProgressionDetailsDialogProps = {
  open: boolean;
  detailsLoading: boolean;
  details: ProgressionDetail | null;
  onClose: () => void;
};

export default function ProgressionDetailsDialog({
  open,
  detailsLoading,
  details,
  onClose,
}: ProgressionDetailsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Progression Details</DialogTitle>
      <DialogContent dividers>
        {detailsLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography color="text.secondary">Loading details...</Typography>
          </Stack>
        ) : details ? (
          <Stack spacing={2}>
            <Typography variant="h6">{details.title}</Typography>
            <Typography>
              <strong>Owner:</strong> {details.owner.name ?? 'Unknown'} ({details.owner.email})
            </Typography>
            <Typography>
              <strong>Genre:</strong> {details.genre ?? 'N/A'}
            </Typography>
            <Typography>
              <strong>Scale:</strong> {details.scale ?? 'N/A'}
            </Typography>
            <Typography>
              <strong>Feel:</strong> {details.feel ?? 'N/A'}
            </Typography>
            <Typography>
              <strong>Public:</strong> {details.isPublic ? 'Yes' : 'No'}
            </Typography>
            <Typography>
              <strong>Tags:</strong> {details.tags.join(', ') || 'None'}
            </Typography>
            <Typography>
              <strong>Notes:</strong> {details.notes || 'No notes'}
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                overflowX: 'auto',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'grey.50',
                fontSize: 12,
              }}
            >
              {JSON.stringify(details.chords, null, 2)}
            </Box>
          </Stack>
        ) : (
          <Typography color="text.secondary">No details available.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
