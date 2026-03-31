# Features: Admin-Managed Marketing CMS

## Purpose

The Marketing CMS lets non-engineering teams own and iterate on all user-facing marketing copy — homepage, pricing, nav/footer labels, public progressions discovery — without touching code or triggering a deployment.

It follows the same draft → publish → rollback lifecycle used for prompt versioning and subscription plan management, so operational teams already familiar with the admin dashboard can use it immediately.

## Managed Surfaces

| Surface key | What it controls |
|---|---|
| `homepage` | Hero, proof strip, how-it-works, benefits, FAQ, CTA band, featured progressions section, SEO |
| `pricing` | Page hero, billing-toggle copy, plan summaries, badge labels, comparison intro, FAQ, trust copy, upgrade-flow CTAs |
| `global_marketing_chrome` | Anonymous nav labels, footer copy, support links, announcement banner |
| `public_progressions` | Discovery hero, filter helpers, empty states, sign-in and upgrade CTAs, persona spotlight |
| `auth_flow_copy` | Intent-specific auth modal titles, descriptions, and CTA labels (save, access, upgrade, generic) |
| `featured_progressions` | Homepage sample showcase (title, description, visibility toggle) |

Content for product UI, generator controls, and error messages remains in the file-based i18n JSON namespace system and is not managed through the CMS.

## Data Model

Each surface has a stable parent record (`MarketingContent`) and a set of versioned locale rows (`MarketingContentVersion`).

Key fields per version:

- `locale` — BCP 47 locale tag (e.g. `en`, `fr`, `de`).
- `versionNumber` — auto-incrementing per surface+locale pair.
- `content` — structured JSON validated against a per-surface schema before save.
- `isDraft` — true until explicitly published.
- `isActive` — true for the single live version per surface+locale.
- `translationOrigin` — `human` or `ai_assisted`.
- `translationModel` — model used when `ai_assisted`.
- `sourceVersionId` — links a translated draft to the exact English source version it was generated from.

## Admin Workflow

### Edit and save a draft

1. Open admin dashboard → Marketing Content tab.
2. Select surface and locale.
3. Edit JSON in the editor pane (format button available).
4. Click Save Draft — content is validated against the surface schema before accepting. Invalid payloads are rejected with field-level errors.

### Publish

1. Review the current draft.
2. Click Publish. Previous active version is deactivated; this version becomes active immediately.
3. Publish action is audit-logged with editor email and timestamp.

### Rollback

1. Select any previous version from the version history table.
2. Click Restore as Draft. A new draft is created from the selected version's content.
3. Review and publish the restored draft using the normal publish flow.

### Starter templates

Each surface has a Load Template button that populates the editor with a valid skeleton for that surface, reducing the risk of schema validation failures from scratch edits.

## Translation Workflow

AI-assisted translation creates locale drafts only. No translation path can auto-publish.

### Generate a translation draft

1. Select the target locale in the editor.
2. Click Generate Translation.
3. The admin API reads the currently active English source version, sends its structured content to OpenAI, and saves the result as a new draft linked to `sourceVersionId`.
4. The draft is surfaced in the editor for review before any publish action.

### Stale translation detection

A translated draft is marked stale when the active English source version is newer than the `sourceVersionId` the draft was generated from. Stale status is:

- Shown as a warning chip in the version history table.
- Shown as a warning banner in the editor when the current draft is stale.
- Included in admin state API responses so UI has it without a second fetch.

### Regenerate from latest source

When a draft is stale, a Regenerate from source button appears. Clicking it:

1. Fetches the current active English version.
2. Generates a new translated draft from that version.
3. Links the new draft to the updated `sourceVersionId`.

## Section Visibility

Each managed surface supports per-section `show` boolean flags in its content JSON. Marketing can hide entire sections (e.g. FAQ, proof strip, featured progressions) without deleting their content.

## Runtime Behavior

The public app fetches published marketing content via `/api/marketing-content/public` with locale preference from the request. Locale fallback order:

1. Requested locale.
2. Language prefix match (e.g. `fr-CA` → `fr`).
3. `en` default.
4. Hardcoded component defaults when no published content exists.

All public surfaces fall back gracefully to existing i18n strings or component defaults if the CMS has no published content for a surface, so the CMS can be adopted incrementally.

## Audit Logging

All marketing content actions are audit-logged in `AdminAuditLog`:

- draft saved
- content published
- version rolled back
- translation draft generated
- translation approved / rejected (future)

## Environment Variables

No new environment variables are required specifically for the marketing CMS. The translation workflow uses the existing `OPENAI_API_KEY` already required for chord generation.

## Related Pages

- Architecture: [Architecture](Architecture.md)
- API: [API](API.md)
- Database: [Database](Database.md)
- Prompt Versioning: [Features-Prompt-Versioning](Features-Prompt-Versioning.md)
- Analytics: [Features-Analytics](Features-Analytics.md)
