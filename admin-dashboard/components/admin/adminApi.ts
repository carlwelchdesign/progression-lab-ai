import type {
  AdminLoginResult,
  AdminUser,
  AdminProgressionFilters,
  AdminUserFilters,
  AdminUserRow,
  AdminUserSummary,
  AdminAuditLogItem,
  CreatePromoCodeInput,
  RunBoardroomInput,
  BoardroomRunResult,
  BoardroomBoard,
  BoardroomBoardsResponse,
  BoardroomRunHistoryDetail,
  BoardroomRunHistoryPage,
  BoardroomPersonaSuggestion,
  MarketingContentState,
  MarketingContentOperationResponse,
  MarketingContentVersion,
  PlanVersion,
  PlanVersionsState,
  PromoCodeRedemptionRow,
  PromoCodeRow,
  PromptBuilderState,
  PromptVersion,
  ProgressionDetail,
  ProgressionRow,
  SavePlanDraftInput,
  SaveMarketingContentDraftInput,
  TranslateMarketingContentInput,
  SubscriptionPlan,
  SubscriptionTierConfig,
  UpdatePromoCodeInput,
  AnalyticsSummary,
} from './types';

import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';

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

export async function login(credentials: {
  email: string;
  password: string;
  preferPassword?: boolean;
}): Promise<AdminLoginResult> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Login failed'));
  }

  return (await response.json()) as AdminLoginResult;
}

export async function verifyAdminWebAuthn(params: {
  response: AuthenticationResponseJSON;
}): Promise<AdminLoginResult> {
  const response = await fetch('/api/auth/webauthn/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Security key verification failed'));
  }

  return (await response.json()) as AdminLoginResult;
}

export async function enrollAdminWebAuthn(params: {
  response: RegistrationResponseJSON;
  label?: string | null;
}): Promise<AdminLoginResult> {
  const response = await fetch('/api/auth/webauthn/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Security key enrollment failed'));
  }

  return (await response.json()) as AdminLoginResult;
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

export async function fetchAnalyticsSummary(params?: {
  days?: number;
  startDate?: string;
  endDate?: string;
  locale?: string;
  persona?: string;
}): Promise<AnalyticsSummary> {
  const searchParams = new URLSearchParams();
  if (typeof params?.days === 'number') {
    searchParams.set('days', String(params.days));
  } else {
    searchParams.set('days', '7');
  }
  if (params?.startDate) {
    searchParams.set('startDate', params.startDate);
  }
  if (params?.endDate) {
    searchParams.set('endDate', params.endDate);
  }
  if (params?.locale) {
    searchParams.set('locale', params.locale);
  }
  if (params?.persona) {
    searchParams.set('persona', params.persona);
  }
  const response = await fetch(`/api/analytics/summary?${searchParams.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch analytics summary'));
  }

  return (await response.json()) as AnalyticsSummary;
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

export async function fetchMarketingContentState(
  contentKey?: string,
  locale?: string,
  sourceLocale?: string,
): Promise<MarketingContentState> {
  const searchParams = new URLSearchParams();
  if (contentKey) {
    searchParams.set('contentKey', contentKey);
  }
  if (locale) {
    searchParams.set('locale', locale);
  }
  if (sourceLocale) {
    searchParams.set('sourceLocale', sourceLocale);
  }

  const query = searchParams.toString();
  const response = await fetch(`/api/marketing-content${query ? `?${query}` : ''}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch marketing content'));
  }

  return (await response.json()) as MarketingContentState;
}

export async function saveMarketingContentDraft(
  params: SaveMarketingContentDraftInput,
): Promise<MarketingContentVersion> {
  const response = await fetch('/api/marketing-content', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to save marketing content draft'));
  }

  const data = (await response.json()) as { item: MarketingContentVersion };
  return data.item;
}

export async function publishMarketingContentDraft(params: {
  contentKey: string;
  locale: string;
}): Promise<{ item: MarketingContentVersion; stale?: MarketingContentOperationResponse['stale'] }> {
  const response = await fetch('/api/marketing-content/publish', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to publish marketing content draft'));
  }

  return (await response.json()) as {
    item: MarketingContentVersion;
    stale?: MarketingContentOperationResponse['stale'];
  };
}

export async function rollbackMarketingContentVersion(params: {
  contentKey: string;
  locale: string;
  versionId: string;
}): Promise<{ item: MarketingContentVersion; stale?: MarketingContentOperationResponse['stale'] }> {
  const response = await fetch('/api/marketing-content/rollback', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Failed to rollback marketing content version'),
    );
  }

  return (await response.json()) as {
    item: MarketingContentVersion;
    stale?: MarketingContentOperationResponse['stale'];
  };
}

export async function generateMarketingContentTranslationDraft(
  params: TranslateMarketingContentInput,
): Promise<MarketingContentVersion> {
  const response = await fetch('/api/marketing-content/translate', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Failed to generate marketing content translation draft'),
    );
  }

  const data = (await response.json()) as { item: MarketingContentVersion };
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

export async function fetchPromoCodes(): Promise<PromoCodeRow[]> {
  const response = await fetch('/api/promo-codes', {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch promo codes'));
  }

  const data = (await response.json()) as { items: PromoCodeRow[] };
  return data.items;
}

export async function createPromoCode(input: CreatePromoCodeInput): Promise<PromoCodeRow> {
  const response = await fetch('/api/promo-codes', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create promo code'));
  }

  const data2 = (await response.json()) as { item: PromoCodeRow };
  return data2.item;
}

export async function updatePromoCode(
  id: string,
  updates: UpdatePromoCodeInput,
): Promise<PromoCodeRow> {
  const response = await fetch(`/api/promo-codes/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to update promo code'));
  }

  const data3 = (await response.json()) as { item: PromoCodeRow };
  return data3.item;
}

export async function revokePromoCode(id: string): Promise<void> {
  const response = await fetch(`/api/promo-codes/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: createCsrfHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to revoke promo code'));
  }
}

export async function fetchPromoCodeRedemptions(id: string): Promise<PromoCodeRedemptionRow[]> {
  const response = await fetch(`/api/promo-codes/${id}/redemptions`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch redemptions'));
  }

  const data4 = (await response.json()) as { items: PromoCodeRedemptionRow[] };
  return data4.items;
}

export async function runBoardroom(input: RunBoardroomInput): Promise<BoardroomRunResult> {
  const response = await fetch('/api/boardroom/run', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to run AI Boardroom'));
  }

  return (await response.json()) as BoardroomRunResult;
}

export async function fetchBoardroomBoards(): Promise<BoardroomBoardsResponse> {
  const response = await fetch('/api/boardroom/boards', {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch AI Boardroom boards'));
  }

  return (await response.json()) as BoardroomBoardsResponse;
}

export async function createBoardroomBoard(input: BoardroomBoard): Promise<BoardroomBoard> {
  const response = await fetch('/api/boardroom/boards', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create AI Boardroom board'));
  }

  const data = (await response.json()) as { item: BoardroomBoard };
  return data.item;
}

export async function updateBoardroomBoard(
  id: string,
  input: BoardroomBoard,
): Promise<BoardroomBoard> {
  const response = await fetch(`/api/boardroom/boards/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to update AI Boardroom board'));
  }

  const data = (await response.json()) as { item: BoardroomBoard };
  return data.item;
}

export async function deleteBoardroomBoard(id: string): Promise<void> {
  const response = await fetch(`/api/boardroom/boards/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: createCsrfHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to delete AI Boardroom board'));
  }
}

export async function fetchBoardroomRuns(params?: {
  page?: number;
  pageSize?: number;
}): Promise<BoardroomRunHistoryPage> {
  const searchParams = new URLSearchParams();
  if (params?.page) {
    searchParams.set('page', String(params.page));
  }
  if (params?.pageSize) {
    searchParams.set('pageSize', String(params.pageSize));
  }

  const query = searchParams.toString();
  const url = query ? `/api/boardroom/runs?${query}` : '/api/boardroom/runs';
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch AI Boardroom runs'));
  }

  return (await response.json()) as BoardroomRunHistoryPage;
}

export async function fetchBoardroomRun(id: string): Promise<BoardroomRunHistoryDetail> {
  const response = await fetch(`/api/boardroom/runs/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch AI Boardroom run'));
  }

  const data = (await response.json()) as { item: BoardroomRunHistoryDetail };
  return data.item;
}

export async function deleteBoardroomRun(id: string): Promise<void> {
  const response = await fetch(`/api/boardroom/runs/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: createCsrfHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to delete AI Boardroom run'));
  }
}
