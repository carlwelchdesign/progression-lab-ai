'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import Link from 'next/link';
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material';

import { useAuth } from '../../../components/providers/AuthProvider';
import { useAuthModal } from '../../../components/providers/AuthModalProvider';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import { createCsrfHeaders, ensureCsrfCookie } from '../../../lib/csrfClient';

type CheckoutPlan = 'COMPOSER' | 'STUDIO';
type BillingInterval = 'monthly' | 'yearly';

type PricingTier = {
  name: string;
  priceMonthly: string;
  priceYearly: string;
  summary: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  checkoutPlan?: CheckoutPlan;
};

const TIERS: PricingTier[] = [
  {
    name: 'Session',
    priceMonthly: '$0',
    priceYearly: '$0',
    summary: 'Try the studio with meaningful limits',
    description: 'Perfect for exploring the generator before you commit to a paid workflow.',
    features: [
      '10 AI generations per month',
      '10 saved progressions',
      '5 saved arrangements',
      '2 public shares',
      'Standard playback tools',
    ],
    cta: 'Start free',
  },
  {
    name: 'Composer',
    priceMonthly: '$9',
    priceYearly: '$90',
    summary: 'For serious songwriting sessions',
    description: 'Unlock exports, more storage, and enough AI headroom for regular use.',
    features: [
      '50 AI generations per month',
      '50 saved progressions',
      '25 saved arrangements',
      '10 public shares',
      'MIDI and PDF export',
    ],
    cta: 'Choose Composer',
    highlighted: true,
    badge: 'Most practical',
    checkoutPlan: 'COMPOSER',
  },
  {
    name: 'Studio',
    priceMonthly: '$19',
    priceYearly: '$190',
    summary: 'Maximum headroom for power users',
    description: 'Best fit when ProgressionLab is part of your daily creative stack.',
    features: [
      '200 AI generations per month',
      'Unlimited saved progressions',
      'Unlimited saved arrangements',
      'Unlimited public shares',
      'Premium AI model access',
    ],
    cta: 'Go Studio',
    checkoutPlan: 'STUDIO',
  },
];

export default function PricingPageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showError } = useAppSnackbar();
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('monthly');
  const [pendingPlan, setPendingPlan] = useState<CheckoutPlan | null>(null);

  const handleCheckout = async (plan: CheckoutPlan) => {
    if (!isAuthenticated) {
      openAuthModal({ mode: 'register' });
      return;
    }

    setPendingPlan(plan);

    try {
      await ensureCsrfCookie();

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          plan,
          interval: selectedInterval,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? 'Failed to start checkout');
      }

      const body = (await response.json()) as { url?: string };
      if (!body.url) {
        throw new Error('Checkout URL was not returned');
      }

      window.location.assign(body.url);
    } catch (error) {
      showError((error as Error).message || 'Failed to start checkout');
    } finally {
      setPendingPlan(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Stack
            spacing={2}
            alignItems="center"
            sx={{ textAlign: 'center', maxWidth: 760, width: '100%' }}
          >
            <Chip
              icon={<BoltIcon />}
              label="Subscription plans"
              color="primary"
              variant="outlined"
              sx={{ alignSelf: 'center' }}
            />
            <Typography
              variant="h3"
              component="h1"
              align="center"
              sx={{ width: '100%', textAlign: 'center' }}
            >
              Pick the plan that matches your writing pace
            </Typography>
            <Typography
              color="text.secondary"
              align="center"
              sx={{ fontSize: '1.05rem', maxWidth: 700, width: '100%', textAlign: 'center' }}
            >
              Session keeps the door open. Composer is the default paid tier. Studio is for users
              who want the highest AI headroom and no storage friction.
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Button
            variant={selectedInterval === 'monthly' ? 'contained' : 'outlined'}
            onClick={() => setSelectedInterval('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={selectedInterval === 'yearly' ? 'contained' : 'outlined'}
            onClick={() => setSelectedInterval('yearly')}
          >
            Yearly
          </Button>
        </Stack>

        {!isLoading && !isAuthenticated ? (
          <Alert severity="info">
            You can browse plans without signing in. Checkout begins after you create or sign into
            an account.
          </Alert>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            alignItems: 'stretch',
          }}
        >
          {TIERS.map((tier) => {
            const price = selectedInterval === 'monthly' ? tier.priceMonthly : tier.priceYearly;
            return (
              <Card
                key={tier.name}
                variant="outlined"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: tier.highlighted ? 'primary.main' : 'divider',
                  boxShadow: tier.highlighted ? 6 : undefined,
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5">{tier.name}</Typography>
                    {tier.badge ? (
                      <Chip
                        size="small"
                        color="primary"
                        label={tier.badge}
                        icon={tier.highlighted ? <WorkspacePremiumIcon /> : undefined}
                      />
                    ) : null}
                  </Stack>

                  <Box>
                    <Typography variant="h3">{price}</Typography>
                    <Typography color="text.secondary">
                      {selectedInterval === 'monthly' ? 'per month' : 'per year'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography fontWeight={700}>{tier.summary}</Typography>
                    <Typography color="text.secondary">{tier.description}</Typography>
                  </Box>

                  <Stack spacing={1.25}>
                    {tier.features.map((feature) => (
                      <Stack key={feature} direction="row" spacing={1.25} alignItems="flex-start">
                        <CheckCircleOutlineIcon
                          color="primary"
                          fontSize="small"
                          sx={{ mt: '2px' }}
                        />
                        <Typography color="text.secondary">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  {tier.checkoutPlan ? (
                    <Button
                      fullWidth
                      variant={tier.highlighted ? 'contained' : 'outlined'}
                      onClick={() => void handleCheckout(tier.checkoutPlan!)}
                      disabled={pendingPlan === tier.checkoutPlan}
                    >
                      {pendingPlan === tier.checkoutPlan ? 'Starting checkout...' : tier.cta}
                    </Button>
                  ) : isAuthenticated ? (
                    <Button fullWidth component={Link} href="/" variant="outlined">
                      Keep using Session
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => openAuthModal({ mode: 'register' })}
                    >
                      {tier.cta}
                    </Button>
                  )}
                </CardActions>
              </Card>
            );
          })}
        </Box>
      </Stack>
    </Container>
  );
}
