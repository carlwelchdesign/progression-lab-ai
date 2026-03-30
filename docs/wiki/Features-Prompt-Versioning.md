# Features: Prompt Versioning

## Purpose

Prompt versioning allows operational control over AI instruction templates without code deploys.

## Lifecycle

1. Create or update draft prompt.
2. Publish draft to active.
3. Roll back to a previous version when needed.

Admin-side endpoints support this lifecycle and include audit logging.

## Runtime Behavior

At generation time, the API route resolves prompt text via prompt-version lookup.

Expected behavior:

- Use active DB prompt when present.
- Fall back to default in-code template when no active version exists or DB lookup fails.
- Record prompt metadata for usage observability.

## Why This Matters

- Faster prompt iteration
- Safer rollback path
- Better production visibility of active prompt source

## Operational Reference

Use the full runbook for exact procedures:

- `PROMPT_VERSIONING_RUNBOOK.md`

## Related Pages

- Architecture: `Architecture`
- API: `API`
- Deployment: `Deployment`
