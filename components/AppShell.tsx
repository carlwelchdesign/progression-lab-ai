'use client';

import MenuIcon from '@mui/icons-material/Menu';
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
  Toolbar,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import ThemeModeToggle from './ui/ThemeModeToggle';

type Props = {
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { label: 'Generator', href: '/#generator' },
  { label: 'Suggestions', href: '/#suggestions' },
  { label: 'Progressions', href: '/#progressions' },
  { label: 'Structure', href: '/#structure' },
];

export default function AppShell({ children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (mounted) {
          setIsAuthenticated(response.ok);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
        }
      }
    };

    loadAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    window.location.href = '/auth';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
            <Typography variant="h6" component="a" href="/" sx={{ textDecoration: 'none', color: 'text.primary' }}>
              ProgressionLab.AI
            </Typography>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              {NAV_ITEMS.map((item) => (
                <Button key={item.label} href={item.href} color="inherit">
                  {item.label}
                </Button>
              ))}
              <Button href="/progressions" color="inherit">
                My Progressions
              </Button>
              {isAuthenticated ? (
                <Button onClick={handleLogout} color="inherit">
                  Logout
                </Button>
              ) : (
                <Button href="/auth" color="inherit">
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

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <Box sx={{ width: 280, pt: 2 }} role="presentation">
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.label}
                component="a"
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            <ListItemButton component="a" href="/progressions" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="My Progressions" />
            </ListItemButton>
            {isAuthenticated ? (
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
              >
                <ListItemText primary="Logout" />
              </ListItemButton>
            ) : (
              <ListItemButton component="a" href="/auth" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="Login" />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>

      <Box sx={{ pt: { xs: 8, md: 9 } }}>{children}</Box>
    </Box>
  );
}
