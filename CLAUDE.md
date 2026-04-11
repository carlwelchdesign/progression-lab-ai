# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ProgressionLab** is an AI-assisted harmony and songwriting workspace. It has two deployable Next.js apps sharing one PostgreSQL database via Prisma:

- **Main app** (`/`, port 3000) — chord generation, progressions, arrangements, auth, billing
- **Admin dashboard** (`/admin-dashboard/`, port 3010) — CMS, analytics, prompt versioning, promo codes

## Commands

All common tasks are in `Makefile`. Use `make` rather than invoking tools directly.

```bash
make install              # Install dependencies (both apps)
make dev                  # Run main app (port 3000)
make admin-dev            # Run admin dashboard (port 3010)

make test                 # Jest unit/component tests
make test-e2e             # Playwright E2E tests
make test-e2e:mobile      # Mobile viewport E2E tests

make build                # Production build (Prisma generate + migrate + app build)
make vercel-build         # Vercel-safe build (generate + build, no migrate)

make db-generate          # Generate Prisma client
make db-push              # Push schema to dev DB (no migrations)
make db-seed              # Seed admin user + defaults
make db-studio            # Prisma Studio GUI
make db-migrate-deploy-safe  # Run migrations in production
```

Unit tests use Jest (`jest.config.js`). To run a single test file:
```bash
yarn jest path/to/file.test.ts
```

E2E tests use Playwright (`playwright.config.ts`) with page-object pattern in `/e2e/`.

## Architecture

### Key Structural Patterns

**Features vs Components:** UI is organized into feature modules (`/features/*`) that own their own components, hooks, and types. `/components/` holds shared UI primitives.

**API Routes:** All backend logic lives in `/app/api/`. Each route does: auth check → entitlement check → business logic → response.

**Database:** Prisma schema at `/prisma/schema.prisma` is authoritative. Main app owns migrations; admin app reads the same DB without touching migrations. Prisma middleware enforces user isolation (queries filtered by `userId`).

**Session auth:** Cookie-based sessions (`progressionlab_session`) signed with HMAC-SHA256. Session contains `userId`, `email`, `role`, expiration. Admin sessions use a separate cookie and `ADMIN_AUTH_SECRET`. WebAuthn (SimpleWebAuthn) is required for admins and optional for users.

**Entitlements:** Plan-based feature access lives in `/lib/entitlements.ts`. Plans: SESSION (free), COMPOSER, STUDIO, COMP, INVITE. Always check entitlements at the API boundary.

**AI Integration:** OpenAI Responses API with strict JSON schema validation. Prompts are DB-versioned (`PromptVersion` table) via `/lib/promptVersionConfig.ts` with hardcoded fallback for resilience. Prompt key: `chord_suggestions`.

**Billing:** Stripe subscriptions synced via webhooks (`/app/api/billing/webhooks/`). Promo codes support DISCOUNT (percentage/dollar off) and INVITE (temporary plan grants). Usage quotas tracked per-month in `UsageEvent` table.

**Admin CMS:** Marketing content (homepage, pricing, nav/footer) is DB-versioned with draft/publish/rollback and AI-assisted translation. Stale-draft detection when English source changes.

### Tech Stack

- **Framework:** Next.js 15 App Router, React 19, TypeScript 5.8
- **UI:** Material-UI v7 + Emotion
- **ORM:** Prisma 5.10 + PostgreSQL
- **AI:** OpenAI API (gpt-4o / gpt-3.5-turbo)
- **Audio:** Tone.js (Salamander piano samples)
- **Billing:** Stripe
- **Auth:** Custom HMAC sessions + WebAuthn (SimpleWebAuthn)
- **Export:** jsPDF, @tonejs/midi, SvGuitar
- **i18n:** i18next + react-i18next
- **Observability:** Sentry
- **Package manager:** Yarn 1.x

### Security Headers

`/middleware.ts` sets CSP, HSTS, X-Frame-Options, and X-Content-Type-Options on all responses. Rate limiting on auth endpoints (10 attempts / 15 min) is in-memory — needs Redis for distributed deployments.

## Environment Variables

**Main app** (`.env.local`):
- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL (direct URL needed for Vercel Postgres migrations)
- `AUTH_SECRET` — HMAC session signing
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, `WEBAUTHN_ORIGIN`
- `NEXT_PUBLIC_SENTRY_DSN`

**Admin app** (same DB, separate auth):
- `ADMIN_AUTH_SECRET`, `ADMIN_WEBAUTHN_ORIGIN`

## Deployment

- Main app: Vercel, build command `make vercel-build`
- Admin: Separate Vercel project with root dir `admin-dashboard/`
- Migrations run separately via `make db-migrate-deploy-safe` (never during Vercel build)
