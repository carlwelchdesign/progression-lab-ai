'use client';

import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { fetchAdminAuditLogs } from './adminApi';
import type { AdminAuditLogItem } from './types';

const DEFAULT_LOG_LIMIT = 100;

export default function AdminAuditLogTable() {
  const [rows, setRows] = useState<AdminAuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const items = await fetchAdminAuditLogs(DEFAULT_LOG_LIMIT);
      setRows(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

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
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Tier Configuration Audit Log</Typography>
        <Button variant="outlined" size="small" onClick={() => void loadLogs(true)}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Timestamp</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Updated Fields</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    No audit log entries yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{row.actorEmail}</TableCell>
                  <TableCell>{row.actorRole}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.targetId}</TableCell>
                  <TableCell>{row.updatedFields.join(', ') || 'None'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
