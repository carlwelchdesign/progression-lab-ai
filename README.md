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
- Marketing CMS: admin-managed homepage, pricing, nav/footer, and progressions copy with draft, publish, and rollback versioning — no code deploys required for copy changes.
- AI Translation: OpenAI-assisted locale draft generation for all marketing surfaces, with mandatory human review before publish and stale-draft detection when English source changes.
- Persona Onboarding: post-register sample progression selector (Beginner / Intermediate / Professional) that pre-seeds the generator for the user's first session.
- Analytics: server-side funnel event ingestion with admin insights panel covering page views, auth, upgrade intent, and segment breakdowns by locale and persona.

## MFA and Security Keys

- Admin dashboard uses WebAuthn hardware MFA.
- `ADMIN` users are required to enroll and use a security key for login.
- `AUDITOR` users are prompted for key auth when they have enrolled credentials.
- Main app users can enroll and manage WebAuthn credentials from Settings > Security.
- Main app login requires key verification when an account has active WebAuthn credentials.
- Sensitive settings routes (`/settings/security`, `/settings/billing`) require an active session and redirect to `/auth` when logged out.

Required WebAuthn environment variables:

- `WEBAUTHN_RP_ID`
- `WEBAUTHN_RP_NAME`
- `WEBAUTHN_ORIGIN`

Admin dashboard additionally requires:

- `ADMIN_WEBAUTHN_ORIGIN`

## Separate Admin Deployment

This repository includes a standalone admin app in [admin-dashboard](admin-dashboard) that is deployed independently from the main app.

- Admin local dev: `make admin-dev`
- Admin lint: `make admin-lint`
- Admin build: `make admin-build`

See [admin-dashboard/README.md](admin-dashboard/README.md) for admin setup and deployment details.

## Quick Start

1. Install dependencies.

```bash
make install
```

2. Create your local environment file.

```bash
cp .env.local.example .env.local
```

3. Start local services and database.

```bash
docker-compose up -d
make db-push
make db-seed
```

4. Run the app.

```bash
make dev
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
| Marketing CMS | https://github.com/carlwelchdesign/progression-lab-ai/wiki/Features-Marketing-CMS |
| Analytics & Funnel Insights | https://github.com/carlwelchdesign/progression-lab-ai/wiki/Features-Analytics |
| Security Overview | https://github.com/carlwelchdesign/progression-lab-ai/wiki/Security |
| Security Audit | [SECURITY_AUDIT_2025.md](SECURITY_AUDIT_2025.md) |
| Security Deployment Checklist | [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) |

The migration map for moved README sections is tracked in [docs/README_TO_WIKI_MAP.md](docs/README_TO_WIKI_MAP.md).

## Common Commands

```bash
make dev
make build
make build-app
make start
make lint
make lint-fix
make test
make test-e2e
make db-generate
make db-push
make db-studio
make admin-dev
make admin-build
make wiki-publish
```

Prefer `make` as the default command surface for local workflows.

## Contributing

1. Create a feature branch.
2. Make your changes with tests where applicable.
3. Run checks before opening a PR.

```bash
make lint
make test
make build
```

4. Open a pull request with a clear summary and validation notes.

## Roadmap Snapshot

Completed recently:

- [x] Expanded playback controls (tempo-aware playback + stop behavior)
- [x] MIDI and PDF export support
- [x] Rich social previews
- [x] Admin-managed marketing CMS with per-locale draft/publish/rollback
- [x] AI-assisted translation workflow with stale-draft detection
- [x] Persona-based onboarding with generator pre-seeding
- [x] Analytics ingestion and admin funnel insights panel

Next up:

- [ ] Saved progression edit flow
- [ ] Pagination for large progression libraries
- [ ] Additional playback controls (loop toggle and dedicated stop UI)
