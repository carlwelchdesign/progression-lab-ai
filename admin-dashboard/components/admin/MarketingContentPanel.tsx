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
  fetchMarketingContentState,
  generateMarketingContentTranslationDraft,
  publishMarketingContentDraft,
  rollbackMarketingContentVersion,
  saveMarketingContentDraft,
} from './adminApi';
import type { MarketingContentState, MarketingContentVersion, Role } from './types';

type MarketingContentPanelProps = {
  role: Role;
};

function stringifyContent(content: Record<string, unknown>): string {
  return JSON.stringify(content, null, 2);
}

function getDiffPreview(current: string, previous: string): string {
  if (!previous) {
    return 'No previous version available for diff preview.';
  }

  const currentLines = current.split('\n');
  const previousLines = previous.split('\n');
  const maxLines = Math.max(currentLines.length, previousLines.length);
  const preview: string[] = [];

  for (let index = 0; index < maxLines; index += 1) {
    const before = previousLines[index] ?? '';
    const after = currentLines[index] ?? '';

    if (before !== after) {
      if (before) {
        preview.push(`- ${before}`);
      }
      if (after) {
        preview.push(`+ ${after}`);
      }
    }

    if (preview.length >= 24) {
      preview.push('...');
      break;
    }
  }

  return preview.length ? preview.join('\n') : 'No changes from previous version.';
}

export default function MarketingContentPanel({ role }: MarketingContentPanelProps) {
  const [state, setState] = useState<MarketingContentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false);
  const [rollingBackVersionId, setRollingBackVersionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedContentKey, setSelectedContentKey] = useState('');
  const [sourceLocale, setSourceLocale] = useState('en');
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [draftContent, setDraftContent] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const loadState = useCallback(
    async (contentKey?: string, locale?: string, requestedSourceLocale?: string) => {
      const nextSourceLocale = requestedSourceLocale ?? sourceLocale;

      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchMarketingContentState(contentKey, locale, nextSourceLocale);
        setState(result);
        setSelectedContentKey(result.contentKey);
        setSelectedLocale(result.locale);
        setSourceLocale(result.sourceLocale);
        setDraftContent(
          stringifyContent(
            result.draft?.content ?? result.active?.content ?? result.defaultContent,
          ),
        );
        setDraftNotes(result.draft?.notes ?? '');
        setJsonError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load marketing content',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [sourceLocale],
  );

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    if (!selectedContentKey || !selectedLocale || !sourceLocale) {
      return;
    }

    void loadState(selectedContentKey, selectedLocale, sourceLocale);
  }, [loadState, selectedContentKey, selectedLocale, sourceLocale]);

  const versions = useMemo(() => state?.versions ?? [], [state?.versions]);

  const selectedDiffPreview = useMemo(() => {
    const latestVersion = versions[0];
    const previousVersion = versions[1];
    if (!latestVersion) {
      return 'No versions available yet.';
    }

    return getDiffPreview(
      stringifyContent(latestVersion.content),
      stringifyContent(previousVersion?.content ?? {}),
    );
  }, [versions]);

  const sourceActiveVersionId = state?.sourceActiveVersionId ?? null;
  const sourceActiveVersionNumber = state?.sourceActiveVersionNumber ?? null;
  const staleVersionIds = state?.staleVersionIds ?? [];
  const selectedDraftIsStale = state?.selectedDraftIsStale ?? false;

  const handleSelectionChange = async (contentKey: string, locale: string) => {
    setSelectedContentKey(contentKey);
    setSelectedLocale(locale);
    await loadState(contentKey, locale);
  };

  const handleSaveDraft = async () => {
    if (role !== 'ADMIN') {
      return;
    }

    try {
      const parsed = JSON.parse(draftContent) as Record<string, unknown>;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        setJsonError('Marketing content must be a JSON object at the top level.');
        return;
      }

      setJsonError(null);
      setIsSaving(true);
      setError(null);
      await saveMarketingContentDraft({
        contentKey: selectedContentKey,
        locale: selectedLocale,
        content: parsed,
        notes: draftNotes || null,
      });
      await loadState(selectedContentKey, selectedLocale);
    } catch (saveError) {
      if (saveError instanceof SyntaxError) {
        setJsonError('Draft content must be valid JSON before it can be saved.');
      } else {
        setError(
          saveError instanceof Error ? saveError.message : 'Failed to save marketing content draft',
        );
      }
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
      await publishMarketingContentDraft({
        contentKey: selectedContentKey,
        locale: selectedLocale,
      });
      await loadState(selectedContentKey, selectedLocale);
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : 'Failed to publish marketing content draft',
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async (version: MarketingContentVersion) => {
    if (role !== 'ADMIN') {
      return;
    }

    try {
      setRollingBackVersionId(version.id);
      setError(null);
      await rollbackMarketingContentVersion({
        contentKey: selectedContentKey,
        locale: selectedLocale,
        versionId: version.id,
      });
      await loadState(selectedContentKey, selectedLocale);
    } catch (rollbackError) {
      setError(
        rollbackError instanceof Error
          ? rollbackError.message
          : 'Failed to rollback marketing content version',
      );
    } finally {
      setRollingBackVersionId(null);
    }
  };

  const handleGenerateTranslation = async (sourceVersionId?: string) => {
    if (role !== 'ADMIN') {
      return;
    }

    try {
      setIsGeneratingTranslation(true);
      setError(null);
      await generateMarketingContentTranslationDraft({
        contentKey: selectedContentKey,
        sourceLocale,
        targetLocale: selectedLocale,
        sourceVersionId,
      });
      await loadState(selectedContentKey, selectedLocale);
    } catch (translationError) {
      setError(
        translationError instanceof Error
          ? translationError.message
          : 'Failed to generate translation draft',
      );
    } finally {
      setIsGeneratingTranslation(false);
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

  const selectedDefinition =
    state?.definitions.find((definition) => definition.key === selectedContentKey) ?? null;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {jsonError ? <Alert severity="warning">{jsonError}</Alert> : null}
      {selectedDraftIsStale ? (
        <Alert severity="warning">
          This draft is stale. The active {sourceLocale} source version has changed since this
          translation draft was generated.
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Marketing Content</Typography>
            {selectedDefinition ? (
              <Typography variant="body2" color="text.secondary">
                {selectedDefinition.description}
              </Typography>
            ) : null}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                label="Content surface"
                size="small"
                value={selectedContentKey}
                onChange={(event) => void handleSelectionChange(event.target.value, selectedLocale)}
                sx={{ minWidth: 260 }}
              >
                {(state?.definitions ?? []).map((definition) => (
                  <MenuItem key={definition.key} value={definition.key}>
                    {definition.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Locale"
                size="small"
                value={selectedLocale}
                onChange={(event) =>
                  void handleSelectionChange(selectedContentKey, event.target.value)
                }
                sx={{ minWidth: 180 }}
              >
                {(state?.supportedLocales ?? []).map((locale) => (
                  <MenuItem key={locale} value={locale}>
                    {locale}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Source locale"
                size="small"
                value={sourceLocale}
                onChange={(event) => setSourceLocale(event.target.value)}
                sx={{ minWidth: 180 }}
              >
                {(state?.supportedLocales ?? []).map((locale) => (
                  <MenuItem key={locale} value={locale}>
                    {locale}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Draft Notes"
              size="small"
              value={draftNotes}
              onChange={(event) => setDraftNotes(event.target.value)}
              disabled={role !== 'ADMIN' || isSaving || isPublishing}
              fullWidth
            />

            <TextField
              label="Content JSON"
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              multiline
              minRows={20}
              disabled={role !== 'ADMIN' || isSaving || isPublishing}
              fullWidth
            />

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => void handleSaveDraft()}
                disabled={
                  role !== 'ADMIN' ||
                  isSaving ||
                  isPublishing ||
                  isGeneratingTranslation ||
                  !draftContent.trim()
                }
              >
                {isSaving ? 'Saving draft...' : 'Save Draft'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handlePublish()}
                disabled={
                  role !== 'ADMIN' ||
                  isSaving ||
                  isPublishing ||
                  isGeneratingTranslation ||
                  !state?.draft
                }
              >
                {isPublishing ? 'Publishing...' : 'Publish Draft'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => void handleGenerateTranslation(sourceActiveVersionId ?? undefined)}
                disabled={
                  role !== 'ADMIN' ||
                  isSaving ||
                  isPublishing ||
                  isGeneratingTranslation ||
                  sourceLocale === selectedLocale ||
                  !sourceActiveVersionId
                }
              >
                {isGeneratingTranslation
                  ? 'Generating translation...'
                  : 'Generate AI Translation Draft'}
              </Button>
              {selectedDraftIsStale ? (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => void handleGenerateTranslation(sourceActiveVersionId ?? undefined)}
                  disabled={
                    role !== 'ADMIN' ||
                    isSaving ||
                    isPublishing ||
                    isGeneratingTranslation ||
                    !sourceActiveVersionId
                  }
                >
                  {isGeneratingTranslation
                    ? 'Regenerating...'
                    : `Regenerate from ${sourceLocale} v${sourceActiveVersionNumber ?? 'latest'}`}
                </Button>
              ) : null}
              <Button
                variant="text"
                onClick={() => void loadState(selectedContentKey, selectedLocale)}
              >
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
              <TableCell>Locale</TableCell>
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
                <TableCell colSpan={8}>No marketing content versions found.</TableCell>
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
                      {version.translationOrigin === 'AI_ASSISTED' ? (
                        <Chip size="small" color="info" label="AI Draft" />
                      ) : null}
                      {staleVersionIds.includes(version.id) ? (
                        <Chip size="small" color="error" label="Stale" />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>{version.locale}</TableCell>
                  <TableCell>{new Date(version.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {version.publishedAt ? new Date(version.publishedAt).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>{version.editorEmail ?? 'unknown'}</TableCell>
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
