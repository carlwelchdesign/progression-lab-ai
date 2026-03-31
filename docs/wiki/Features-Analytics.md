# Features: Analytics & Funnel Insights

## Purpose

The analytics system captures key funnel events from the public app and surfaces them as conversion insights in the admin dashboard. It lets product and marketing teams identify where users drop off, which locales and personas convert best, and how marketing copy changes affect funnel performance over time.

## Event Ingestion

Events are sent from the browser to `/api/analytics/track` and persisted in the `AnalyticsEvent` database table.

### Tracked event types

| Event | When it fires |
|---|---|
| `page_view` | On meaningful page loads |
| `auth_modal_open` | When sign-in / register dialog opens |
| `auth_success` | On successful sign-in or registration |
| `progression_saved` | When a progression is saved to the library |
| `upgrade_intent` | When a user clicks an upgrade CTA |
| `upgrade_complete` | On successful plan upgrade |
| `sample_progression_selected` | When a user clicks a sample in the homepage showcase |
| `onboarding_persona_selected` | When a new user picks a persona in post-register onboarding |
| `onboarding_persona_skipped` | When the persona step is skipped |
| `cms_section_viewed` | When a CMS-driven homepage section enters the viewport |
| `cta_clicked` | When a nav or footer CTA is clicked |

### Event schema

Each event record includes:

- `eventType` — one of the types above.
- `properties` — structured JSON (persona, locale, surface key, CTA label, etc.).
- `sessionId` — anonymous session identifier for pre-auth funnel tracking.
- `userId` — resolved after auth; null for anonymous events.
- `createdAt` — UTC timestamp.

## Admin Analytics Insights Panel

Located in the admin dashboard under the Analytics tab. Requires admin authentication.

### Funnel metrics

The summary card row shows top-of-funnel to bottom-of-funnel conversion for the selected time range:

| Metric | Definition |
|---|---|
| Page views | `page_view` event count |
| Auth starts | `auth_modal_open` event count |
| Auth completions | `auth_success` event count |
| Upgrade intents | `upgrade_intent` event count |
| Upgrade completions | `upgrade_complete` event count |

Each metric card shows:

- Absolute count for the period.
- Day-over-day delta (absolute and percentage) with positive/negative color coding.
- Tooltip showing current vs previous day raw values.

### Time range selection

Two modes are available:

- **Preset** — Last 7 / 30 / 90 days (default: 30 days).
- **Custom** — Explicit start and end datetime inputs for precise period analysis.

### Segment breakdowns

Results can be broken down by locale or persona via filter inputs. Both filters can be applied simultaneously.

The locale and persona breakdown tables show the full funnel per segment, including step conversion rates (auth start → complete, upgrade intent → complete), so weak cohorts are visible at a glance.

### Daily funnel trend table

Below the summary cards, a day-by-day table shows counts for views, auth starts, auth completions, upgrade intent, and upgrade completions. Each row includes:

- Absolute daily count per step.
- Day-over-day delta (absolute and percentage).
- Color-coded trend direction per cell.

### Pricing conversion cards

Two surfaced signals highlight the weakest-performing segment for pricing conversion:

- Lowest pricing completion locale — the locale with the fewest upgrade completions relative to page views.
- Lowest pricing completion persona — the persona with the same signal.

Each card has a Tune pricing copy action that opens the Marketing Content editor directly on the pricing surface, pre-scoped to the upgrade flow content section, so the fix cycle is as short as possible.

## Jump-to-Edit Actions

From any locale or persona breakdown row in the insights panel, a Jump to marketing content button opens the Marketing Content tab pre-focused on the relevant surface and locale. This eliminates manual navigation when diagnosing a conversion gap.

## Experiment Infrastructure

A lightweight client-side experiment system is available in `lib/analytics.ts`:

- `enrollInExperiment(experimentId, variants)` — assigns a variant deterministically using localStorage, so enrollment is consistent across page loads.
- `getExperimentVariant(experimentId)` — reads the assigned variant for conditional rendering.
- All experiment enrollment is local-only in the current implementation; no server-side assignment.

## Persona Onboarding

After successful registration, users see a persona selector (Beginner / Intermediate / Professional) that:

- Shows three curated sample progressions per persona.
- Stores the selected persona's first progression in `sessionStorage` under `onboarding_seed_chords`.
- `GeneratorPageContent` reads and clears that key on first mount, pre-filling the seed chords field for the user's first generation session.

The persona selection and skip actions fire `onboarding_persona_selected` and `onboarding_persona_skipped` analytics events.

## Sample Progression Showcase

The homepage CMS surface includes a `featured_progressions` section (visibility-toggled via CMS) that renders curated sample progressions grouped by persona on the public homepage. Each sample click:

- Fires a `sample_progression_selected` analytics event with persona and chord metadata.
- Scrolls the user to the generator and loads the selected chords as seed input.

## API Reference

### POST `/api/analytics/track`

Ingests one or more analytics events.

Request body:

```json
{
  "events": [
    {
      "eventType": "auth_modal_open",
      "properties": { "intent": "save-arrangement" },
      "sessionId": "abc123"
    }
  ]
}
```

Response: `200 OK` on success. Events are batch-inserted for efficiency.

### GET `/api/analytics/summary` (admin only)

Returns funnel summary, breakdowns, and daily trends.

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `days` | number | Preset lookback window (default: 30). |
| `startDate` | ISO string | Custom range start (overrides `days`). |
| `endDate` | ISO string | Custom range end (required with `startDate`). |
| `locale` | string | Filter to a specific locale. |
| `persona` | string | Filter to a specific persona value. |

Response includes:

- `range` — mode, since, until, days.
- `totals` — aggregate funnel counts.
- `funnelRates` — auth and upgrade conversion rates.
- `localBreakdown` — per-locale funnel metrics.
- `personaBreakdown` — per-persona funnel metrics.
- `dailyTrends` — per-day funnel counts.

## Related Pages

- Architecture: [Architecture](Architecture.md)
- API: [API](API.md)
- Marketing CMS: [Features-Marketing-CMS](Features-Marketing-CMS.md)
- Prompt Versioning: [Features-Prompt-Versioning](Features-Prompt-Versioning.md)
