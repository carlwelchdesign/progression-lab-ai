# Feature Spec: Piano Lessons from the Legends

**Feature**: 001-piano-lessons-from-the-legends  
**Branch**: `001-piano-lessons-from-the-legends`  
**Date**: 2026-04-13

---

## Problem Statement

ProgressionLab has powerful chord generation tools, but no structured learning path that connects musical theory to the real artists and songs users already love. Users learn abstract theory but don't know *why* Stevie Wonder chooses minor 9ths, or *how* Elton John's left-hand patterns create that iconic full-band sound from just a piano.

If we can teach in the voice and context of great musicians — using their actual songs, their characteristic keys, their specific techniques — theory becomes memorable rather than academic.

---

## System Requirements

**MIDI keyboard required.** This feature is designed around hands-on piano practice. A connected MIDI keyboard is required to complete exercise steps. The lesson player will prompt for MIDI device connection before exercises can be started, and exercise completion is confirmed by playing the correct notes.

---

## Goal

Build "Piano Lessons from the Legends": a feature where authenticated users connect a MIDI keyboard, search for any pianist they want to learn from, and receive an AI-generated curriculum that grows with them. The app ships with a large pre-seeded roster of pianists across all major genres. If a user's preferred pianist isn't in the roster, they can request lessons for any name — the AI generates a musician profile and curriculum on the fly. The legend acts as a **continuing mentor** — lessons are generated in batches and new lessons are unlocked as the student advances, with no fixed cap.

---

## User Stories

### Core Flow

**As a user**, I want to search for any pianist by name using an autocomplete field, so I can find the legend I'm most excited to learn from regardless of whether they're popular or niche.

**As a user**, I want the search to show results from a curated pre-seeded roster of pianists across classical, jazz, R&B, rock, gospel, soul, and pop genres, so I can discover pianists I might not have thought of.

**As a user**, if the pianist I search for isn't in the roster, I want the app to offer to create a curriculum for them anyway — the AI will generate their style profile and lessons based on their name and genre.

**As a user**, I want to see a musician's style profile (genre, era, signature techniques, example songs) before starting their curriculum, so I know what I'm getting into.

**As a user**, I want the AI to generate an initial set of lessons personalized to my assessed skill level, so I'm not starting from scratch if I've been using the app.

**As a user**, I want each lesson to feel like the musician is teaching me — conversational, enthusiastic, a bit of personality — not like reading a textbook.

**As a user**, I want each lesson to include something I can play immediately on my MIDI keyboard: a scale pattern, a chord voicing, or a short progression, shown on an interactive piano diagram. Exercise steps are confirmed by playing the correct notes.

**As a user**, I want step progression to feel automatic and fluid, so I am focused on learning rather than repeatedly clicking next buttons.

**As a user**, I want to mark lessons as complete and see my progress across a musician's curriculum.

**As a user**, when I complete all available lessons for a musician, I want the next batch of lessons to be generated automatically so my learning never hits a dead end.

**As a user**, I want my skill level to advance as I complete lessons, so later batches challenge me appropriately rather than repeating beginner material.

**As a user**, I want to be notified when the musician's prompt template has been updated, and choose whether to regenerate my curriculum from the current point.

### Retention / Engagement

**As a user**, I want to see how many lessons I've completed for a musician so I feel a sense of progress.

**As a user**, when I finish a lesson, I want a clear prompt to continue to the next one, so momentum carries through.

---

## Non-Goals (explicit exclusions for this feature)

- Advanced MIDI performance analysis (note velocity, timing accuracy grading) — MIDI is for completion detection only, not performance scoring
- Adaptive difficulty within a single lesson (skill level is assessed at batch generation time)
- User-authored lesson editing
- Video or audio recordings of musicians
- Multiplayer or social comparison features
- Subscription tier gate at launch (deferred — will be wired after lessons are validated in testing)
- Admin UI for managing the musician roster (seed file + DB tools only)

---

## What Makes Lessons Stick (Design Constraints)

Every lesson **must** follow this narrative arc:

1. **Hook** — A concrete story or "did you know" about this musician's specific choice  
   *e.g. "Stevie Wonder wrote Superstition in Eb because that's where his Clavinet sits most naturally. It's not arbitrary — he built a whole sonic world around that key."*

2. **The Concept** — One focused musical idea: a scale pattern, a specific chord voicing, or a characteristic progression. One thing — not three.

3. **Hear + See It** — The concept shown on an interactive piano diagram with the relevant notes highlighted. Playable via click.

4. **Try It** — A focused exercise: "Play this voicing in your left hand" or "Try this scale pattern up 2 octaves." Simple, specific, achievable.

5. **Why It Works** — A brief explanation of the theory behind the sound. This is the "click" moment — connecting what they just played to *why* it sounds like that musician.

6. **Real Song Connection** — "You just played a key component of [Song]. Next time you hear it, you'll recognize exactly what's happening."

---

## Interaction Flow Constraints

- Step progression should require at most one intentional click per step in normal use.
- Exercise steps auto-complete when required MIDI `targetNotes` are matched, then auto-advance after a short delay (700-1200 ms).
- Text steps use a single primary action (`Continue`) and support keyboard shortcut progression (`Enter` / `Space`).
- End-of-lesson progression uses a single primary action (`Start Next Lesson`) with no extra confirmation modal.
- Users can still manually go back to a previous step without losing progress.

---

## Curriculum Generation Rules

- **Initial generation**: Skill level assessed from the user's completed `LessonProgress` count (0–2 = beginner, 3–9 = intermediate, 10+ = advanced). First batch is 3 lessons.
- **Ongoing generation**: When the user completes the last available lesson for a musician, a new batch of 3 lessons is generated. Skill level is reassessed at each batch based on total completed lessons at that time.
- **Context carry-forward**: Each new batch generation sends a summary of previously completed lessons to the AI so lessons don't repeat concepts.
- **One curriculum per pair**: Lessons are appended to the same `GeneratedCurriculum` record — one per `(userId, musicianId)`. Lessons accumulate over time.
- **Prompt version staleness**: If `MusicianProfile.promptVersion` changes, the user is notified (not auto-regenerated). They may choose to start fresh (discards prior progress) or continue with existing lessons.
- **Generation cost**: Each batch generation (initial or continuation) counts as one `AI_GENERATION` usage event.

---

## Success Criteria

- A user can find any pianist by typing 2+ characters in the search field and see matching results from the roster
- A user can request lessons for a pianist not in the pre-seeded roster, and lessons are generated within 15 seconds
- A user with a MIDI keyboard can complete the first 3 lessons for one musician and describe one specific thing that musician does differently from other pianists
- Generated lessons use the musician's name, reference their real songs, and include at least one MIDI-confirmed exercise per lesson
- No lesson is a wall of text: every lesson alternates between explanation and MIDI interaction
- Mean manual clicks per completed step is <= 1.2 in analytics for lesson sessions
- Progress is persisted: leaving and returning to a lesson picks up where you left off
- After completing the last available lesson, new lessons are generated and available within 15 seconds
- Skill level advances when thresholds are crossed, and later lesson batches are noticeably more challenging

---

## Out of Scope

- Subscription gating (deferred until lessons are validated — available to all authenticated users during development and testing; will be wired after launch validation)
- Admin musician management UI (musicians managed via seed/admin DB tools)
