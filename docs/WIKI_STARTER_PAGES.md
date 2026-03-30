# Wiki Starter Pages

Use this file as a seed when creating pages in:
https://github.com/carlwelchdesign/progression-lab-ai/wiki

## Home

Suggested sections:

- Product overview
- Quick links (Architecture, API, Database, Development, Deployment, Security)
- New contributor path
- Runbooks and incident docs

## Architecture

Suggested sections:

- System overview
- App vs admin-dashboard split
- Request/data flow
- AI generation lifecycle
- Observability and error handling

## Architecture/AI-Design

Suggested sections:

- Prompt versioning model and active prompt selection
- Request normalization and schema constraints
- Model and fallback behavior
- Validation and post-processing strategy
- Failure modes and fallback handling

## API

Suggested sections:

- Authentication APIs
- Chord suggestion API
- Progressions CRUD
- Public sharing APIs
- Error semantics and response codes

## API/Endpoints

Suggested sections:

- Endpoint tables by domain
- Request/response examples
- Auth requirements
- Rate limits and entitlement checks

## Database

Suggested sections:

- Prisma model overview
- Migration policy
- Local migration workflows
- Seed data guidance

## Database/Schema

Suggested sections:

- Link to prisma/schema.prisma
- Core entity relationships
- Important indexes and constraints
- Notes for evolving prompt and billing models

## Development

Suggested sections:

- Local setup and prerequisites
- Toolchain and Node version
- Common dev commands
- Testing strategy and expectations

## Development/Local-Setup

Suggested sections:

- Environment variables
- Docker and DB startup
- Prisma setup
- Main app and admin app startup commands

## Development/Testing

Suggested sections:

- Unit/component test commands
- E2E test setup
- Coverage guidance
- Flake mitigation notes

## Development/Storybook

Suggested sections:

- Storybook local workflow
- Build/publish flow
- Component story conventions

## Deployment

Suggested sections:

- Main app deployment flow
- Admin dashboard deployment flow
- Migration sequence
- Rollback and recovery notes
- Links to DEPLOYMENT.md and SECURITY_DEPLOYMENT.md

## Security

Suggested sections:

- Security architecture summary
- Secure deployment checklist links
- Audit artifact links
- Incident response references

## Features/Prompt-Versioning

Suggested sections:

- Draft/publish/rollback lifecycle
- Runtime prompt source behavior
- Cache/fallback behavior
- Links to PROMPT_VERSIONING_RUNBOOK.md

## Reference/Common-Commands

Suggested sections:

- Core yarn commands
- DB and migration commands
- Admin app commands
- Makefile shortcuts
