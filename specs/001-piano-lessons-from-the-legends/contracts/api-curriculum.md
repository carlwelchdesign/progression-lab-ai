# API Contracts: Musician Styles / Lesson Curriculum

**Branch**: `001-piano-lessons-from-the-legends`  
**Date**: 2026-04-13

---

## GET /api/musician-styles

List active musician profiles, grouped by genre. Supports autocomplete search.

**Auth**: Required

**Query params**:
- `search` (optional) — filter by name/alias, 2+ chars, returns max 8 results
- `genre` (optional) — filter to a single genre category

**Response 200 (no search param)** — grouped for browse view:
```json
{
  "genres": [
    {
      "label": "Jazz",
      "musicians": [ /* MusicianProfileSummary[] */ ]
    }
  ]
}
```

**Response 200 (with `search` param)** — flat list for autocomplete:
```json
[
  { /* MusicianProfileSummary */ },
  { /* MusicianProfileSummary */ }
]
```

**Error responses**: 401 Unauthorized

---

## POST /api/musician-styles/request

Request lessons for a pianist not in the pre-seeded roster. Generates a musician profile via AI, saves it to DB, and returns the profile so the client can immediately redirect to the lesson player.

**Auth**: Required

**Request body**:
```json
{
  "name": "Thelonious Monk",
  "genre": "Jazz"
}
```

- `name`: required — pianist name as typed by user
- `genre`: optional — helps AI if the name is ambiguous

**Response 201**:
```json
{
  "slug": "thelonious-monk",
  "displayName": "Thelonious Monk",
  "genre": "Jazz",
  "era": "1940s–1970s",
  "tagline": "...",
  "isCustom": true
}
```

**Error responses**:
```json
{ "message": "Unauthorized" }                         // 401
{ "code": "PROFILE_ALREADY_EXISTS",
  "slug": "thelonious-monk" }                         // 409 — redirect client to existing profile
{ "code": "INSUFFICIENT_INFORMATION",
  "message": "We couldn't find enough information about [Name] as a pianist." }  // 422
```

---

## GET /api/musician-styles/[slug]

Get a single musician profile plus the user's cached curriculum (if any).

**Auth**: Required

**Path params**: `slug` — musician slug (e.g. `stevie-wonder`)

**Response 200**:
```json
{
  "musician": { /* MusicianProfileSummary — same shape as roster item */ },
  "curriculum": {
    "musicianIntro": "Stevie Wonder didn't just play piano — he rewrote what a keyboard could feel like...",
    "skillLevelAssessment": "Based on your progress, we're starting at beginner level...",
    "lessons": [
      {
        "id": "stevie-wonder-lesson-1",
        "title": "The Eb Universe: Why Stevie Lives in Flat Keys",
        "estimatedMinutes": 8,
        "steps": [
          {
            "type": "text",
            "heading": "Here's the thing about Eb",
            "body": "Stevie Wonder wrote Superstition in Eb...",
            "tip": "Most pop music stays in C or G. Stevie chose Eb deliberately — it's warmer, darker, and sits perfectly under black keys."
          },
          {
            "type": "exercise",
            "exercise": {
              "id": "sw-ex-1-1",
              "prompt": "Play an Eb major scale with your right hand, starting on Eb4.",
              "chord": "Eb",
              "hint": "Start on Eb — the black key just left of the two-black-key group.",
              "targetNotes": ["Eb4", "F4", "G4", "Ab4", "Bb4", "C5", "D5", "Eb5"]
            }
          }
        ]
      }
    ]
  },
  "curriculumStale": false
}
```

**curriculum is null** when no curriculum has been generated yet for this user/musician pair.  
**curriculumStale is true** when `cached.promptVersion < musician.promptVersion`.  
**The `lessons` array grows over time** — contains all lessons from all batches, oldest first.

**Error responses**: 401 Unauthorized, 404 Not Found

---

## POST /api/musician-styles/[slug]/curriculum

Generate the initial batch of lessons, or generate the **next batch** when the student has completed all current lessons.

**Auth**: Required

**Path params**: `slug` — musician slug

**Request body**:
```json
{
  "force": false
}
```

- `force: false` (default): Generate initial curriculum if none exists. Generate next batch if user has completed all current lessons. No-op (returns cached) if uncompleted lessons remain.
- `force: true`: Always generate a new batch regardless of completion state. Costs one `AI_GENERATION` usage event.

**Response 200** — full updated `GeneratedCurriculumData` with new lessons appended.

```json
{
  "musicianIntro": "...",
  "skillLevelAssessment": "...",
  "currentBatch": 2,
  "lessons": [
    { "id": "stevie-wonder-lesson-1", "batchNumber": 1, "skillLevel": "beginner", ... },
    { "id": "stevie-wonder-lesson-2", "batchNumber": 1, "skillLevel": "beginner", ... },
    { "id": "stevie-wonder-lesson-3", "batchNumber": 1, "skillLevel": "beginner", ... },
    { "id": "stevie-wonder-lesson-4", "batchNumber": 2, "skillLevel": "intermediate", ... }
  ]
}
```

**Error responses**:
```json
{ "message": "Unauthorized" }                          // 401
{ "message": "Musician not found" }                    // 404
{ "code": "AI_GENERATION_LIMIT_REACHED",
  "message": "You have reached your monthly AI generation limit for this plan",
  "plan": "SESSION", "limit": 10, "used": 10 }         // 402
```

---

## POST /api/lessons/progress

Upsert lesson progress for the authenticated user. Called when a step is completed and when the full lesson is completed.

**Auth**: Required

**Request body**:
```json
{
  "lessonId": "stevie-wonder-lesson-1",
  "completed": true,
  "stepIndex": 5,
  "attempts": 3,
  "autoAdvance": true,
  "midiSession": {
    "notesPlayed": 42,
    "exercisesCompleted": 2,
    "lastConnectedDevice": "Arturia KeyLab 49"
  }
}
```

- `autoAdvance`: optional, true when step completion was triggered automatically by MIDI match (used for click-friction analytics)

**Response 200**:
```json
{
  "id": "cuid",
  "lessonId": "stevie-wonder-lesson-1",
  "completed": true,
  "completedAt": "2026-04-13T10:00:00.000Z",
  "attempts": 3,
  "nextStepIndex": 6
}
```

- `nextStepIndex`: index client should navigate to for fluid progression; null when lesson is complete

**Error responses**: 401 Unauthorized, 400 Bad Request (missing lessonId)

---

## JSON Schema for OpenAI Responses API

Used with `type: 'json_schema', strict: true` to constrain AI output to `GeneratedCurriculumData` shape. Lives at `app/api/musician-styles/curriculumSchema.ts`.

Key constraints enforced by schema:
- All fields required with no `additionalProperties`
- Each step has `type: 'text' | 'exercise'`
- Exercise chord must be a valid chord symbol string
- `targetNotes` is **required** and non-empty — every exercise step must include MIDI-matchable notes
- `batchNumber` and `skillLevel` required on each lesson
