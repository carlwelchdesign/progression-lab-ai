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
- Visual diagrams:
	- Piano chord diagrams
	- Guitar chord diagrams (theme-aware in light/dark mode)
- Authentication:
	- Register, login, logout, session-based auth
- Progression persistence:
	- Save progressions with chords, voicings, feel, scale, genre, notes, tags, and visibility
	- My Progressions page with filters and chip-based autocomplete
	- Clear Filters action
	- Per-card delete loading state
- Sharing:
	- Public share links
	- Public progression browsing with tag/key filters
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

## Roadmap Ideas

- Saved progression edit flow
- Pagination for large progression libraries
- Expanded playback controls (tempo/loop/stop)
- Export options (MIDI/DAW-friendly formats)
