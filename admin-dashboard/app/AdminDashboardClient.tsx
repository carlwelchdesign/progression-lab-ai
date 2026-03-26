'use client';

import { Alert, Container, Stack } from '@mui/material';
import DashboardHeader from '../components/admin/DashboardHeader';
import LoadingState from '../components/admin/LoadingState';
import LoginCard from '../components/admin/LoginCard';
import ProgressionDetailsDialog from '../components/admin/ProgressionDetailsDialog';
import ProgressionsTable from '../components/admin/ProgressionsTable';
import useAdminDashboard from '../components/admin/useAdminDashboard';

export default function AdminDashboardClient() {
  const {
    user,
    isSessionLoading,
    authError,
    rows,
    total,
    page,
    pageSize,
    isTableLoading,
    tableError,
    detailsOpen,
    detailsLoading,
    details,
    email,
    password,
    isSubmittingLogin,
    canDelete,
    tableLabel,
    setEmail,
    setPassword,
    setPage,
    setDetailsOpen,
    handleLogin,
    handleLogout,
    handleOpenDetails,
    handleDelete,
    handlePageSizeChange,
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

        {tableError ? <Alert severity="error">{tableError}</Alert> : null}

        <ProgressionsTable
          rows={rows}
          total={total}
          page={page}
          pageSize={pageSize}
          isLoading={isTableLoading}
          canDelete={canDelete}
          tableLabel={tableLabel}
          onView={(id) => void handleOpenDetails(id)}
          onDelete={(id) => void handleDelete(id)}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />

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
