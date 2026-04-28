#!/usr/bin/env bash

set -euo pipefail

SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-prisma/schema.prisma}"

load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$file"
    set +a
  fi
}

# Load local env files so DIRECT_URL is available during Make/CI runs.
load_env_file ".env"
load_env_file ".env.local"

# Fallback: if DIRECT_URL is not set but DATABASE_URL is already a direct Postgres URL,
# reuse DATABASE_URL so local migration commands remain ergonomic.
if [ -z "${DIRECT_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  if printf '%s' "$DATABASE_URL" | grep -Eqi '^(postgresql|postgres)://'; then
    DIRECT_URL="$DATABASE_URL"
  fi
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL is required for prisma migrate deploy."
  echo "Checked shell env plus .env and .env.local."
  echo "Set DIRECT_URL to a direct postgresql:// connection string before running migrations."
  echo "For Vercel builds, use 'make vercel-build' and run migrations separately with direct DB access."
  exit 1
fi

if printf '%s' "$DIRECT_URL" | grep -Eqi '^prisma://'; then
  echo "DIRECT_URL must be a direct Postgres connection, not a Prisma Accelerate URL."
  echo "Current DIRECT_URL appears to be prisma://..."
  echo "Use 'make vercel-build' for Vercel app builds and run 'make db-migrate-deploy-safe' from CI or a trusted machine with direct DB access."
  exit 1
fi

if ! printf '%s' "$DIRECT_URL" | grep -Eqi '^(postgresql|postgres)://'; then
  echo "DIRECT_URL must start with postgres:// or postgresql://"
  echo "Current DIRECT_URL does not look like a Postgres connection string."
  exit 1
fi

npx prisma migrate deploy --schema "$SCHEMA_PATH"
