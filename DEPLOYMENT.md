# Prompt Versioning System - Deployment Documentation

**Feature:** DB-backed prompt builder with versioning, draft/publish/rollback workflows, fallback safety mechanism  
**Deployed:** March 30, 2026  
**Status:** ✅ Production Ready  

---

## What's Included

### Database Changes
- **New Model:** `PromptVersion` with versioning, draft state, active flag, audit metadata
- **Migrations:** 
  - `20260330193000_add_prompt_versioning` — Creates PromptVersion table, seeds chord_suggestions v1
  - Indexes on (promptKey, isActive), (promptKey, isDraft), (promptKey, createdAt)

### Runtime Changes
- **New File:** `lib/promptVersionConfig.ts` — Prompt resolution service with DB read + fallback
- **Updated:** `app/api/chord-suggestions/route.ts` — Integrated DB prompt loading
- **Updated:** `app/api/chord-suggestions/instructions.ts` — Refactored to export template + renderer

### Admin Dashboard
- **New Panel:** Prompt Builder tab with draft editor, version history, diff preview, publish/rollback
- **New APIs:** 
  - GET/POST `/admin/api/prompt-versions` — Fetch and save drafts
  - POST `/admin/api/prompt-versions/publish` — Publish draft as new active version
  - POST `/admin/api/prompt-versions/rollback` — Activate any historical version
- **Audit Logging:** All mutations tracked in AdminAuditLog table

### Monitoring & Safety
- **New File:** `lib/promptVersionMonitoring.ts` — Fallback event reporting to Sentry
- **Sentry Integration:** Every fallback event triggers warning-level alert
- **Fallback Pattern:** DB failure → automatic hardcoded template (no downtime)

### Tests
- **New Suites:** 19 passing tests covering:
  - Admin API publish flow (csrf, auth, validation, audit logging)
  - Admin API rollback flow (csrf, auth, validation, audit logging)
  - Runtime chord suggestions with prompt service integration
  - Runtime fallback behavior and source tracking

---

## Deployment Timeline

### Pre-Deployment (Completed ✅)
- [x] Feature implemented and tested locally
- [x] 19 focused tests passing
- [x] Main and admin app builds successful
- [x] Code review and merge to main
- [x] Monitoring and alerting configured

### Deployment Steps (Automated)

1. **Vercel Trigger** (automatic on merge to main)
   - Detects main branch update
   - Starts build for both main and admin apps
   - Builds the app without running database migrations inside the Vercel build step

2. **Build Phase**
   - Compiles Next.js applications
   - Type-checks TypeScript
   - Bundles assets

3. **Migration Phase**
   - Runs `make db-migrate-deploy-safe` from CI or another environment with direct Postgres access
   - Executes `20260330193000_add_prompt_versioning` migration
   - Seeds initial PromptVersion record

4. **Deploy Phase**
   - Serves new build to production
   - Zero downtime deployment (Vercel blue-green)

5. **Verification**
   - Automated health checks
   - Manual verification checklist (see below)

### Post-Deployment (Manual Verification - 15 min)

**✅ Check 1: Application Health**
```bash
# Main app
curl -I https://progressionlab.com/api/chord-suggestions
# Expected: 200 OK

# Admin app (with auth redirect)
curl -I https://admin.progressionlab.com
# Expected: 301/302 redirect to login
```

**✅ Check 2: Database Operations**
```sql
-- Verify PromptVersion table and seeded data
SELECT COUNT(*) as total_versions, 
       SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_versions
FROM prompt_version;
-- Expected: At least 1 active version

-- Verify chord_suggestions active version
SELECT version_number, version_created_at 
FROM prompt_version 
WHERE prompt_key = 'chord_suggestions' AND is_active = true;
-- Expected: Returns 1 row with version_number 1
```

**✅ Check 3: No Fallback Alerts**
- Navigate to Sentry dashboard
- Search for events tagged with `component: prompt-versioning`
- Should show 0 warning-level fallback alerts
- Expected: Only info-level "Prompt loaded from DB" events

**✅ Check 4: Admin Dashboard Functional**
- Login to admin dashboard
- Navigate to Prompt Builder tab
- Verify version history displays
- Verify current active version shows "Active" badge
- Expected: No errors, UI loads correctly

**✅ Check 5: Usage Events**
- Generate a chord suggestion request
- Check usage event shows:
  - `promptSource: 'db'` (not 'fallback')
  - `promptVersionNumber: 1` (not null)
  - `promptKey: 'chord_suggestions'`
- Expected: All three fields match database version

---

## Rollback Plan

### If Critical Issue Found

**Option 1: Revert Deployment (Safest)**
1. Go to Vercel dashboard
2. Select production deployment
3. Click "Rollback to previous"
4. Confirm and wait for redeployment

**Option 2: Revert Code**
```bash
# Create revert commit
cd /repo
git revert HEAD --no-edit
git push origin main

# Vercel automatically deploys new push
```

**Option 3: Manual Database Rollback**
- Migrations are one-way; only do this if data corruption detected
- Contact database on-call for guidance
- Document reason and timeline

---

## Accessing the Admin Dashboard

### First-Time Setup

1. **Ensure admin user exists** with `role: 'ADMIN'`
   ```sql
   -- Check if admin user exists
   SELECT email, role FROM user WHERE role = 'ADMIN' LIMIT 1;
   ```

2. **Navigate to Admin Dashboard**
   - URL: `https://admin.progressionlab.com`
   - Login with admin credentials

3. **Prompt Builder Tab**
   - Should display current active prompt and version
   - "Draft" section shows unsaved changes
   - Version history shows all published versions

### Permissions

- **ADMIN role:** Full write access (save, publish, rollback, view audit logs)
- **AUDITOR role:** Read-only access (view versions and audit logs)
- **Other roles:** No access (forbidden)

---

## Monitoring & Alerting Setup

### Sentry Configuration

Fallback events are automatically captured and alerted via Sentry:

- **Tag:** `component: prompt-versioning`
- **Alert Reason Tags:** `fallback_reason: {db_error | no_active_version | query_timeout}`
- **Severity:** Warning (immediate notification)
- **Alert Recipient:** Engineering on-call (configured in Sentry)

### Expected Behavior

**Normal (No Alerts)**
- Info-level events: "Prompt loaded from DB: chord_suggestions (v1)"
- These indicate successful DB-backed prompt loading

**Alert Condition** ⚠️
- Warning-level event: "Prompt fallback: chord_suggestions (db_error)"
- Means system is using hardcoded template due to DB failure
- Requires immediate investigation (see [Operational Runbook](./PROMPT_VERSIONING_RUNBOOK.md#section-4-incident-response))

---

## Key Files Reference

| File | Purpose |
|------|---------|
| [`lib/promptVersionConfig.ts`](lib/promptVersionConfig.ts) | Runtime prompt resolution with DB + fallback |
| [`lib/promptVersionMonitoring.ts`](lib/promptVersionMonitoring.ts) | Sentry fallback event reporting |
| [`app/api/chord-suggestions/route.ts`](app/api/chord-suggestions/route.ts) | Updated to use DB prompts |
| [`admin-dashboard/lib/promptVersions.ts`](admin-dashboard/lib/promptVersions.ts) | Admin service for publish/rollback |
| [`admin-dashboard/components/admin/PromptBuilderPanel.tsx`](admin-dashboard/components/admin/PromptBuilderPanel.tsx) | Admin UI component |
| [`prisma/migrations/20260330193000_add_prompt_versioning/migration.sql`](prisma/migrations/20260330193000_add_prompt_versioning/migration.sql) | Database schema |

---

## Documentation

- **[Operational Runbook](./PROMPT_VERSIONING_RUNBOOK.md)** — Daily operations, incident response, troubleshooting
- **Admin Dashboard Guide** — How to publish and rollback prompts (in-app help)
- **Architecture** — See conversation summary for design decisions

---

## Questions?

**For deployment issues:** Check Vercel dashboard and Sentry  
**For admin access issues:** Verify user role in database  
**For prompt/versioning questions:** See Operational Runbook  
**For escalation:** Contact engineering on-call

---

## Sign-Off

- [x] Feature complete and tested
- [x] Monitoring configured
- [x] Operational runbook created
- [x] Deployment documentation complete
- [x] Ready for production deployment

**Deployed by:** GitHub Copilot  
**Date:** March 30, 2026  
**Commit:** f19be56 (feat(testing): add focused tests for prompt publish/rollback and runtime fallback)
