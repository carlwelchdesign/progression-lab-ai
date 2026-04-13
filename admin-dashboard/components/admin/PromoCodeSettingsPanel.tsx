'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState, useCallback, useEffect } from 'react';
import {
  fetchPromoCodeConfig,
  updatePromoCodeConfig,
  type PromoCodeConfig,
} from '../../lib/promoCodeConfig';

export default function PromoCodeSettingsPanel() {
  const [config, setConfig] = useState<PromoCodeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cfg = await fetchPromoCodeConfig();
      setConfig(cfg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function handleSave() {
    if (!config) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updatePromoCodeConfig({
        prefixes: config.prefixes,
        suffixLength: config.suffixLength,
        separator: config.separator,
      });
      setConfig(updated);
      setSuccess('Promo code settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save config');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return <Alert severity="error">Failed to load promo code settings</Alert>;
  }

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Promo Code Generation Settings
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize how promo codes are auto-generated. These settings allow you to tailor promo codes
        to your business domain without code changes.
      </Typography>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          fullWidth
          label="Prefixes (comma-separated)"
          value={config.prefixes}
          onChange={(e) => setConfig({ ...config, prefixes: e.target.value })}
          helperText="Examples: EARLY,BETA,LAUNCH or FOUNDER,PIONEER,CHAMPION or any business context words"
          multiline
          rows={2}
        />

        <TextField
          label="Suffix Length"
          type="number"
          value={config.suffixLength}
          onChange={(e) =>
            setConfig({ ...config, suffixLength: Math.max(1, parseInt(e.target.value) || 4) })
          }
          inputProps={{ min: 1, max: 10 }}
          helperText="Number of random characters appended (1-10)"
          sx={{ maxWidth: 200 }}
        />

        <TextField
          label="Separator"
          value={config.separator}
          onChange={(e) => setConfig({ ...config, separator: e.target.value || '-' })}
          helperText='Character between prefix and suffix (e.g., "-" creates "EARLY-ABC1")'
          sx={{ maxWidth: 200 }}
        />

        <Box>
          <Typography variant="caption" color="text.secondary">
            Preview: <code>{`${config.prefixes.split(',')[0].trim()}${config.separator}ABC1`}</code>
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Settings'}
          </Button>
          <Button variant="outlined" onClick={loadConfig} disabled={isSaving}>
            Reset
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
