'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminUser, ProgressionDetail, ProgressionRow } from './types';
import {
  deleteProgression,
  fetchProgressionDetails,
  fetchProgressions,
  fetchSession,
  login,
  logout,
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

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadProgressions();
  }, [loadProgressions, user, page, pageSize]);

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
  };
}
