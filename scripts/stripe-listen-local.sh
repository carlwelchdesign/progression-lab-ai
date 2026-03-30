#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORWARD_TO="${STRIPE_FORWARD_TO:-localhost:3000/api/webhooks/stripe}"

if [[ $# -gt 0 && "$1" != --* ]]; then
  FORWARD_TO="$1"
  shift
fi

resolve_stripe_key() {
  if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
    printf '%s\n' "$STRIPE_SECRET_KEY"
    return 0
  fi

  if [[ -f "$ROOT_DIR/.env.local" ]]; then
    sed -nE 's/^STRIPE_SECRET_KEY="?([^"[:space:]]+)"?$/\1/p' "$ROOT_DIR/.env.local" | tail -n 1
    return 0
  fi

  printf '\n'
}

STRIPE_KEY="$(resolve_stripe_key)"

if [[ -z "$STRIPE_KEY" ]]; then
  echo "Missing STRIPE_SECRET_KEY. Set it in the environment or in .env.local." >&2
  exit 1
fi

if [[ "$STRIPE_KEY" != sk_* ]]; then
  echo "STRIPE_SECRET_KEY does not look valid (expected a value starting with sk_)." >&2
  exit 1
fi

echo "Forwarding Stripe webhooks to: $FORWARD_TO"
exec stripe listen --api-key "$STRIPE_KEY" --forward-to "$FORWARD_TO" "$@"