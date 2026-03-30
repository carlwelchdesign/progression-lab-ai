'use client';

import { Alert, Container, Stack, Box, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

import AdminSummaryCards from '../components/admin/AdminSummaryCards';
import DashboardHeader from '../components/admin/DashboardHeader';
import LoadingState from '../components/admin/LoadingState';
import LoginCard from '../components/admin/LoginCard';
import ProgressionDetailsDialog from '../components/admin/ProgressionDetailsDialog';
import ProgressionsTable from '../components/admin/ProgressionsTable';
import TierConfigTable from '../components/admin/TierConfigTable';
import UsersTable from '../components/admin/UsersTable';
import useAdminDashboard from '../components/admin/useAdminDashboard';

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<'overview' | 'progressions' | 'tier-config'>(
    'overview',
  );

  const {
    user,
    isSessionLoading,
    authError,
    rows,
    total,
    progressionFilters,
    page,
    pageSize,
    isTableLoading,
    tableError,
    userRows,
    userTotal,
    userSummary,
    userFilters,
    userPage,
    userPageSize,
    isUsersLoading,
    usersError,
    updatingUserId,
    detailsOpen,
    detailsLoading,
    details,
    email,
    password,
    isSubmittingLogin,
    canDelete,
    tableLabel,
    usersTableLabel,
    hasActiveProgressionFilters,
    hasActiveUserFilters,
    setEmail,
    setPassword,
    setPage,
    setUserPage,
    setDetailsOpen,
    handleLogin,
    handleLogout,
    handleOpenDetails,
    handleDelete,
    handlePageSizeChange,
    handleProgressionFiltersChange,
    handleResetProgressionFilters,
    handleUsersPageSizeChange,
    handleUserFiltersChange,
    handleResetUserFilters,
    handlePlanOverrideChange,
  } = useAdminDashboard();

  if (isSessionLoading) {
    return <LoadingState message="Loading admin session..." />;
  }

  if (!user) {
    return (
      <LoginCard
        authError={authError}
        email={email}
        password={password}
        isSubmitting={isSubmittingLogin}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <DashboardHeader user={user} onLogout={() => void handleLogout()} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) =>
              setActiveTab(newValue as 'overview' | 'progressions' | 'tier-config')
            }
          >
            <Tab label="Users & Overview" value="overview" />
            <Tab label="Progressions" value="progressions" />
            {user.role === 'ADMIN' && <Tab label="Tier Configuration" value="tier-config" />}
          </Tabs>
        </Box>

        {tableError ? <Alert severity="error">{tableError}</Alert> : null}
        {usersError ? <Alert severity="error">{usersError}</Alert> : null}

        {activeTab === 'overview' && (
          <Stack spacing={3}>
            <AdminSummaryCards summary={userSummary} />

            <UsersTable
              rows={userRows}
              total={userTotal}
              page={userPage}
              pageSize={userPageSize}
              isLoading={isUsersLoading}
              filters={userFilters}
              hasActiveFilters={hasActiveUserFilters}
              tableLabel={usersTableLabel}
              canEditPlanOverride={user.role === 'ADMIN'}
              updatingUserId={updatingUserId}
              onPageChange={setUserPage}
              onPageSizeChange={handleUsersPageSizeChange}
              onFiltersChange={handleUserFiltersChange}
              onResetFilters={handleResetUserFilters}
              onPlanOverrideChange={(userId, planOverride) =>
                void handlePlanOverrideChange(userId, planOverride)
              }
            />
          </Stack>
        )}

        {activeTab === 'progressions' && (
          <ProgressionsTable
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            isLoading={isTableLoading}
            canDelete={canDelete}
            filters={progressionFilters}
            hasActiveFilters={hasActiveProgressionFilters}
            tableLabel={tableLabel}
            onView={(id) => void handleOpenDetails(id)}
            onDelete={(id) => void handleDelete(id)}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            onFiltersChange={handleProgressionFiltersChange}
            onResetFilters={handleResetProgressionFilters}
          />
        )}

        {activeTab === 'tier-config' && user.role === 'ADMIN' && <TierConfigTable />}

        <ProgressionDetailsDialog
          open={detailsOpen}
          detailsLoading={detailsLoading}
          details={details}
          onClose={() => setDetailsOpen(false)}
        />
      </Stack>
    </Container>
  );
}
