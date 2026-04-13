-- CreateTable
CREATE TABLE "PromoCodeConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "prefixes" TEXT NOT NULL DEFAULT 'EARLY,BETA,LAUNCH,START,PROMO,GROWTH,ACCESS',
    "suffixLength" INTEGER NOT NULL DEFAULT 4,
    "separator" TEXT NOT NULL DEFAULT '-',
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "PromoCodeConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PromoCodeConfig" ADD CONSTRAINT "PromoCodeConfig_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
