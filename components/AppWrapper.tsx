'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import Link from 'next/link';
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
  Toolbar,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import ThemeModeToggle from './ui/ThemeModeToggle';
import { useAuth } from './providers/AuthProvider';

type Props = {
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  sectionId?: ResultSectionId;
};

const NAV_ITEMS = [
  { label: 'Generator', href: '/#generator' },
  { label: 'Suggestions', href: '/#suggestions', sectionId: 'suggestions' },
  { label: 'Progressions', href: '/#progressions', sectionId: 'progressions' },
  { label: 'Structure', href: '/#structure', sectionId: 'structure' },
] satisfies NavItem[];

const RESULT_SECTION_IDS = ['suggestions', 'progressions', 'structure'] as const;
type ResultSectionId = (typeof RESULT_SECTION_IDS)[number];

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

export default function AppWrapper({ children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [availableSections, setAvailableSections] = useState<ResultSectionId[]>([]);
  const { isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();

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

  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter(
      (item) => !item.sectionId || availableSections.includes(item.sectionId),
    );
  }, [availableSections]);

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
                src="/icon.png"
                alt="ProgressionLab.AI logo"
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
              <Button component={Link} href="/progressions?view=public" color="inherit">
                My Progressions
              </Button>
              {isLoading ? (
                <Button color="inherit" disabled sx={{ minWidth: 80 }}>
                  ...
                </Button>
              ) : isAuthenticated ? (
                <Button onClick={logout} color="inherit">
                  Logout
                </Button>
              ) : (
                <Button component={Link} href="/auth" color="inherit">
                  Login
                </Button>
              )}
              <ThemeModeToggle />
            </Box>

            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
              <ThemeModeToggle />
              <IconButton
                color="inherit"
                aria-label="Open navigation menu"
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
            <ListItemButton
              component={Link}
              href="/progressions?view=public"
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primary="My Progressions" />
            </ListItemButton>
            {isLoading ? (
              <ListItemButton disabled>
                <ListItemText primary="..." />
              </ListItemButton>
            ) : isAuthenticated ? (
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  void logout();
                }}
              >
                <ListItemText primary="Logout" />
              </ListItemButton>
            ) : (
              <ListItemButton component={Link} href="/auth" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="Login" />
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
            justifyContent: 'center',
            gap: 2,
            px: { xs: 0, sm: 2 },
          }}
        >
          <Stack direction="row" spacing={1}>
            <IconButton
              component="a"
              href="https://github.com/carlwelchdesign/progression-lab-ai"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Open Progression Lab AI GitHub repository"
              color="inherit"
            >
              <GitHubIcon />
            </IconButton>

            <IconButton
              component="a"
              href="https://www.linkedin.com/in/carlwelch/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Open Carl Welch LinkedIn profile"
              color="inherit"
            >
              <LinkedInIcon />
            </IconButton>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
