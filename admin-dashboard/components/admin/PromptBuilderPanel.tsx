'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchPromptBuilderState,
  publishPromptDraft,
  rollbackPromptVersion,
  savePromptDraft,
} from './adminApi';
import type { PromptBuilderState, PromptVersion, Role } from './types';

type PromptBuilderPanelProps = {
  role: Role;
};

function getDiffPreview(current: string, previous: string): string {
  if (!previous) {
    return 'No previous version available for diff preview.';
  }

  const currentLines = current.split('\n');
  const previousLines = previous.split('\n');
  const maxLines = Math.max(currentLines.length, previousLines.length);
  const preview: string[] = [];

  for (let i = 0; i < maxLines; i += 1) {
    const before = previousLines[i] ?? '';
    const after = currentLines[i] ?? '';

    if (before !== after) {
      if (before) {
        preview.push(`- ${before}`);
      }
      if (after) {
        preview.push(`+ ${after}`);
      }
    }

    if (preview.length >= 20) {
      preview.push('...');
      break;
    }
  }

  return preview.length ? preview.join('\n') : 'No changes from previous version.';
}

export default function PromptBuilderPanel({ role }: PromptBuilderPanelProps) {
  const [state, setState] = useState<PromptBuilderState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [rollingBackVersionId, setRollingBackVersionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPromptKey, setSelectedPromptKey] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftNotes, setDraftNotes] = useState('');

  const loadState = useCallback(async (promptKey?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchPromptBuilderState(promptKey);
      setState(result);
      setSelectedPromptKey(result.promptKey);
      setDraftContent(result.draft?.contentTemplate ?? result.active?.contentTemplate ?? '');
      setDraftNotes(result.draft?.notes ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load prompt builder');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const versions = useMemo(() => state?.versions ?? [], [state?.versions]);

  const selectedDiffPreview = useMemo(() => {
    const latestVersion = versions[0];
    const previousVersion = versions[1];
    if (!latestVersion) {
      return 'No versions available yet.';
    }

    return getDiffPreview(latestVersion.contentTemplate, previousVersion?.contentTemplate ?? '');
  }, [versions]);

  const handlePromptKeyChange = async (newPromptKey: string) => {
    setSelectedPromptKey(newPromptKey);
    await loadState(newPromptKey);
  };

  const handleSaveDraft = async () => {
    if (role !== 'ADMIN') {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await savePromptDraft({
        promptKey: selectedPromptKey,
        contentTemplate: draftContent,
        notes: draftNotes || null,
      });
      await loadState(selectedPromptKey);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (role !== 'ADMIN') {
      return;
    }

    try {
      setIsPublishing(true);
      setError(null);
      await publishPromptDraft(selectedPromptKey);
      await loadState(selectedPromptKey);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Failed to publish draft');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async (version: PromptVersion) => {
    if (role !== 'ADMIN') {
      return;
    }

    try {
      setRollingBackVersionId(version.id);
      setError(null);
      await rollbackPromptVersion({
        promptKey: selectedPromptKey,
        versionId: version.id,
      });
      await loadState(selectedPromptKey);
    } catch (rollbackError) {
      setError(rollbackError instanceof Error ? rollbackError.message : 'Failed to rollback');
    } finally {
      setRollingBackVersionId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Prompt Builder</Typography>

            <TextField
              select
              label="Prompt key"
              size="small"
              value={selectedPromptKey}
              onChange={(event) => void handlePromptKeyChange(event.target.value)}
            >
              {(state?.keys ?? []).map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Draft Notes"
              size="small"
              value={draftNotes}
              onChange={(event) => setDraftNotes(event.target.value)}
              disabled={role !== 'ADMIN' || isSaving || isPublishing}
              fullWidth
            />

            <TextField
              label="Prompt Template"
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              multiline
              minRows={16}
              disabled={role !== 'ADMIN' || isSaving || isPublishing}
              fullWidth
            />

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => void handleSaveDraft()}
                disabled={role !== 'ADMIN' || isSaving || isPublishing || !draftContent.trim()}
              >
                {isSaving ? 'Saving draft...' : 'Save Draft'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handlePublish()}
                disabled={role !== 'ADMIN' || isSaving || isPublishing || !state?.draft}
              >
                {isPublishing ? 'Publishing...' : 'Publish Draft'}
              </Button>
              <Button variant="text" onClick={() => void loadState(selectedPromptKey)}>
                Refresh
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Version Diff Preview</Typography>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                backgroundColor: '#fafafa',
              }}
            >
              <Typography component="pre" sx={{ m: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                {selectedDiffPreview}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Published</TableCell>
              <TableCell>Editor</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No prompt versions found.</TableCell>
              </TableRow>
            ) : (
              versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>v{version.versionNumber}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {version.isActive ? (
                        <Chip size="small" color="success" label="Active" />
                      ) : null}
                      {version.isDraft ? <Chip size="small" color="warning" label="Draft" /> : null}
                    </Stack>
                  </TableCell>
                  <TableCell>{new Date(version.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {version.publishedAt ? new Date(version.publishedAt).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>{version.createdByEmail ?? 'unknown'}</TableCell>
                  <TableCell>{version.notes || '-'}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => void handleRollback(version)}
                      disabled={
                        role !== 'ADMIN' ||
                        version.isDraft ||
                        version.isActive ||
                        rollingBackVersionId === version.id
                      }
                    >
                      {rollingBackVersionId === version.id ? 'Rolling back...' : 'Rollback'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
