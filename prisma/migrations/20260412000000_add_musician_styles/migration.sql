-- CreateTable
CREATE TABLE "MusicianProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "styleDescription" TEXT NOT NULL,
    "signatureTechniques" TEXT[],
    "exampleSongs" TEXT[],
    "preferredKeys" TEXT[],
    "promptTemplate" TEXT NOT NULL,
    "promptVersion" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicianProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedCurriculum" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "promptVersion" INTEGER NOT NULL,
    "skillLevel" TEXT NOT NULL,
    "curriculumJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedCurriculum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicianProfile_slug_key" ON "MusicianProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedCurriculum_userId_musicianId_key" ON "GeneratedCurriculum"("userId", "musicianId");

-- CreateIndex
CREATE INDEX "GeneratedCurriculum_userId_idx" ON "GeneratedCurriculum"("userId");

-- CreateIndex
CREATE INDEX "GeneratedCurriculum_musicianId_idx" ON "GeneratedCurriculum"("musicianId");

-- AddForeignKey
ALTER TABLE "GeneratedCurriculum" ADD CONSTRAINT "GeneratedCurriculum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedCurriculum" ADD CONSTRAINT "GeneratedCurriculum_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
