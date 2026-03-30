export type Role = 'ADMIN' | 'AUDITOR';
export type SubscriptionPlan = 'SESSION' | 'COMPOSER' | 'STUDIO' | 'COMP';
export type UserRole = 'ADMIN' | 'AUDITOR' | 'USER';

export type AdminUser = {
  id: string;
  email: string;
  role: Role;
};

export type ProgressionOwner = {
  id: string;
  name: string | null;
  email: string;
};

export type ProgressionRow = {
  id: string;
  title: string;
  genre: string | null;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: ProgressionOwner;
};

export type ProgressionDetail = {
  id: string;
  title: string;
  chords: unknown;
  pianoVoicings: unknown;
  feel: string | null;
  scale: string | null;
  genre: string | null;
  notes: string | null;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: ProgressionOwner;
};

export type ProgressionVisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE';

export type AdminProgressionFilters = {
  query: string;
  visibility: ProgressionVisibilityFilter;
};

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  resolvedPlan: SubscriptionPlan;
  planOverride: SubscriptionPlan | null;
  subscriptionStatus: string | null;
  billingInterval: string | null;
  aiGenerationsUsed: number;
  aiGenerationsLimit: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserSummary = {
  totalUsers: number;
  payingUsers: number;
  compedUsers: number;
  monthlyAiGenerations: number;
};

export type SubscriptionTierConfig = {
  plan: SubscriptionPlan;
  gptModel: string;
  aiGenerationsPerMonth: number | null;
  maxSavedProgressions: number | null;
  maxSavedArrangements: number | null;
  maxPublicShares: number | null;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
};

export type AdminAuditLogItem = {
  id: string;
  actorEmail: string;
  actorRole: Role;
  action: string;
  targetType: string;
  targetId: string;
  updatedFields: string[];
  createdAt: string;
};

export type UserRoleFilter = UserRole | 'ALL';
export type UserResolvedPlanFilter = SubscriptionPlan | 'ALL';
export type UserSubscriptionStatusFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'UNPAID'
  | 'NONE';
export type UserOverrideFilter = 'ALL' | 'OVERRIDDEN' | 'NONE';

export type AdminUserFilters = {
  query: string;
  role: UserRoleFilter;
  resolvedPlan: UserResolvedPlanFilter;
  subscriptionStatus: UserSubscriptionStatusFilter;
  overrideState: UserOverrideFilter;
};
