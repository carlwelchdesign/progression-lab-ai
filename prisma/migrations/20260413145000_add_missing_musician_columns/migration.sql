-- AddColumn
ALTER TABLE "MusicianProfile" ADD COLUMN "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddColumn
ALTER TABLE "MusicianProfile" ADD COLUMN "isCustom" BOOLEAN NOT NULL DEFAULT false;
