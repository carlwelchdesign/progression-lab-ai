# Data Model: Piano Lessons from the Legends

**Branch**: `001-piano-lessons-from-the-legends`  
**Date**: 2026-04-13

---

## DB Migration Notes

> **CRITICAL**: Never run `prisma migrate reset`, `prisma db push --force-reset`, or any destructive command against the dev or production database. These commands will wipe the `User` table and all user data. Always use `prisma migrate dev` (additive migrations only). When generating a new migration, use `--create-only` first, review the SQL to confirm it contains only `CREATE TABLE` / `ALTER TABLE` / `CREATE INDEX` statements, then apply.

The dev database already has tables from the spike branch migrations:
- `LessonProgress` (from `20260411190000_add_lesson_progress`)
- `MusicianProfile` (from `20260412000000_add_musician_styles`)
- `GeneratedCurriculum` (from `20260412000000_add_musician_styles`)

These migrations are **not in `main`**. This feature branch will add a single clean migration that creates all three tables, aligned with the schema below. Prisma will detect the tables already exist in dev and skip creation; in production these will be created fresh.

---

## Prisma Schema Changes

Add to `prisma/schema.prisma` (new models):

```prisma
model LessonProgress {
  id          String    @id @default(cuid())
  userId      String
  lessonId    String    // stable slug e.g. 'stevie-wonder-lesson-1'
  completed   Boolean   @default(false)
  completedAt DateTime?
  attempts    Int       @default(0)
  metadata    Json?     // step index reached, MIDI session stats, etc.
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
}

model MusicianProfile {
  id                  String   @id @default(cuid())
  slug                String   @unique
  displayName         String
  aliases             String[] // alternative search terms: ["Stevie", "Little Stevie Wonder"]
  genre               String
  era                 String
  tagline             String
  styleDescription    String   @db.Text
  signatureTechniques String[]
  exampleSongs        String[]
  preferredKeys       String[]
  promptTemplate      String   @db.Text
  promptVersion       Int      @default(1)
  isActive            Boolean  @default(true)  // false = not shown in global browse
  isCustom            Boolean  @default(false) // true = user-requested, AI-generated profile
  sortOrder           Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  generatedCurricula  GeneratedCurriculum[]
}

model GeneratedCurriculum {
  id              String   @id @default(cuid())
  userId          String
  musicianId      String
  promptVersion   Int
  skillLevel      String   // 'beginner' | 'intermediate' | 'advanced'
  curriculumJson  Json     // GeneratedCurriculumData
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  musician MusicianProfile @relation(fields: [musicianId], references: [id], onDelete: Cascade)

  @@unique([userId, musicianId])
  @@index([userId])
  @@index([musicianId])
}
```

Add relations to `User` model:

```prisma
  lessonProgress      LessonProgress[]
  generatedCurricula  GeneratedCurriculum[]
```

---

## TypeScript Types (features/musician-styles/types.ts)

```typescript
// Lesson step types
export type TextStep = {
  type: 'text';
  heading: string;
  body: string;
  tip?: string;
};

export type ExerciseStep = {
  type: 'exercise';
  exercise: {
    id: string;
    prompt: string;
    chord: string;           // standard chord symbol: 'Ebmaj9', 'Bb7', etc.
    hint?: string;            // where to find it on the keyboard
    targetNotes: string[];   // required: exact notes for MIDI matching ['Eb4', 'G4', 'Bb4', 'D5']
  };
};

export type GeneratedStep = TextStep | ExerciseStep;

export type GeneratedLesson = {
  id: string;                  // stable slug: 'stevie-wonder-lesson-1'
  title: string;
  estimatedMinutes: number;
  batchNumber: number;         // which generation batch this lesson belongs to (1, 2, 3, ...)
  skillLevel: 'beginner' | 'intermediate' | 'advanced';  // skill level at time of this batch
  steps: GeneratedStep[];
};

export type GeneratedCurriculumData = {
  musicianIntro: string;        // 1-2 sentence bio hook, in the musician's genre voice
  skillLevelAssessment: string; // why this skill level was chosen for the initial batch
  currentBatch: number;         // highest batch number generated so far
  lessons: GeneratedLesson[];   // all lessons generated to date, across all batches — append-only
  previousLessonSummaries?: PreviousLessonSummary[];  // populated on batch 2+, sent as AI context
};

export type PreviousLessonSummary = {
  lessonId: string;
  title: string;
  conceptCovered: string;      // 1-sentence summary of key concept — sent to AI to avoid repetition
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
};

// API response shapes
export type MusicianProfileSummary = {
  id: string;
  slug: string;
  displayName: string;
  genre: string;
  era: string;
  tagline: string;
  signatureTechniques: string[];
  exampleSongs: string[];
  preferredKeys: string[];
  sortOrder: number;
  isCustom: boolean;
};

export type MusicianStyleResponse = {
  musician: MusicianProfileSummary;
  curriculum: GeneratedCurriculumData | null;
  curriculumStale: boolean;   // true when cached promptVersion < musician.promptVersion
};
```

---

## Skill Level Assessment Logic

Derived from total completed `LessonProgress` records (Piano Course + musician-style lessons combined). Reassessed at each batch generation boundary:

| Completed Lessons | Skill Level    |
|-------------------|----------------|
| 0–2               | `beginner`     |
| 3–9               | `intermediate` |
| 10+               | `advanced`     |

Each batch generation records the skill level at that time inside each `GeneratedLesson.skillLevel`, so the curriculum history shows how the student advanced over time.

---

## Seed Data

~30 musician profiles across 8 genre categories in `prisma/seed/musicianProfiles.ts`. See research.md "Seed Roster" section for full list. All seeded profiles have `isActive: true`, `isCustom: false`, `promptVersion: 2`.

User-requested (custom) profiles are created at runtime via `POST /api/musician-styles/request` with `isActive: false`, `isCustom: true`.

---

## Validation Rules

- `MusicianProfile.slug`: URL-safe lowercase, hyphenated, unique
- `MusicianProfile.promptVersion`: integer, increment on prompt changes
- `GeneratedCurriculum.curriculumJson`: must match `GeneratedCurriculumData` shape — enforced at write time via TypeScript cast
- `LessonProgress.lessonId`: matches the `id` field in a `GeneratedLesson` — referenced by slug, not DB foreign key (denormalized for flexibility)
