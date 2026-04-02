APP_NAME=music-chord-app

.PHONY: install dev build build-app start lint lint-fix test test-e2e db-generate db-push db-seed db-studio db-migrate-deploy admin-dev admin-build admin-start admin-lint admin-db-generate wiki-publish docker-build docker-up docker-down docker-logs clean setup-env help vercel-link vercel-pull vercel-preview vercel-prod vercel-prod-with-migrate

install:
	yarn install

dev:
	yarn dev

# Production-safe build sequence used by deployment docs and pipelines.
build:
	npx prisma generate
	npx prisma migrate deploy
	yarn build

# App build only (no DB migration), useful for local verification.
build-app:
	yarn build

start:
	yarn start

lint:
	yarn lint:check

lint-fix:
	yarn lint:fix

test:
	yarn test

test-e2e:
	yarn test:e2e

db-generate:
	yarn db:generate

db-push:
	yarn db:push

db-seed:
	yarn db:seed

db-studio:
	yarn db:studio

db-migrate-deploy:
	npx prisma migrate deploy

admin-dev:
	yarn admin:dev

admin-build:
	yarn admin:build

admin-start:
	yarn admin:start

admin-lint:
	yarn admin:lint

admin-db-generate:
	yarn admin:db:generate

wiki-publish:
	yarn wiki:publish

docker-build:
	docker compose build

docker-up:
	docker compose up

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

clean:
	rm -rf .next node_modules

setup-env:
	cp .env.local.example .env.local

vercel-link:
	npx vercel link

vercel-pull:
	npx vercel pull --yes

vercel-preview:
	npx vercel --yes

vercel-prod:
	npx vercel --prod --yes

vercel-prod-with-migrate:
	npx prisma migrate deploy && npx vercel --prod --yes

help:
	@echo "Available commands:"
	@echo "  make install                Install dependencies"
	@echo "  make dev                    Run development server"
	@echo "  make build                  Production build sequence (Prisma generate + migrate deploy + app build)"
	@echo "  make build-app              Build app only (no DB migration)"
	@echo "  make start                  Run production server"
	@echo "  make lint                   Run lint checks"
	@echo "  make lint-fix               Run lint with fixes"
	@echo "  make test                   Run unit/component tests"
	@echo "  make test-e2e               Run Playwright E2E tests"
	@echo "  make db-generate            Generate Prisma client"
	@echo "  make db-push                Push Prisma schema to DB"
	@echo "  make db-seed                Seed local database"
	@echo "  make db-studio              Open Prisma Studio"
	@echo "  make admin-dev              Run admin dashboard dev server"
	@echo "  make admin-build            Build admin dashboard"
	@echo "  make admin-start            Start admin dashboard production server"
	@echo "  make admin-lint             Lint admin dashboard"
	@echo "  make admin-db-generate      Generate admin Prisma client"
	@echo "  make wiki-publish           Publish docs/wiki to GitHub Wiki"
	@echo "  make docker-up              Run with Docker"
	@echo "  make vercel-link            Link this repo to a Vercel project"
	@echo "  make vercel-pull            Pull Vercel env vars into .env.local"
	@echo "  make vercel-preview         Deploy a preview build to Vercel"
	@echo "  make vercel-prod            Deploy to Vercel production"
	@echo "  make vercel-prod-with-migrate Run Prisma migrate deploy, then Vercel prod deploy"
