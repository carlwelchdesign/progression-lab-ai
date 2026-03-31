'use client';

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
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
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (lookbackDays: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchAnalyticsSummary(lookbackDays);
      setSummary(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics summary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary(days);
  }, [days, loadSummary]);

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
            </Stack>

            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                <CircularProgress />
              </Stack>
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
