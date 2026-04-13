#!/usr/bin/env bash

set -euo pipefail

SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-prisma/schema.prisma}"

# Load .env.local if DIRECT_URL is not already in shell
if [ -z "${DIRECT_URL:-}" ] && [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL is required for prisma migrate deploy."
  echo "Set DIRECT_URL to a direct postgresql:// connection string before running migrations."
  echo "For Vercel builds, use 'make vercel-build' and run migrations separately with direct DB access."
  exit 1
fi

# Check for Accelerate proxy URL (prisma:// scheme), but allow db.prisma.io direct connections
# Prisma-hosted databases work directly with Prisma's cloud infrastructure
if printf '%s' "$DIRECT_URL" | grep -Eqi '^prisma://'; then
  echo "DIRECT_URL must be a direct Postgres connection, not a Prisma Accelerate proxy (prisma://)."
  echo "Current DIRECT_URL appears to use the Accelerate proxy format."
  echo "Use 'make vercel-build' for Vercel app builds and run 'make db-migrate-deploy-safe' from CI or a trusted machine with direct DB access."
  exit 1
fi

npx prisma migrate deploy --schema "$SCHEMA_PATH"
