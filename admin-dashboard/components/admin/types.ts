export type Role = 'ADMIN' | 'AUDITOR';
export type SubscriptionPlan = 'SESSION' | 'COMPOSER' | 'STUDIO' | 'COMP' | 'INVITE';
export type UserRole = 'ADMIN' | 'AUDITOR' | 'USER';

export type AdminUser = {
  id: string;
  email: string;
  role: Role;
};

export type AdminLoginStatus = 'AUTHENTICATED' | 'MFA_REQUIRED' | 'ENROLLMENT_REQUIRED';

export type AdminLoginResult = {
  status: AdminLoginStatus;
  user: AdminUser;
  options?: unknown;
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
  canUseAdvancedVoicingControls: boolean;
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

export type PromptVersion = {
  id: string;
  promptKey: string;
  versionNumber: number;
  contentTemplate: string;
  notes: string | null;
  isDraft: boolean;
  isActive: boolean;
  createdByUserId: string | null;
  createdByEmail: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromptBuilderState = {
  promptKey: string;
  keys: string[];
  active: PromptVersion | null;
  draft: PromptVersion | null;
  versions: PromptVersion[];
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

export type PlanVersion = {
  id: string;
  planId: string;
  displayName: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyStripePriceId: string | null;
  yearlyStripePriceId: string | null;
  gptModel: string;
  aiGenerationsPerMonth: number | null;
  maxSavedProgressions: number | null;
  maxSavedArrangements: number | null;
  maxPublicShares: number | null;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
  canUsePremiumAiModel: boolean;
  versionNumber: number;
  isDraft: boolean;
  isActive: boolean;
  publishedAt: string | null;
  editorEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanVersionsState = {
  planId: string;
  planIds: string[];
  active: PlanVersion | null;
  draft: PlanVersion | null;
  versions: PlanVersion[];
};

export type MarketingContentKind = 'PAGE' | 'GLOBAL_CHROME' | 'DISCOVERY_SURFACE';
export type MarketingTranslationOrigin = 'HUMAN' | 'AI_ASSISTED';

export type MarketingContentDefinition = {
  key: string;
  label: string;
  description: string;
  contentKind: MarketingContentKind;
  schemaVersion: number;
  defaultLocale: string;
  defaultContent: Record<string, unknown>;
};

export type MarketingContentVersion = {
  id: string;
  marketingContentId: string;
  contentKey: string;
  contentKind: MarketingContentKind;
  schemaVersion: number;
  locale: string;
  versionNumber: number;
  content: Record<string, unknown>;
  notes: string | null;
  isDraft: boolean;
  isActive: boolean;
  editorUserId: string | null;
  editorEmail: string | null;
  publishedAt: string | null;
  sourceVersionId: string | null;
  translationOrigin: MarketingTranslationOrigin | null;
  translationModel: string | null;
  translationGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketingContentState = {
  contentKey: string;
  locale: string;
  sourceLocale: string;
  definitions: MarketingContentDefinition[];
  supportedLocales: string[];
  active: MarketingContentVersion | null;
  draft: MarketingContentVersion | null;
  versions: MarketingContentVersion[];
  sourceActiveVersionId: string | null;
  sourceActiveVersionNumber: number | null;
  staleVersionIds: string[];
  selectedDraftIsStale: boolean;
  defaultContent: Record<string, unknown>;
};

export type MarketingContentOperationResponse = {
  item: MarketingContentVersion;
  stale?: {
    isStale: boolean;
    sourceActiveVersionId: string | null;
    sourceActiveVersionNumber: number | null;
  };
};

export type SaveMarketingContentDraftInput = {
  contentKey: string;
  locale: string;
  content: Record<string, unknown>;
  notes: string | null;
  sourceVersionId?: string | null;
  translationOrigin?: MarketingTranslationOrigin | null;
  translationModel?: string | null;
};

export type TranslateMarketingContentInput = {
  contentKey: string;
  sourceLocale: string;
  targetLocale: string;
  sourceVersionId?: string | null;
  model?: string;
};

export type PromoCodeType = 'DISCOUNT' | 'INVITE';
export type PromoRedemptionStatus = 'REDEEMED' | 'REJECTED';

export type PromoCodeRow = {
  id: string;
  code: string;
  type: PromoCodeType;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  isSingleUse: boolean;
  allowedPlans: SubscriptionPlan[];
  grantedPlan: SubscriptionPlan | null;
  inviteDurationDays: number | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePromoCodeInput = {
  code: string;
  type: PromoCodeType;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  maxRedemptions: number | null;
  isSingleUse: boolean;
  allowedPlans: SubscriptionPlan[];
  grantedPlan: SubscriptionPlan | null;
  inviteDurationDays: number | null;
  stripePromotionCodeId: string | null;
};

export type UpdatePromoCodeInput = Partial<Omit<CreatePromoCodeInput, 'code' | 'type'>>;

export type PromoCodeRedemptionRow = {
  id: string;
  userId: string;
  userEmail: string;
  status: PromoRedemptionStatus;
  redeemedAt: string;
};

export type SavePlanDraftInput = {
  planId: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyStripePriceId: string | null;
  yearlyStripePriceId: string | null;
  gptModel: string;
  aiGenerationsPerMonth: number | null;
  maxSavedProgressions: number | null;
  maxSavedArrangements: number | null;
  maxPublicShares: number | null;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
  canUsePremiumAiModel: boolean;
};

export type AnalyticsEventSummaryRow = {
  eventType: string;
  count: number;
};

export type AnalyticsRecentEvent = {
  id: string;
  eventType: string;
  sessionId: string | null;
  createdAt: string;
  properties: unknown;
};

export type AnalyticsSummary = {
  days: number;
  since: string;
  until: string;
  rangeMode: 'lookback' | 'custom';
  filters: {
    locale: string | null;
    persona: string | null;
  };
  totals: {
    totalEvents: number;
    uniqueSessions: number;
    conversionEvents: number;
  };
  funnel: {
    pageViews: number;
    authStarted: number;
    authCompleted: number;
    upgradeIntent: number;
    upgradeCompleted: number;
    authStartRateFromViews: number;
    authCompletionRateFromStarts: number;
    upgradeIntentRateFromAuthCompletion: number;
    upgradeCompletionRateFromIntent: number;
  };
  breakdownByLocale: AnalyticsFunnelBreakdownRow[];
  breakdownByPersona: AnalyticsFunnelBreakdownRow[];
  dailyFunnelTrend: AnalyticsFunnelTrendRow[];
  eventsByType: AnalyticsEventSummaryRow[];
  recentEvents: AnalyticsRecentEvent[];
};

export type AnalyticsFunnelTrendRow = {
  date: string;
  pageViews: number;
  authStarted: number;
  authCompleted: number;
  upgradeIntent: number;
  upgradeCompleted: number;
};

export type AnalyticsFunnelBreakdownRow = {
  key: string;
  pageViews: number;
  authStarted: number;
  authCompleted: number;
  upgradeIntent: number;
  upgradeCompleted: number;
  authStartRateFromViews: number;
  authCompletionRateFromStarts: number;
  upgradeIntentRateFromAuthCompletion: number;
  upgradeCompletionRateFromIntent: number;
};

export type BoardroomProductStage = 'IDEA' | 'MVP' | 'EARLY_TRACTION' | 'GROWTH' | 'SCALE';

export type BoardroomRiskTolerance = 'LOW' | 'MEDIUM' | 'HIGH';

export type BoardroomContextInput = {
  productStage?: BoardroomProductStage;
  goals?: string[];
  constraints?: string[];
  budget?: string;
  timeframe?: string;
  riskTolerance?: BoardroomRiskTolerance;
  extraNotes?: string;
};

export type RunBoardroomInput = {
  question: string;
  context?: BoardroomContextInput;
};

export type BoardroomPhaseSummary = {
  role: 'CTO' | 'CMO' | 'CFO' | 'INVESTOR' | 'OPERATOR';
  summary: string;
  keyRisks: string[];
  topTradeoffs: string[];
};

export type BoardroomRunResult = {
  decision: string;
  reasoning: string;
  keyTradeoffs: string[];
  risks: string[];
  actionPlan: string[];
  dissentingOpinions: string[];
  debate?: {
    independentSummaries: BoardroomPhaseSummary[];
    critiqueSummaries: BoardroomPhaseSummary[];
    revisionSummaries: BoardroomPhaseSummary[];
  };
};
