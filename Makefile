APP_NAME=music-chord-app

.PHONY: install dev build start docker-build docker-up docker-down docker-logs clean setup-env help vercel-link vercel-pull vercel-preview vercel-prod vercel-prod-with-migrate

install:
	npm install

dev:
	npm run dev

build:
	npx prisma generate
	npx prisma migrate deploy
	npm run build

start:
	npm run start

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
	@echo "  make install      Install dependencies"
	@echo "  make dev          Run development server"
	@echo "  make build        Run Prisma generate+migrate, then build project"
	@echo "  make start        Run production build"
	@echo "  make docker-up    Run with Docker"
	@echo "  make vercel-link  Link this repo to a Vercel project"
	@echo "  make vercel-pull  Pull Vercel env vars into .env.local"
	@echo "  make vercel-preview Deploy a preview build to Vercel"
	@echo "  make vercel-prod  Deploy to Vercel production"
	@echo "  make vercel-prod-with-migrate Run Prisma migrate deploy, then Vercel prod deploy"