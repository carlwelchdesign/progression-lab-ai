import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AdminProgressionFilters, AdminUserFilters } from '../../components/admin/types';

jest.mock('../../components/admin/useAdminDashboard', () => jest.fn());

jest.mock('../../components/admin/AnalyticsInsightsPanel', () => ({
  __esModule: true,
  default: ({
    onJumpToMarketing,
  }: {
    onJumpToMarketing?: (focus: { contentKey: string; locale?: string; section?: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onJumpToMarketing?.({
          contentKey: 'pricing',
          locale: 'fr',
          section: 'upgradeFlow',
        })
      }
    >
      Trigger Jump
    </button>
  ),
}));

jest.mock('../../components/admin/MarketingContentPanel', () => ({
  __esModule: true,
  default: ({
    initialContentKey,
    initialLocale,
    initialSection,
  }: {
    initialContentKey?: string;
    initialLocale?: string;
    initialSection?: string;
  }) => (
    <div>
      <p>Marketing Panel</p>
      <p data-testid="focus-key">{initialContentKey ?? ''}</p>
      <p data-testid="focus-locale">{initialLocale ?? ''}</p>
      <p data-testid="focus-section">{initialSection ?? ''}</p>
    </div>
  ),
}));

import AdminDashboardClient from '../AdminDashboardClient';
import useAdminDashboard from '../../components/admin/useAdminDashboard';

const mockedUseAdminDashboard = jest.mocked(useAdminDashboard);

const defaultUserFilters: AdminUserFilters = {
  query: '',
  role: 'ALL',
  resolvedPlan: 'ALL',
  subscriptionStatus: 'ALL',
  overrideState: 'ALL',
};

const defaultProgressionFilters: AdminProgressionFilters = {
  query: '',
  visibility: 'ALL',
};

const createHookState = (overrides: Partial<ReturnType<typeof useAdminDashboard>> = {}) => ({
  user: {
    id: 'user-1',
    email: 'demo@progressionlab.ai',
    role: 'ADMIN' as const,
  },
  isSessionLoading: false,
  authError: null,
  rows: [],
  total: 0,
  progressionFilters: defaultProgressionFilters,
  page: 0,
  pageSize: 25,
  isTableLoading: false,
  tableError: null,
  userRows: [],
  userTotal: 0,
  userSummary: {
    totalUsers: 0,
    payingUsers: 0,
    compedUsers: 0,
    monthlyAiGenerations: 0,
  },
  userFilters: defaultUserFilters,
  userPage: 0,
  userPageSize: 25,
  isUsersLoading: false,
  usersError: null,
  updatingUserId: null,
  detailsOpen: false,
  detailsLoading: false,
  details: null,
  email: '',
  password: '',
  isSubmittingLogin: false,
  loginStatus: 'AUTHENTICATED' as const,
  mfaOptions: null,
  canDelete: false,
  tableLabel: 'No records',
  usersTableLabel: 'No users',
  hasActiveProgressionFilters: false,
  hasActiveUserFilters: false,
  setEmail: jest.fn(),
  setPassword: jest.fn(),
  setPage: jest.fn(),
  setUserPage: jest.fn(),
  setDetailsOpen: jest.fn(),
  handleLogin: jest.fn(),
  handleLogout: jest.fn(),
  handleWebAuthnAuthentication: jest.fn(),
  handleWebAuthnEnrollment: jest.fn(),
  handleOpenDetails: jest.fn(),
  handleDelete: jest.fn(),
  handlePageSizeChange: jest.fn(),
  handleProgressionFiltersChange: jest.fn(),
  handleResetProgressionFilters: jest.fn(),
  handleUsersPageSizeChange: jest.fn(),
  handleUserFiltersChange: jest.fn(),
  handleResetUserFilters: jest.fn(),
  handlePlanOverrideChange: jest.fn(),
  ...overrides,
});

describe('AdminDashboardClient jump-to-marketing flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAdminDashboard.mockReturnValue(createHookState());
  });

  it('passes pricing focus key, locale, and section from analytics jump action', async () => {
    const user = userEvent.setup();

    render(<AdminDashboardClient />);

    await user.click(screen.getByRole('tab', { name: 'Analytics' }));
    await user.click(screen.getByRole('button', { name: 'Trigger Jump' }));

    expect(screen.getByRole('tab', { name: 'Marketing Content', selected: true })).toBeTruthy();
    expect(screen.getByTestId('focus-key').textContent).toContain('pricing');
    expect(screen.getByTestId('focus-locale').textContent).toContain('fr');
    expect(screen.getByTestId('focus-section').textContent).toContain('upgradeFlow');
  });
});
