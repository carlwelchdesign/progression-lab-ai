'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { fetchSubscriptionTierConfigs, updateSubscriptionTierConfig } from './adminApi';
import type { SubscriptionPlan, SubscriptionTierConfig } from './types';

type TierConfigRow = SubscriptionTierConfig & {
  isSaving?: boolean;
  saveError?: string | null;
};

export default function TierConfigTable() {
  const [rows, setRows] = useState<TierConfigRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load tier configs on mount
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const configs = await fetchSubscriptionTierConfigs();
        setRows(configs as TierConfigRow[]);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load tier configurations');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigs();
  }, []);

  const updateField = useCallback(
    (plan: SubscriptionPlan, field: keyof Omit<SubscriptionTierConfig, 'plan'>, value: unknown) => {
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.plan === plan
            ? {
                ...row,
                [field]: value,
                saveError: null,
              }
            : row,
        ),
      );
    },
    [],
  );

  const saveRow = useCallback(async (row: TierConfigRow) => {
    setRows((prevRows) =>
      prevRows.map((r) =>
        r.plan === row.plan
          ? {
              ...r,
              isSaving: true,
            }
          : r,
      ),
    );

    try {
      const updated = await updateSubscriptionTierConfig(row.plan, {
        gptModel: row.gptModel,
        aiGenerationsPerMonth: row.aiGenerationsPerMonth,
        maxSavedProgressions: row.maxSavedProgressions,
        maxSavedArrangements: row.maxSavedArrangements,
        maxPublicShares: row.maxPublicShares,
        canExportMidi: row.canExportMidi,
        canExportPdf: row.canExportPdf,
        canSharePublicly: row.canSharePublicly,
        canUseVocalTrackRecording: row.canUseVocalTrackRecording,
        maxVocalTakesPerArrangement: row.maxVocalTakesPerArrangement,
        canUseAdvancedVoicingControls: row.canUseAdvancedVoicingControls,
      });

      setRows((prevRows) =>
        prevRows.map((r) =>
          r.plan === row.plan
            ? {
                ...(updated as TierConfigRow),
                isSaving: false,
              }
            : r,
        ),
      );
    } catch (error) {
      setRows((prevRows) =>
        prevRows.map((r) =>
          r.plan === row.plan
            ? {
                ...r,
                isSaving: false,
                saveError: error instanceof Error ? error.message : 'Save failed',
              }
            : r,
        ),
      );
    }
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {loadError && <Alert severity="error">{loadError}</Alert>}

      <Typography variant="h6">Subscription Tier Configuration</Typography>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Plan</TableCell>
              <TableCell>GPT Model</TableCell>
              <TableCell align="right">AI Gen/Month</TableCell>
              <TableCell align="right">Max Progressions</TableCell>
              <TableCell align="right">Max Arrangements</TableCell>
              <TableCell align="right">Max Public Shares</TableCell>
              <TableCell align="center">Export MIDI</TableCell>
              <TableCell align="center">Export PDF</TableCell>
              <TableCell align="center">Public Share</TableCell>
              <TableCell align="center">Vocal Recording</TableCell>
              <TableCell align="right">Vocal Takes Cap</TableCell>
              <TableCell align="center">Advanced Voicing</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.plan}>
                <TableCell sx={{ fontWeight: 600 }}>{row.plan}</TableCell>

                {/* GPT Model */}
                <TableCell>
                  <TextField
                    size="small"
                    value={row.gptModel}
                    onChange={(e) => updateField(row.plan, 'gptModel', e.target.value)}
                    fullWidth
                    disabled={row.isSaving}
                  />
                </TableCell>

                {/* AI Generations Per Month */}
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={row.aiGenerationsPerMonth ?? ''}
                    onChange={(e) =>
                      updateField(
                        row.plan,
                        'aiGenerationsPerMonth',
                        e.target.value ? Number.parseInt(e.target.value, 10) : null,
                      )
                    }
                    disabled={row.isSaving}
                    sx={{ width: '90px' }}
                  />
                </TableCell>

                {/* Max Progressions */}
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={row.maxSavedProgressions ?? ''}
                    onChange={(e) =>
                      updateField(
                        row.plan,
                        'maxSavedProgressions',
                        e.target.value ? Number.parseInt(e.target.value, 10) : null,
                      )
                    }
                    disabled={row.isSaving}
                    sx={{ width: '90px' }}
                  />
                </TableCell>

                {/* Max Arrangements */}
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={row.maxSavedArrangements ?? ''}
                    onChange={(e) =>
                      updateField(
                        row.plan,
                        'maxSavedArrangements',
                        e.target.value ? Number.parseInt(e.target.value, 10) : null,
                      )
                    }
                    disabled={row.isSaving}
                    sx={{ width: '90px' }}
                  />
                </TableCell>

                {/* Max Public Shares */}
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={row.maxPublicShares ?? ''}
                    onChange={(e) =>
                      updateField(
                        row.plan,
                        'maxPublicShares',
                        e.target.value ? Number.parseInt(e.target.value, 10) : null,
                      )
                    }
                    disabled={row.isSaving}
                    sx={{ width: '90px' }}
                  />
                </TableCell>

                {/* Export MIDI */}
                <TableCell align="center">
                  <Checkbox
                    checked={row.canExportMidi}
                    onChange={(e) => updateField(row.plan, 'canExportMidi', e.target.checked)}
                    disabled={row.isSaving}
                  />
                </TableCell>

                {/* Export PDF */}
                <TableCell align="center">
                  <Checkbox
                    checked={row.canExportPdf}
                    onChange={(e) => updateField(row.plan, 'canExportPdf', e.target.checked)}
                    disabled={row.isSaving}
                  />
                </TableCell>

                {/* Public Share */}
                <TableCell align="center">
                  <Checkbox
                    checked={row.canSharePublicly}
                    onChange={(e) => updateField(row.plan, 'canSharePublicly', e.target.checked)}
                    disabled={row.isSaving}
                  />
                </TableCell>

                {/* Vocal Recording */}
                <TableCell align="center">
                  <Checkbox
                    checked={row.canUseVocalTrackRecording}
                    onChange={(e) =>
                      updateField(row.plan, 'canUseVocalTrackRecording', e.target.checked)
                    }
                    disabled={row.isSaving}
                  />
                </TableCell>

                {/* Vocal Takes Cap */}
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={row.maxVocalTakesPerArrangement ?? ''}
                    onChange={(e) =>
                      updateField(
                        row.plan,
                        'maxVocalTakesPerArrangement',
                        e.target.value ? Number.parseInt(e.target.value, 10) : null,
                      )
                    }
                    disabled={row.isSaving}
                    sx={{ width: '90px' }}
                  />
                </TableCell>

                {/* Advanced Voicing */}
                <TableCell align="center">
                  <Checkbox
                    checked={row.canUseAdvancedVoicingControls}
                    onChange={(e) =>
                      updateField(row.plan, 'canUseAdvancedVoicingControls', e.target.checked)
                    }
                    disabled={row.isSaving}
                  />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => saveRow(row)}
                    disabled={row.isSaving}
                  >
                    {row.isSaving ? <CircularProgress size={20} /> : 'Save'}
                  </Button>
                  {row.saveError && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'error.main', mt: 1 }}>
                      {row.saveError}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
