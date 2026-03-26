import { act, renderHook, waitFor } from '@testing-library/react';

import useAdminDashboard from '../useAdminDashboard';
import {
  deleteProgression,
  fetchProgressionDetails,
  fetchProgressions,
  fetchSession,
  login,
  logout,
} from '../adminApi';
import type { AdminUser, ProgressionDetail, ProgressionRow } from '../types';

jest.mock('../adminApi', () => ({
  fetchSession: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  fetchProgressions: jest.fn(),
  fetchProgressionDetails: jest.fn(),
  deleteProgression: jest.fn(),
}));

const mockedFetchSession = jest.mocked(fetchSession);
const mockedLogin = jest.mocked(login);
const mockedLogout = jest.mocked(logout);
const mockedFetchProgressions = jest.mocked(fetchProgressions);
const mockedFetchProgressionDetails = jest.mocked(fetchProgressionDetails);
const mockedDeleteProgression = jest.mocked(deleteProgression);

const adminUser: AdminUser = {
  id: 'user-1',
  email: 'demo@progressionlab.ai',
  role: 'ADMIN',
};

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

const detail: ProgressionDetail = {
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

describe('useAdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchSession.mockResolvedValue(null);
    mockedFetchProgressions.mockResolvedValue({ items: [], total: 0 });
    mockedFetchProgressionDetails.mockResolvedValue(detail);
    mockedDeleteProgression.mockResolvedValue();
    mockedLogin.mockResolvedValue();
    mockedLogout.mockResolvedValue();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads the session and fetches progressions for an authenticated user', async () => {
    mockedFetchSession.mockResolvedValue(adminUser);
    mockedFetchProgressions.mockResolvedValue({ items: rows, total: 1 });

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isSessionLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.rows).toEqual(rows);
    });

    expect(result.current.user).toEqual(adminUser);
    expect(mockedFetchProgressions).toHaveBeenCalledWith({ page: 0, pageSize: 25 });
    expect(result.current.tableLabel).toBe('1-1 of 1');
  });

  it('logs in and refreshes the session state', async () => {
    mockedFetchSession.mockResolvedValueOnce(null).mockResolvedValueOnce(adminUser);
    mockedFetchProgressions.mockResolvedValue({ items: rows, total: 1 });

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isSessionLoading).toBe(false);
    });

    act(() => {
      result.current.setEmail('demo@progressionlab.ai');
      result.current.setPassword('Admin123!ChangeMe');
    });

    await act(async () => {
      await result.current.handleLogin({ preventDefault() {} } as React.FormEvent<HTMLFormElement>);
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(adminUser);
    });

    expect(mockedLogin).toHaveBeenCalledWith({
      email: 'demo@progressionlab.ai',
      password: 'Admin123!ChangeMe',
    });
    expect(result.current.password).toBe('');
  });

  it('opens details and deletes a progression when confirmed', async () => {
    mockedFetchSession.mockResolvedValue(adminUser);
    mockedFetchProgressions.mockResolvedValue({ items: rows, total: 1 });

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.user).toEqual(adminUser);
    });

    await act(async () => {
      await result.current.handleOpenDetails('progression-1');
    });

    expect(mockedFetchProgressionDetails).toHaveBeenCalledWith('progression-1');
    expect(result.current.details).toEqual(detail);
    expect(result.current.detailsOpen).toBe(true);

    await act(async () => {
      await result.current.handleDelete('progression-1');
    });

    expect(mockedDeleteProgression).toHaveBeenCalledWith('progression-1');
    expect(mockedFetchProgressions).toHaveBeenLastCalledWith({ page: 0, pageSize: 25 });
    expect(result.current.details).toBeNull();
    expect(result.current.detailsOpen).toBe(false);
  });
});
