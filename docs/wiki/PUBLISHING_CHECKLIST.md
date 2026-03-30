# Wiki Publishing Checklist

Use this checklist when publishing the wiki migration from this branch.

## 1) Create Wiki Pages

Create these pages in order:

1. Home
2. Architecture
3. API
4. Database
5. Development
6. Deployment
7. Security
8. Features-Prompt-Versioning

## 2) Copy Initial Content

Copy from these source files:

- `docs/wiki/Home.md` -> `Home`
- `docs/wiki/Architecture.md` -> `Architecture`
- `docs/wiki/API.md` -> `API`
- `docs/wiki/Database.md` -> `Database`
- `docs/wiki/Development.md` -> `Development`
- `docs/wiki/Deployment.md` -> `Deployment`
- `docs/wiki/Security.md` -> `Security`
- `docs/wiki/Features-Prompt-Versioning.md` -> `Features-Prompt-Versioning`

## 3) Cross-Link Validation

- [ ] Wiki Home links resolve to all top-level pages.
- [ ] Each page links back to related pages where relevant.
- [ ] README links point to valid wiki pages.
- [ ] In-repo runbook links remain valid.

## 4) Editorial Validation

- [ ] No duplicated large sections between README and wiki.
- [ ] README remains onboarding-focused.
- [ ] Deep operational content remains in runbooks where required.

## 5) Post-Publish Verification

- [ ] Open README and test all wiki links.
- [ ] Open wiki Home and click through all sections.
- [ ] Confirm page titles match README references.
- [ ] Announce documentation source-of-truth update to team.
