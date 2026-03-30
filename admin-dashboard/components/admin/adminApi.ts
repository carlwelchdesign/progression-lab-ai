import type {
  AdminUser,
  AdminProgressionFilters,
  AdminUserFilters,
  AdminUserRow,
  AdminUserSummary,
  AdminAuditLogItem,
  PlanVersion,
  PlanVersionsState,
  PromptBuilderState,
  PromptVersion,
  ProgressionDetail,
  ProgressionRow,
  SavePlanDraftInput,
  SubscriptionPlan,
  SubscriptionTierConfig,
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
  filters: AdminProgressionFilters;
}): Promise<{ items: ProgressionRow[]; total: number }> {
  const searchParams = new URLSearchParams({
    page: String(params.page + 1),
    pageSize: String(params.pageSize),
    visibility: params.filters.visibility,
  });

  if (params.filters.query.trim()) {
    searchParams.set('query', params.filters.query.trim());
  }

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
  filters: AdminUserFilters;
}): Promise<{ items: AdminUserRow[]; total: number; summary: AdminUserSummary }> {
  const searchParams = new URLSearchParams({
    page: String(params.page + 1),
    pageSize: String(params.pageSize),
    role: params.filters.role,
    resolvedPlan: params.filters.resolvedPlan,
    subscriptionStatus: params.filters.subscriptionStatus,
    overrideState: params.filters.overrideState,
  });

  if (params.filters.query.trim()) {
    searchParams.set('query', params.filters.query.trim());
  }

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

export async function fetchSubscriptionTierConfigs(): Promise<SubscriptionTierConfig[]> {
  const response = await fetch('/api/subscription-tier-configs', {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch tier configurations'));
  }

  const data = (await response.json()) as { items: SubscriptionTierConfig[] };
  return data.items;
}

export async function updateSubscriptionTierConfig(
  plan: SubscriptionPlan,
  updates: Partial<Omit<SubscriptionTierConfig, 'plan'>>,
): Promise<SubscriptionTierConfig> {
  const response = await fetch(`/api/subscription-tier-configs/${plan}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Failed to update tier configuration for ${plan}`),
    );
  }

  const data = (await response.json()) as { item: SubscriptionTierConfig };
  return data.item;
}

export async function fetchAdminAuditLogs(limit = 100): Promise<AdminAuditLogItem[]> {
  const searchParams = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`/api/admin-audit-logs?${searchParams.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch admin audit logs'));
  }

  const data = (await response.json()) as { items: AdminAuditLogItem[] };
  return data.items;
}

export async function fetchPromptBuilderState(promptKey?: string): Promise<PromptBuilderState> {
  const searchParams = new URLSearchParams();
  if (promptKey) {
    searchParams.set('promptKey', promptKey);
  }

  const query = searchParams.toString();
  const response = await fetch(`/api/prompt-versions${query ? `?${query}` : ''}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch prompt versions'));
  }

  return (await response.json()) as PromptBuilderState;
}

export async function savePromptDraft(params: {
  promptKey: string;
  contentTemplate: string;
  notes?: string | null;
}): Promise<PromptVersion> {
  const response = await fetch('/api/prompt-versions', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to save prompt draft'));
  }

  const data = (await response.json()) as { item: PromptVersion };
  return data.item;
}

export async function publishPromptDraft(promptKey: string): Promise<PromptVersion> {
  const response = await fetch('/api/prompt-versions/publish', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ promptKey }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to publish prompt draft'));
  }

  const data = (await response.json()) as { item: PromptVersion };
  return data.item;
}

export async function rollbackPromptVersion(params: {
  promptKey: string;
  versionId: string;
}): Promise<PromptVersion> {
  const response = await fetch('/api/prompt-versions/rollback', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to rollback prompt version'));
  }

  const data = (await response.json()) as { item: PromptVersion };
  return data.item;
}

export async function fetchPlanVersionsState(planId?: string): Promise<PlanVersionsState> {
  const searchParams = new URLSearchParams();
  if (planId) {
    searchParams.set('planId', planId);
  }
  const query = searchParams.toString();
  const response = await fetch(`/api/subscription-plans${query ? `?${query}` : ''}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch plan versions'));
  }

  return (await response.json()) as PlanVersionsState;
}

export async function savePlanDraft(input: SavePlanDraftInput): Promise<PlanVersion> {
  const response = await fetch('/api/subscription-plans', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to save plan draft'));
  }

  const data = (await response.json()) as { item: PlanVersion };
  return data.item;
}

export async function publishPlanDraft(planId: string): Promise<PlanVersion> {
  const response = await fetch('/api/subscription-plans/publish', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ planId }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to publish plan draft'));
  }

  const data = (await response.json()) as { item: PlanVersion };
  return data.item;
}

export async function rollbackPlanVersion(params: {
  planId: string;
  versionId: string;
}): Promise<PlanVersion> {
  const response = await fetch('/api/subscription-plans/rollback', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to rollback plan version'));
  }

  const data = (await response.json()) as { item: PlanVersion };
  return data.item;
}
