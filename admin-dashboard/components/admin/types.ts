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
