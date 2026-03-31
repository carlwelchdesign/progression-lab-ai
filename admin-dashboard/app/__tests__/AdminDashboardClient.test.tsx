import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AdminDashboardClient from '../AdminDashboardClient';
import useAdminDashboard from '../../components/admin/useAdminDashboard';
import type {
  AdminProgressionFilters,
  AdminUserFilters,
  ProgressionDetail,
  ProgressionRow,
} from '../../components/admin/types';

jest.mock('../../components/admin/useAdminDashboard', () => jest.fn());

const mockedUseAdminDashboard = jest.mocked(useAdminDashboard);

const rows: ProgressionRow[] = [
  {
    id: 'progression-1',
    title: 'Neo Soul Loop',
    genre: 'Neo Soul',
    tags: ['lush'],
    isPublic: false,
    createdAt: '2026-03-26T10:00:00.000Z',
    updatedAt: '2026-03-26T11:00:00.000Z',
    owner: {
      id: 'user-1',
      name: 'Demo Admin',
      email: 'demo@progressionlab.ai',
    },
  },
];

const details: ProgressionDetail = {
  id: 'progression-1',
  title: 'Neo Soul Loop',
  chords: ['Cmaj7', 'Am7'],
  pianoVoicings: [],
  feel: 'smooth',
  scale: 'ionian',
  genre: 'Neo Soul',
  notes: 'use soft voicings',
  tags: ['lush'],
  isPublic: false,
  createdAt: '2026-03-26T10:00:00.000Z',
  updatedAt: '2026-03-26T11:00:00.000Z',
  owner: {
    id: 'user-1',
    name: 'Demo Admin',
    email: 'demo@progressionlab.ai',
  },
};

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
  user: null,
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

describe('AdminDashboardClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the loading state while the session is being resolved', () => {
    mockedUseAdminDashboard.mockReturnValue(createHookState({ isSessionLoading: true }));

    render(<AdminDashboardClient />);

    expect(screen.getByText('Loading admin session...')).toBeInTheDocument();
  });

  it('submits login form interactions through the real login card', async () => {
    const user = userEvent.setup();
    const setEmail = jest.fn();
    const setPassword = jest.fn();
    const handleLogin = jest.fn((event: { preventDefault: () => void }) => event.preventDefault());

    mockedUseAdminDashboard.mockReturnValue(
      createHookState({
        authError: 'Invalid credentials',
        email: 'before@example.com',
        password: 'before-password',
        setEmail,
        setPassword,
        handleLogin,
      }),
    );

    render(<AdminDashboardClient />);

    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'demo@progressionlab.ai' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Admin123!ChangeMe' },
    });
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    expect(setEmail).toHaveBeenCalledWith('demo@progressionlab.ai');
    expect(setPassword).toHaveBeenCalledWith('Admin123!ChangeMe');
    expect(handleLogin).toHaveBeenCalledTimes(1);
  });

  it('wires dashboard header and table interactions through the real child components', async () => {
    const user = userEvent.setup();
    const handleLogout = jest.fn();
    const handleOpenDetails = jest.fn();
    const handleDelete = jest.fn();

    mockedUseAdminDashboard.mockReturnValue(
      createHookState({
        user: {
          id: 'user-1',
          email: 'demo@progressionlab.ai',
          role: 'ADMIN',
        },
        rows,
        total: 1,
        tableError: 'Delete failed',
        canDelete: true,
        tableLabel: '1-1 of 1',
        detailsOpen: false,
        handleLogout,
        handleOpenDetails,
        handleDelete,
      }),
    );

    render(<AdminDashboardClient />);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getAllByText('demo@progressionlab.ai')).toHaveLength(1);
    expect(screen.getByText('Delete failed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await user.click(screen.getByRole('tab', { name: 'Progressions' }));
    await user.click(screen.getByRole('button', { name: 'View' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('Neo Soul Loop')).toBeInTheDocument();
    expect(handleLogout).toHaveBeenCalledTimes(1);
    expect(handleOpenDetails).toHaveBeenCalledWith('progression-1');
    expect(handleDelete).toHaveBeenCalledWith('progression-1');
  });

  it('closes the real details dialog when the close button is clicked', async () => {
    const user = userEvent.setup();
    const setDetailsOpen = jest.fn();

    mockedUseAdminDashboard.mockReturnValue(
      createHookState({
        user: {
          id: 'user-1',
          email: 'demo@progressionlab.ai',
          role: 'ADMIN',
        },
        rows,
        total: 1,
        canDelete: true,
        tableLabel: '1-1 of 1',
        detailsOpen: true,
        details,
        setDetailsOpen,
      }),
    );

    render(<AdminDashboardClient />);

    expect(screen.getByRole('dialog', { name: 'Progression Details' })).toBeInTheDocument();
    expect(screen.getByText(/Owner:/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(setDetailsOpen).toHaveBeenCalledWith(false);
  });
});
