# ai-musician-helper Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-13

## Active Technologies

- TypeScript 5.8 / Node.js 20+ + Next.js 15 App Router, React 19, MUI v7, Prisma 5, OpenAI SDK (Responses API), `piano-chart` (interactive keyboard) (001-piano-lessons-from-the-legends)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.8 / Node.js 20+: Follow standard conventions

## Recent Changes

- 001-piano-lessons-from-the-legends: Added TypeScript 5.8 / Node.js 20+ + Next.js 15 App Router, React 19, MUI v7, Prisma 5, OpenAI SDK (Responses API), `piano-chart` (interactive keyboard)

<!-- MANUAL ADDITIONS START -->
## Engineering Principles

All code written in this project must follow SOLID principles. This is non-negotiable and applies to every class, module, hook, service, and API route.

**S — Single Responsibility**: Every module, class, hook, and function has exactly one reason to change. API route handlers validate + delegate; they do not contain business logic. Business logic lives in service functions. Components render; they do not fetch or transform data directly.

**O — Open/Closed**: Extend behavior through new modules, not by modifying existing ones. New musician lesson types, new exercise formats, new skill assessment strategies — all added by extending interfaces, not editing core logic.

**L — Liskov Substitution**: Any implementation of an interface must be fully substitutable. A `MockMidiService` must behave exactly as `WebMidiService` does from the caller's perspective. Never override to throw or no-op.

**I — Interface Segregation**: Prefer narrow, purpose-specific TypeScript interfaces over wide general ones. A component that only reads `MusicianProfileSummary` should not depend on the full `MusicianProfile` DB shape. Define the minimal interface the consumer needs.

**D — Dependency Inversion**: Depend on abstractions, not concretions. API routes receive service dependencies as parameters or via factory functions — never instantiate services inline. MIDI, AI generation, and usage tracking are injected, not imported directly in business logic.

### Applied to this stack

| Layer | SRP Application |
|-------|-----------------|
| Next.js route handler | Auth check + input validation + delegate to service + return response |
| Service function | One operation (e.g. `generateCurriculumBatch`) — no HTTP concerns |
| React component | Render only — data fetching in hooks, state in hooks |
| Custom hook | One concern: `useGeneratedCurriculum`, `useMidiInput`, `useLessonProgress` |
| Prisma queries | Encapsulated in repository-style functions, not scattered in routes |
<!-- MANUAL ADDITIONS END -->
