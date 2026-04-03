-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AUDITOR', 'USER');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('SESSION', 'COMPOSER', 'STUDIO', 'COMP', 'INVITE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "UsageEventType" AS ENUM ('AI_GENERATION', 'MIDI_EXPORT', 'PDF_EXPORT');

-- CreateEnum
CREATE TYPE "PromoCodeType" AS ENUM ('DISCOUNT', 'INVITE');

-- CreateEnum
CREATE TYPE "PromoRedemptionStatus" AS ENUM ('REDEEMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MfaPolicy" AS ENUM ('NONE', 'OPTIONAL', 'REQUIRED_ADMIN');

-- CreateEnum
CREATE TYPE "MfaEnrollmentState" AS ENUM ('NONE', 'PENDING', 'ACTIVE');

-- CreateEnum
CREATE TYPE "WebAuthnFlowType" AS ENUM ('CUSTOMER_REGISTRATION', 'ADMIN_AUTHENTICATION', 'ADMIN_BOOTSTRAP_REGISTRATION');

-- CreateEnum
CREATE TYPE "MarketingContentKind" AS ENUM ('PAGE', 'GLOBAL_CHROME', 'DISCOVERY_SURFACE');

-- CreateEnum
CREATE TYPE "MarketingTranslationOrigin" AS ENUM ('HUMAN', 'AI_ASSISTED');

-- CreateEnum
CREATE TYPE "BoardroomModelClass" AS ENUM ('SMALL', 'LARGE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "stripeCustomerId" TEXT,
    "planOverride" "SubscriptionPlan",
    "planOverrideExpiresAt" TIMESTAMP(3),
    "mfaPolicy" "MfaPolicy" NOT NULL DEFAULT 'NONE',
    "mfaEnrollmentState" "MfaEnrollmentState" NOT NULL DEFAULT 'NONE',
    "mfaEnabledAt" TIMESTAMP(3),
    "lastMfaVerifiedAt" TIMESTAMP(3),
    "mfaBypassUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardroomBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardroomBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardroomBoardMember" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "personaLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priorities" JSONB NOT NULL,
    "biases" JSONB NOT NULL,
    "modelClass" "BoardroomModelClass" NOT NULL DEFAULT 'SMALL',
    "maxOutputChars" INTEGER NOT NULL DEFAULT 1400,
    "suggestionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardroomBoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardroomRun" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "boardId" TEXT,
    "boardName" TEXT NOT NULL,
    "boardSnapshot" JSONB NOT NULL,
    "question" TEXT NOT NULL,
    "context" JSONB,
    "decision" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "keyTradeoffs" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "actionPlan" JSONB NOT NULL,
    "dissentingOpinions" JSONB NOT NULL,
    "debate" JSONB,
    "durationMs" INTEGER NOT NULL,
    "modelClasses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardroomRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebAuthnCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceType" TEXT,
    "backedUp" BOOLEAN,
    "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebAuthnChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flowType" "WebAuthnFlowType" NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebAuthnChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL,
    "billingInterval" "BillingInterval",
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "appliedPromoCode" TEXT,
    "stripePromotionCodeId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoCodeType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "currentRedemptions" INTEGER NOT NULL DEFAULT 0,
    "isSingleUse" BOOLEAN NOT NULL DEFAULT false,
    "allowedPlans" "SubscriptionPlan"[],
    "allowedBillingIntervals" "BillingInterval"[],
    "grantedPlan" "SubscriptionPlan",
    "inviteDurationDays" INTEGER,
    "maxSavedProgressions" INTEGER,
    "maxSavedArrangements" INTEGER,
    "aiGenerationsPerMonth" INTEGER,
    "stripePromotionCodeId" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCodeRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PromoRedemptionStatus" NOT NULL DEFAULT 'REDEEMED',
    "failureReason" TEXT,
    "checkoutSessionId" TEXT,
    "stripeSubscriptionId" TEXT,
    "metadata" JSONB,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCodeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "UsageEventType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionTierConfig" (
    "plan" "SubscriptionPlan" NOT NULL,
    "gptModel" TEXT NOT NULL,
    "aiGenerationsPerMonth" INTEGER,
    "maxSavedProgressions" INTEGER,
    "maxSavedArrangements" INTEGER,
    "maxPublicShares" INTEGER,
    "canExportMidi" BOOLEAN NOT NULL DEFAULT false,
    "canExportPdf" BOOLEAN NOT NULL DEFAULT false,
    "canSharePublicly" BOOLEAN NOT NULL DEFAULT true,
    "canUseVocalTrackRecording" BOOLEAN NOT NULL DEFAULT true,
    "maxVocalTakesPerArrangement" INTEGER,
    "canUseAdvancedVoicingControls" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionTierConfig_pkey" PRIMARY KEY ("plan")
);

-- CreateTable
CREATE TABLE "SubscriptionPlanVersion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "yearlyPrice" DECIMAL(10,2) NOT NULL,
    "monthlyStripePriceId" TEXT,
    "yearlyStripePriceId" TEXT,
    "gptModel" TEXT NOT NULL,
    "aiGenerationsPerMonth" INTEGER,
    "maxSavedProgressions" INTEGER,
    "maxSavedArrangements" INTEGER,
    "maxPublicShares" INTEGER,
    "canExportMidi" BOOLEAN NOT NULL DEFAULT false,
    "canExportPdf" BOOLEAN NOT NULL DEFAULT false,
    "canSharePublicly" BOOLEAN NOT NULL DEFAULT true,
    "canUsePremiumAiModel" BOOLEAN NOT NULL DEFAULT false,
    "versionNumber" INTEGER NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "editorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "promptKey" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentTemplate" TEXT NOT NULL,
    "notes" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdByEmail" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contentKind" "MarketingContentKind" NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "defaultLocale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingContentVersion" (
    "id" TEXT NOT NULL,
    "marketingContentId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "notes" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "editorUserId" TEXT,
    "editorEmail" TEXT,
    "publishedAt" TIMESTAMP(3),
    "sourceVersionId" TEXT,
    "translationOrigin" "MarketingTranslationOrigin",
    "translationModel" TEXT,
    "translationGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "properties" JSONB,
    "sessionId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progression" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chords" JSONB NOT NULL,
    "pianoVoicings" JSONB,
    "generatorSnapshot" JSONB,
    "feel" TEXT,
    "scale" TEXT,
    "genre" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "BoardroomBoard_isDefault_updatedAt_idx" ON "BoardroomBoard"("isDefault", "updatedAt");

-- CreateIndex
CREATE INDEX "BoardroomBoard_createdAt_idx" ON "BoardroomBoard"("createdAt");

-- CreateIndex
CREATE INDEX "BoardroomBoardMember_boardId_displayOrder_idx" ON "BoardroomBoardMember"("boardId", "displayOrder");

-- CreateIndex
CREATE INDEX "BoardroomBoardMember_boardId_isActive_idx" ON "BoardroomBoardMember"("boardId", "isActive");

-- CreateIndex
CREATE INDEX "BoardroomRun_adminUserId_createdAt_idx" ON "BoardroomRun"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardroomRun_boardId_createdAt_idx" ON "BoardroomRun"("boardId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardroomRun_createdAt_idx" ON "BoardroomRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebAuthnCredential_credentialId_key" ON "WebAuthnCredential"("credentialId");

-- CreateIndex
CREATE INDEX "WebAuthnCredential_userId_revokedAt_idx" ON "WebAuthnCredential"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "WebAuthnChallenge_userId_flowType_idx" ON "WebAuthnChallenge"("userId", "flowType");

-- CreateIndex
CREATE INDEX "WebAuthnChallenge_expiresAt_idx" ON "WebAuthnChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_plan_status_idx" ON "Subscription"("plan", "status");

-- CreateIndex
CREATE INDEX "Subscription_appliedPromoCode_idx" ON "Subscription"("appliedPromoCode");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_type_isActive_expiresAt_idx" ON "PromoCode"("type", "isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "PromoCode_createdAt_idx" ON "PromoCode"("createdAt");

-- CreateIndex
CREATE INDEX "PromoCodeRedemption_userId_redeemedAt_idx" ON "PromoCodeRedemption"("userId", "redeemedAt");

-- CreateIndex
CREATE INDEX "PromoCodeRedemption_promoCodeId_redeemedAt_idx" ON "PromoCodeRedemption"("promoCodeId", "redeemedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeRedemption_promoCodeId_userId_key" ON "PromoCodeRedemption"("promoCodeId", "userId");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_eventType_createdAt_idx" ON "UsageEvent"("userId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionPlanVersion_isActive_idx" ON "SubscriptionPlanVersion"("isActive");

-- CreateIndex
CREATE INDEX "SubscriptionPlanVersion_isDraft_idx" ON "SubscriptionPlanVersion"("isDraft");

-- CreateIndex
CREATE INDEX "SubscriptionPlanVersion_planId_isActive_idx" ON "SubscriptionPlanVersion"("planId", "isActive");

-- CreateIndex
CREATE INDEX "SubscriptionPlanVersion_planId_createdAt_idx" ON "SubscriptionPlanVersion"("planId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanVersion_planId_versionNumber_key" ON "SubscriptionPlanVersion"("planId", "versionNumber");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_createdAt_idx" ON "AdminAuditLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PromptVersion_promptKey_isActive_idx" ON "PromptVersion"("promptKey", "isActive");

-- CreateIndex
CREATE INDEX "PromptVersion_promptKey_isDraft_idx" ON "PromptVersion"("promptKey", "isDraft");

-- CreateIndex
CREATE INDEX "PromptVersion_promptKey_createdAt_idx" ON "PromptVersion"("promptKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVersion_promptKey_versionNumber_key" ON "PromptVersion"("promptKey", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingContent_key_key" ON "MarketingContent"("key");

-- CreateIndex
CREATE INDEX "MarketingContent_contentKind_idx" ON "MarketingContent"("contentKind");

-- CreateIndex
CREATE INDEX "MarketingContentVersion_marketingContentId_locale_isActive_idx" ON "MarketingContentVersion"("marketingContentId", "locale", "isActive");

-- CreateIndex
CREATE INDEX "MarketingContentVersion_marketingContentId_locale_isDraft_idx" ON "MarketingContentVersion"("marketingContentId", "locale", "isDraft");

-- CreateIndex
CREATE INDEX "MarketingContentVersion_locale_isActive_idx" ON "MarketingContentVersion"("locale", "isActive");

-- CreateIndex
CREATE INDEX "MarketingContentVersion_createdAt_idx" ON "MarketingContentVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingContentVersion_marketingContentId_locale_versionNu_key" ON "MarketingContentVersion"("marketingContentId", "locale", "versionNumber");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_createdAt_idx" ON "AnalyticsEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Progression_shareId_key" ON "Progression"("shareId");

-- CreateIndex
CREATE INDEX "Progression_userId_idx" ON "Progression"("userId");

-- CreateIndex
CREATE INDEX "Progression_shareId_idx" ON "Progression"("shareId");

-- AddForeignKey
ALTER TABLE "BoardroomBoardMember" ADD CONSTRAINT "BoardroomBoardMember_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "BoardroomBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardroomRun" ADD CONSTRAINT "BoardroomRun_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardroomRun" ADD CONSTRAINT "BoardroomRun_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "BoardroomBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebAuthnCredential" ADD CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebAuthnChallenge" ADD CONSTRAINT "WebAuthnChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeRedemption" ADD CONSTRAINT "PromoCodeRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeRedemption" ADD CONSTRAINT "PromoCodeRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptVersion" ADD CONSTRAINT "PromptVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingContentVersion" ADD CONSTRAINT "MarketingContentVersion_marketingContentId_fkey" FOREIGN KEY ("marketingContentId") REFERENCES "MarketingContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingContentVersion" ADD CONSTRAINT "MarketingContentVersion_editorUserId_fkey" FOREIGN KEY ("editorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progression" ADD CONSTRAINT "Progression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

