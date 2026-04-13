'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Card,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

import {
  fetchPromoCodes,
  createPromoCode,
  updatePromoCode,
  revokePromoCode,
  fetchPromoCodeRedemptions,
} from './adminApi';
import {
  fetchPromoCodeConfig,
  generatePromoCode as generatePromoCodeFromConfig,
  type PromoCodeConfig,
} from '../../lib/promoCodeConfig';
import type { CreatePromoCodeInput, PromoCodeRow, PromoCodeRedemptionRow } from './types';

const EMPTY_FORM: CreatePromoCodeInput = {
  code: '',
  type: 'INVITE',
  isActive: true,
  startsAt: null,
  expiresAt: null,
  maxRedemptions: null,
  isSingleUse: false,
  allowedPlans: [],
  grantedPlan: 'INVITE',
  inviteDurationDays: 14,
  stripePromotionCodeId: null,
};

type Props = { role: 'ADMIN' | 'AUDITOR' };

export default function PromoCodesPanel({ role }: Props) {
  const [codes, setCodes] = useState<PromoCodeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreatePromoCodeInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<{
    forId: string;
    items: PromoCodeRedemptionRow[];
    loading: boolean;
  } | null>(null);
  const [promoConfig, setPromoConfig] = useState<PromoCodeConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCodes(await fetchPromoCodes());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const config = await fetchPromoCodeConfig();
      setPromoConfig(config);
    } catch (e) {
      console.error('Failed to load promo config:', e);
      // Fall back to defaults
      setPromoConfig({
        prefixes: 'EARLY,BETA,LAUNCH,START,PROMO,GROWTH,ACCESS',
        suffixLength: 4,
        separator: '-',
      });
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadConfig();
  }, [load, loadConfig]);

  function handleGenerateCode() {
    if (!promoConfig) return;
    try {
      const code = generatePromoCodeFromConfig(promoConfig);
      setForm((f) => ({ ...f, code }));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to generate code');
    }
  }

  async function handleCreate() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const codeToUse =
        form.code || (promoConfig ? generatePromoCodeFromConfig(promoConfig) : 'DEFAULT');
      const item = await createPromoCode({ ...form, code: codeToUse });
      setCodes((prev) => [item, ...prev]);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(row: PromoCodeRow) {
    try {
      const updated = await updatePromoCode(row.id, { isActive: !row.isActive });
      setCodes((prev) => prev.map((c) => (c.id === row.id ? updated : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  async function handleRevoke(row: PromoCodeRow) {
    if (!confirm(`Revoke code ${row.code}? This cannot be undone.`)) return;
    try {
      await revokePromoCode(row.id);
      setCodes((prev) => prev.map((c) => (c.id === row.id ? { ...c, isActive: false } : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke');
    }
  }

  async function handleViewRedemptions(row: PromoCodeRow) {
    setRedemptions({ forId: row.id, items: [], loading: true });
    try {
      const items = await fetchPromoCodeRedemptions(row.id);
      setRedemptions({ forId: row.id, items, loading: false });
    } catch {
      setRedemptions({ forId: row.id, items: [], loading: false });
    }
  }

  const isAdmin = role === 'ADMIN';

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Promo & Invite Codes</Typography>
        {isAdmin && (
          <Button variant="contained" size="small" onClick={() => setCreateOpen(true)}>
            Create Code
          </Button>
        )}
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Redemptions</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Created By</TableCell>
                {isAdmin && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {codes.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {row.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.type}
                      size="small"
                      color={row.type === 'INVITE' ? 'info' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={row.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => void handleViewRedemptions(row)}
                    >
                      {row.currentRedemptions}
                      {row.maxRedemptions != null ? ` / ${row.maxRedemptions}` : ''}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>{row.createdByEmail ?? '—'}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => void handleToggleActive(row)}>
                          {row.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        {row.isActive && (
                          <Button size="small" color="error" onClick={() => void handleRevoke(row)}>
                            Revoke
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No promo codes yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create code dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Promo Code</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {saveError ? <Alert severity="error">{saveError}</Alert> : null}
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Code (blank = auto-generate)"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                fullWidth
                size="small"
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleGenerateCode}
                disabled={!promoConfig || configLoading}
              >
                Generate
              </Button>
            </Stack>
            <TextField
              select
              label="Type"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as 'DISCOUNT' | 'INVITE' }))
              }
              size="small"
            >
              <MenuItem value="INVITE">Invite (grants access plan)</MenuItem>
              <MenuItem value="DISCOUNT">Discount (Stripe coupon)</MenuItem>
            </TextField>
            {form.type === 'DISCOUNT' && (
              <TextField
                label="Stripe Promotion Code ID"
                value={form.stripePromotionCodeId ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stripePromotionCodeId: e.target.value || null }))
                }
                size="small"
                fullWidth
                helperText="The promo_XXXX ID from the Stripe Dashboard"
              />
            )}
            {form.type === 'INVITE' && (
              <TextField
                label="Invite Duration (days)"
                type="number"
                value={form.inviteDurationDays ?? 14}
                onChange={(e) =>
                  setForm((f) => ({ ...f, inviteDurationDays: parseInt(e.target.value) || 14 }))
                }
                size="small"
                inputProps={{ min: 1, max: 365 }}
              />
            )}
            <TextField
              label="Max Redemptions (blank = unlimited)"
              type="number"
              value={form.maxRedemptions ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxRedemptions: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
              size="small"
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Expiry Date (optional)"
              type="date"
              value={form.expiresAt ? form.expiresAt.substring(0, 10) : ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isSingleUse}
                  onChange={(e) => setForm((f) => ({ ...f, isSingleUse: e.target.checked }))}
                />
              }
              label="Single-use (one redemption per user only)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleCreate()} disabled={isSaving}>
            {isSaving ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redemptions dialog */}
      <Dialog
        open={redemptions !== null}
        onClose={() => setRedemptions(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Redemptions</DialogTitle>
        <DialogContent>
          {redemptions?.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(redemptions?.items ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.userEmail}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{new Date(r.redeemedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {(redemptions?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No redemptions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedemptions(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
