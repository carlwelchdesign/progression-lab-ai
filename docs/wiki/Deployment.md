# Deployment

## Overview

Main and admin applications are deployed independently.

- Main app deployment guidance lives in `DEPLOYMENT.md`.
- Admin deployment details live in `admin-dashboard/README.md`.

## Production Sequence

```bash
npx prisma generate
npx prisma migrate deploy
yarn build
```

## Operational Checks

1. Confirm environment variables are present for app, auth, AI, billing, and telemetry.
2. Confirm migrations apply cleanly in target environment.
3. Validate health endpoints and core API route behavior post-deploy.
4. Verify error monitoring and alerts are active.

## Recovery Notes

For migration-history drift and prompt-version behavior, consult:

- `PROMPT_VERSIONING_RUNBOOK.md`
- `DEPLOYMENT.md`

## Security References

- `SECURITY_DEPLOYMENT.md`
- `SECURITY_AUDIT_2025.md`
- `SECURITY_DEPENDENCIES.md`
