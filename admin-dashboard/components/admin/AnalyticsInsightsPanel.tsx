'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Tooltip,
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

type MarketingFocus = {
  contentKey: string;
  locale?: string;
  section?: string;
};

type AnalyticsInsightsPanelProps = {
  onJumpToMarketing?: (focus: MarketingFocus) => void;
};

function buildSparklinePoints(values: number[]): string {
  if (values.length === 0) {
    return '';
  }

  const width = 140;
  const height = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

function getImprovementTarget(
  authCompletionRateFromStarts: number,
  upgradeCompletionRateFromIntent: number,
): string {
  if (authCompletionRateFromStarts < 50) {
    return 'auth_flow_copy';
  }

  if (upgradeCompletionRateFromIntent < 30) {
    return 'pricing';
  }

  return 'homepage';
}

type DeltaMetric = {
  current: number;
  previous: number;
  delta: number;
  percentageDelta: number | null;
};

function computeDeltaMetric(current: number, previous: number): DeltaMetric {
  const delta = current - previous;
  const percentageDelta =
    previous === 0 ? (current === 0 ? 0 : null) : Number(((delta / previous) * 100).toFixed(1));

  return {
    current,
    previous,
    delta,
    percentageDelta,
  };
}

function getDayDeltaRows(summary: AnalyticsSummary | null) {
  const trend = summary?.dailyFunnelTrend ?? [];
  if (trend.length < 2) {
    return null;
  }

  const latest = trend[trend.length - 1];
  const previous = trend[trend.length - 2];

  return {
    pageViews: computeDeltaMetric(latest.pageViews, previous.pageViews),
    authStarted: computeDeltaMetric(latest.authStarted, previous.authStarted),
    authCompleted: computeDeltaMetric(latest.authCompleted, previous.authCompleted),
    upgradeCompleted: computeDeltaMetric(latest.upgradeCompleted, previous.upgradeCompleted),
  };
}

function renderDeltaChip(label: string, metric: DeltaMetric) {
  const percentageText =
    metric.percentageDelta === null
      ? 'new'
      : `${metric.percentageDelta > 0 ? '+' : ''}${metric.percentageDelta}%`;
  const tooltipTitle = `Current: ${metric.current} | Previous: ${metric.previous}`;

  if (metric.delta === 0) {
    return (
      <Tooltip title={tooltipTitle}>
        <Chip size="small" label={`${label}: 0 (0%)`} color="default" variant="outlined" />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipTitle}>
      <Chip
        size="small"
        label={`${label}: ${metric.delta > 0 ? '+' : ''}${metric.delta} (${percentageText})`}
        color={metric.delta > 0 ? 'success' : 'error'}
        variant="outlined"
      />
    </Tooltip>
  );
}

export default function AnalyticsInsightsPanel({ onJumpToMarketing }: AnalyticsInsightsPanelProps) {
  const [days, setDays] = useState<number>(7);
  const [rangeMode, setRangeMode] = useState<'lookback' | 'custom'>('lookback');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [localeFilter, setLocaleFilter] = useState<string>('');
  const [personaFilter, setPersonaFilter] = useState<string>('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result =
        rangeMode === 'custom' && startDate && endDate
          ? await fetchAnalyticsSummary({
              startDate,
              endDate,
              locale: localeFilter || undefined,
              persona: personaFilter || undefined,
            })
          : await fetchAnalyticsSummary({
              days,
              locale: localeFilter || undefined,
              persona: personaFilter || undefined,
            });
      setSummary(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics summary');
    } finally {
      setIsLoading(false);
    }
  }, [days, endDate, localeFilter, personaFilter, rangeMode, startDate]);

  useEffect(() => {
    if (rangeMode === 'custom' && (!startDate || !endDate)) {
      setIsLoading(false);
      return;
    }
    void loadSummary();
  }, [loadSummary, rangeMode, startDate, endDate]);

  const topEvents = useMemo(() => summary?.eventsByType.slice(0, 8) ?? [], [summary?.eventsByType]);
  const sparklineSeries = useMemo(
    () => ({
      views: (summary?.dailyFunnelTrend ?? []).map((row) => row.pageViews),
      authStarts: (summary?.dailyFunnelTrend ?? []).map((row) => row.authStarted),
      authCompleted: (summary?.dailyFunnelTrend ?? []).map((row) => row.authCompleted),
      upgrades: (summary?.dailyFunnelTrend ?? []).map((row) => row.upgradeCompleted),
    }),
    [summary?.dailyFunnelTrend],
  );
  const weakestLocale = useMemo(() => {
    const rows = (summary?.breakdownByLocale ?? []).filter((row) => row.upgradeIntent > 0);
    if (rows.length === 0) {
      return null;
    }

    return [...rows].sort(
      (a, b) => a.upgradeCompletionRateFromIntent - b.upgradeCompletionRateFromIntent,
    )[0];
  }, [summary?.breakdownByLocale]);
  const weakestPersona = useMemo(() => {
    const rows = (summary?.breakdownByPersona ?? []).filter((row) => row.upgradeIntent > 0);
    if (rows.length === 0) {
      return null;
    }

    return [...rows].sort(
      (a, b) => a.upgradeCompletionRateFromIntent - b.upgradeCompletionRateFromIntent,
    )[0];
  }, [summary?.breakdownByPersona]);
  const dailyDelta = useMemo(() => getDayDeltaRows(summary), [summary]);

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

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    label="Locale filter"
                    size="small"
                    value={localeFilter}
                    onChange={(event) => setLocaleFilter(event.target.value)}
                    placeholder="e.g. en-US"
                  />
                  <TextField
                    label="Persona filter"
                    size="small"
                    value={personaFilter}
                    onChange={(event) => setPersonaFilter(event.target.value)}
                    placeholder="e.g. beginner"
                  />
                </Stack>
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
                {(summary?.filters.locale || summary?.filters.persona) && (
                  <Alert severity="info">
                    Applying filters
                    {summary?.filters.locale ? ` locale=${summary.filters.locale}` : ''}
                    {summary?.filters.persona ? ` persona=${summary.filters.persona}` : ''}
                  </Alert>
                )}

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
                      {dailyDelta ? (
                        <Box sx={{ mt: 1 }}>
                          {renderDeltaChip('DoD starts', dailyDelta.authStarted)}
                        </Box>
                      ) : null}
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
                      {dailyDelta ? (
                        <Box sx={{ mt: 1 }}>
                          {renderDeltaChip('DoD completions', dailyDelta.authCompleted)}
                        </Box>
                      ) : null}
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
                      {dailyDelta ? (
                        <Box sx={{ mt: 1 }}>
                          {renderDeltaChip('DoD upgrades', dailyDelta.upgradeCompleted)}
                        </Box>
                      ) : null}
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    gap: 2,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Lowest Pricing Completion Locale
                      </Typography>
                      {weakestLocale ? (
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <Typography variant="h6">{weakestLocale.key}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {weakestLocale.upgradeCompleted} / {weakestLocale.upgradeIntent}{' '}
                            completed from intent ({weakestLocale.upgradeCompletionRateFromIntent}%)
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              onJumpToMarketing?.({
                                contentKey: 'pricing',
                                locale:
                                  weakestLocale.key === 'unknown' ? undefined : weakestLocale.key,
                                section: 'upgradeFlow',
                              })
                            }
                          >
                            Tune pricing copy
                          </Button>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Not enough localized upgrade-intent data yet.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Lowest Pricing Completion Persona
                      </Typography>
                      {weakestPersona ? (
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <Typography variant="h6">{weakestPersona.key}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {weakestPersona.upgradeCompleted} / {weakestPersona.upgradeIntent}{' '}
                            completed from intent ({weakestPersona.upgradeCompletionRateFromIntent}
                            %)
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              onJumpToMarketing?.({
                                contentKey: 'pricing',
                                section: 'upgradeFlow',
                              })
                            }
                          >
                            Tune pricing copy
                          </Button>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Not enough persona upgrade-intent data yet.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Funnel Trend Snapshot
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                      {[
                        { label: 'Views', values: sparklineSeries.views, color: '#1e88e5' },
                        {
                          label: 'Auth Starts',
                          values: sparklineSeries.authStarts,
                          color: '#00897b',
                        },
                        {
                          label: 'Auth Completed',
                          values: sparklineSeries.authCompleted,
                          color: '#43a047',
                        },
                        {
                          label: 'Upgrades',
                          values: sparklineSeries.upgrades,
                          color: '#fb8c00',
                        },
                      ].map((item) => (
                        <Box key={item.label} sx={{ minWidth: 160 }}>
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                          {item.values.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No data
                            </Typography>
                          ) : (
                            <svg width="140" height="40" aria-label={`${item.label} trend`}>
                              <polyline
                                fill="none"
                                stroke={item.color}
                                strokeWidth="2"
                                points={buildSparklinePoints(item.values)}
                              />
                            </svg>
                          )}
                        </Box>
                      ))}
                    </Stack>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Daily Funnel Trend
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Views</TableCell>
                          <TableCell align="right">Auth Starts</TableCell>
                          <TableCell align="right">Auth Completions</TableCell>
                          <TableCell align="right">Upgrade Intent</TableCell>
                          <TableCell align="right">Upgrade Completions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(summary?.dailyFunnelTrend ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6}>No daily trend data in this window.</TableCell>
                          </TableRow>
                        ) : (
                          (summary?.dailyFunnelTrend ?? []).map((row) => (
                            <TableRow key={row.date}>
                              <TableCell>{row.date}</TableCell>
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
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(summary?.breakdownByLocale ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7}>
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
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    const contentKey = getImprovementTarget(
                                      row.authCompletionRateFromStarts,
                                      row.upgradeCompletionRateFromIntent,
                                    );
                                    onJumpToMarketing?.({
                                      contentKey,
                                      locale: row.key === 'unknown' ? undefined : row.key,
                                    });
                                  }}
                                >
                                  Improve copy
                                </Button>
                              </TableCell>
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
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(summary?.breakdownByPersona ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7}>
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
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    const contentKey = getImprovementTarget(
                                      row.authCompletionRateFromStarts,
                                      row.upgradeCompletionRateFromIntent,
                                    );
                                    onJumpToMarketing?.({ contentKey });
                                  }}
                                >
                                  Improve copy
                                </Button>
                              </TableCell>
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
