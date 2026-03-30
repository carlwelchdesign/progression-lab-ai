'use client';

import { FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type {
  AdminUser,
  AdminLoginStatus,
  AdminProgressionFilters,
  AdminUserFilters,
  AdminUserRow,
  AdminUserSummary,
  ProgressionDetail,
  ProgressionRow,
  SubscriptionPlan,
} from './types';
import {
  deleteProgression,
  enrollAdminWebAuthn,
  fetchUsers,
  fetchProgressionDetails,
  fetchProgressions,
  fetchSession,
  login,
  logout,
  updateUserPlanOverride,
  verifyAdminWebAuthn,
} from './adminApi';

const DEFAULT_USER_FILTERS: AdminUserFilters = {
  query: '',
  role: 'ALL',
  resolvedPlan: 'ALL',
  subscriptionStatus: 'ALL',
  overrideState: 'ALL',
};

const DEFAULT_PROGRESSION_FILTERS: AdminProgressionFilters = {
  query: '',
  visibility: 'ALL',
};

export default function useAdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<AdminLoginStatus | null>(null);
  const [mfaOptions, setMfaOptions] = useState<unknown>(null);

  const [rows, setRows] = useState<ProgressionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [progressionFilters, setProgressionFilters] = useState<AdminProgressionFilters>(
    DEFAULT_PROGRESSION_FILTERS,
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  const [userRows, setUserRows] = useState<AdminUserRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userSummary, setUserSummary] = useState<AdminUserSummary>({
    totalUsers: 0,
    payingUsers: 0,
    compedUsers: 0,
    monthlyAiGenerations: 0,
  });
  const [userFilters, setUserFilters] = useState<AdminUserFilters>(DEFAULT_USER_FILTERS);
  const [userPage, setUserPage] = useState(0);
  const [userPageSize, setUserPageSize] = useState(25);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<ProgressionDetail | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const canDelete = user?.role === 'ADMIN';
  const deferredProgressionQuery = useDeferredValue(progressionFilters.query);
  const deferredUserQuery = useDeferredValue(userFilters.query);

  const effectiveProgressionFilters = useMemo(
    () => ({
      ...progressionFilters,
      query: deferredProgressionQuery.trim(),
    }),
    [deferredProgressionQuery, progressionFilters],
  );

  const effectiveUserFilters = useMemo(
    () => ({
      ...userFilters,
      query: deferredUserQuery.trim(),
    }),
    [deferredUserQuery, userFilters],
  );

  const hasActiveProgressionFilters = useMemo(
    () => progressionFilters.query.trim().length > 0 || progressionFilters.visibility !== 'ALL',
    [progressionFilters],
  );

  const hasActiveUserFilters = useMemo(
    () =>
      userFilters.query.trim().length > 0 ||
      userFilters.role !== 'ALL' ||
      userFilters.resolvedPlan !== 'ALL' ||
      userFilters.subscriptionStatus !== 'ALL' ||
      userFilters.overrideState !== 'ALL',
    [userFilters],
  );

  const tableLabel = useMemo(() => {
    if (total === 0) {
      return 'No records';
    }

    const from = page * pageSize + 1;
    const to = Math.min(total, from + rows.length - 1);
    return `${from}-${to} of ${total}`;
  }, [page, pageSize, rows.length, total]);

  const usersTableLabel = useMemo(() => {
    if (userTotal === 0) {
      return 'No users';
    }

    const from = userPage * userPageSize + 1;
    const to = Math.min(userTotal, from + userRows.length - 1);
    return `${from}-${to} of ${userTotal}`;
  }, [userPage, userPageSize, userRows.length, userTotal]);

  const loadSession = useCallback(async () => {
    setIsSessionLoading(true);
    setAuthError(null);

    try {
      const currentUser = await fetchSession();
      if (!currentUser) {
        setUser(null);
        setIsSessionLoading(false);
        return;
      }

      setUser(currentUser);
    } catch {
      setAuthError('Unable to check current session');
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  const loadProgressions = useCallback(
    async (nextPage = page, nextPageSize = pageSize) => {
      if (!user) {
        return;
      }

      setIsTableLoading(true);
      setTableError(null);

      try {
        const data = await fetchProgressions({
          page: nextPage,
          pageSize: nextPageSize,
          filters: effectiveProgressionFilters,
        });

        setRows(data.items);
        setTotal(data.total);
      } catch (error) {
        setTableError((error as Error).message);
      } finally {
        setIsTableLoading(false);
      }
    },
    [effectiveProgressionFilters, page, pageSize, user],
  );

  const loadUsers = useCallback(
    async (nextPage = userPage, nextPageSize = userPageSize) => {
      if (!user) {
        return;
      }

      setIsUsersLoading(true);
      setUsersError(null);

      try {
        const data = await fetchUsers({
          page: nextPage,
          pageSize: nextPageSize,
          filters: effectiveUserFilters,
        });
        setUserRows(data.items);
        setUserTotal(data.total);
        setUserSummary(data.summary);
      } catch (error) {
        setUsersError((error as Error).message);
      } finally {
        setIsUsersLoading(false);
      }
    },
    [effectiveUserFilters, user, userPage, userPageSize],
  );

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadProgressions();
  }, [loadProgressions, user, page, pageSize]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadUsers();
  }, [loadUsers, user, userPage, userPageSize]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingLogin(true);
    setAuthError(null);

    try {
      const result = await login({ email, password });
      setLoginStatus(result.status);

      if (result.status === 'AUTHENTICATED') {
        await loadSession();
        setPassword('');
        setMfaOptions(null);
      } else {
        setMfaOptions(result.options ?? null);
      }
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleWebAuthnAuthentication = async (
    authResponse: import('@simplewebauthn/browser').AuthenticationResponseJSON,
  ) => {
    setIsSubmittingLogin(true);
    setAuthError(null);

    try {
      const result = await verifyAdminWebAuthn({ response: authResponse });
      if (result.status === 'AUTHENTICATED') {
        await loadSession();
        setPassword('');
        setLoginStatus(null);
        setMfaOptions(null);
      }
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleWebAuthnEnrollment = async (
    regResponse: import('@simplewebauthn/browser').RegistrationResponseJSON,
    label?: string | null,
  ) => {
    setIsSubmittingLogin(true);
    setAuthError(null);

    try {
      const result = await enrollAdminWebAuthn({ response: regResponse, label });
      if (result.status === 'AUTHENTICATED') {
        await loadSession();
        setPassword('');
        setLoginStatus(null);
        setMfaOptions(null);
      }
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRows([]);
    setTotal(0);
    setProgressionFilters({ ...DEFAULT_PROGRESSION_FILTERS });
    setUserRows([]);
    setUserTotal(0);
    setUserFilters({ ...DEFAULT_USER_FILTERS });
    setUserSummary({
      totalUsers: 0,
      payingUsers: 0,
      compedUsers: 0,
      monthlyAiGenerations: 0,
    });
    setDetails(null);
    setDetailsOpen(false);
    setLoginStatus(null);
    setMfaOptions(null);
  };

  const handleOpenDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const item = await fetchProgressionDetails(id);
      setDetails(item);
    } catch (error) {
      setDetails(null);
      setTableError((error as Error).message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm('Delete this progression permanently?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteProgression(id);
      await loadProgressions();
      if (details?.id === id) {
        setDetails(null);
        setDetailsOpen(false);
      }
    } catch (error) {
      setTableError((error as Error).message);
    }
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(0);
  };

  const handleProgressionFiltersChange = (nextFilters: Partial<AdminProgressionFilters>) => {
    setProgressionFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
    setPage(0);
  };

  const handleResetProgressionFilters = () => {
    setProgressionFilters({ ...DEFAULT_PROGRESSION_FILTERS });
    setPage(0);
  };

  const handleUsersPageSizeChange = (nextPageSize: number) => {
    setUserPageSize(nextPageSize);
    setUserPage(0);
  };

  const handleUserFiltersChange = (nextFilters: Partial<AdminUserFilters>) => {
    setUserFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
    setUserPage(0);
  };

  const handleResetUserFilters = () => {
    setUserFilters({ ...DEFAULT_USER_FILTERS });
    setUserPage(0);
  };

  const handlePlanOverrideChange = async (
    targetUserId: string,
    planOverride: SubscriptionPlan | null,
  ) => {
    if (user?.role !== 'ADMIN') {
      return;
    }

    setUpdatingUserId(targetUserId);

    try {
      await updateUserPlanOverride({ userId: targetUserId, planOverride });
      await loadUsers();
    } catch (error) {
      setUsersError((error as Error).message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return {
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
  };
}
