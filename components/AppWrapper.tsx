'use client';

import MenuIcon from '@mui/icons-material/Menu';
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
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import ThemeModeToggle from './ui/ThemeModeToggle';
import { useAuth } from '../lib/authContext';

type Props = {
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { label: 'Generator', href: '/#generator' },
  { label: 'Suggestions', href: '/#suggestions' },
  { label: 'Progressions', href: '/#progressions' },
  { label: 'Structure', href: '/#structure' },
];

export default function AppWrapper({ children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading, logout } = useAuth();

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
            <Typography
              variant="h6"
              component={Link}
              href="/"
              sx={{ textDecoration: 'none', color: 'text.primary' }}
            >
              ProgressionLab.AI
            </Typography>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              {NAV_ITEMS.map((item) => (
                <Button key={item.label} component={Link} href={item.href} color="inherit">
                  {item.label}
                </Button>
              ))}
              <Button component={Link} href="/progressions" color="inherit">
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
            {NAV_ITEMS.map((item) => (
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
              href="/progressions"
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

      <Box sx={{ pt: { xs: 8, md: 9 } }}>{children}</Box>
    </Box>
  );
}
