# Development

## Prerequisites

- Node version aligned with `.nvmrc`
- Docker for local Postgres
- GNU Make

## Local Setup

```bash
make install
cp .env.local.example .env.local
docker-compose up -d
make db-push
make db-seed
make dev
```

Main app URL:

- `http://localhost:3000`

Admin app URL depends on admin config; run with:

```bash
make admin-dev
```

## Common Commands

```bash
make dev
make build
make lint
make lint-fix
make test
make test-e2e
make db-generate
make db-studio
```

## Testing

### Unit and Component

```bash
make test
npx vitest --watch
npx vitest run --coverage
```

### End-to-End

```bash
npx playwright install chromium
make test-e2e
```

## Storybook

```bash
npx storybook dev -p 6006
npx storybook build
```

Use `make help` to list the supported workflow commands. Prefer Make targets for day-to-day development, and use direct tool commands only when a Make target is not available.

## Related References

- Main README: `README.md`
- Admin docs: `admin-dashboard/README.md`
- Deployment: `DEPLOYMENT.md`
