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

function getStarterTemplate(contentKey: string): Record<string, unknown> {
  if (contentKey === 'homepage') {
    return {
      hero: {
        eyebrow: 'Compose with confidence',
        title: 'From idea to polished progression in minutes',
        description:
          'Generate, refine, and save chord progressions with practical voicings and arrangement-friendly ideas.',
        ctaPrimary: 'Start generating',
        ctaSecondary: 'View pricing',
      },
      proofStrip: [
        'Used by songwriters',
        'Built for fast iteration',
        'Designed for musical clarity',
      ],
    };
  }

  if (contentKey === 'pricing') {
    return {
      hero: {
        title: 'Pick a plan that matches your studio workflow',
        description:
          'Start free, then unlock advanced export and collaboration features as you grow.',
      },
      comparisonIntro:
        'All plans include the core generator. Paid tiers unlock deeper production workflows.',
      upgradeFlow: {
        signInHint: 'Create an account to start a paid plan and keep billing history in one place.',
        composerCta: 'Start Composer',
        studioCta: 'Start Studio',
        checkoutPendingLabel: 'Preparing checkout...',
      },
    };
  }

  if (contentKey === 'public_progressions') {
    return {
      hero: {
        title: 'Discover progressions from the community',
        description:
          'Browse proven harmonic ideas, then load one into the generator and make it yours.',
      },
      spotlight: {
        title: 'Spotlight: curated starter progressions',
        description: 'Choose a skill level and start from a musically strong progression.',
        maxItems: 3,
      },
      emptyState: {
        description: 'No public progressions match these filters yet.',
        cta: 'Create a progression',
      },
    };
  }

  if (contentKey === 'auth_flow_copy') {
    return {
      generic: {
        modalTitle: 'Create your free account',
        modalDescription: 'Save your ideas and continue from any device.',
        loginButtonLabel: 'Sign in',
        registerButtonLabel: 'Create account',
        benefitDescription: 'Unlock save, export, and progress tracking.',
      },
      'my-progressions': {
        modalTitle: 'Access your progressions',
        modalDescription: 'Sign in to view, edit, and manage your saved progressions.',
      },
    };
  }

  return {};
}

function getPreviewLines(contentKey: string, content: Record<string, unknown>): string[] {
  if (contentKey === 'homepage') {
    const hero = content.hero as Record<string, unknown> | undefined;
    return [
      `Hero: ${String(hero?.title ?? '(not set)')}`,
      `Subtext: ${String(hero?.description ?? '(not set)')}`,
    ];
  }

  if (contentKey === 'pricing') {
    const hero = content.hero as Record<string, unknown> | undefined;
    const upgradeFlow = content.upgradeFlow as Record<string, unknown> | undefined;
    return [
      `Page hero: ${String(hero?.title ?? '(not set)')}`,
      `Comparison intro: ${String(content.comparisonIntro ?? '(not set)')}`,
      `Composer CTA: ${String(upgradeFlow?.composerCta ?? '(not set)')}`,
    ];
  }

  if (contentKey === 'public_progressions') {
    const hero = content.hero as Record<string, unknown> | undefined;
    const spotlight = content.spotlight as Record<string, unknown> | undefined;
    return [
      `Hero: ${String(hero?.title ?? '(not set)')}`,
      `Spotlight: ${String(spotlight?.title ?? '(not set)')}`,
      `Spotlight max items: ${String(spotlight?.maxItems ?? '(default)')}`,
    ];
  }

  if (contentKey === 'auth_flow_copy') {
    const generic = content.generic as Record<string, unknown> | undefined;
    return [
      `Auth title: ${String(generic?.modalTitle ?? '(not set)')}`,
      `Auth CTA: ${String(generic?.registerButtonLabel ?? '(not set)')}`,
    ];
  }

  return ['No preview available for this content surface.'];
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
  const parsedDraftPreview = useMemo(() => {
    try {
      const parsed = JSON.parse(draftContent) as Record<string, unknown>;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }, [draftContent]);

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
      const result = await publishMarketingContentDraft({
        contentKey: selectedContentKey,
        locale: selectedLocale,
      });

      if (state && result.stale) {
        setState({
          ...state,
          active: result.item,
          draft: null,
          sourceActiveVersionId: result.stale.sourceActiveVersionId,
          sourceActiveVersionNumber: result.stale.sourceActiveVersionNumber,
          selectedDraftIsStale: false,
          versions: state.versions.map((v) => (v.id === result.item.id ? result.item : v)),
        });
      } else {
        await loadState(selectedContentKey, selectedLocale);
      }
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
      const result = await rollbackMarketingContentVersion({
        contentKey: selectedContentKey,
        locale: selectedLocale,
        versionId: version.id,
      });

      if (state && result.stale) {
        setState({
          ...state,
          active: result.item,
          sourceActiveVersionId: result.stale.sourceActiveVersionId,
          sourceActiveVersionNumber: result.stale.sourceActiveVersionNumber,
          versions: state.versions.map((v) => (v.id === result.item.id ? result.item : v)),
        });
      } else {
        await loadState(selectedContentKey, selectedLocale);
      }
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
                variant="text"
                onClick={() =>
                  setDraftContent(stringifyContent(getStarterTemplate(selectedContentKey)))
                }
                disabled={role !== 'ADMIN' || isSaving || isPublishing || isGeneratingTranslation}
              >
                Load starter template
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(draftContent) as Record<string, unknown>;
                    setDraftContent(stringifyContent(parsed));
                    setJsonError(null);
                  } catch {
                    setJsonError('Draft content must be valid JSON before formatting.');
                  }
                }}
                disabled={role !== 'ADMIN' || isSaving || isPublishing || isGeneratingTranslation}
              >
                Format JSON
              </Button>
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

      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">Live Content Preview</Typography>
            <Typography variant="body2" color="text.secondary">
              Quick sanity-check preview based on current draft JSON.
            </Typography>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                backgroundColor: '#fafafa',
              }}
            >
              {parsedDraftPreview ? (
                <Stack spacing={0.5}>
                  {getPreviewLines(selectedContentKey, parsedDraftPreview).map((line) => (
                    <Typography key={line} variant="body2">
                      {line}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Draft JSON is not valid. Fix syntax errors to render preview.
                </Typography>
              )}
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
