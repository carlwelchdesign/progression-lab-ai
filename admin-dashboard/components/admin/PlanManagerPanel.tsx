'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
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
import { useCallback, useEffect, useState } from 'react';

import {
  fetchPlanVersionsState,
  publishPlanDraft,
  rollbackPlanVersion,
  savePlanDraft,
} from './adminApi';
import type { PlanVersion, PlanVersionsState, Role, SavePlanDraftInput } from './types';

type PlanManagerPanelProps = {
  role: Role;
};

type DraftFormState = {
  displayName: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyStripePriceId: string;
  yearlyStripePriceId: string;
  gptModel: string;
  aiGenerationsPerMonth: string;
  maxSavedProgressions: string;
  maxSavedArrangements: string;
  maxPublicShares: string;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
  canUsePremiumAiModel: boolean;
};

function stateToForm(plan: PlanVersion | null | undefined): DraftFormState {
  if (!plan) {
    return {
      displayName: '',
      description: '',
      monthlyPrice: '0',
      yearlyPrice: '0',
      monthlyStripePriceId: '',
      yearlyStripePriceId: '',
      gptModel: 'gpt-3.5-turbo',
      aiGenerationsPerMonth: '',
      maxSavedProgressions: '',
      maxSavedArrangements: '',
      maxPublicShares: '',
      canExportMidi: false,
      canExportPdf: false,
      canSharePublicly: true,
      canUsePremiumAiModel: false,
    };
  }
  return {
    displayName: plan.displayName,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    monthlyStripePriceId: plan.monthlyStripePriceId ?? '',
    yearlyStripePriceId: plan.yearlyStripePriceId ?? '',
    gptModel: plan.gptModel,
    aiGenerationsPerMonth:
      plan.aiGenerationsPerMonth != null ? String(plan.aiGenerationsPerMonth) : '',
    maxSavedProgressions:
      plan.maxSavedProgressions != null ? String(plan.maxSavedProgressions) : '',
    maxSavedArrangements:
      plan.maxSavedArrangements != null ? String(plan.maxSavedArrangements) : '',
    maxPublicShares: plan.maxPublicShares != null ? String(plan.maxPublicShares) : '',
    canExportMidi: plan.canExportMidi,
    canExportPdf: plan.canExportPdf,
    canSharePublicly: plan.canSharePublicly,
    canUsePremiumAiModel: plan.canUsePremiumAiModel,
  };
}

function parseNullableInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = parseInt(trimmed, 10);
  return !isNaN(num) && num >= 0 ? num : null;
}

export default function PlanManagerPanel({ role }: PlanManagerPanelProps) {
  const [state, setState] = useState<PlanVersionsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [rollingBackVersionId, setRollingBackVersionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [form, setForm] = useState<DraftFormState>(stateToForm(null));

  const loadState = useCallback(async (planId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchPlanVersionsState(planId);
      setState(result);
      setSelectedPlanId(result.planId);
      setForm(stateToForm(result.draft ?? result.active));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load plan manager');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const handlePlanIdChange = async (newPlanId: string) => {
    setSelectedPlanId(newPlanId);
    await loadState(newPlanId);
  };

  const handleFormChange = <K extends keyof DraftFormState>(key: K, value: DraftFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildInput = (): SavePlanDraftInput => ({
    planId: selectedPlanId,
    displayName: form.displayName.trim(),
    description: form.description.trim(),
    monthlyPrice: parseFloat(form.monthlyPrice) || 0,
    yearlyPrice: parseFloat(form.yearlyPrice) || 0,
    monthlyStripePriceId: form.monthlyStripePriceId.trim() || null,
    yearlyStripePriceId: form.yearlyStripePriceId.trim() || null,
    gptModel: form.gptModel.trim(),
    aiGenerationsPerMonth: parseNullableInt(form.aiGenerationsPerMonth),
    maxSavedProgressions: parseNullableInt(form.maxSavedProgressions),
    maxSavedArrangements: parseNullableInt(form.maxSavedArrangements),
    maxPublicShares: parseNullableInt(form.maxPublicShares),
    canExportMidi: form.canExportMidi,
    canExportPdf: form.canExportPdf,
    canSharePublicly: form.canSharePublicly,
    canUsePremiumAiModel: form.canUsePremiumAiModel,
  });

  const handleSaveDraft = async () => {
    if (role !== 'ADMIN') return;
    try {
      setIsSaving(true);
      setError(null);
      await savePlanDraft(buildInput());
      await loadState(selectedPlanId);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (role !== 'ADMIN') return;
    try {
      setIsPublishing(true);
      setError(null);
      await publishPlanDraft(selectedPlanId);
      await loadState(selectedPlanId);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Failed to publish draft');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async (version: PlanVersion) => {
    if (role !== 'ADMIN') return;
    try {
      setRollingBackVersionId(version.id);
      setError(null);
      await rollbackPlanVersion({ planId: selectedPlanId, versionId: version.id });
      await loadState(selectedPlanId);
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

  const isDisabled = role !== 'ADMIN' || isSaving || isPublishing;
  const versions = state?.versions ?? [];

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Plan Manager</Typography>

            <TextField
              select
              label="Plan"
              size="small"
              value={selectedPlanId}
              onChange={(event) => void handlePlanIdChange(event.target.value)}
              sx={{ maxWidth: 240 }}
            >
              {(state?.planIds ?? []).map((id) => (
                <MenuItem key={id} value={id}>
                  {id}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Display Name"
                size="small"
                fullWidth
                value={form.displayName}
                onChange={(e) => handleFormChange('displayName', e.target.value)}
                disabled={isDisabled}
              />
              <TextField
                label="GPT Model"
                size="small"
                fullWidth
                value={form.gptModel}
                onChange={(e) => handleFormChange('gptModel', e.target.value)}
                disabled={isDisabled}
              />
            </Stack>
            <TextField
              label="Description"
              size="small"
              fullWidth
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              disabled={isDisabled}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Monthly Price ($)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={form.monthlyPrice}
                onChange={(e) => handleFormChange('monthlyPrice', e.target.value)}
                disabled={isDisabled}
              />
              <TextField
                label="Yearly Price ($)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={form.yearlyPrice}
                onChange={(e) => handleFormChange('yearlyPrice', e.target.value)}
                disabled={isDisabled}
              />
              <TextField
                label="Monthly Stripe Price ID"
                size="small"
                fullWidth
                value={form.monthlyStripePriceId}
                onChange={(e) => handleFormChange('monthlyStripePriceId', e.target.value)}
                disabled={isDisabled}
                placeholder="price_..."
              />
              <TextField
                label="Yearly Stripe Price ID"
                size="small"
                fullWidth
                value={form.yearlyStripePriceId}
                onChange={(e) => handleFormChange('yearlyStripePriceId', e.target.value)}
                disabled={isDisabled}
                placeholder="price_..."
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="AI Generations/Month (blank = unlimited)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                value={form.aiGenerationsPerMonth}
                onChange={(e) => handleFormChange('aiGenerationsPerMonth', e.target.value)}
                disabled={isDisabled}
              />
              <TextField
                label="Max Saved Progressions (blank = unlimited)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                value={form.maxSavedProgressions}
                onChange={(e) => handleFormChange('maxSavedProgressions', e.target.value)}
                disabled={isDisabled}
              />
              <TextField
                label="Max Saved Arrangements (blank = unlimited)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                value={form.maxSavedArrangements}
                onChange={(e) => handleFormChange('maxSavedArrangements', e.target.value)}
                disabled={isDisabled}
              />
              <TextField
                label="Max Public Shares (blank = unlimited)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                value={form.maxPublicShares}
                onChange={(e) => handleFormChange('maxPublicShares', e.target.value)}
                disabled={isDisabled}
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feature Flags
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={form.canExportMidi}
                      onChange={(e) => handleFormChange('canExportMidi', e.target.checked)}
                      disabled={isDisabled}
                    />
                  }
                  label="Export MIDI"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={form.canExportPdf}
                      onChange={(e) => handleFormChange('canExportPdf', e.target.checked)}
                      disabled={isDisabled}
                    />
                  }
                  label="Export PDF"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={form.canSharePublicly}
                      onChange={(e) => handleFormChange('canSharePublicly', e.target.checked)}
                      disabled={isDisabled}
                    />
                  }
                  label="Public Sharing"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={form.canUsePremiumAiModel}
                      onChange={(e) => handleFormChange('canUsePremiumAiModel', e.target.checked)}
                      disabled={isDisabled}
                    />
                  }
                  label="Premium AI Model"
                />
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => void handleSaveDraft()}
                disabled={isDisabled || !form.displayName.trim() || !form.description.trim()}
              >
                {isSaving ? 'Saving draft...' : 'Save Draft'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handlePublish()}
                disabled={isDisabled || !state?.draft}
              >
                {isPublishing ? 'Publishing...' : 'Publish Draft'}
              </Button>
              <Button variant="text" onClick={() => void loadState(selectedPlanId)}>
                Refresh
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Display Name</TableCell>
              <TableCell>Price (mo/yr)</TableCell>
              <TableCell>GPT Model</TableCell>
              <TableCell>Editor</TableCell>
              <TableCell>Published</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No plan versions found.</TableCell>
              </TableRow>
            ) : (
              versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>v{version.versionNumber}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {version.isActive ? (
                        <Chip size="small" color="success" label="Active" />
                      ) : null}
                      {version.isDraft ? <Chip size="small" color="warning" label="Draft" /> : null}
                    </Stack>
                  </TableCell>
                  <TableCell>{version.displayName}</TableCell>
                  <TableCell>
                    ${version.monthlyPrice} / ${version.yearlyPrice}
                  </TableCell>
                  <TableCell>{version.gptModel}</TableCell>
                  <TableCell>{version.editorEmail ?? '-'}</TableCell>
                  <TableCell>
                    {version.publishedAt ? new Date(version.publishedAt).toLocaleString() : '-'}
                  </TableCell>
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
