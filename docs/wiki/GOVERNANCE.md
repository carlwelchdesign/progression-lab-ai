# Documentation Governance

This file defines how documentation should be maintained for this repository.

## Source of Truth Policy

1. `README.md` is for onboarding and navigation only.
2. GitHub Wiki is the primary source for deep technical documentation.
3. Version-sensitive operational procedures remain in-repo runbooks.

## Ownership

- Engineering owners maintain architecture, API, database, and deployment pages.
- Security owners maintain security pages and linked audit/checklist docs.
- Feature owners maintain feature-specific wiki pages and runbook references.

## Update Rules

1. If a PR changes behavior meaningfully, update at least one of:
   - wiki page(s), or
   - runbook(s), or
   - README links/navigation.
2. Prefer adding links over copying large repeated sections.
3. Keep examples concise and implementation-accurate.

## Review Requirements

For significant platform changes, include docs review in PR checklist:

- [ ] README impacts assessed
- [ ] Wiki page updates made (or explicitly marked N/A)
- [ ] Runbooks updated where applicable

## Release Cadence

- Perform a docs sweep before production releases touching auth, billing, AI prompting, or migrations.
- Validate links after merges that move or rename docs files.

## Escalation

If docs and implementation diverge:

1. Fix critical runbooks first.
2. Fix relevant wiki pages second.
3. Update README navigation if entry points changed.
