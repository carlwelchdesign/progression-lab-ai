-- CreateTable AdminAuditLog
CREATE TABLE "AdminAuditLog" (
    "id" text NOT NULL,
    "actorUserId" text,
    "actorEmail" text NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "action" text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    "metadata" jsonb,
    "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_createdAt_idx" ON "AdminAuditLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
