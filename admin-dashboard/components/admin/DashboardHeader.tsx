'use client';

import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import type { AdminUser } from './types';

type DashboardHeaderProps = {
  user: AdminUser;
  onLogout: () => void;
};

export default function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip label={user.role} color={user.role === 'ADMIN' ? 'primary' : 'default'} />
          <Chip label={user.email} variant="outlined" />
        </Stack>
        {user.role === 'AUDITOR' ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            View-only mode. Sensitive fields are masked and delete is disabled.
          </Typography>
        ) : null}
      </Box>
      <Button variant="outlined" onClick={onLogout}>
        Logout
      </Button>
    </Box>
  );
}
