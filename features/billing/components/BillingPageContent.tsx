'use client';

import { SubscriptionPlan } from '@prisma/client';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  };
  planOverride: SubscriptionPlan | null;
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
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function BillingPageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showError } = useAppSnackbar();
  const [billingStatus, setBillingStatus] = useState<BillingStatusResponse | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setIsPageLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadBillingStatus = async () => {
      try {
        const response = await fetch('/api/billing/status', {
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = (await response.json()) as { message?: string };
          throw new Error(body.message ?? 'Failed to load billing status');
        }

        const body = (await response.json()) as BillingStatusResponse;
        setBillingStatus(body);
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') {
          return;
        }

        showError((error as Error).message || 'Failed to load billing status');
      } finally {
        setIsPageLoading(false);
      }
    };

    void loadBillingStatus();

    return () => controller.abort();
  }, [isAuthenticated, isLoading, showError]);

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
        throw new Error(body.message ?? 'Failed to open billing portal');
      }

      const body = (await response.json()) as { url?: string };
      if (!body.url) {
        throw new Error('Billing portal URL was not returned');
      }

      window.location.assign(body.url);
    } catch (error) {
      showError((error as Error).message || 'Failed to open billing portal');
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading billing status...</Typography>
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
              <Chip icon={<LockOutlinedIcon />} label="Sign in required" variant="outlined" />
              <Typography variant="h4">Billing is tied to your account</Typography>
              <Typography color="text.secondary">
                Sign in to view your current plan, monthly usage, and manage your subscription.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" onClick={() => openAuthModal({ mode: 'login' })}>
                  Sign in
                </Button>
                <Button component={Link} href="/pricing" variant="outlined">
                  View pricing
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
        <Alert severity="error">Billing status is unavailable right now.</Alert>
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
            Billing and usage
          </Typography>
          <Typography color="text.secondary">
            See your current plan, monthly AI usage, and manage billing through Stripe.
          </Typography>
        </Stack>

        {billingStatus.planOverride ? (
          <Alert severity="info">
            This account has a manual plan override: {PLAN_LABELS[billingStatus.planOverride]}.
          </Alert>
        ) : null}

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
                    <Typography variant="h5">Current plan</Typography>
                    <Typography color="text.secondary">{planLabel}</Typography>
                  </Box>
                  <Chip
                    icon={<CreditCardIcon />}
                    label={billingStatus.subscriptionStatus ?? 'No paid subscription'}
                    color={billingStatus.subscriptionStatus ? 'primary' : 'default'}
                    variant="outlined"
                  />
                </Stack>

                <Stack spacing={1}>
                  <Typography fontWeight={700}>Billing cycle</Typography>
                  <Typography color="text.secondary">
                    {billingStatus.billing.subscription?.billingInterval ?? 'No paid billing cycle'}
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography fontWeight={700}>Current period end</Typography>
                  <Typography color="text.secondary">
                    {formatDate(billingStatus.billing.subscription?.currentPeriodEnd ?? null)}
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  {billingStatus.billing.stripeCustomerId ? (
                    <Button
                      variant="contained"
                      onClick={() => void handleOpenPortal()}
                      disabled={isPortalLoading}
                    >
                      {isPortalLoading ? 'Opening portal...' : 'Manage billing'}
                    </Button>
                  ) : (
                    <Button component={Link} href="/pricing" variant="contained">
                      Upgrade plan
                    </Button>
                  )}
                  <Button component={Link} href="/pricing" variant="outlined">
                    Compare plans
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
                  <Typography variant="h5">AI usage</Typography>
                </Stack>

                <Box>
                  <Typography variant="h4">
                    {aiLimit === null ? `${aiUsed}` : `${aiUsed} / ${aiLimit}`}
                  </Typography>
                  <Typography color="text.secondary">generations used this month</Typography>
                </Box>

                {aiLimit === null ? (
                  <Alert severity="success">
                    Your current plan does not enforce an AI hard cap.
                  </Alert>
                ) : (
                  <Stack spacing={1}>
                    <LinearProgress variant="determinate" value={aiProgress} />
                    <Typography color="text.secondary">
                      {aiProgress}% of monthly quota used
                    </Typography>
                  </Stack>
                )}

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BoltIcon fontSize="small" color="primary" />
                    <Typography fontWeight={700}>Feature access</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    MIDI export: {billingStatus.entitlements.canExportMidi ? 'enabled' : 'locked'}
                  </Typography>
                  <Typography color="text.secondary">
                    PDF export: {billingStatus.entitlements.canExportPdf ? 'enabled' : 'locked'}
                  </Typography>
                  <Typography color="text.secondary">
                    Public sharing:{' '}
                    {billingStatus.entitlements.canSharePublicly ? 'enabled' : 'locked'}
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
