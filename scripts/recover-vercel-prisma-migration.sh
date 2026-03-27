#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_MIGRATION_NAME="20260326143000_add_user_role_default_user"
MIGRATION_NAME="${1:-$DEFAULT_MIGRATION_NAME}"
ENVIRONMENT="${VERCEL_ENVIRONMENT:-production}"
ENV_FILE="${VERCEL_ENV_FILE:-.env.vercel.${ENVIRONMENT}}"
ROLE_ENUM_NAME="${PRISMA_ROLE_ENUM_NAME:-UserRole}"
ROLE_ENUM_VALUE="${PRISMA_ROLE_ENUM_VALUE:-USER}"

cd "$REPO_ROOT"

echo "Recovering Prisma migration '$MIGRATION_NAME' using Vercel $ENVIRONMENT environment."

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install it with: npm i -g vercel"
  exit 1
fi

if [ ! -f ".vercel/project.json" ]; then
  echo "This repo is not linked to Vercel yet. Starting 'vercel link'."
  vercel link
fi

echo "Pulling Vercel environment variables into $ENV_FILE"
vercel env pull "$ENV_FILE" --environment="$ENVIRONMENT"

echo "Loading environment variables from $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is missing after pulling Vercel env vars."
  exit 1
fi

echo "Current migration status:"
npx prisma migrate status || true

echo "Ensuring enum value '$ROLE_ENUM_VALUE' exists on '$ROLE_ENUM_NAME'"
printf "ALTER TYPE \"%s\" ADD VALUE IF NOT EXISTS '%s';\n" "$ROLE_ENUM_NAME" "$ROLE_ENUM_VALUE" | \
  npx prisma db execute --stdin --schema prisma/schema.prisma

echo "Attempting to mark failed migration as rolled back"
if npx prisma migrate resolve --rolled-back "$MIGRATION_NAME"; then
  echo "Migration marked as rolled back."
else
  echo "Rolled-back resolve failed; attempting to mark migration as applied instead."
  npx prisma migrate resolve --applied "$MIGRATION_NAME"
fi

echo "Deploying migrations"
npx prisma migrate deploy

echo "Final migration status:"
npx prisma migrate status

echo "Recovery complete. You can now run: npx prisma generate && npm run build"