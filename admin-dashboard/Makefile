.PHONY: install dev build start lint db-generate clean help

install:
	yarn install

dev:
	yarn dev

build:
	yarn build

start:
	yarn start

lint:
	yarn lint

db-generate:
	yarn db:generate

clean:
	rm -rf .next node_modules

help:
	@echo "Available commands:"
	@echo "  make install      Install dependencies"
	@echo "  make dev          Run development server on port 3010"
	@echo "  make build        Build admin dashboard"
	@echo "  make start        Start production server on port 3010"
	@echo "  make lint         Run lint checks"
	@echo "  make db-generate  Generate Prisma client"
	@echo "  make clean        Remove build output and node_modules"
