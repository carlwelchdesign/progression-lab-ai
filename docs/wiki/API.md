# API

## Overview

The API layer is implemented with Next.js route handlers under `app/api/` and split by domain.

## Endpoint Domains

### Authentication

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Start session |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Return current session user |

### AI Generation

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/chord-suggestions` | Auth required, entitlement and rate-limit checked |

### Progressions

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/progressions` | Authenticated list |
| POST | `/api/progressions` | Create progression |
| GET | `/api/progressions/[id]` | Read one progression |
| PUT | `/api/progressions/[id]` | Update progression |
| DELETE | `/api/progressions/[id]` | Delete progression |

### Public Sharing

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/shared` | Public feed with filters |
| GET | `/api/shared/[shareId]` | Public single progression |

## AI Contract Notes

`/api/chord-suggestions` is a structured-output endpoint, not free-form text.

- Request input is normalized and validated.
- Prompt is resolved from prompt-version storage with fallback.
- Response is constrained by JSON schema and parsed before return.

For prompt lifecycle details, see `Features-Prompt-Versioning`.

## Error Semantics

Common status classes:

- `400` invalid request payload
- `401` authentication or access context failure
- `413` payload too large
- `429` rate limiting
- `5xx` provider failure or internal route error

## Related Pages

- Architecture: `Architecture`
- Database: `Database`
- Prompt lifecycle: `Features-Prompt-Versioning`
