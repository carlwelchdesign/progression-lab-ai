'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

type Role = 'ADMIN' | 'AUDITOR';

type AdminUser = {
  id: string;
  email: string;
  role: Role;
};

type ProgressionRow = {
  id: string;
  title: string;
  genre: string | null;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
};

type ProgressionDetail = {
  id: string;
  title: string;
  chords: unknown;
  pianoVoicings: unknown;
  feel: string | null;
  scale: string | null;
  genre: string | null;
  notes: string | null;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
};

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export default function AdminDashboardClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [rows, setRows] = useState<ProgressionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<ProgressionDetail | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const canDelete = user?.role === 'ADMIN';

  const tableLabel = useMemo(() => {
    if (total === 0) {
      return 'No records';
    }

    const from = page * pageSize + 1;
    const to = Math.min(total, from + rows.length - 1);
    return `${from}-${to} of ${total}`;
  }, [page, pageSize, rows.length, total]);

  const loadSession = async () => {
    setIsSessionLoading(true);
    setAuthError(null);

    try {
      const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) {
        setUser(null);
        setIsSessionLoading(false);
        return;
      }

      const data = (await response.json()) as { user: AdminUser };
      setUser(data.user);
    } catch {
      setAuthError('Unable to check current session');
    } finally {
      setIsSessionLoading(false);
    }
  };

  const loadProgressions = useCallback(
    async (nextPage = page, nextPageSize = pageSize) => {
      if (!user) {
        return;
      }

      setIsTableLoading(true);
      setTableError(null);

      try {
        const searchParams = new URLSearchParams({
          page: String(nextPage + 1),
          pageSize: String(nextPageSize),
        });

        const response = await fetch(`/api/progressions?${searchParams.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response, 'Failed to fetch progressions'));
        }

        const data = (await response.json()) as {
          items: ProgressionRow[];
          total: number;
        };

        setRows(data.items);
        setTotal(data.total);
      } catch (error) {
        setTableError((error as Error).message);
      } finally {
        setIsTableLoading(false);
      }
    },
    [page, pageSize, user],
  );

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadProgressions();
  }, [loadProgressions, user, page, pageSize]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingLogin(true);
    setAuthError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Login failed'));
      }

      await loadSession();
      setPassword('');
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setRows([]);
    setDetails(null);
    setDetailsOpen(false);
  };

  const handleOpenDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const response = await fetch(`/api/progressions/${id}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to fetch progression details'));
      }

      const data = (await response.json()) as { item: ProgressionDetail };
      setDetails(data.item);
    } catch (error) {
      setDetails(null);
      setTableError((error as Error).message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm('Delete this progression permanently?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/progressions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to delete progression'));
      }

      await loadProgressions();
      if (details?.id === id) {
        setDetails(null);
        setDetailsOpen(false);
      }
    } catch (error) {
      setTableError((error as Error).message);
    }
  };

  if (isSessionLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading admin session...</Typography>
        </Stack>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3} component="form" onSubmit={handleLogin}>
              <Box>
                <Typography variant="h4" component="h1">
                  ProgressionLab Admin
                </Typography>
                <Typography color="text.secondary">
                  Sign in with an ADMIN or AUDITOR account.
                </Typography>
              </Box>

              {authError ? <Alert severity="error">{authError}</Alert> : null}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <Button type="submit" variant="contained" disabled={isSubmittingLogin}>
                {isSubmittingLogin ? 'Signing in...' : 'Sign in'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="h4" component="h1">
              Admin Dashboard
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label={user.role} color={user.role === 'ADMIN' ? 'primary' : 'default'} />
              <Chip label={user.email} variant="outlined" />
            </Stack>
            {user.role === 'AUDITOR' ? (
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                View-only mode. Sensitive fields are masked and delete is disabled.
              </Typography>
            ) : null}
          </Box>
          <Button variant="outlined" onClick={() => void handleLogout()}>
            Logout
          </Button>
        </Box>

        {tableError ? <Alert severity="error">{tableError}</Alert> : null}

        <Card variant="outlined">
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Genre</TableCell>
                    <TableCell>Tags</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isTableLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={16} />
                          <Typography color="text.secondary">Loading data...</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isTableLoading && rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color="text.secondary">No progressions found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isTableLoading
                    ? rows.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.title}</TableCell>
                          <TableCell>{row.owner.email}</TableCell>
                          <TableCell>{row.genre ?? 'N/A'}</TableCell>
                          <TableCell>{row.tags.join(', ') || 'None'}</TableCell>
                          <TableCell>{new Date(row.updatedAt).toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => void handleOpenDetails(row.id)}
                              >
                                View
                              </Button>
                              {canDelete ? (
                                <Button
                                  size="small"
                                  color="error"
                                  variant="contained"
                                  onClick={() => void handleDelete(row.id)}
                                >
                                  Delete
                                </Button>
                              ) : null}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={pageSize}
              onPageChange={(_event, value) => setPage(value)}
              onRowsPerPageChange={(event) => {
                setPageSize(Number.parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelDisplayedRows={() => tableLabel}
            />
          </CardContent>
        </Card>

        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Progression Details</DialogTitle>
          <DialogContent dividers>
            {detailsLoading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography color="text.secondary">Loading details...</Typography>
              </Stack>
            ) : details ? (
              <Stack spacing={2}>
                <Typography variant="h6">{details.title}</Typography>
                <Typography>
                  <strong>Owner:</strong> {details.owner.name ?? 'Unknown'} ({details.owner.email})
                </Typography>
                <Typography>
                  <strong>Genre:</strong> {details.genre ?? 'N/A'}
                </Typography>
                <Typography>
                  <strong>Scale:</strong> {details.scale ?? 'N/A'}
                </Typography>
                <Typography>
                  <strong>Feel:</strong> {details.feel ?? 'N/A'}
                </Typography>
                <Typography>
                  <strong>Public:</strong> {details.isPublic ? 'Yes' : 'No'}
                </Typography>
                <Typography>
                  <strong>Tags:</strong> {details.tags.join(', ') || 'None'}
                </Typography>
                <Typography>
                  <strong>Notes:</strong> {details.notes || 'No notes'}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    overflowX: 'auto',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                    fontSize: 12,
                  }}
                >
                  {JSON.stringify(details.chords, null, 2)}
                </Box>
              </Stack>
            ) : (
              <Typography color="text.secondary">No details available.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}
