'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AdminUser,
  AdminUserRow,
  AdminUserSummary,
  ProgressionDetail,
  ProgressionRow,
  SubscriptionPlan,
} from './types';
import {
  deleteProgression,
  fetchUsers,
  fetchProgressionDetails,
  fetchProgressions,
  fetchSession,
  login,
  logout,
  updateUserPlanOverride,
} from './adminApi';

export default function useAdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [rows, setRows] = useState<ProgressionRow[]>([]);
  const [total, setTotal] = useState(0);
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
        const data = await fetchProgressions({ page: nextPage, pageSize: nextPageSize });

        setRows(data.items);
        setTotal(data.total);
      } catch (error) {
        setTableError((error as Error).message);
      } finally {
        setIsTableLoading(false);
      }
    },
    [page, pageSize, user],
  );

  const loadUsers = useCallback(
    async (nextPage = userPage, nextPageSize = userPageSize) => {
      if (!user) {
        return;
      }

      setIsUsersLoading(true);
      setUsersError(null);

      try {
        const data = await fetchUsers({ page: nextPage, pageSize: nextPageSize });
        setUserRows(data.items);
        setUserTotal(data.total);
        setUserSummary(data.summary);
      } catch (error) {
        setUsersError((error as Error).message);
      } finally {
        setIsUsersLoading(false);
      }
    },
    [user, userPage, userPageSize],
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
      await login({ email, password });
      await loadSession();
      setPassword('');
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
    setUserRows([]);
    setUserTotal(0);
    setUserSummary({
      totalUsers: 0,
      payingUsers: 0,
      compedUsers: 0,
      monthlyAiGenerations: 0,
    });
    setDetails(null);
    setDetailsOpen(false);
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

  const handleUsersPageSizeChange = (nextPageSize: number) => {
    setUserPageSize(nextPageSize);
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
    page,
    pageSize,
    isTableLoading,
    tableError,
    userRows,
    userTotal,
    userSummary,
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
    handleUsersPageSizeChange,
    handlePlanOverrideChange,
  };
}
