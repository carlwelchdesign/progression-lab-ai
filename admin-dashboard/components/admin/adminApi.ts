import type { AdminUser, ProgressionDetail, ProgressionRow } from './types';

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
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
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
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to delete progression'));
  }
}
