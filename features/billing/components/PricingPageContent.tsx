'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  TextField,
  Typography,
} from '@mui/material';

import { useAuth } from '../../../components/providers/AuthProvider';
import { useAuthModal } from '../../../components/providers/AuthModalProvider';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import { createCsrfHeaders, ensureCsrfCookie } from '../../../lib/csrfClient';
import { fetchPublishedMarketingContent } from '../../../lib/marketingContentClient';

type CheckoutPlan = 'COMPOSER' | 'STUDIO';
type BillingInterval = 'monthly' | 'yearly';
type PublicPlan = 'SESSION' | 'COMPOSER' | 'STUDIO';

type PricingTierConfig = {
  planId: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyStripePriceId: string | null;
  yearlyStripePriceId: string | null;
  gptModel: string;
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

type PricingTier = {
  plan: PublicPlan;
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

type PricingMarketingContent = {
  hero?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
  planSummaries?: {
    session?: string;
    composer?: string;
    studio?: string;
  };
  comparisonIntro?: string;
  billingToggleLabel?: string;
  promoCodeLabel?: string;
  trustSection?: {
    title?: string;
    items?: string[];
  };
  faq?: {
    title?: string;
    items?: Array<{
      question?: string;
      answer?: string;
    }>;
  };
};

const TIERS: PricingTier[] = [
  {
    plan: 'SESSION',
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
    plan: 'COMPOSER',
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
    plan: 'STUDIO',
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

function formatLimit(limit: number | null, label: string) {
  return limit === null ? `Unlimited ${label}` : `${limit} ${label}`;
}

function getExportFeature(config: PricingTierConfig): string {
  if (config.canExportMidi && config.canExportPdf) {
    return 'MIDI and PDF export';
  }

  if (config.canExportMidi) {
    return 'MIDI export';
  }

  if (config.canExportPdf) {
    return 'PDF export';
  }

  return 'No export tools';
}

function getAiAccessFeature(config: PricingTierConfig): string {
  if (config.canUsePremiumAiModel) {
    return 'Premium AI model access';
  }
  const normalizedModel = config.gptModel.toLowerCase();
  const isPremiumModel =
    normalizedModel.startsWith('gpt-4') ||
    normalizedModel.startsWith('o1') ||
    normalizedModel.startsWith('o3') ||
    normalizedModel.startsWith('gpt-5');

  return isPremiumModel ? 'Premium AI model access' : 'Standard AI model access';
}

function getVocalFeature(plan: PublicPlan, config?: PricingTierConfig): string {
  if (config?.canUseVocalTrackRecording === false) {
    return 'Vocal recording unavailable';
  }

  const maxTakes =
    config?.maxVocalTakesPerArrangement ??
    (plan === 'SESSION' ? 1 : plan === 'COMPOSER' ? 4 : null);

  if (maxTakes === null) {
    return 'Unlimited vocal takes per arrangement';
  }

  return `${maxTakes} vocal take${maxTakes === 1 ? '' : 's'} per arrangement`;
}

function buildFeatures(
  plan: PublicPlan,
  baseFeatures: readonly string[],
  config?: PricingTierConfig,
): string[] {
  if (!config) {
    return [...baseFeatures, getVocalFeature(plan)];
  }

  const features = [
    formatLimit(config.aiGenerationsPerMonth, 'AI generations per month'),
    formatLimit(config.maxSavedProgressions, 'saved progressions'),
    formatLimit(config.maxSavedArrangements, 'saved arrangements'),
    config.canSharePublicly
      ? formatLimit(config.maxPublicShares, 'public shares')
      : 'Public sharing disabled',
    getExportFeature(config),
    getVocalFeature(plan, config),
    getAiAccessFeature(config),
  ];

  return features;
}

function getDefaultTierContent(t: (key: string) => string) {
  return {
    SESSION: {
      name: t('billing.pricing.tiers.session.name'),
      priceMonthly: t('billing.pricing.tiers.session.priceMonthly'),
      priceYearly: t('billing.pricing.tiers.session.priceYearly'),
      summary: t('billing.pricing.tiers.session.summary'),
      description: t('billing.pricing.tiers.session.description'),
      features: [
        t('billing.pricing.tiers.session.features.generations'),
        t('billing.pricing.tiers.session.features.savedProgressions'),
        t('billing.pricing.tiers.session.features.savedArrangements'),
        t('billing.pricing.tiers.session.features.publicShares'),
        t('billing.pricing.tiers.session.features.playbackTools'),
      ],
      cta: t('billing.pricing.tiers.session.cta'),
      badge: '',
    },
    COMPOSER: {
      name: t('billing.pricing.tiers.composer.name'),
      priceMonthly: t('billing.pricing.tiers.composer.priceMonthly'),
      priceYearly: t('billing.pricing.tiers.composer.priceYearly'),
      summary: t('billing.pricing.tiers.composer.summary'),
      description: t('billing.pricing.tiers.composer.description'),
      features: [
        t('billing.pricing.tiers.composer.features.generations'),
        t('billing.pricing.tiers.composer.features.savedProgressions'),
        t('billing.pricing.tiers.composer.features.savedArrangements'),
        t('billing.pricing.tiers.composer.features.publicShares'),
        t('billing.pricing.tiers.composer.features.exports'),
      ],
      cta: t('billing.pricing.tiers.composer.cta'),
      badge: t('billing.pricing.tiers.composer.badge'),
    },
    STUDIO: {
      name: t('billing.pricing.tiers.studio.name'),
      priceMonthly: t('billing.pricing.tiers.studio.priceMonthly'),
      priceYearly: t('billing.pricing.tiers.studio.priceYearly'),
      summary: t('billing.pricing.tiers.studio.summary'),
      description: t('billing.pricing.tiers.studio.description'),
      features: [
        t('billing.pricing.tiers.studio.features.generations'),
        t('billing.pricing.tiers.studio.features.savedProgressions'),
        t('billing.pricing.tiers.studio.features.savedArrangements'),
        t('billing.pricing.tiers.studio.features.publicShares'),
        t('billing.pricing.tiers.studio.features.premiumAi'),
      ],
      cta: t('billing.pricing.tiers.studio.cta'),
      badge: '',
    },
  } as const;
}

export default function PricingPageContent() {
  const { t, i18n } = useTranslation('common');
  const { isAuthenticated, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showError } = useAppSnackbar();
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('monthly');
  const [pendingPlan, setPendingPlan] = useState<CheckoutPlan | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [tierConfigs, setTierConfigs] = useState<Record<PublicPlan, PricingTierConfig> | null>(
    null,
  );
  const [marketingContent, setMarketingContent] = useState<PricingMarketingContent | null>(null);

  useEffect(() => {
    const loadTierConfigs = async () => {
      try {
        const response = await fetch('/api/pricing-tier-configs', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as { items: PricingTierConfig[] };
        const byPlan = body.items.reduce(
          (acc, item) => {
            acc[item.planId as PublicPlan] = item;
            return acc;
          },
          {} as Record<PublicPlan, PricingTierConfig>,
        );

        setTierConfigs(byPlan);
      } catch {
        // Keep static fallback tiers if pricing config fetch fails.
      }
    };

    void loadTierConfigs();
  }, []);

  useEffect(() => {
    const loadMarketingContent = async () => {
      try {
        const item = await fetchPublishedMarketingContent('pricing', i18n.language);
        setMarketingContent((item?.content ?? null) as PricingMarketingContent | null);
      } catch {
        setMarketingContent(null);
      }
    };

    void loadMarketingContent();
  }, [i18n.language]);

  const displayedTiers = useMemo(() => {
    const defaultsByPlan = getDefaultTierContent(t);
    return TIERS.map((tier) => {
      const defaults = defaultsByPlan[tier.plan];
      const config = tierConfigs?.[tier.plan];
      const priceMonthly =
        config?.monthlyPrice !== undefined
          ? config.monthlyPrice === 0
            ? '$0'
            : `$${config.monthlyPrice}`
          : defaults.priceMonthly;
      const priceYearly =
        config?.yearlyPrice !== undefined
          ? config.yearlyPrice === 0
            ? '$0'
            : `$${config.yearlyPrice}`
          : defaults.priceYearly;

      return {
        ...tier,
        name: config?.displayName || defaults.name,
        priceMonthly,
        priceYearly,
        summary:
          marketingContent?.planSummaries?.[
            tier.plan.toLowerCase() as 'session' | 'composer' | 'studio'
          ] ||
          config?.description ||
          defaults.summary,
        description: defaults.description,
        features: buildFeatures(tier.plan, defaults.features, config),
        cta: defaults.cta,
        badge: defaults.badge,
      };
    });
  }, [marketingContent, t, tierConfigs]);

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
          promoCode: promoCode.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        const msg = body.message ?? t('billing.errors.startCheckout');
        if (/promo/i.test(msg)) {
          setPromoError(msg);
          return;
        }
        throw new Error(msg);
      }

      const body = (await response.json()) as { url?: string };
      if (!body.url) {
        throw new Error(t('billing.errors.checkoutUrlMissing'));
      }

      window.location.assign(body.url);
    } catch (error) {
      showError((error as Error).message || t('billing.errors.startCheckout'));
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
              label={
                marketingContent?.hero?.eyebrow?.trim() ||
                t('billing.pricing.subscriptionPlansLabel')
              }
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
              {marketingContent?.hero?.title?.trim() || t('billing.pricing.pageTitle')}
            </Typography>
            <Typography
              color="text.secondary"
              align="center"
              sx={{ fontSize: '1.05rem', maxWidth: 700, width: '100%', textAlign: 'center' }}
            >
              {marketingContent?.hero?.description?.trim() || t('billing.pricing.pageDescription')}
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Button
            variant={selectedInterval === 'monthly' ? 'contained' : 'outlined'}
            onClick={() => setSelectedInterval('monthly')}
          >
            {marketingContent?.billingToggleLabel &&
            (marketingContent.billingToggleLabel as string).includes('monthly')
              ? (marketingContent.billingToggleLabel as string)
              : t('billing.pricing.monthly')}
          </Button>
          <Button
            variant={selectedInterval === 'yearly' ? 'contained' : 'outlined'}
            onClick={() => setSelectedInterval('yearly')}
          >
            {t('billing.pricing.yearly')}
          </Button>
        </Stack>

        {marketingContent?.comparisonIntro && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" align="center" sx={{ maxWidth: 600, opacity: 0.85 }}>
              {marketingContent.comparisonIntro}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <TextField
            label={marketingContent?.promoCodeLabel?.trim() || 'Promo code'}
            value={promoCode}
            onChange={(event) => {
              setPromoCode(event.target.value.toUpperCase());
              setPromoError('');
            }}
            placeholder="PRODUCER-XXXX"
            size="small"
            sx={{ width: { xs: '100%', sm: 340 } }}
            error={!!promoError}
            helperText={promoError || 'Applies to paid plans when valid'}
            inputProps={{ maxLength: 64 }}
          />
        </Box>

        {!isLoading && !isAuthenticated ? (
          <Alert severity="info">{t('billing.pricing.signInHint')}</Alert>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            alignItems: 'stretch',
          }}
        >
          {displayedTiers.map((tier) => {
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
                      {selectedInterval === 'monthly'
                        ? t('billing.pricing.perMonth')
                        : t('billing.pricing.perYear')}
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
                      {pendingPlan === tier.checkoutPlan
                        ? t('billing.pricing.startingCheckout')
                        : tier.cta}
                    </Button>
                  ) : isAuthenticated ? (
                    <Button fullWidth component={Link} href="/" variant="outlined">
                      {t('billing.pricing.keepUsingSession')}
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

        {/* Trust Section */}
        {marketingContent?.trustSection && (
          <Box
            sx={{
              py: 4,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Stack spacing={3} alignItems="center">
              {marketingContent.trustSection.title && (
                <Typography
                  variant="h6"
                  align="center"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {marketingContent.trustSection.title}
                </Typography>
              )}
              {marketingContent.trustSection.items &&
                marketingContent.trustSection.items.length > 0 && (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                      flexWrap: 'wrap',
                    }}
                  >
                    {marketingContent.trustSection.items.map((item, idx) => (
                      <Typography key={idx} variant="body2" sx={{ opacity: 0.7 }}>
                        {item}
                        {idx < marketingContent.trustSection!.items!.length - 1 && (
                          <span style={{ margin: '0 1rem', opacity: 0.3 }}>•</span>
                        )}
                      </Typography>
                    ))}
                  </Stack>
                )}
            </Stack>
          </Box>
        )}

        {/* FAQ Section */}
        {marketingContent?.faq && (
          <Box
            sx={{
              py: 4,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Stack spacing={4}>
              {marketingContent.faq.title && (
                <Typography
                  variant="h5"
                  align="center"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {marketingContent.faq.title}
                </Typography>
              )}
              {marketingContent.faq.items && marketingContent.faq.items.length > 0 && (
                <Stack spacing={2}>
                  {marketingContent.faq.items.map((faqItem, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                      }}
                    >
                      {faqItem.question && (
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                          }}
                        >
                          {faqItem.question}
                        </Typography>
                      )}
                      {faqItem.answer && (
                        <Typography
                          variant="body2"
                          sx={{
                            lineHeight: 1.6,
                            opacity: 0.85,
                          }}
                        >
                          {faqItem.answer}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
