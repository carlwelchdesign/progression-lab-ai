# ProgressionLab

> An AI-assisted harmony and songwriting workspace. Generate chord progressions, hear them instantly, and share them with the world.

[![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=flat&logo=storybook&logoColor=white)](https://storybook-progression-lab-ai.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MUI](https://img.shields.io/badge/MUI_v7-007FFF?style=flat&logo=mui&logoColor=white)](https://mui.com)

- Production: [https://progressionlab.app/](https://progressionlab.app/)
- Storybook: [https://storybook-progression-lab-ai.vercel.app](https://storybook-progression-lab-ai.vercel.app)
- Documentation Wiki: [https://github.com/carlwelchdesign/progression-lab-ai/wiki](https://github.com/carlwelchdesign/progression-lab-ai/wiki)

<img width="1221" height="1310" alt="image" src="https://github.com/user-attachments/assets/3bfbfba4-b2d5-4e60-9a86-8bdb4765ed48" />

## What It Does

ProgressionLab turns harmonic intent into playable music. Describe a mood, style reference, and mode, then the AI returns next chords, progression ideas, and structure suggestions, each with practical piano and guitar voicings.

## Core Features

- Generator: seed chords, mood tags, mode, genre, style reference, and adventurousness controls.
- Randomize: one-click creative input generation.
- Playback: BPM-aware preview with humanized timing and gated playback behavior.
- Diagrams: inline piano and guitar chord diagrams.
- Export: MIDI and PDF export.
- Library: save and filter progressions by tags and harmonic context.
- Sharing: public progression links via `shareId` pages.
- Auth: session-based auth for protected actions while preserving a public browse flow.

## Separate Admin Deployment

This repository includes a standalone admin app in [admin-dashboard](admin-dashboard) that is deployed independently from the main app.

- Admin local dev: `yarn admin:dev`
- Admin lint: `yarn admin:lint`
- Admin build: `yarn admin:build`

See [admin-dashboard/README.md](admin-dashboard/README.md) for admin setup and deployment details.

## Quick Start

1. Install dependencies.

```bash
yarn install
```

2. Create your local environment file.

```bash
cp .env.local.example .env.local
```

3. Start local services and database.

```bash
docker-compose up -d
yarn db:push
yarn db:seed
```

4. Run the app.

```bash
yarn dev
```

Main app: `http://localhost:3000`

5. Optional billing webhook forwarding.

```bash
./scripts/stripe-listen-local.sh
```

Print webhook secret only:

```bash
./scripts/stripe-listen-local.sh --print-secret
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Material UI v7 |
| AI | OpenAI Responses API with strict JSON schema output |
| ORM | Prisma + PostgreSQL |
| Audio | Tone.js (Salamander samples) |
| Testing | Jest, React Testing Library, Playwright |
| Observability | Sentry |

Deep technical docs now live in the wiki: [Architecture](https://github.com/carlwelchdesign/progression-lab-ai/wiki/Architecture).

## Project Structure

```text
app/                  # Next.js app routes and API handlers
features/             # Feature-level UI and logic modules
components/           # Shared UI primitives and wrappers
lib/                  # Runtime utilities (auth, db, billing, AI helpers)
prisma/               # Database schema and migrations
admin-dashboard/      # Standalone admin application
```

## Key Documentation

| Topic | Link |
|---|---|
| Wiki Home | https://github.com/carlwelchdesign/progression-lab-ai/wiki |
| Architecture | https://github.com/carlwelchdesign/progression-lab-ai/wiki/Architecture |
| API Reference | https://github.com/carlwelchdesign/progression-lab-ai/wiki/API |
| Database Schema | https://github.com/carlwelchdesign/progression-lab-ai/wiki/Database |
| Development Setup | https://github.com/carlwelchdesign/progression-lab-ai/wiki/Development |
| Deployment Guide | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Prompt Versioning Runbook | [PROMPT_VERSIONING_RUNBOOK.md](PROMPT_VERSIONING_RUNBOOK.md) |
| Security Overview | https://github.com/carlwelchdesign/progression-lab-ai/wiki/Security |
| Security Audit | [SECURITY_AUDIT_2025.md](SECURITY_AUDIT_2025.md) |
| Security Deployment Checklist | [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) |

The migration map for moved README sections is tracked in [docs/README_TO_WIKI_MAP.md](docs/README_TO_WIKI_MAP.md).

## Common Commands

```bash
yarn dev
yarn build
yarn start
yarn lint:check
yarn lint:fix
yarn test
yarn test:e2e
yarn db:generate
yarn db:push
yarn db:studio
yarn wiki:publish
```

## Contributing

1. Create a feature branch.
2. Make your changes with tests where applicable.
3. Run checks before opening a PR.

```bash
yarn lint:check
yarn test
yarn build
```

4. Open a pull request with a clear summary and validation notes.

## Roadmap Snapshot

Completed recently:

- [x] Expanded playback controls (tempo-aware playback + stop behavior)
- [x] MIDI and PDF export support
- [x] Rich social previews

Next up:

- [ ] Saved progression edit flow
- [ ] Pagination for large progression libraries
- [ ] Additional playback controls (loop toggle and dedicated stop UI)
