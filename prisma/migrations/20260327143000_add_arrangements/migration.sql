-- Persist Chord Playground sequencer recordings as arrangements.
CREATE TABLE "Arrangement" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "timeline" JSONB NOT NULL,
    "playbackSnapshot" JSONB NOT NULL,
    "sourceChords" JSONB,
    "notes" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arrangement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Arrangement_shareId_key" ON "Arrangement"("shareId");
CREATE INDEX "Arrangement_userId_idx" ON "Arrangement"("userId");
CREATE INDEX "Arrangement_shareId_idx" ON "Arrangement"("shareId");

ALTER TABLE "Arrangement"
ADD CONSTRAINT "Arrangement_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
