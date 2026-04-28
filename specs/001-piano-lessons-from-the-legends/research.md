# Research: Piano Lessons from the Legends

**Branch**: `001-piano-lessons-from-the-legends`  
**Date**: 2026-04-13  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Research Key: Engineering Approach

**Principle**: All implementation follows SOLID design principles.

**Applied architecture implications**:

- **Route handlers are thin** — `app/api/musician-styles/[slug]/curriculum/route.ts` does: auth check → input parse → call `generateCurriculumBatch()` → return result. No OpenAI calls, no DB queries inline.
- **Services own the logic** — `features/musician-styles/services/curriculumService.ts` owns batch generation; `features/musician-styles/services/profileService.ts` owns custom profile generation. Each has one reason to change.
- **Hooks own one concern each** — `useGeneratedCurriculum`, `useMidiInput`, `useLessonProgress` are separate hooks. Components compose them; they do not combine concerns.
- **MIDI is abstracted** — a `MidiService` interface with `WebMidiService` (production) and `MockMidiService` (tests) implementations. Components depend on the interface, not the Web MIDI API directly.
- **Step renderers are segregated** — `LessonStepText` and `LessonStepExercise` each receive the minimal type they need (`TextStep` | `ExerciseStep`). Neither knows about the other step type.
- **Extension without modification** — adding a new step type (e.g. `VideoStep`) requires: add to `GeneratedStep` union, add renderer component, add case to the step dispatcher. No existing renderers change.

---


**Decision**: Batched generation, 3 lessons per batch, appended to the same `GeneratedCurriculum` record. New batches are generated when the student completes the last available lesson.

**Rationale**:
- The spike proved a single `client.responses.create()` call with strict JSON schema returns 3 lessons in ~5–8s—fast enough for a "Generating your next lessons…" prompt
- Batching 3 at a time keeps generation cost proportional to actual usage (you only pay when you finish the current batch)
- Appending to a single `GeneratedCurriculum` record preserves the full lesson history for context carry-forward
- Each new batch generation sends a `previousLessons` summary array so the AI doesn’t repeat concepts already covered
- Skill level is reassessed at each batch boundary based on total completed lessons at that moment

**Alternatives considered**:
- Fixed 3-lesson curriculum (original): Rejected — user wants an ongoing mentor relationship with no hard cap
- Single growing generation (all lessons at once): Rejected — impractical upfront; the AI can’t predict how many lessons a student will need
- Lesson-by-lesson generation: Rejected — adds visible loading gaps mid-session and triples API costs

---

## Research Key: Lesson Narrative Structure

**Question**: What lesson format makes musical concepts actually stick vs. feel like a textbook?

**Decision**: 6-part structure: Hook → Concept → Hear+See It → Try It → Why It Works → Real Song Connection (defined in spec).

**Rationale**:
- Piano Marvel and Yousician succeed by connecting abstract theory to immediate play — not explanation-first
- The spike's lessons were explanation-heavy with exercises tacked on. Users scanned text, skipped exercises
- The new structure forces the AI to anchor every concept to a real song and give one playable exercise — no filler

**Research findings**:
- Adult learners retain ~10% of what they read vs ~75% of what they practice immediately after instruction (learning pyramid)
- "One concept per lesson" is the core principle of Piano Marvel's lesson design
- The "Real Song Connection" step is the key differentiator vs. generic theory apps — it's what makes the lesson feel like the legendary musician's curriculum

**Implementation implication**:
- Prompt template must explicitly instruct the AI to follow this 6-part structure
- Steps in `GeneratedLesson` will use `type: 'text'` for Hook/Concept/WhyItWorks/RealSongConnection and `type: 'exercise'` for HearSeeIt/TryIt

---

## Research Key: DB Migration Strategy

**Question**: The spike applied two migrations (`20260411190000_add_lesson_progress`, `20260412000000_add_musician_styles`) to the dev DB but they are NOT in `main`. How should migration be handled?

**Decision**: Port the migration SQL to a clean new migration file on this branch. Do NOT cherry-pick from spike.

**Rationale**:
- The spike migrations add `LessonProgress`, `MusicianProfile`, and `GeneratedCurriculum` — all three are correct and needed
- The schema itself is good; what was bad was the lesson UX/content
- Creating a fresh migration file ensures proper naming conventions and Prisma migrate history alignment
- Any data in the dev DB from the spike stays: `GeneratedCurriculum` rows will be invalidated naturally when `promptVersion` bumps (which will happen as we redesign prompts)

**Dev DB cleanup needed**:
- `MusicianProfile` rows from the spike seed are fine to keep — same musicians, same slugs
- `GeneratedCurriculum` rows are stale but harmless — new UX will trigger regeneration
- `LessonProgress` rows from spike testing can be left (they track lesson IDs that won't exist in the new curriculum, so they won't interfere)

---

## Research Key: Skill Level Gating

**Question**: Which subscription tier should this feature require?

**Decision**: **Deferred.** No subscription gate during development and testing. The gate will be wired after lessons are validated and the team is happy with the experience. All authenticated users can access the feature in the interim. Generation still counts against the existing `aiGenerationsPerMonth` quota.

**Planned gate (post-validation)**: COMPOSER or STUDIO tier (SESSION users excluded). This will require UI changes to the entitlements flow and a paywall prompt for SESSION users.

**Rationale**: Gating too early creates friction before the experience is proven. Validate the lesson quality first, then restrict access.

---

## Research Key: OpenAI Model Selection

**Decision**: Use the model from `accessContext.entitlements.gptModel` (same pattern as chord suggestions and curriculum generation in spike).

**Rationale**: Tier-driven model selection already exists in `lib/entitlements.ts`. Reuse it — no new logic needed.

---

## Research Key: MIDI Interactive Exercises

**Question**: Should MIDI input be required or optional for exercise completion?

**Decision**: **Required.** A MIDI keyboard must be connected to use this feature. Exercise step completion is confirmed by the user playing the correct notes on their MIDI device.

**Rationale**:
- The whole premise of the feature is hands-on practice with a real instrument — a visual-only experience undermines the core value prop
- Requiring MIDI from the start shapes the entire lesson authoring model: every exercise step will have `targetNotes` defined, the AI prompt explicitly specifies playable exercises
- Adults learn physical skills through repetition with feedback — the MIDI confirmation loop is the feedback mechanism
- The app can require this because users who come to a "piano lessons" feature already expect to have a piano or MIDI keyboard

**MIDI enforcement in UX**:
- Lesson player shows a MIDI connection gate before lessons can be started
- If MIDI connection drops mid-lesson, show a reconnect prompt (don’t lose progress)
- Exercise steps: “Done” button is locked until the correct `targetNotes` are detected
- MIDI session stats (notes played, attempts) are saved in `LessonProgress.metadata`

**What MIDI is NOT used for**:
- Velocity/timing grading or performance scoring
- Audio playback (piano-chart handles visual; MIDI input only confirms correct notes played)

---

## Research Key: Interaction Friction and Click Minimization

**Question**: How do we keep lesson progression fluid and organic while still preserving explicit progress state?

**Decision**: Auto-advance by default, with minimal manual controls.

**Rationale**:
- Repeated click-confirm-click loops break musical flow and make lessons feel like forms, not coaching
- MIDI-confirmed exercises provide a natural completion signal; we should use that signal to advance automatically
- A single primary action per text step keeps cognitive load low and avoids "which button do I press" hesitation

**UX flow rules**:
- Text step: one primary action (`Continue`), keyboard shortcuts supported (`Enter` / `Space`)
- Exercise step: auto-complete on MIDI note match, then auto-advance after 700-1200 ms
- Lesson completion: one primary action (`Start Next Lesson`), no extra confirmation layer
- Manual back-navigation always available for review

**Implementation implication**:
- Add step transition state in lesson player (`idle -> completed -> advancing`) to avoid duplicate progress writes
- Debounce MIDI match handling so sustained notes do not trigger repeated completion events
- Track click-friction analytics (`manualClicks`, `autoAdvanceCount`, `backtrackCount`) per lesson session

---

## Research Key: Musician Selection UX

**Question**: Should musicians be shown as a fixed grid of cards, or should the user be able to search/type freely?

**Decision**: Autocomplete search field backed by the `MusicianProfile` table. The search page also shows a curated genre-grouped browse view below the search field for discoverability.

**Rationale**:
- A fixed 4-card grid doesn't scale to a large roster (30+ musicians) without becoming a scroll wall
- Autocomplete lets users instantly find whoever they're thinking of without scanning
- Browse-by-genre below the search field surfaces pianists the user didn't know to search for
- The two modes serve different moods: "I know who I want" vs "show me what's available"

**Search behavior**:
- Triggers on 2+ characters typed
- Matches against `displayName` and `aliases` (e.g. "Stevie" matches Stevie Wonder; "Wonder" also matches)
- Returns max 8 results ranked by `sortOrder` + fuzzy name similarity
- If no match: shows "Request lessons for \"[typed name]\"" option

**Implementation**: `GET /api/musician-styles?search=stevie` for autocomplete results; full roster grouped by genre for the browse view.

---

## Research Key: Custom Musician Requests

**Question**: What happens when a user types a pianist not in the pre-seeded roster?

**Decision**: The user can request lessons for any pianist name. The system generates a `MusicianProfile` on the fly using a separate AI call ("profile generation"), then generates the curriculum as normal. The profile is saved to the DB (with `isCustom: true`, `isActive: false` so it doesn't appear in global browse) and reused if the same name is requested again.

**Rationale**:
- The AI has broad knowledge of piano musicians across all genres — it can synthesize `genre`, `era`, `signatureTechniques`, `exampleSongs`, `preferredKeys` for any real pianist
- Blocking unknown pianists would frustrate users who have a specific mentor in mind
- Saving generated profiles prevents redundant AI calls if multiple users want the same obscure artist
- `isActive: false` keeps custom profiles out of the curated browse view (admin can promote them if popular)

**Profile generation flow**:
1. User types a name not in DB → "Generate lessons with [Name]" button
2. `POST /api/musician-styles/request` with `{ name: string, genre?: string }`
3. API calls OpenAI to generate a `MusicianProfile`-shaped object (displayName, slug, genre, era, tagline, signatureTechniques, exampleSongs, preferredKeys, promptTemplate)
4. Profile saved to DB with `isCustom: true`, `isActive: false`, `promptVersion: 1`
5. Redirect to `/styles/[generated-slug]` and immediately trigger curriculum generation

**Edge case**: If the AI can't find enough information to generate a credible profile (very obscure, fictional, or non-pianist), return a friendly error: "We don't have enough information about [Name] as a pianist. Try a different name or choose from our roster."

---

## Research Key: Seed Roster Size and Genre Coverage

**Question**: How many musicians should be pre-seeded and which genres?

**Decision**: ~30 musicians across 8 genre categories. Seed file lives at `prisma/seed/musicianProfiles.ts`.

**Genre categories and representative artists** (not exhaustive — full list in seed file):

| Genre | Example Artists |
|-------|-----------------|
| Soul / R&B | Stevie Wonder, Ray Charles, Alicia Keys |
| Jazz | Herbie Hancock, Thelonious Monk, Oscar Peterson, Bill Evans, Chick Corea |
| Classic Rock | Elton John, Billy Joel, Jerry Lee Lewis |
| Pop / Singer-Songwriter | Paul McCartney, Carole King, Norah Jones |
| Gospel / Blues | Nina Simone, Dr. John, Professor Longhair |
| Classical (crossover) | Keith Jarrett, Yuja Wang |
| Latin / World | Chucho Valdés, Michel Camilo |
| Funk / Neo-Soul | Booker T. Jones, Robert Glasper |

**Rationale**: Genre diversity prevents the feature from feeling like a "soul piano" app. Users from any background should see a pianist they're excited about in the browse view.

---

## Research Key: Entitlement for Curriculum Count

**Question**: Is there a per-musician generation limit?

**Decision**: No per-musician limit. Each batch generation call (initial or continuation) debits one `aiGenerationsPerMonth` usage event. The student continues generating new lesson batches as long as they have quota remaining.

---
