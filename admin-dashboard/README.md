# ProgressionLab Admin Dashboard

Standalone Next.js admin application for ProgressionLab.

## What It Includes

- Separate deployable app (independent of main product app and Storybook)
- Role-based access using `ADMIN` and `AUDITOR`
- MUI table for progression list browsing
- Click-to-view progression details
- Delete action restricted to `ADMIN`
- Email masking for `AUDITOR`

## Local Setup

1. Install dependencies:

```bash
yarn --cwd admin-dashboard install
```

2. Copy env file:

```bash
cp admin-dashboard/.env.local.example admin-dashboard/.env.local
```

3. Generate Prisma client for admin app:

```bash
yarn admin:db:generate
```

4. Seed a local ADMIN user:

```bash
yarn admin:seed
```

Default local credentials:

- Email: `demo@progressionlab.ai`
- Password: `Admin123!ChangeMe`

Optional overrides:

- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `ADMIN_SEED_NAME`

5. Start admin app:

```bash
yarn admin:dev
```

Or from inside the admin-dashboard directory:

```bash
make dev
```

Admin app runs at `http://localhost:3010`.

## Deployment

Deploy `admin-dashboard` as its own Vercel project (or equivalent) with root directory set to `admin-dashboard`.

**Build command** (set in Vercel project settings):

```
npm run build:deploy
```

This runs `prisma generate` then `next build`. It does **not** run `prisma migrate deploy` — migrations are owned by the main app and must be applied there before deploying admin.

Required env vars:

- `DATABASE_URL`
- `ADMIN_AUTH_SECRET`
- `WEBAUTHN_RP_ID`
- `WEBAUTHN_RP_NAME`
- `ADMIN_WEBAUTHN_ORIGIN`

## Notes

- This app authenticates directly against the shared `User` table.
- Only users with role `ADMIN` or `AUDITOR` can sign in.
- Admin hardware MFA will use WebAuthn with exact origin matching, so local development should
  keep the admin app running at the configured origin.
- The main app still owns schema migrations; keep Prisma schema in sync when role/data models change.
