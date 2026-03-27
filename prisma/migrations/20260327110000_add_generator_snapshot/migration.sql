-- Persist full generator API payload for saved progression restore.
ALTER TABLE "Progression"
ADD COLUMN "generatorSnapshot" JSONB;
