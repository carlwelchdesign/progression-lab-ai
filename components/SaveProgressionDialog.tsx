'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';

import { createProgression } from '../lib/api/progressions';
import type { ChordItem, PianoVoicing } from '../lib/types';

type SaveProgressionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  chords: ChordItem[];
  pianoVoicings?: PianoVoicing[];
  feel?: string;
  scale?: string;
};

export default function SaveProgressionDialog({
  open,
  onClose,
  onSuccess,
  chords,
  pianoVoicings,
  feel: defaultFeel,
  scale: defaultScale,
}: SaveProgressionDialogProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createProgression({
        title: title.trim(),
        chords,
        pianoVoicings,
        feel: defaultFeel,
        scale: defaultScale,
        notes: notes.trim() || undefined,
        tags: tags.trim() ? tags.split(',').map((t) => t.trim()) : [],
        isPublic,
      });

      // Reset form
      setTitle('');
      setNotes('');
      setTags('');
      setIsPublic(false);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save progression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Save Progression</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Late Night Groove"
            fullWidth
            disabled={loading}
            error={!!error && !title.trim()}
          />

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Try with syncopated bass..."
            fullWidth
            multiline
            rows={3}
            disabled={loading}
          />

          <TextField
            label="Tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="house, jazzy, uplifting"
            helperText="Comma-separated"
            fullWidth
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading}
              />
            }
            label="Make public & shareable"
          />

          {error && (
            <span style={{ color: 'red', fontSize: '0.875rem' }}>{error}</span>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !title.trim()}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
