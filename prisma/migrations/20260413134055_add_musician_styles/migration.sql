-- CreateTable "MusicianProfile"
CREATE TABLE "MusicianProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "genre" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "styleDescription" TEXT NOT NULL,
    "signatureTechniques" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exampleSongs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promptTemplate" TEXT NOT NULL,
    "promptVersion" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicianProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable "GeneratedCurriculum"
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

-- CreateTable "LessonProgress"
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicianProfile_slug_key" ON "MusicianProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedCurriculum_userId_musicianId_key" ON "GeneratedCurriculum"("userId", "musicianId");

-- CreateIndex
CREATE INDEX "GeneratedCurriculum_userId_idx" ON "GeneratedCurriculum"("userId");

-- CreateIndex
CREATE INDEX "GeneratedCurriculum_musicianId_idx" ON "GeneratedCurriculum"("musicianId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "LessonProgress_userId_idx" ON "LessonProgress"("userId");

-- AddForeignKey
ALTER TABLE "GeneratedCurriculum" ADD CONSTRAINT "GeneratedCurriculum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedCurriculum" ADD CONSTRAINT "GeneratedCurriculum_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "MusicianProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
