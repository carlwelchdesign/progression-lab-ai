-- Add persisted genre metadata for saved progressions.
ALTER TABLE "Progression"
ADD COLUMN "genre" TEXT;
