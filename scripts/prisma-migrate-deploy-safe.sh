#!/usr/bin/env bash

set -euo pipefail

SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-prisma/schema.prisma}"

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL is required for prisma migrate deploy."
  echo "Set DIRECT_URL to a direct postgresql:// connection string before running migrations."
  echo "For Vercel builds, use 'make vercel-build' and run migrations separately with direct DB access."
  exit 1
fi

if printf '%s' "$DIRECT_URL" | grep -Eqi '(^prisma://|db\.prisma\.io)'; then
  echo "DIRECT_URL must be a direct Postgres connection, not a Prisma Accelerate URL."
  echo "Current DIRECT_URL appears to point at Prisma Accelerate or db.prisma.io."
  echo "Use 'make vercel-build' for Vercel app builds and run 'make db-migrate-deploy-safe' from CI or a trusted machine with direct DB access."
  exit 1
fi

npx prisma migrate deploy --schema "$SCHEMA_PATH"
