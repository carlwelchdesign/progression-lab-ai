# Database

## Overview

Persistence is managed with Prisma and PostgreSQL.

Primary schema file:

- `prisma/schema.prisma`

Migration history:

- `prisma/migrations/`

## Core Domain Entities

| Entity | Purpose |
|---|---|
| User | Authentication identity and account metadata |
| Progression | Saved harmonic progressions and share metadata |
| PromptVersion | Versioned AI prompt templates with active/draft state |
| Billing entities | Subscription and entitlement related records |

## Schema and Migration Practices

1. Make schema changes in `prisma/schema.prisma`.
2. Create and review SQL migrations.
3. Apply migrations in staging before production.
4. Use `prisma migrate resolve` only for explicit recovery scenarios.

## Local Workflow

```bash
make db-generate
make db-push
make db-migrate-deploy
```

## Production Workflow

Recommended sequence:

```bash
make build
```

For Vercel-hosted app deploys, split the workflow:

```bash
make vercel-build
make db-migrate-deploy-safe
```

Run `make db-migrate-deploy-safe` from an environment with direct Postgres access and a valid `DIRECT_URL`.

For build verification without running DB migrations, use:

```bash
make build-app
```

## References

- Deployment runbook: `DEPLOYMENT.md`
- Prompt versioning runbook: `PROMPT_VERSIONING_RUNBOOK.md`
- Security deployment checks: `SECURITY_DEPLOYMENT.md`
