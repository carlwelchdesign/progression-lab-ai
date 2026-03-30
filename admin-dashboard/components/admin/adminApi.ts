import type {
  AdminUser,
  AdminUserRow,
  AdminUserSummary,
  ProgressionDetail,
  ProgressionRow,
  SubscriptionPlan,
} from './types';

import { createCsrfHeaders } from '../../lib/csrfClient';

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchSession(): Promise<AdminUser | null> {
  const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { user: AdminUser };
  return data.user;
}

export async function login(credentials: { email: string; password: string }): Promise<void> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Login failed'));
  }
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders(),
  });
}

export async function fetchProgressions(params: {
  page: number;
  pageSize: number;
}): Promise<{ items: ProgressionRow[]; total: number }> {
  const searchParams = new URLSearchParams({
    page: String(params.page + 1),
    pageSize: String(params.pageSize),
  });

  const response = await fetch(`/api/progressions?${searchParams.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch progressions'));
  }

  return (await response.json()) as {
    items: ProgressionRow[];
    total: number;
  };
}

export async function fetchProgressionDetails(id: string): Promise<ProgressionDetail> {
  const response = await fetch(`/api/progressions/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch progression details'));
  }

  const data = (await response.json()) as { item: ProgressionDetail };
  return data.item;
}

export async function deleteProgression(id: string): Promise<void> {
  const response = await fetch(`/api/progressions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: createCsrfHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to delete progression'));
  }
}

export async function fetchUsers(params: {
  page: number;
  pageSize: number;
}): Promise<{ items: AdminUserRow[]; total: number; summary: AdminUserSummary }> {
  const searchParams = new URLSearchParams({
    page: String(params.page + 1),
    pageSize: String(params.pageSize),
  });

  const response = await fetch(`/api/users?${searchParams.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch users'));
  }

  return (await response.json()) as {
    items: AdminUserRow[];
    total: number;
    summary: AdminUserSummary;
  };
}

export async function updateUserPlanOverride(params: {
  userId: string;
  planOverride: SubscriptionPlan | null;
}): Promise<void> {
  const response = await fetch(`/api/users/${params.userId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ planOverride: params.planOverride }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to update plan override'));
  }
}
