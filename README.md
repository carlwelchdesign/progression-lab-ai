# ProgressionLab

ProgressionLab is an AI-assisted harmony and songwriting workspace built with Next.js App Router. It generates chord suggestions and progression ideas from your inputs, provides playable piano/guitar voicings, and supports account-based saving, filtering, and sharing of progressions.

## Current Product Capabilities

- Generator form with react-hook-form validation
- Multi-chip autocomplete inputs for seed chords and mood
- Randomize Inputs action for quick idea generation
	- Random seed chord count: 1 to 7
	- Random mood tag count: 1 to 7
	- Random mode, genre, instrument, and adventurousness
- AI-generated output sections:
	- Next chord suggestions
	- Progression ideas
	- Structure suggestions
- Playable voicings:
	- Play single chord voicings
	- Play full progression voicings
	- Stop currently playing audio before new playback starts
	- Global BPM-driven playback timing
	- Piano sampler playback via Tone.js Salamander samples
	- Slight strum timing for more humanized chord playback
- Visual diagrams:
	- Piano chord diagrams
	- Guitar chord diagrams (theme-aware in light/dark mode)
- Authentication:
	- Register, login, logout, session-based auth
- Progression persistence:
	- Save progressions with chords, voicings, feel, scale, genre, notes, tags, and visibility
	- Authenticated "My Progressions" page with filters and chip-based autocomplete
	- Public progressions browser accessible from nav bar (no login required)
	- Clear Filters action
	- Per-card delete loading state
- Sharing:
	- Public share links
	- Public progression browsing with tag/key filters
- Diagram instrument selector:
	- Sticky theme-aware selector for piano/guitar diagram modes
	- Semi-transparent frosted-glass background with gradient selected state
	- Smooth scroll position restoration when switching diagrams
	- Available in both generator and loaded progression views
- MIDI export:
	- Download single chord voicings as .mid
	- Download full progression voicings as .mid
	- Generator BPM is applied to both playback and MIDI export
	- Reusable icon-based MIDI action button across sections
- Link preview/metadata:
	- Open Graph and Twitter image routes for richer link previews in sharing apps
- Footer links:
	- Site-wide footer with icon links to GitHub repository and LinkedIn profile
- Access control:
	- Unauthenticated users can browse public progressions
	- In-page "My Progressions" button routes unauth users to registration flow
	- Pre-populated register mode with contextual prompt
- Restore flow:
	- Open saved/shared progression back into generator with form values restored

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Material UI 7
- react-hook-form
- OpenAI API (structured JSON output)
- Prisma ORM + PostgreSQL
- Tone.js
- piano-chart
- svguitar

## Project Structure

- app/page.tsx: Main generator UI and AI request flow
- app/progressions/page.tsx: My/Public progression browser and filters
- app/p/[shareId]/page.tsx: Shared progression landing page
- app/api/chord-suggestions/route.ts: AI generation endpoint
- app/api/auth/*: Auth endpoints
- app/api/progressions/*: Authenticated progression CRUD endpoints
- app/api/shared/*: Public progression endpoints
- components/: Reusable UI, diagrams, and dialogs
- lib/: API clients, auth helpers, option sets, metadata, and types
- prisma/: Schema, migrations, and seed script

## API Overview

### AI

- POST /api/chord-suggestions

## OpenAI Implementation Notes

The AI layer is intentionally implemented as a strict contract instead of free-form text generation.

How it works:

1. The generator submits normalized input to `POST /api/chord-suggestions`.
2. The route calls OpenAI Responses API with explicit instructions for harmonic behavior and voicing constraints.
3. The response is forced into a strict JSON schema using `text.format = { type: 'json_schema', strict: true }`.
4. The app parses that JSON and renders it directly into typed UI sections (next chords, progression ideas, structure).

Why this is reliable:

- Schema validation enforces exact shape and required fields.
- The model cannot return arbitrary prose outside the defined contract.
- Types for voicings and structural fields are predictable for rendering/playback.
- Parse failures and empty-output cases are explicitly handled in the route.

What the schema guarantees:

- `inputSummary` with normalized request context
- `nextChordSuggestions` with tension/confidence plus optional piano and guitar voicings
- `progressionIdeas` with matched `chords` and `pianoVoicings`
- `structureSuggestions` with constrained section names and bar ranges

Key file:

- `app/api/chord-suggestions/route.ts`

Example request payload:

```json
{
	"seedChords": ["Fmaj7", "F#m7"],
	"mood": "dreamy, uplifting",
	"mode": "dorian",
	"genre": "piano house",
	"instrument": "both",
	"adventurousness": "balanced"
}
```

Example response shape (abbreviated):

```json
{
	"inputSummary": {
		"seedChords": ["Fmaj7", "F#m7"],
		"mood": "dreamy, uplifting",
		"mode": "dorian",
		"genre": "piano house",
		"instrument": "both",
		"adventurousness": "balanced"
	},
	"nextChordSuggestions": [
		{
			"chord": "Gmaj7",
			"romanNumeral": "IImaj7",
			"functionExplanation": "Lifts the progression while keeping modal color.",
			"tensionLevel": 3,
			"confidence": 4,
			"voicingHint": "Keep upper voices close for smooth motion.",
			"pianoVoicing": {
				"leftHand": ["G2", "D3"],
				"rightHand": ["F#3", "B3", "D4", "G4"]
			},
			"guitarVoicing": {
				"title": "Gmaj7",
				"position": 3,
				"fingers": [
					{ "string": 6, "fret": 3, "finger": "2" },
					{ "string": 5, "fret": 2, "finger": "1" },
					{ "string": 4, "fret": 0, "finger": null }
				],
				"barres": []
			}
		}
	],
	"progressionIdeas": [
		{
			"label": "Lift and Resolve",
			"chords": ["Fmaj7", "F#m7", "Gmaj7", "Aadd9"],
			"feel": "Airy and modern",
			"performanceTip": "Accent the offbeats in the right hand.",
			"pianoVoicings": [
				{ "leftHand": ["F2", "C3"], "rightHand": ["E3", "A3", "C4", "F4"] }
			]
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

### Auth

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Progressions (authenticated)

- GET /api/progressions
- POST /api/progressions
- GET /api/progressions/[id]
- PUT /api/progressions/[id]
- DELETE /api/progressions/[id]

### Public/Sharing

- GET /api/shared
	- Supports query params:
		- tag: comma-separated tag filters
		- key: comma-separated first-chord filters
- GET /api/shared/[shareId]

## Data Model Snapshot

Core Prisma models:

- User
	- id, email, name, passwordHash, createdAt, updatedAt
- Progression
	- id, shareId, userId, title
	- chords (Json)
	- pianoVoicings (Json?)
	- feel (String?)
	- scale (String?)
	- genre (String?)
	- notes (String?)
	- tags (String[])
	- isPublic (Boolean)
	- createdAt, updatedAt

Latest schema addition:

- genre field is now persisted on Progression and restored into the generator when opening saved progressions.

## Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Required values:

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/progression_lab
AUTH_SECRET=replace_with_output_of_openssl_rand_base64_32
```

Generate AUTH_SECRET:

```bash
openssl rand -base64 32
```

## Local Development

Install dependencies:

```bash
yarn install
```

Run the app locally:

```bash
yarn dev
```

## Testing

Unit and component tests:

```bash
yarn test
```

End-to-end tests with Playwright:

```bash
yarn playwright install chromium
yarn test:e2e
```

Playwright reports and failure artifacts are written to dedicated generated folders:

- `playwright-report/`
- `test-results/`

These folders are ignored by git and should not be committed.

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
