# Architecture

## System Shape

ProgressionLab uses a Next.js App Router application for the main product and a separate Next.js deployment for admin operations.

Core architectural layers:

- UI and route handlers in `app/`
- Feature modules in `features/`
- Shared UI primitives in `components/`
- Runtime services and utilities in `lib/`
- Data model and migrations in `prisma/`
- Standalone admin app in `admin-dashboard/`

## Runtime Components

| Component | Responsibility |
|---|---|
| Main app | User-facing generator, playback, library, sharing |
| API routes | Auth, AI generation, progression CRUD, sharing endpoints |
| Prisma + Postgres | Persistence for users, progressions, prompt versions, billing data |
| OpenAI integration | Structured JSON generation for chord suggestions |
| Audio engine | Tone.js playback and chord audition |
| Admin dashboard | Prompt management, pricing and operational admin controls |

## Main Request Flows

### AI Generation Flow

1. Client submits normalized input to `POST /api/chord-suggestions`.
2. Route validates auth, entitlement, and request body.
3. Route resolves active prompt template from DB with fallback.
4. OpenAI Responses API returns strict JSON-schema output.
5. Route normalizes voicings and returns typed payload.

### Progression Library Flow

1. Authenticated user creates or updates progression records.
2. Public records are exposed through sharing endpoints.
3. Share pages render SEO and social metadata from saved entities.

## Admin Split

Admin is intentionally separated for stronger operational isolation and independent deploy cadence.

- Admin app path: `admin-dashboard/`
- Local command: `yarn admin:dev`
- Admin docs: `admin-dashboard/README.md`

## Related Pages

- API: `API`
- Database: `Database`
- Development: `Development`
- Prompt lifecycle: `Features-Prompt-Versioning`
