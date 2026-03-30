-- CreateTable SubscriptionPlanVersion
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

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanVersion_planId_versionNumber_key" ON "SubscriptionPlanVersion"("planId", "versionNumber");

-- CreateIndex
CREATE INDEX "SubscriptionPlanVersion_isActive_idx" ON "SubscriptionPlanVersion"("isActive");

-- CreateIndex
CREATE INDEX "SubscriptionPlanVersion_isDraft_idx" ON "SubscriptionPlanVersion"("isDraft");

-- CreateIndex
CREATE INDEX "SubscriptionPlanVersion_planId_isActive_idx" ON "SubscriptionPlanVersion"("planId", "isActive");

-- CreateIndex
CREATE INDEX "SubscriptionPlanVersion_planId_createdAt_idx" ON "SubscriptionPlanVersion"("planId", "createdAt");

-- Seed existing plans - SESSION
INSERT INTO "SubscriptionPlanVersion" ("id", "planId", "displayName", "description", "monthlyPrice", "yearlyPrice", "monthlyStripePriceId", "yearlyStripePriceId", "gptModel", "aiGenerationsPerMonth", "maxSavedProgressions", "maxSavedArrangements", "maxPublicShares", "canExportMidi", "canExportPdf", "canSharePublicly", "canUsePremiumAiModel", "versionNumber", "isDraft", "isActive", "publishedAt", "editorEmail", "createdAt", "updatedAt") VALUES ('spv-session-001', 'SESSION', 'Session', 'Try the studio with meaningful limits', 0.00, 0.00, NULL, NULL, 'gpt-3.5-turbo', 10, 10, 5, 2, false, false, true, false, 1, false, true, NOW(), 'seed@progressionlab.com', NOW(), NOW());

-- Seed existing plans - COMPOSER
INSERT INTO "SubscriptionPlanVersion" ("id", "planId", "displayName", "description", "monthlyPrice", "yearlyPrice", "monthlyStripePriceId", "yearlyStripePriceId", "gptModel", "aiGenerationsPerMonth", "maxSavedProgressions", "maxSavedArrangements", "maxPublicShares", "canExportMidi", "canExportPdf", "canSharePublicly", "canUsePremiumAiModel", "versionNumber", "isDraft", "isActive", "publishedAt", "editorEmail", "createdAt", "updatedAt") VALUES ('spv-composer-001', 'COMPOSER', 'Composer', 'For serious songwriting sessions', 9.00, 90.00, '', '', 'gpt-3.5-turbo', 50, 50, 25, 10, true, true, true, false, 1, false, true, NOW(), 'seed@progressionlab.com', NOW(), NOW());

-- Seed existing plans - STUDIO
INSERT INTO "SubscriptionPlanVersion" ("id", "planId", "displayName", "description", "monthlyPrice", "yearlyPrice", "monthlyStripePriceId", "yearlyStripePriceId", "gptModel", "aiGenerationsPerMonth", "maxSavedProgressions", "maxSavedArrangements", "maxPublicShares", "canExportMidi", "canExportPdf", "canSharePublicly", "canUsePremiumAiModel", "versionNumber", "isDraft", "isActive", "publishedAt", "editorEmail", "createdAt", "updatedAt") VALUES ('spv-studio-001', 'STUDIO', 'Studio', 'Maximum headroom for power users', 19.00, 190.00, '', '', 'gpt-4o', 200, NULL, NULL, NULL, true, true, true, true, 1, false, true, NOW(), 'seed@progressionlab.com', NOW(), NOW());

-- Seed existing plans - COMP
INSERT INTO "SubscriptionPlanVersion" ("id", "planId", "displayName", "description", "monthlyPrice", "yearlyPrice", "monthlyStripePriceId", "yearlyStripePriceId", "gptModel", "aiGenerationsPerMonth", "maxSavedProgressions", "maxSavedArrangements", "maxPublicShares", "canExportMidi", "canExportPdf", "canSharePublicly", "canUsePremiumAiModel", "versionNumber", "isDraft", "isActive", "publishedAt", "editorEmail", "createdAt", "updatedAt") VALUES ('spv-comp-001', 'COMP', 'COMP', 'Legacy internal plan', 0.00, 0.00, NULL, NULL, 'gpt-4o', 200, NULL, NULL, NULL, true, true, true, true, 1, false, true, NOW(), 'seed@progressionlab.com', NOW(), NOW());
