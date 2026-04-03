'use client';

import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Alert,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import AdminAuditLogTable from '../components/admin/AdminAuditLogTable';
import AiBoardroomPanel from '../components/admin/AiBoardroomPanel';
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

type AdminTabValue =
  | 'overview'
  | 'progressions'
  | 'tier-config'
  | 'prompt-builder'
  | 'marketing-content'
  | 'plan-manager'
  | 'promo-codes'
  | 'boardroom'
  | 'analytics'
  | 'audit-log';

type AdminTab = {
  value: AdminTabValue;
  label: string;
  mobileLabel?: string;
  adminOnly?: boolean;
};

const ADMIN_TABS: AdminTab[] = [
  { value: 'overview', label: 'Users & Overview' },
  { value: 'progressions', label: 'Progressions' },
  {
    value: 'tier-config',
    label: 'Tier Configuration',
    mobileLabel: 'Tier Config',
    adminOnly: true,
  },
  { value: 'prompt-builder', label: 'Prompt Builder' },
  { value: 'marketing-content', label: 'Marketing Content', mobileLabel: 'Marketing' },
  { value: 'plan-manager', label: 'Plan Manager', adminOnly: true },
  { value: 'promo-codes', label: 'Promo & Invites', mobileLabel: 'Promo & Invites' },
  { value: 'boardroom', label: 'AI Boardroom', adminOnly: true },
  { value: 'analytics', label: 'Analytics' },
  { value: 'audit-log', label: 'Audit Log' },
];

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<AdminTabValue>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    handleUsePasswordFallback,
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
        onUsePasswordFallback={handleUsePasswordFallback}
        onWebAuthnAuthentication={(resp) => void handleWebAuthnAuthentication(resp)}
        onWebAuthnEnrollment={(resp, label) => void handleWebAuthnEnrollment(resp, label)}
      />
    );
  }

  const visibleTabs = ADMIN_TABS.filter((tab) => !tab.adminOnly || user.role === 'ADMIN');
  const activeTabConfig =
    visibleTabs.find((tab) => tab.value === activeTab) ??
    visibleTabs.find((tab) => tab.value === 'overview') ??
    visibleTabs[0];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 } }}>
      <Stack spacing={3}>
        <DashboardHeader user={user} onLogout={() => void handleLogout()} />

        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 1,
            py: 0.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {activeTabConfig?.mobileLabel ?? activeTabConfig?.label}
          </Typography>
          <IconButton
            aria-label="Open admin navigation menu"
            onClick={() => setMobileNavOpen(true)}
            size="large"
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <Drawer
          anchor="right"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          PaperProps={{ 'aria-label': 'Admin navigation drawer' }}
        >
          <Box sx={{ width: 280 }} role="presentation">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 2, py: 1 }}
            >
              <Typography variant="h6">Admin Sections</Typography>
              <IconButton
                aria-label="Close admin navigation menu"
                onClick={() => setMobileNavOpen(false)}
                size="large"
              >
                <CloseIcon />
              </IconButton>
            </Stack>

            <List>
              {visibleTabs.map((tab) => (
                <ListItem key={tab.value} disablePadding>
                  <ListItemButton
                    selected={activeTab === tab.value}
                    onClick={() => {
                      setActiveTab(tab.value);
                      setMobileNavOpen(false);
                    }}
                  >
                    <ListItemText primary={tab.mobileLabel ?? tab.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: { xs: 'none', md: 'block' } }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue: AdminTabValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {visibleTabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
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

        {activeTab === 'boardroom' && user.role === 'ADMIN' && <AiBoardroomPanel />}

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
