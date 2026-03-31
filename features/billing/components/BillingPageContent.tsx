'use client';

import { SubscriptionPlan } from '@prisma/client';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useAuth } from '../../../components/providers/AuthProvider';
import { useAuthModal } from '../../../components/providers/AuthModalProvider';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import { createCsrfHeaders, ensureCsrfCookie } from '../../../lib/csrfClient';

type BillingStatusResponse = {
  plan: SubscriptionPlan;
  entitlements: {
    aiGenerationsPerMonth: number | null;
    maxSavedProgressions: number | null;
    maxSavedArrangements: number | null;
    maxPublicShares: number | null;
    canExportMidi: boolean;
    canExportPdf: boolean;
    canSharePublicly: boolean;
    canUsePremiumAiModel: boolean;
    canUseVocalTrackRecording?: boolean;
    maxVocalTakesPerArrangement?: number | null;
  };
  planOverride: SubscriptionPlan | null;
  planOverrideExpiresAt: string | null;
  subscriptionStatus: string | null;
  billing: {
    stripeCustomerId: string | null;
    subscription: {
      plan: SubscriptionPlan;
      status: string;
      billingInterval: string | null;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      stripePriceId: string | null;
      stripeSubscriptionId: string | null;
    } | null;
  };
  usage: {
    aiGenerationsUsed: number;
    aiGenerationsLimit: number | null;
  };
};

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  SESSION: 'Session',
  COMPOSER: 'Composer',
  STUDIO: 'Studio',
  COMP: 'Comped',
  INVITE: 'Invite',
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'common.billing.format.notSet';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function BillingPageContent() {
  const { t } = useTranslation('common');
  const { isAuthenticated, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showError, showInfo, showSuccess } = useAppSnackbar();
  const [billingStatus, setBillingStatus] = useState<BillingStatusResponse | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isInviteRedeeming, setIsInviteRedeeming] = useState(false);

  const loadBillingStatus = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch('/api/billing/status', {
        cache: 'no-store',
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? t('billing.errors.loadStatus'));
      }

      const body = (await response.json()) as BillingStatusResponse;
      setBillingStatus(body);
    },
    [t],
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setIsPageLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadBillingStatusWithHandling = async () => {
      try {
        await loadBillingStatus(controller.signal);
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') {
          return;
        }

        showError((error as Error).message || t('billing.errors.loadStatus'));
      } finally {
        setIsPageLoading(false);
      }
    };

    void loadBillingStatusWithHandling();

    return () => controller.abort();
  }, [isAuthenticated, isLoading, loadBillingStatus, showError, t]);

  const handleRedeemInvite = async () => {
    const normalizedCode = inviteCode.trim();
    if (!normalizedCode) {
      return;
    }

    setIsInviteRedeeming(true);

    try {
      await ensureCsrfCookie();

      const response = await fetch('/api/invites/redeem', {
        method: 'POST',
        credentials: 'include',
        headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ code: normalizedCode }),
      });

      const body = (await response.json()) as {
        applied?: boolean;
        message?: string;
        expiresAt?: string;
      };

      if (!response.ok) {
        setInviteError(body.message ?? 'Unable to redeem invite code');
        return;
      }

      if (body.applied) {
        const expiresSuffix = body.expiresAt
          ? ` Expires ${new Intl.DateTimeFormat(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }).format(new Date(body.expiresAt))}.`
          : '';
        showSuccess(`Invite applied successfully.${expiresSuffix}`.trim());
        setInviteCode('');
        setInviteError('');
        await loadBillingStatus();
        return;
      }

      showInfo(body.message ?? 'Invite code was checked.');
      await loadBillingStatus();
    } catch (error) {
      showError((error as Error).message || 'Unable to redeem invite code');
    } finally {
      setIsInviteRedeeming(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);

    try {
      await ensureCsrfCookie();

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        credentials: 'include',
        headers: createCsrfHeaders(),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? t('billing.errors.openPortal'));
      }

      const body = (await response.json()) as { url?: string };
      if (!body.url) {
        throw new Error(t('billing.errors.portalUrlMissing'));
      }

      window.location.assign(body.url);
    } catch (error) {
      showError((error as Error).message || t('billing.errors.openPortal'));
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">{t('billing.loadingStatus')}</Typography>
        </Stack>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5} alignItems="flex-start">
              <Chip
                icon={<LockOutlinedIcon />}
                label={t('billing.signInRequiredChip')}
                variant="outlined"
              />
              <Typography variant="h4">{t('billing.signInRequiredTitle')}</Typography>
              <Typography color="text.secondary">
                {t('billing.signInRequiredDescription')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" onClick={() => openAuthModal({ mode: 'login' })}>
                  {t('billing.signInAction')}
                </Button>
                <Button component={Link} href="/pricing" variant="outlined">
                  {t('billing.viewPricingAction')}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!billingStatus) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Alert severity="error">{t('billing.unavailable')}</Alert>
      </Container>
    );
  }

  const aiLimit = billingStatus.usage.aiGenerationsLimit;
  const aiUsed = billingStatus.usage.aiGenerationsUsed;
  const aiProgress = aiLimit === null ? 0 : Math.min(100, Math.round((aiUsed / aiLimit) * 100));
  const planLabel = PLAN_LABELS[billingStatus.plan];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={3.5}>
        <Stack spacing={1}>
          <Typography variant="h3" component="h1">
            {t('billing.pageTitle')}
          </Typography>
          <Typography color="text.secondary">{t('billing.pageDescription')}</Typography>
        </Stack>

        {billingStatus.planOverride ? (
          <Alert severity="info">
            {t('billing.planOverride', { plan: PLAN_LABELS[billingStatus.planOverride] })}
            {billingStatus.planOverrideExpiresAt
              ? ` Expires ${new Intl.DateTimeFormat(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(billingStatus.planOverrideExpiresAt))}.`
              : ''}
          </Alert>
        ) : null}

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Redeem Invite Code</Typography>
              <Typography color="text.secondary">
                Enter an invite code to unlock temporary producer access.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  fullWidth
                  label="Invite code"
                  value={inviteCode}
                  onChange={(event) => {
                    setInviteCode(event.target.value.toUpperCase());
                    setInviteError('');
                  }}
                  placeholder="PRODUCER-XXXX"
                  error={!!inviteError}
                  helperText={inviteError || undefined}
                  inputProps={{ maxLength: 64 }}
                />
                <Button
                  variant="contained"
                  onClick={() => void handleRedeemInvite()}
                  disabled={isInviteRedeeming || !inviteCode.trim()}
                >
                  {isInviteRedeeming ? 'Redeeming...' : 'Redeem'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
            gap: 3,
          }}
        >
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h5">{t('billing.currentPlan')}</Typography>
                    <Typography color="text.secondary">{planLabel}</Typography>
                  </Box>
                  <Chip
                    icon={<CreditCardIcon />}
                    label={billingStatus.subscriptionStatus ?? t('billing.noPaidSubscription')}
                    color={billingStatus.subscriptionStatus ? 'primary' : 'default'}
                    variant="outlined"
                  />
                </Stack>

                <Stack spacing={1}>
                  <Typography fontWeight={700}>{t('billing.billingCycle')}</Typography>
                  <Typography color="text.secondary">
                    {billingStatus.billing.subscription?.billingInterval ??
                      t('billing.noPaidBillingCycle')}
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography fontWeight={700}>{t('billing.currentPeriodEnd')}</Typography>
                  <Typography color="text.secondary">
                    {t(formatDate(billingStatus.billing.subscription?.currentPeriodEnd ?? null))}
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  {billingStatus.billing.stripeCustomerId ? (
                    <Button
                      variant="contained"
                      onClick={() => void handleOpenPortal()}
                      disabled={isPortalLoading}
                    >
                      {isPortalLoading ? t('billing.openingPortal') : t('billing.manageBilling')}
                    </Button>
                  ) : (
                    <Button component={Link} href="/pricing" variant="contained">
                      {t('billing.upgradePlan')}
                    </Button>
                  )}
                  <Button component={Link} href="/pricing" variant="outlined">
                    {t('billing.comparePlans')}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoAwesomeIcon color="primary" />
                  <Typography variant="h5">{t('billing.aiUsage')}</Typography>
                </Stack>

                <Box>
                  <Typography variant="h4">
                    {aiLimit === null ? `${aiUsed}` : `${aiUsed} / ${aiLimit}`}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('billing.generationsUsedThisMonth')}
                  </Typography>
                </Box>

                {aiLimit === null ? (
                  <Alert severity="success">{t('billing.noAiHardCap')}</Alert>
                ) : (
                  <Stack spacing={1}>
                    <LinearProgress variant="determinate" value={aiProgress} />
                    <Typography color="text.secondary">
                      {t('billing.monthlyQuotaUsed', { percent: aiProgress })}
                    </Typography>
                  </Stack>
                )}

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BoltIcon fontSize="small" color="primary" />
                    <Typography fontWeight={700}>{t('billing.featureAccess')}</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {t('billing.midiExportStatus', {
                      status: billingStatus.entitlements.canExportMidi
                        ? t('billing.enabled')
                        : t('billing.locked'),
                    })}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('billing.pdfExportStatus', {
                      status: billingStatus.entitlements.canExportPdf
                        ? t('billing.enabled')
                        : t('billing.locked'),
                    })}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('billing.publicSharingStatus', {
                      status: billingStatus.entitlements.canSharePublicly
                        ? t('billing.enabled')
                        : t('billing.locked'),
                    })}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('billing.vocalRecordingStatus', {
                      status: billingStatus.entitlements.canUseVocalTrackRecording
                        ? t('billing.enabled')
                        : t('billing.locked'),
                    })}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('billing.vocalTakeLimitStatus', {
                      value:
                        billingStatus.entitlements.maxVocalTakesPerArrangement === null
                          ? t('billing.unlimited')
                          : String(billingStatus.entitlements.maxVocalTakesPerArrangement ?? 1),
                    })}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}
