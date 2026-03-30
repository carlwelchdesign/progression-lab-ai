'use client';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupsIcon from '@mui/icons-material/Groups';
import PaidIcon from '@mui/icons-material/Paid';
import RedeemIcon from '@mui/icons-material/Redeem';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

import type { AdminUserSummary } from './types';

type AdminSummaryCardsProps = {
  summary: AdminUserSummary;
};

const SUMMARY_ITEMS = [
  {
    key: 'totalUsers',
    label: 'Total users',
    icon: <GroupsIcon color="primary" />,
  },
  {
    key: 'payingUsers',
    label: 'Paying users',
    icon: <PaidIcon color="primary" />,
  },
  {
    key: 'compedUsers',
    label: 'Comped users',
    icon: <RedeemIcon color="primary" />,
  },
  {
    key: 'monthlyAiGenerations',
    label: 'Monthly AI generations',
    icon: <AutoAwesomeIcon color="primary" />,
  },
] as const;

export default function AdminSummaryCards({ summary }: AdminSummaryCardsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      {SUMMARY_ITEMS.map((item) => (
        <Card key={item.key} variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              {item.icon}
              <Typography color="text.secondary">{item.label}</Typography>
              <Typography variant="h4">{summary[item.key]}</Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
