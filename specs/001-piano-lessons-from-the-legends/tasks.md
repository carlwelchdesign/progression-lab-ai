# Tasks: Piano Lessons from the Legends

**Input**: Design documents from `/specs/001-piano-lessons-from-the-legends/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-curriculum.md, quickstart.md

**Tests**: Include both unit/integration tests and Playwright e2e tests per user story.

> Migration Safety: Use additive migrations only. Never run `prisma migrate reset` or `prisma db push --force-reset` for this feature.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and enforce safe migration workflow.

- [X] T001 Create feature module scaffolding in `features/musician-styles/components/.gitkeep`, `features/musician-styles/hooks/.gitkeep`, and `features/musician-styles/services/.gitkeep`
- [X] T002 Create API route scaffolding in `app/api/musician-styles/route.ts`, `app/api/musician-styles/[slug]/route.ts`, `app/api/musician-styles/[slug]/curriculum/route.ts`, and `app/api/musician-styles/request/route.ts`
- [X] T003 [P] Create lesson progress API scaffold in `app/api/lessons/progress/route.ts`
- [X] T004 [P] Create route shells in `app/styles/page.tsx` and `app/styles/[slug]/page.tsx`
- [X] T005 Add additive-only migration workflow note to `specs/001-piano-lessons-from-the-legends/tasks.md` header comments (explicitly forbid `prisma migrate reset` and `prisma db push --force-reset` in implementation notes)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema, shared types, and service abstractions that block all user stories.

**CRITICAL**: Complete this phase before starting any user story.

- [X] T006 Update schema with `LessonProgress`, `MusicianProfile`, `GeneratedCurriculum`, and `User` relations in `prisma/schema.prisma`
- [X] T007 Create a single additive migration for new tables/indexes only in `prisma/migrations/20260413_add_musician_lessons/migration.sql`
- [X] T008 [P] Seed curated roster and prompt versions in `prisma/seed/musicianProfiles.ts`
- [X] T009 [P] Add generated lesson/curriculum domain types in `features/musician-styles/types.ts`
- [X] T010 [P] Add strict OpenAI curriculum JSON schema in `app/api/musician-styles/curriculumSchema.ts`
- [X] T011 Implement MIDI service interface and browser adapter in `features/musician-styles/services/midiService.ts`
- [X] T012 [P] Implement curriculum repository helpers in `features/musician-styles/services/curriculumRepository.ts`
- [X] T013 [P] Implement musician profile repository helpers in `features/musician-styles/services/musicianRepository.ts`
- [X] T014 [P] Implement lesson progress repository helpers in `features/musician-styles/services/lessonProgressRepository.ts`
- [X] T015 Implement skill-level assessment and completed-lesson summarization helpers in `features/musician-styles/services/skillAssessmentService.ts`

**Checkpoint**: Foundation is ready for independently testable story work.

---

## Phase 3: User Story 1 - Learn From Seeded Legends With MIDI-First Fluid Lessons (Priority: P1) 🎯 MVP

**Goal**: Let authenticated users browse/search seeded musicians, generate an initial 3-lesson curriculum, complete lessons with required MIDI-confirmed exercises, and persist progress with low-click flow.

**Independent Test**: A user can open `/styles`, find a seeded pianist by autocomplete, start `/styles/[slug]`, complete MIDI exercises with auto-advance, and resume progress after refresh.

### Tests for User Story 1

- [X] T016 [P] [US1] Add unit tests for roster search and grouped browse query behavior in `features/musician-styles/services/__tests__/musicianRepository.test.ts`
- [X] T017 [P] [US1] Add unit tests for lesson flow state transitions and duplicate MIDI match debounce in `features/musician-styles/components/__tests__/LessonFlowController.test.ts`
- [X] T018 [P] [US1] Add API route tests for initial curriculum generation and progress upsert in `app/api/musician-styles/[slug]/curriculum/__tests__/route.test.ts` and `app/api/lessons/progress/__tests__/route.test.ts`
- [X] T019 [P] [US1] Add Playwright e2e for seeded musician search, lesson start, MIDI-required gate, and step progression in `e2e/musician-styles-seeded.spec.ts`

### Implementation for User Story 1

- [X] T020 [US1] Implement authenticated roster endpoint with grouped browse and search modes in `app/api/musician-styles/route.ts`
- [X] T021 [US1] Implement authenticated musician detail endpoint returning profile + cached curriculum + staleness flag in `app/api/musician-styles/[slug]/route.ts`
- [X] T022 [US1] Implement initial curriculum generation endpoint (`force=false` first batch behavior + usage event) in `app/api/musician-styles/[slug]/curriculum/route.ts`
- [X] T023 [US1] Implement progress upsert endpoint returning `nextStepIndex` and metadata merge in `app/api/lessons/progress/route.ts`
- [X] T024 [P] [US1] Implement curriculum generation service (strict schema call + parse + validation) in `features/musician-styles/services/curriculumGenerationService.ts`
- [X] T025 [P] [US1] Implement progress service for step completion writes and lesson completion writes in `features/musician-styles/services/lessonProgressService.ts`
- [X] T026 [US1] Build roster UI with autocomplete + genre browse cards in `features/musician-styles/components/MusicianRoster.tsx` and `features/musician-styles/components/MusicianCard.tsx`
- [X] T027 [US1] Build lesson page shell and curriculum status bar in `features/musician-styles/components/MusicianStylePage.tsx` and `features/musician-styles/components/CurriculumStatusBar.tsx`
- [X] T028 [US1] Build lesson list and lesson player with single-primary-action text steps in `features/musician-styles/components/LessonList.tsx` and `features/musician-styles/components/LessonPlayer.tsx`
- [X] T029 [P] [US1] Build text and exercise step renderers with interactive piano diagram hooks in `features/musician-styles/components/LessonStepText.tsx` and `features/musician-styles/components/LessonStepExercise.tsx`
- [X] T030 [US1] Implement curriculum + progress hooks in `features/musician-styles/hooks/useGeneratedCurriculum.ts` and `features/musician-styles/hooks/useLessonProgress.ts`
- [X] T031 [US1] Wire `/styles` and `/styles/[slug]` routes to feature components in `app/styles/page.tsx` and `app/styles/[slug]/page.tsx`

**Checkpoint**: US1 is independently usable and testable as the MVP lesson loop.

---

## Phase 4: User Story 2 - Ongoing Batched Curriculum With Auto-Unlock and Skill Progression (Priority: P2)

**Goal**: Automatically append new 3-lesson batches when users finish current lessons, reassess skill each batch, and support stale prompt-version regeneration choices.

**Independent Test**: After completing all available lessons for a musician, the next batch appears within one generation cycle, shows incremented batch numbers, and uses reassessed skill level without overwriting prior lesson history.

### Tests for User Story 2

- [X] T032 [P] [US2] Add unit tests for batch continuation, previous-lesson summaries, and skill threshold transitions in `features/musician-styles/services/__tests__/curriculumGenerationService.test.ts`
- [X] T033 [P] [US2] Add API route tests for `force` behavior, continuation no-op when lessons remain, and stale prompt regeneration flows in `app/api/musician-styles/[slug]/curriculum/__tests__/continuation.test.ts`
- [X] T034 [P] [US2] Add Playwright e2e for complete-last-lesson auto-generation and immediate next-lesson start CTA in `e2e/musician-styles-batch-continuation.spec.ts`

### Implementation for User Story 2

- [X] T035 [US2] Extend curriculum generation service for append-only batch creation and previous-lesson context injection in `features/musician-styles/services/curriculumGenerationService.ts`
- [X] T036 [US2] Extend curriculum route for continuation trigger rules (`force`, completed-last-lesson checks, usage accounting) in `app/api/musician-styles/[slug]/curriculum/route.ts`
- [X] T037 [US2] Add stale curriculum decision handling (continue existing vs regenerate from current point) in `features/musician-styles/hooks/useGeneratedCurriculum.ts`
- [X] T038 [US2] Implement low-click completion UX (`Start Next Lesson`, no modal, back-navigation safety) in `features/musician-styles/components/LessonPlayer.tsx`
- [X] T039 [US2] Emit friction analytics (`manualClicks`, `autoAdvanceCount`, `backtrackCount`) in `features/musician-styles/components/LessonPlayer.tsx` and `lib/analytics.ts`

**Checkpoint**: US2 delivers unlimited batched progression without dead ends.

---

## Phase 5: User Story 3 - Custom Pianist Requests via Autocomplete + Request Endpoint (Priority: P3)

**Goal**: Allow users to request lessons for pianists not in the seeded roster, generate/store custom musician profiles, and immediately launch curriculum generation for the new profile.

**Independent Test**: Typing an unlisted pianist in autocomplete shows a request CTA; submitting it creates or reuses a profile, redirects to `/styles/[slug]`, and allows lesson generation with required MIDI flow.

### Tests for User Story 3

- [X] T040 [P] [US3] Add unit tests for custom musician slug generation, profile validation, and duplicate-name resolution in `features/musician-styles/services/__tests__/profileGenerationService.test.ts`
- [X] T041 [P] [US3] Add API route tests for request endpoint success, 409 existing-profile redirect payload, and 422 insufficient-information response in `app/api/musician-styles/request/__tests__/route.test.ts`
- [X] T042 [P] [US3] Add Playwright e2e for autocomplete no-match request flow through redirect and lesson start in `e2e/musician-styles-custom-request.spec.ts`

### Implementation for User Story 3

- [X] T043 [US3] Implement custom musician request endpoint with AI profile generation and conflict handling in `app/api/musician-styles/request/route.ts`
- [X] T044 [P] [US3] Implement profile generation service and schema validation for `MusicianProfile` fields in `features/musician-styles/services/profileGenerationService.ts`
- [X] T045 [US3] Extend roster autocomplete UI with no-match request CTA and submit states in `features/musician-styles/components/MusicianRoster.tsx`
- [X] T046 [US3] Add client request action and redirect wiring in `features/musician-styles/hooks/useGeneratedCurriculum.ts` and `app/styles/page.tsx`

**Checkpoint**: US3 unlocks “learn from any pianist” workflows.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Harden quality, observability, and release-readiness across all stories.

- [X] T047 [P] Add accessibility and keyboard-navigation refinements for search, lesson controls, and MIDI gate in `features/musician-styles/components/MusicianRoster.tsx` and `features/musician-styles/components/LessonPlayer.tsx`
- [X] T048 [P] Add defensive API validation/error mapping for all musician-style routes in `app/api/musician-styles/route.ts`, `app/api/musician-styles/[slug]/route.ts`, `app/api/musician-styles/[slug]/curriculum/route.ts`, and `app/api/musician-styles/request/route.ts`
- [X] T049 [P] Add regression tests for auth/CSRF/usage accounting across routes in `app/api/musician-styles/__tests__/security.test.ts`
- [X] T050 Run full verification suite and capture evidence in `specs/001-piano-lessons-from-the-legends/quickstart.md` (Jest + Playwright + manual MIDI checklist)

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies
- Foundational (Phase 2): depends on Setup; blocks all user stories
- User Stories (Phases 3-5): all depend on Foundational completion
- Polish (Phase 6): depends on completion of targeted user stories

### User Story Dependencies

- US1 (P1): starts after Phase 2; no dependency on other user stories
- US2 (P2): depends on US1 endpoints and player flow being available
- US3 (P3): depends on US1 roster search and curriculum generation path

### Within Story Ordering

- Tests first (write and verify failing behavior before implementation)
- Service/repository logic before route wiring where possible
- Routes before page/component integration
- Hooks and UI integration before e2e stabilization

## Parallel Opportunities

- Phase 2 tasks `T008`, `T009`, `T010`, `T012`, `T013`, and `T014` can run in parallel after `T006`
- US1 tests `T016`-`T019` can run in parallel
- US1 implementation `T024` and `T025` can run in parallel; `T029` can run in parallel with `T026`-`T028`
- US2 tests `T032`-`T034` can run in parallel
- US3 tests `T040`-`T042` can run in parallel
- Polish tasks `T047`-`T049` can run in parallel

## Parallel Example: User Story 1

```bash
# Parallel test authoring
T016 + T017 + T018 + T019

# Parallel service/component development after API contract alignment
T024 + T025 + T029
```

## Parallel Example: User Story 3

```bash
# Parallel custom-profile test coverage
T040 + T041 + T042

# Parallel implementation slices
T044 + T045
```

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) end-to-end.
3. Validate MIDI-required lesson completion, low-click progression, and persisted progress.
4. Demo/deploy MVP before advanced batching and custom requests.

### Incremental Delivery

1. Ship US1 for seeded-legend curriculum loop.
2. Add US2 for ongoing batched progression and skill advancement.
3. Add US3 for any-pianist custom requests.
4. Finish Phase 6 hardening and full-suite verification.

### Safety Constraint

- Use additive Prisma migration flow only; do not use destructive reset commands.
