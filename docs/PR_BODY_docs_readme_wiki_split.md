## Summary

This PR restructures project documentation to keep the root README concise and move deep technical content to wiki-oriented documentation.

### Included

- Refactor `README.md` into onboarding + navigation format.
- Add section migration mapping in `docs/README_TO_WIKI_MAP.md`.
- Add wiki starter templates in `docs/WIKI_STARTER_PAGES.md`.
- Add initial wiki-ready page drafts in `docs/wiki/`.
- Add wiki publishing checklist and documentation governance docs.

## Why

The previous README had grown too large and mixed onboarding, reference, and runbook content. This split makes discovery easier and improves long-term maintainability.

## Docs Added/Updated

- `README.md`
- `docs/README_TO_WIKI_MAP.md`
- `docs/WIKI_STARTER_PAGES.md`
- `docs/wiki/Home.md`
- `docs/wiki/Architecture.md`
- `docs/wiki/API.md`
- `docs/wiki/Database.md`
- `docs/wiki/Development.md`
- `docs/wiki/Deployment.md`
- `docs/wiki/Security.md`
- `docs/wiki/Features-Prompt-Versioning.md`
- `docs/wiki/PUBLISHING_CHECKLIST.md`
- `docs/wiki/GOVERNANCE.md`

## Validation

- Verified markdown files are lint-clean from editor diagnostics.
- Confirmed git working tree consistency and branch push.
- Confirmed README now links to wiki/rubbooks rather than embedding full deep-dive sections.

## Follow-up

1. Publish wiki pages using `docs/wiki/PUBLISHING_CHECKLIST.md`.
2. Adopt governance rules in `docs/wiki/GOVERNANCE.md`.
3. Add docs checks to PR process if desired.
