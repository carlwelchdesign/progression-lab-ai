'use client';

import { Alert, Container, Stack, Box, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

import AdminAuditLogTable from '../components/admin/AdminAuditLogTable';
import AnalyticsInsightsPanel from '../components/admin/AnalyticsInsightsPanel';
import AdminSummaryCards from '../components/admin/AdminSummaryCards';
import DashboardHeader from '../components/admin/DashboardHeader';
import LoadingState from '../components/admin/LoadingState';
import LoginCard from '../components/admin/LoginCard';
import MarketingContentPanel from '../components/admin/MarketingContentPanel';
import ProgressionDetailsDialog from '../components/admin/ProgressionDetailsDialog';
import ProgressionsTable from '../components/admin/ProgressionsTable';
import PlanManagerPanel from '../components/admin/PlanManagerPanel';
import PromoCodesPanel from '../components/admin/PromoCodesPanel';
import PromptBuilderPanel from '../components/admin/PromptBuilderPanel';
import TierConfigTable from '../components/admin/TierConfigTable';
import UsersTable from '../components/admin/UsersTable';
import useAdminDashboard from '../components/admin/useAdminDashboard';

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'progressions'
    | 'tier-config'
    | 'prompt-builder'
    | 'marketing-content'
    | 'plan-manager'
    | 'promo-codes'
    | 'analytics'
    | 'audit-log'
  >('overview');
  const [marketingFocus, setMarketingFocus] = useState<
    { contentKey: string; locale?: string; section?: string } | undefined
  >(undefined);

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
    loginStatus,
    mfaOptions,
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
    handleWebAuthnAuthentication,
    handleWebAuthnEnrollment,
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
        loginStatus={loginStatus}
        mfaOptions={mfaOptions}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        onWebAuthnAuthentication={(resp) => void handleWebAuthnAuthentication(resp)}
        onWebAuthnEnrollment={(resp, label) => void handleWebAuthnEnrollment(resp, label)}
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
              setActiveTab(
                newValue as
                  | 'overview'
                  | 'progressions'
                  | 'tier-config'
                  | 'prompt-builder'
                  | 'marketing-content'
                  | 'plan-manager'
                  | 'promo-codes'
                  | 'analytics'
                  | 'audit-log',
              )
            }
          >
            <Tab label="Users & Overview" value="overview" />
            <Tab label="Progressions" value="progressions" />
            {user.role === 'ADMIN' && <Tab label="Tier Configuration" value="tier-config" />}
            <Tab label="Prompt Builder" value="prompt-builder" />
            <Tab label="Marketing Content" value="marketing-content" />
            {user.role === 'ADMIN' && <Tab label="Plan Manager" value="plan-manager" />}
            <Tab label="Promo &amp; Invites" value="promo-codes" />
            <Tab label="Analytics" value="analytics" />
            <Tab label="Audit Log" value="audit-log" />
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

        {activeTab === 'prompt-builder' && <PromptBuilderPanel role={user.role} />}

        {activeTab === 'marketing-content' && (
          <MarketingContentPanel
            role={user.role}
            initialContentKey={marketingFocus?.contentKey}
            initialLocale={marketingFocus?.locale}
            initialSection={marketingFocus?.section}
          />
        )}

        {activeTab === 'plan-manager' && user.role === 'ADMIN' && (
          <PlanManagerPanel role={user.role} />
        )}

        {activeTab === 'promo-codes' && <PromoCodesPanel role={user.role} />}

        {activeTab === 'analytics' && (
          <AnalyticsInsightsPanel
            onJumpToMarketing={(focus) => {
              setMarketingFocus(focus);
              setActiveTab('marketing-content');
            }}
          />
        )}

        {activeTab === 'audit-log' && <AdminAuditLogTable />}

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
