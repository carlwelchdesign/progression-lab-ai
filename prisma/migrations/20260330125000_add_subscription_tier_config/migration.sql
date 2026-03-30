-- CreateTable SubscriptionTierConfig
CREATE TABLE "SubscriptionTierConfig" (
    "plan" text NOT NULL,
    "gptModel" text NOT NULL,
    "aiGenerationsPerMonth" integer,
    "maxSavedProgressions" integer,
    "maxSavedArrangements" integer,
    "maxPublicShares" integer,
    "canExportMidi" boolean NOT NULL DEFAULT false,
    "canExportPdf" boolean NOT NULL DEFAULT false,
    "canSharePublicly" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) NOT NULL,

    CONSTRAINT "SubscriptionTierConfig_pkey" PRIMARY KEY ("plan")
);

-- Seed current entitlements
INSERT INTO "SubscriptionTierConfig" ("plan", "gptModel", "aiGenerationsPerMonth", "maxSavedProgressions", "maxSavedArrangements", "maxPublicShares", "canExportMidi", "canExportPdf", "canSharePublicly", "createdAt", "updatedAt") VALUES
  ('SESSION', 'gpt-3.5-turbo', 10, 10, 5, 2, false, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('COMPOSER', 'gpt-3.5-turbo', 50, 50, 25, 10, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('STUDIO', 'gpt-4o', 200, NULL, NULL, NULL, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('COMP', 'gpt-4o', 200, NULL, NULL, NULL, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
