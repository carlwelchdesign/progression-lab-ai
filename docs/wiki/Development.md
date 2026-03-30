# Development

## Prerequisites

- Node version aligned with `.nvmrc`
- Yarn package manager
- Docker for local Postgres

## Local Setup

```bash
yarn install
cp .env.local.example .env.local
docker-compose up -d
yarn db:push
yarn db:seed
yarn dev
```

Main app URL:

- `http://localhost:3000`

Admin app URL depends on admin config; run with:

```bash
yarn admin:dev
```

## Common Commands

```bash
yarn dev
yarn build
yarn lint:check
yarn lint:fix
yarn test
yarn test:e2e
yarn db:generate
yarn db:studio
```

## Testing

### Unit and Component

```bash
yarn test
yarn test:watch
yarn test:coverage
```

### End-to-End

```bash
yarn playwright install chromium
yarn test:e2e
```

## Storybook

```bash
yarn storybook
yarn build-storybook
```

## Related References

- Main README: `README.md`
- Admin docs: `admin-dashboard/README.md`
- Deployment: `DEPLOYMENT.md`
