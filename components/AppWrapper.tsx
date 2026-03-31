'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  SvgIcon,
  Toolbar,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { fetchPublishedMarketingContent } from '../lib/marketingContentClient';
import { trackEvent } from '../lib/analytics';

import ThemeModeToggle from './ui/ThemeModeToggle';
import LanguageSwitcher from './ui/LanguageSwitcher';
import { useAuth } from './providers/AuthProvider';
import { useAuthModal } from './providers/AuthModalProvider';

type Props = {
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  sectionId?: ResultSectionId;
};

type MarketingChromeContent = {
  nav?: {
    pricingLabel?: string;
    progressionsLabel?: string;
  };
  footer?: {
    description?: string;
  };
};

const RESULT_SECTION_IDS = ['suggestions', 'progressions', 'structure'] as const;
type ResultSectionId = (typeof RESULT_SECTION_IDS)[number];
const SHOW_THEME_SWITCHER = false;

const getAvailableSections = (): ResultSectionId[] => {
  return RESULT_SECTION_IDS.filter((sectionId) => Boolean(document.getElementById(sectionId)));
};

const areSectionsEqual = (
  previousSections: ResultSectionId[],
  nextSections: ResultSectionId[],
): boolean => {
  return (
    previousSections.length === nextSections.length &&
    previousSections.every((sectionId, index) => sectionId === nextSections[index])
  );
};

function StorybookIcon() {
  return (
    <SvgIcon viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M16.71.243l-.12 2.71a.18.18 0 00.29.15l1.06-.8.9.7a.18.18 0 00.28-.14l-.1-2.76 1.33-.1a1.2 1.2 0 011.279 1.2v21.596a1.2 1.2 0 01-1.26 1.2l-16.096-.72a1.2 1.2 0 01-1.15-1.16l-.75-19.797a1.2 1.2 0 011.13-1.27L16.7.222zM13.64 9.3c0 .47 3.16.24 3.59-.08 0-3.2-1.72-4.89-4.859-4.89-3.15 0-4.899 1.72-4.899 4.29 0 4.45 5.999 4.53 5.999 6.959 0 .7-.32 1.1-1.05 1.1-.96 0-1.35-.49-1.3-2.16 0-.36-3.649-.48-3.769 0-.27 4.03 2.23 5.2 5.099 5.2 2.79 0 4.969-1.49 4.969-4.18 0-4.77-6.099-4.64-6.099-6.999 0-.97.72-1.1 1.13-1.1.45 0 1.25.07 1.19 1.87z"
      />
    </SvgIcon>
  );
}

export default function AppWrapper({ children }: Props) {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [availableSections, setAvailableSections] = useState<ResultSectionId[]>([]);
  const [marketingChromeContent, setMarketingChromeContent] =
    useState<MarketingChromeContent | null>(null);
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  const navItems = useMemo(
    () =>
      [
        { label: t('generator', { ns: 'nav' }), href: '/#generator' },
        {
          label: t('suggestions', { ns: 'nav' }),
          href: '/#suggestions',
          sectionId: 'suggestions',
        },
        {
          label: t('progressions', { ns: 'nav' }),
          href: '/#progressions',
          sectionId: 'progressions',
        },
        { label: t('structure', { ns: 'nav' }), href: '/#structure', sectionId: 'structure' },
      ] satisfies NavItem[],
    [t],
  );

  useEffect(() => {
    if (pathname !== '/') {
      setAvailableSections([]);
      return;
    }

    const syncAvailableSections = () => {
      const nextSections = getAvailableSections();
      setAvailableSections((previousSections) => {
        if (areSectionsEqual(previousSections, nextSections)) {
          return previousSections;
        }

        return nextSections;
      });
    };

    syncAvailableSections();

    let frameId: number | null = null;

    const observer = new MutationObserver(() => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        syncAvailableSections();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      observer.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    const loadMarketingChrome = async () => {
      try {
        const item = await fetchPublishedMarketingContent('global_marketing_chrome', i18n.language);
        setMarketingChromeContent((item?.content ?? null) as MarketingChromeContent | null);
      } catch {
        setMarketingChromeContent(null);
      }
    };

    void loadMarketingChrome();
  }, [i18n.language]);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => !item.sectionId || availableSections.includes(item.sectionId));
  }, [availableSections, navItems]);

  const pricingLabel =
    marketingChromeContent?.nav?.pricingLabel?.trim() || t('pricing', { ns: 'nav' });
  const progressionsLabel =
    marketingChromeContent?.nav?.progressionsLabel?.trim() || t('myProgressions', { ns: 'nav' });
  const footerDescription =
    marketingChromeContent?.footer?.description?.trim() ||
    'AI-assisted songwriting tools for harmonic exploration and arrangement planning.';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar position="fixed" color="transparent" elevation={0}>
        <Toolbar
          sx={{
            backdropFilter: 'blur(10px)',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 0, sm: 2 },
            }}
          >
            <Typography
              variant="h6"
              component={Link}
              href="/"
              sx={{ textDecoration: 'none', color: 'text.primary' }}
            >
              <Image
                src="/brand-icon.png"
                alt={t('app.brandLogoAlt', { ns: 'common' })}
                width={24}
                height={24}
                style={{ marginRight: 8, marginBottom: 2, verticalAlign: 'middle' }}
              />
              ProgressionLab.AI
            </Typography>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              {visibleNavItems.map((item) => (
                <Button key={item.label} component={Link} href={item.href} color="inherit">
                  {item.label}
                </Button>
              ))}
              <Button component={Link} href="/pricing" color="inherit">
                {pricingLabel}
              </Button>
              <Button component={Link} href="/progressions?view=public" color="inherit">
                {progressionsLabel}
              </Button>
              {isAuthenticated ? (
                <Button component={Link} href="/settings/billing" color="inherit">
                  {t('billing', { ns: 'nav' })}
                </Button>
              ) : null}
              {isAuthenticated ? (
                <Button component={Link} href="/settings/security" color="inherit">
                  {t('security', { ns: 'nav' })}
                </Button>
              ) : null}
              {isLoading ? (
                <Button color="inherit" disabled sx={{ minWidth: 80 }}>
                  {t('loadingEllipsis', { ns: 'common' })}
                </Button>
              ) : isAuthenticated ? (
                <Button onClick={logout} color="inherit">
                  {t('logout', { ns: 'nav' })}
                </Button>
              ) : (
                <Button
                  color="inherit"
                  onClick={() => {
                    trackEvent('auth_modal_opened', { intent: 'nav_cta', mode: 'login' });
                    openAuthModal({ mode: 'login' });
                  }}
                >
                  {t('login', { ns: 'nav' })}
                </Button>
              )}
              <LanguageSwitcher />
              {SHOW_THEME_SWITCHER ? <ThemeModeToggle /> : null}
            </Box>

            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
              {SHOW_THEME_SWITCHER ? <ThemeModeToggle /> : null}
              <IconButton
                color="inherit"
                aria-label={t('openNavigationMenu', { ns: 'common' })}
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }} role="presentation">
          <Box sx={{ px: 2, pb: 2 }}>
            <LanguageSwitcher fullWidth />
          </Box>
          <List>
            {visibleNavItems.map((item) => (
              <ListItemButton
                key={item.label}
                component={Link}
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            <ListItemButton component={Link} href="/pricing" onClick={() => setMobileOpen(false)}>
              <ListItemText primary={pricingLabel} />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/progressions?view=public"
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primary={progressionsLabel} />
            </ListItemButton>
            {isAuthenticated ? (
              <ListItemButton
                component={Link}
                href="/settings/billing"
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={t('billing', { ns: 'nav' })} />
              </ListItemButton>
            ) : null}
            {isAuthenticated ? (
              <ListItemButton
                component={Link}
                href="/settings/security"
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={t('security', { ns: 'nav' })} />
              </ListItemButton>
            ) : null}
            {isLoading ? (
              <ListItemButton disabled>
                <ListItemText primary={t('loadingEllipsis', { ns: 'common' })} />
              </ListItemButton>
            ) : isAuthenticated ? (
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  void logout();
                }}
              >
                <ListItemText primary={t('logout', { ns: 'nav' })} />
              </ListItemButton>
            ) : (
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  openAuthModal({ mode: 'login' });
                }}
              >
                <ListItemText primary={t('login', { ns: 'nav' })} />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>

      <Box sx={{ pt: { xs: 8, md: 9 }, flex: 1 }}>{children}</Box>

      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          py: 2,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            px: { xs: 0, sm: 2 },
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
            {footerDescription}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              component="a"
              href="https://github.com/carlwelchdesign/progression-lab-ai"
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t('app.openGithubAriaLabel', { ns: 'common' })}
              color="inherit"
            >
              <GitHubIcon />
            </IconButton>

            <IconButton
              component="a"
              href="https://www.linkedin.com/in/carlwelch/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t('app.openLinkedInAriaLabel', { ns: 'common' })}
              color="inherit"
            >
              <LinkedInIcon />
            </IconButton>

            <IconButton
              component="a"
              href="https://storybook-progression-lab-ai.vercel.app/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t('app.openStorybookAriaLabel', { ns: 'common' })}
              color="inherit"
            >
              <StorybookIcon />
            </IconButton>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
