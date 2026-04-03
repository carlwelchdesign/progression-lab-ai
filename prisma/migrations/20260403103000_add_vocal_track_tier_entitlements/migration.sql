ALTER TABLE "SubscriptionTierConfig"
ADD COLUMN "canUseVocalTrackRecording" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "maxVocalTakesPerArrangement" INTEGER;

UPDATE "SubscriptionTierConfig"
SET "maxVocalTakesPerArrangement" = CASE
  WHEN "plan" = 'SESSION' THEN 1
  WHEN "plan" = 'COMPOSER' THEN 4
  WHEN "plan" = 'INVITE' THEN 4
  ELSE NULL
END;
