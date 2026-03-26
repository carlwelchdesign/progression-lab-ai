# ProgressionLab

> An AI-assisted harmony and songwriting workspace — generate chord progressions, hear them instantly, and share them with the world.

- Production: [https://progression-lab-ai.vercel.app](https://progression-lab-ai.vercel.app)
- Storybook Docs: [https://storybook-progression-lab-ai.vercel.app](https://storybook-progression-lab-ai.vercel.app)

---

[![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=flat&logo=storybook&logoColor=white)](https://storybook-progression-lab-ai.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MUI](https://img.shields.io/badge/MUI_v7-007FFF?style=flat&logo=mui&logoColor=white)](https://mui.com)

---

<img width="1221" height="1310" alt="image" src="https://github.com/user-attachments/assets/3bfbfba4-b2d5-4e60-9a86-8bdb4765ed48" />

---

## Overview

ProgressionLab turns harmonic intent into playable music. Describe a mood, a style reference, a mode — and the AI returns chord suggestions, full progression ideas, and structure recommendations, each with piano and guitar voicings ready to play or export.

---

## Features

### Generator

- Structured input form: seed chords, mood tags, mode, genre, style reference, and adventurousness level
- **Randomize** action generates a full set of varied inputs in one click (1–7 seed chords and mood tags)
- AI returns three output sections simultaneously:
  - **Next Chord Suggestions** — individual chord recommendations with roman numeral, tension level, confidence score, and a voicing hint
  - **Progression Ideas** — complete chord sequences with a descriptive feel and performance tip
  - **Structure Suggestions** — song section layout (verse/chorus/bridge) mapped to bar counts and harmonic ideas

### Playback

- BPM-controlled playback for individual chords and full progressions
- Piano sampler powered by Tone.js with Salamander grand piano samples
- Humanized strum timing for a more natural chord attack
- Playback is gated — starting a new chord stops any currently playing audio

### Visual Diagrams

- **Piano chord diagrams** rendered inline via `piano-chart`
- **Guitar chord diagrams** rendered via `svguitar`, fully theme-aware (light/dark)
- Sticky instrument toggle (piano/guitar) with frosted-glass styling and smooth scroll restoration

### Export

- Download individual chords or full progressions as `.mid` files
- BPM from the generator is baked into MIDI timing
- PDF export for chord charts

### Progression Library

- Save progressions with title, chords, voicings, feel, scale, mode, genre, notes, tags, and visibility
- **My Progressions** — authenticated view with chip-based tag/key filters
- **Public Feed** — browsable without an account; filterable by tag and first chord
- One-click restore: load any saved or shared progression back into the generator with all form values pre-filled

### Sharing

- Every saved progression gets a unique `shareId`
- Public share URLs (`/p/[shareId]`) with full Open Graph and Twitter Card metadata for rich link previews

### Auth & Access Control

- Session-based authentication (register, login, logout)
- Unauthenticated users can browse the public feed
- Contextual registration prompt when an unauth user tries to access protected features

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Material UI v7 |
| Forms | react-hook-form |
| AI | OpenAI API — structured JSON output via `json_schema` |
| ORM | Prisma + PostgreSQL |
| Audio | Tone.js (Salamander samples) |
| Diagrams | piano-chart, svguitar |
| PDF | jsPDF + jspdf-autotable |
| Testing | Jest, React Testing Library, Playwright |
| Component Docs | Storybook 10 (deployed via Vercel) |
| Error Monitoring | Sentry |

---

## Project Structure

```
app/
  page.tsx                         # Main generator UI
  progressions/page.tsx            # My / Public progression browser
  p/[shareId]/page.tsx             # Shared progression landing page
  api/
    chord-suggestions/route.ts     # AI generation endpoint
    auth/                          # register, login, logout, me
    progressions/                  # Authenticated CRUD
    shared/                        # Public read endpoints
features/
  generator/                       # Generator form, playback, diagrams
  progressions/                    # Progression list and cards
components/
  ui/                              # Primitive UI components
lib/
  audio.ts                         # Tone.js playback engine
  midi.ts                          # MIDI file generation
  pdf.ts                           # PDF chart export
  auth.ts / authContext.tsx        # Session helpers
  prisma.ts                        # Prisma client singleton
prisma/
  schema.prisma                    # Data model
  migrations/                      # Migration history
```

---

## AI Design

The AI layer is a **strict-contract integration**, not free-form text generation.

1. The client submits a normalized payload to `POST /api/chord-suggestions`
2. The route calls the OpenAI Responses API with harmonic system instructions
3. The response is constrained with `text.format = { type: 'json_schema', strict: true }`
4. The parsed output maps directly to typed UI sections — no post-processing heuristics

**Schema guarantees:**

| Field | Description |
|---|---|
| `inputSummary` | Echo of normalized request context |
| `nextChordSuggestions` | Chord, roman numeral, tension (1–5), confidence (1–5), optional piano + guitar voicings |
| `progressionIdeas` | Chord sequence, feel description, performance tip, piano voicings |
| `structureSuggestions` | Section name, bar count, harmonic idea |

<details>
<summary>Example request / response</summary>

**Request:**
```json
{
  "seedChords": ["Fmaj7", "F#m7"],
  "mood": "dreamy, uplifting",
  "mode": "dorian",
  "genre": "piano house",
  "styleReference": "Barry Harris",
  "instrument": "both",
  "adventurousness": "balanced"
}
```

**Response (abbreviated):**
```json
{
  "nextChordSuggestions": [
    {
      "chord": "Gmaj7",
      "romanNumeral": "IImaj7",
      "functionExplanation": "Lifts the progression while keeping modal color.",
      "tensionLevel": 3,
      "confidence": 4,
      "pianoVoicing": {
        "leftHand": ["G2", "D3"],
        "rightHand": ["F#3", "B3", "D4", "G4"]
      }
    }
  ],
  "progressionIdeas": [
    {
      "label": "Lift and Resolve",
      "chords": ["Fmaj7", "F#m7", "Gmaj7", "Aadd9"],
      "feel": "Airy and modern",
      "performanceTip": "Accent the offbeats in the right hand."
    }
  ],
  "structureSuggestions": [
    {
      "section": "verse",
      "bars": 8,
      "harmonicIdea": "Cycle through the first 4 chords with sparse voicings."
    }
  ]
}
```
</details>

---

## API Reference

### Auth
| Method | Endpoint |
|---|---|
| `POST` | `/api/auth/register` |
| `POST` | `/api/auth/login` |
| `POST` | `/api/auth/logout` |
| `GET` | `/api/auth/me` |

### AI Generation
| Method | Endpoint |
|---|---|
| `POST` | `/api/chord-suggestions` |

### Progressions (authenticated)
| Method | Endpoint |
|---|---|
| `GET` | `/api/progressions` |
| `POST` | `/api/progressions` |
| `GET` | `/api/progressions/[id]` |
| `PUT` | `/api/progressions/[id]` |
| `DELETE` | `/api/progressions/[id]` |

### Public / Sharing
| Method | Endpoint | Query params |
|---|---|---|
| `GET` | `/api/shared` | `tag` (comma-separated), `key` (comma-separated first chord) |
| `GET` | `/api/shared/[shareId]` | — |

---

## Data Model

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String?
  passwordHash String
  progressions Progression[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Progression {
  id            String   @id @default(cuid())
  shareId       String   @unique @default(cuid())
  userId        String
  title         String
  chords        Json
  pianoVoicings Json?
  feel          String?
  scale         String?
  genre         String?
  notes         String?
  tags          String[]
  isPublic      Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## Local Development

**1. Clone and install**
```bash
yarn install
```

**2. Configure environment**
```bash
cp .env.local.example .env.local
```

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/progression_lab
AUTH_SECRET=      # generate with: openssl rand -base64 32
```

**3. Start the database**
```bash
docker-compose up -d
```

**4. Run migrations and seed**
```bash
yarn db:push
yarn db:seed
```

**5. Start the dev server**
```bash
yarn dev
```

App runs at `http://localhost:3000`.

---

## Testing

```bash
# Unit + component tests
yarn test

# Watch mode
yarn test:watch

# Coverage
yarn test:coverage

# End-to-end (Playwright)
yarn playwright install chromium
yarn test:e2e
```

---

## Storybook

Component documentation is co-located with source files and published via Vercel.

```bash
# Dev server
yarn storybook          # http://localhost:6006

# Static build
yarn build-storybook    # output: storybook-static/
```

Start local Postgres via Docker:

```bash
make docker-up
```

Generate Prisma client and apply migrations:

```bash
yarn db:generate
npx prisma migrate deploy
```

Run the app:

```bash
yarn dev
```

Open http://localhost:3000

## Common Commands

- yarn dev
- yarn build
- yarn start
- yarn lint:check
- yarn lint:fix
- yarn test
- yarn db:generate
- yarn db:push
- yarn db:studio

Makefile shortcuts are also available for install/dev/build/deploy workflows.

## Build and Deployment Notes

- Production builds run best after Prisma client generation and migration deploy.
- Recommended production sequence:

```bash
npx prisma generate
npx prisma migrate deploy
yarn build
```

- Vercel helpers exist in Makefile:
	- make vercel-link
	- make vercel-pull
	- make vercel-preview
	- make vercel-prod
	- make vercel-prod-with-migrate

## Testing

- Jest + React Testing Library are configured.
- Primary coverage includes generator behavior and API route validation patterns.

## TODO / Roadmap

Completed recently:

- [x] Expanded playback controls (tempo-aware playback + stop behavior)
- [x] Export options (MIDI download for chords/progressions)
- [x] Rich social previews (Open Graph + Twitter images)
- [x] Footer social links with icon actions

Next up:

- [ ] Saved progression edit flow
- [ ] Pagination for large progression libraries
- [ ] Additional playback controls (loop toggle / dedicated stop UI)
- [ ] Optional DAW workflow improvements (for example drag/drop helpers where supported)
