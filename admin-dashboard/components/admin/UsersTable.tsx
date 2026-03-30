'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import type {
  AdminUserFilters,
  AdminUserRow,
  SubscriptionPlan,
  UserOverrideFilter,
  UserResolvedPlanFilter,
  UserRoleFilter,
  UserSubscriptionStatusFilter,
} from './types';

type UsersTableProps = {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  filters: AdminUserFilters;
  hasActiveFilters: boolean;
  tableLabel: string;
  canEditPlanOverride: boolean;
  updatingUserId: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFiltersChange: (filters: Partial<AdminUserFilters>) => void;
  onResetFilters: () => void;
  onPlanOverrideChange: (userId: string, planOverride: SubscriptionPlan | null) => void;
};

const PLAN_OPTIONS: Array<SubscriptionPlan | 'NONE'> = [
  'NONE',
  'SESSION',
  'COMPOSER',
  'STUDIO',
  'COMP',
];

const ROLE_FILTER_OPTIONS: UserRoleFilter[] = ['ALL', 'ADMIN', 'AUDITOR', 'USER'];
const RESOLVED_PLAN_FILTER_OPTIONS: UserResolvedPlanFilter[] = [
  'ALL',
  'SESSION',
  'COMPOSER',
  'STUDIO',
  'COMP',
];
const SUBSCRIPTION_STATUS_FILTER_OPTIONS: UserSubscriptionStatusFilter[] = [
  'ALL',
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
  'CANCELED',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'UNPAID',
  'NONE',
];
const OVERRIDE_FILTER_OPTIONS: UserOverrideFilter[] = ['ALL', 'OVERRIDDEN', 'NONE'];

function formatFilterLabel(value: string) {
  if (value === 'ALL') {
    return 'All';
  }

  if (value === 'NONE') {
    return 'None';
  }

  return value.replaceAll('_', ' ');
}

export default function UsersTable({
  rows,
  total,
  page,
  pageSize,
  isLoading,
  filters,
  hasActiveFilters,
  tableLabel,
  canEditPlanOverride,
  updatingUserId,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  onResetFilters,
  onPlanOverrideChange,
}: UsersTableProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Typography variant="h6">Subscribers and access</Typography>
            {hasActiveFilters ? (
              <Button variant="text" onClick={onResetFilters}>
                Reset filters
              </Button>
            ) : null}
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(240px, 2fr) repeat(4, minmax(140px, 1fr))',
              },
              gap: 1.5,
            }}
          >
            <TextField
              label="Search email or name"
              size="small"
              value={filters.query}
              onChange={(event) => onFiltersChange({ query: event.target.value })}
            />
            <TextField
              select
              label="Role"
              size="small"
              value={filters.role}
              onChange={(event) => onFiltersChange({ role: event.target.value as UserRoleFilter })}
            >
              {ROLE_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {formatFilterLabel(option)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Resolved plan"
              size="small"
              value={filters.resolvedPlan}
              onChange={(event) =>
                onFiltersChange({ resolvedPlan: event.target.value as UserResolvedPlanFilter })
              }
            >
              {RESOLVED_PLAN_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {formatFilterLabel(option)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Subscription"
              size="small"
              value={filters.subscriptionStatus}
              onChange={(event) =>
                onFiltersChange({
                  subscriptionStatus: event.target.value as UserSubscriptionStatusFilter,
                })
              }
            >
              {SUBSCRIPTION_STATUS_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {formatFilterLabel(option)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Override"
              size="small"
              value={filters.overrideState}
              onChange={(event) =>
                onFiltersChange({ overrideState: event.target.value as UserOverrideFilter })
              }
            >
              {OVERRIDE_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {formatFilterLabel(option)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Resolved plan</TableCell>
                  <TableCell>Override</TableCell>
                  <TableCell>Subscription</TableCell>
                  <TableCell>AI usage</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Stack spacing={1.25}>
                        <Typography color="text.secondary">Loading users...</Typography>
                        <LinearProgress />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!isLoading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary">No users found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!isLoading
                  ? rows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography>{row.email}</Typography>
                            {row.name ? (
                              <Typography variant="body2" color="text.secondary">
                                {row.name}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.resolvedPlan}</TableCell>
                        <TableCell>
                          {canEditPlanOverride ? (
                            <Select
                              size="small"
                              value={row.planOverride ?? 'NONE'}
                              disabled={updatingUserId === row.id}
                              onChange={(event) =>
                                onPlanOverrideChange(
                                  row.id,
                                  event.target.value === 'NONE'
                                    ? null
                                    : (event.target.value as SubscriptionPlan),
                                )
                              }
                            >
                              {PLAN_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option === 'NONE' ? 'None' : option}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            (row.planOverride ?? 'None')
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography>{row.subscriptionStatus ?? 'Free / none'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.billingInterval ?? 'No interval'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {row.aiGenerationsLimit === null
                            ? `${row.aiGenerationsUsed} / unlimited`
                            : `${row.aiGenerationsUsed} / ${row.aiGenerationsLimit}`}
                        </TableCell>
                        <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  : null}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={pageSize}
            onPageChange={(_event, value) => onPageChange(value)}
            onRowsPerPageChange={(event) =>
              onPageSizeChange(Number.parseInt(event.target.value, 10))
            }
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelDisplayedRows={() => tableLabel}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
