# Quickstart: Piano Lessons from the Legends

## What's Being Built

A feature that lets authenticated MIDI keyboard users search for any pianist they want to learn from, then receive an ongoing AI-generated curriculum where the legend acts as a continuing mentor. The app ships with ~30 pre-seeded pianists across 8 genre categories. Users can also request lessons for any pianist not in the roster — the AI generates their profile on the fly.

## Feature Entry Points

| Route | What It Does |
|-------|-------------|
| `/styles` | Search + genre browse of musician roster |
| `/styles/[slug]` | Lesson player for a specific musician |
| `GET /api/musician-styles?search=` | Autocomplete search |
| `POST /api/musician-styles/request` | Generate profile for unlisted pianist |
| `POST /api/musician-styles/[slug]/curriculum` | Generate/continue lesson batch |
| `POST /api/lessons/progress` | Save lesson/step progress |

## Starting Implementation

1. **Create Prisma migration** — single file for `MusicianProfile`, `GeneratedCurriculum`, `LessonProgress`
2. **Update schema** — add the three models to `prisma/schema.prisma`
3. **Seed musician profiles** — `prisma/seed/musicianProfiles.ts` with `promptVersion: 2`
4. **Build API routes** — five routes in `app/api/musician-styles/` and `app/api/lessons/progress/`
5. **Build feature components** — in `features/musician-styles/components/`
6. **Wire up pages** — `app/styles/page.tsx` (search + browse) and `app/styles/[slug]/page.tsx` (player)

## Key Design Decisions

- **MIDI required** — exercise steps are confirmed by playing correct notes; lesson player gates behind MIDI connection
- **Fluid progression** — exercise steps auto-advance after MIDI match; text steps use one primary Continue action with keyboard shortcuts
- **Lesson structure is fixed** — always 6 steps in order: Hook → Concept → Hear+See It → Try It → Why It Works → Real Song Connection
- **One curriculum per user/musician** — lessons append to the same record across batches, never reset
- **AI generation is batched** — 3 lessons per call; new batch triggered on completion of last available lesson
- **Any pianist, not just seeded ones** — unlisted musicians get an AI-generated profile via `POST /api/musician-styles/request`
- **No subscription gate during dev** — will be wired after lesson quality is validated

## Low-Friction Lesson Flow Checklist

1. Implement `LessonFlowController` state machine in `features/musician-styles/components/LessonPlayer.tsx` with states: `idle`, `stepCompleted`, `autoAdvancing`, `lessonCompleted`.
2. Text steps: one visible primary action (`Continue`) only; wire `Enter` and `Space` to the same handler.
3. Exercise steps: detect MIDI match against `targetNotes`, mark step complete automatically, then advance after 700-1200 ms.
4. Prevent duplicate completion writes: debounce MIDI match events and ignore repeated matches while `autoAdvancing`.
5. Keep manual back-navigation available and non-destructive (no progress rollback).
6. On final step completion, show one primary action (`Start Next Lesson`) with no confirmation modal.
7. Persist flow metadata through `POST /api/lessons/progress`: include `autoAdvance`, `attempts`, and `stepIndex`.
8. Emit analytics for friction tracking: `manualClicks`, `autoAdvanceCount`, `backtrackCount`.
9. Add unit tests for flow transitions and debounce behavior.
10. Add e2e test path: keyboard-only text progression and MIDI-triggered auto-advance progression.

### Acceptance Checks

- Average manual clicks per completed step <= 1.2.
- No step completion is lost on refresh/navigation.
- Sustained MIDI notes do not trigger duplicate step completion.

## Dev Environment

> **CRITICAL — never reset or wipe the database.** Do not run `prisma migrate reset`, `prisma db push --force-reset`, or any command that truncates the `User` table. Always use `prisma migrate dev` (additive only) to apply new migrations.

### Review migration SQL before applying
```bash
# Generate the migration file without applying it first
npx prisma migrate dev --name add_musician_lessons --create-only
# Review the generated SQL in prisma/migrations/*/migration.sql
# Confirm it only contains CREATE TABLE statements, no DROP or TRUNCATE
# Then apply:
npx prisma migrate dev
```

### Re-seed musician profiles
```bash
npx tsx prisma/seed.ts
```

### Start dev server
```bash
yarn dev
```

### Run tests
```bash
yarn test                    # Jest unit tests
yarn playwright test         # Playwright e2e
```

## Stale Data Note

The dev database already contains `MusicianProfile`, `GeneratedCurriculum`, and `LessonProgress` tables from the spike migration. Existing `GeneratedCurriculum` rows with `promptVersion: 1` will be treated as stale by the new code (which expects `promptVersion: 2`). No cleanup script needed — they are simply ignored and regenerated on next request.

## Verification Evidence

### Focused Jest validation
```bash
npx jest "features/musician-styles/services/__tests__/musicianRepository.test.ts" \
	"features/musician-styles/services/__tests__/curriculumGenerationService.test.ts" \
	"features/musician-styles/services/__tests__/profileGenerationService.test.ts" \
	"features/musician-styles/components/__tests__/LessonFlowController.test.ts" \
	"app/api/musician-styles/request/__tests__/route.test.ts" \
	"app/api/musician-styles/__tests__/security.test.ts" \
	"app/api/lessons/progress/__tests__/route.test.ts" --runInBand
```

Result: `7 passed, 7 total` test suites (`11 passed` tests).

### Playwright spec registration
```bash
npx playwright test "e2e/musician-styles-seeded.spec.ts" \
	"e2e/musician-styles-batch-continuation.spec.ts" \
	"e2e/musician-styles-custom-request.spec.ts" --list
```

Result: `3 tests in 3 files` discovered.
