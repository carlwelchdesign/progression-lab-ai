-- Safely align SubscriptionTierConfig.plan with the existing enum-backed schema
ALTER TABLE "SubscriptionTierConfig"
ALTER COLUMN "plan" TYPE "SubscriptionPlan"
USING ("plan"::"SubscriptionPlan");

-- New entitlement toggle for advanced generator voicing controls
ALTER TABLE "SubscriptionTierConfig"
ADD COLUMN "canUseAdvancedVoicingControls" BOOLEAN;
