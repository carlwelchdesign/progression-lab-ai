'use client';

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchAnalyticsSummary } from './adminApi';
import type { AnalyticsSummary } from './types';

const DAY_OPTIONS = [1, 7, 14, 30, 60, 90] as const;

function formatProperties(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '-';
  }
  const entries = Object.entries(value as Record<string, unknown>).slice(0, 4);
  return entries.map(([key, item]) => `${key}: ${String(item)}`).join(' | ');
}

export default function AnalyticsInsightsPanel() {
  const [days, setDays] = useState<number>(7);
  const [rangeMode, setRangeMode] = useState<'lookback' | 'custom'>('lookback');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result =
        rangeMode === 'custom' && startDate && endDate
          ? await fetchAnalyticsSummary({ startDate, endDate })
          : await fetchAnalyticsSummary({ days });
      setSummary(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics summary');
    } finally {
      setIsLoading(false);
    }
  }, [days, endDate, rangeMode, startDate]);

  useEffect(() => {
    if (rangeMode === 'custom' && (!startDate || !endDate)) {
      setIsLoading(false);
      return;
    }
    void loadSummary();
  }, [loadSummary, rangeMode, startDate, endDate]);

  const topEvents = useMemo(() => summary?.eventsByType.slice(0, 8) ?? [], [summary?.eventsByType]);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
            >
              <Typography variant="h6">Analytics Insights</Typography>
              <Stack spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
                <FormLabel>Range</FormLabel>
                <RadioGroup
                  row
                  value={rangeMode}
                  onChange={(event) => setRangeMode(event.target.value as 'lookback' | 'custom')}
                >
                  <FormControlLabel
                    value="lookback"
                    control={<Radio size="small" />}
                    label="Preset"
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio size="small" />}
                    label="Custom"
                  />
                </RadioGroup>

                {rangeMode === 'lookback' ? (
                  <TextField
                    select
                    label="Lookback window"
                    size="small"
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                    sx={{ minWidth: 180 }}
                  >
                    {DAY_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        Last {option} day{option === 1 ? '' : 's'}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Start"
                      type="datetime-local"
                      size="small"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End"
                      type="datetime-local"
                      size="small"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                )}
              </Stack>
            </Stack>

            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                <CircularProgress />
              </Stack>
            ) : rangeMode === 'custom' && (!startDate || !endDate) ? (
              <Alert severity="info">
                Set both start and end date to load custom-range analytics.
              </Alert>
            ) : (
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Events
                      </Typography>
                      <Typography variant="h5">{summary?.totals.totalEvents ?? 0}</Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Unique Sessions
                      </Typography>
                      <Typography variant="h5">{summary?.totals.uniqueSessions ?? 0}</Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Conversion Events
                      </Typography>
                      <Typography variant="h5">{summary?.totals.conversionEvents ?? 0}</Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Auth Starts From Views
                      </Typography>
                      <Typography variant="h5">
                        {summary?.funnel.authStartRateFromViews ?? 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(summary?.funnel.authStarted ?? 0).toLocaleString()} /{' '}
                        {(summary?.funnel.pageViews ?? 0).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Auth Completion Rate
                      </Typography>
                      <Typography variant="h5">
                        {summary?.funnel.authCompletionRateFromStarts ?? 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(summary?.funnel.authCompleted ?? 0).toLocaleString()} /{' '}
                        {(summary?.funnel.authStarted ?? 0).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Upgrade Intent From Auth
                      </Typography>
                      <Typography variant="h5">
                        {summary?.funnel.upgradeIntentRateFromAuthCompletion ?? 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(summary?.funnel.upgradeIntent ?? 0).toLocaleString()} /{' '}
                        {(summary?.funnel.authCompleted ?? 0).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Upgrade Completion Rate
                      </Typography>
                      <Typography variant="h5">
                        {summary?.funnel.upgradeCompletionRateFromIntent ?? 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(summary?.funnel.upgradeCompleted ?? 0).toLocaleString()} /{' '}
                        {(summary?.funnel.upgradeIntent ?? 0).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Top Event Types
                    </Typography>
                    <Stack spacing={0.5}>
                      {topEvents.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No events captured yet.
                        </Typography>
                      ) : (
                        topEvents.map((row) => (
                          <Typography key={row.eventType} variant="body2">
                            {row.eventType}: {row.count}
                          </Typography>
                        ))
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Funnel Breakdown by Locale
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Locale</TableCell>
                          <TableCell align="right">Views</TableCell>
                          <TableCell align="right">Auth Starts</TableCell>
                          <TableCell align="right">Auth Completions</TableCell>
                          <TableCell align="right">Upgrade Intent</TableCell>
                          <TableCell align="right">Upgrade Completions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(summary?.breakdownByLocale ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6}>
                              No locale breakdown data in this window.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (summary?.breakdownByLocale ?? []).map((row) => (
                            <TableRow key={row.key}>
                              <TableCell>{row.key}</TableCell>
                              <TableCell align="right">{row.pageViews}</TableCell>
                              <TableCell align="right">{row.authStarted}</TableCell>
                              <TableCell align="right">{row.authCompleted}</TableCell>
                              <TableCell align="right">{row.upgradeIntent}</TableCell>
                              <TableCell align="right">{row.upgradeCompleted}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Funnel Breakdown by Persona
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Persona</TableCell>
                          <TableCell align="right">Views</TableCell>
                          <TableCell align="right">Auth Starts</TableCell>
                          <TableCell align="right">Auth Completions</TableCell>
                          <TableCell align="right">Upgrade Intent</TableCell>
                          <TableCell align="right">Upgrade Completions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(summary?.breakdownByPersona ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6}>
                              No persona breakdown data in this window.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (summary?.breakdownByPersona ?? []).map((row) => (
                            <TableRow key={row.key}>
                              <TableCell>{row.key}</TableCell>
                              <TableCell align="right">{row.pageViews}</TableCell>
                              <TableCell align="right">{row.authStarted}</TableCell>
                              <TableCell align="right">{row.authCompleted}</TableCell>
                              <TableCell align="right">{row.upgradeIntent}</TableCell>
                              <TableCell align="right">{row.upgradeCompleted}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Recent Events
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell>Event</TableCell>
                          <TableCell>Session</TableCell>
                          <TableCell>Properties</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(summary?.recentEvents ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4}>No events available in this window.</TableCell>
                          </TableRow>
                        ) : (
                          (summary?.recentEvents ?? []).map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
                              <TableCell>{event.eventType}</TableCell>
                              <TableCell>{event.sessionId ?? '-'}</TableCell>
                              <TableCell>{formatProperties(event.properties)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
