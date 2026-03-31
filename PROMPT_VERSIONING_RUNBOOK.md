# Prompt Versioning System - Operational Runbook

**Last Updated:** March 30, 2026  
**Status:** Production Deployment  
**Owner:** Engineering Team  

---

## 1. System Overview

The prompt versioning system enables database-backed prompt management with draft/publish/rollback workflows. The system uses a hardcoded template fallback when the database is unavailable to maintain high availability for critical endpoints.

### Key Components
- **Database Layer:** Prisma PromptVersion model with versioning and audit logging
- **Runtime Layer:** `lib/promptVersionConfig.ts` with DB read + fallback pattern
- **Admin Layer:** Admin dashboard for draft editing, publishing, and rollback
- **Monitoring:** Sentry integration for fallback event detection and alerting

---

## 2. Normal Operations

### Publishing a New Prompt Version

1. **Navigate to Admin Dashboard** → Prompt Builder tab
2. **Edit draft content** in the textarea
3. **Click "Save"** to save draft (doesn't affect live system)
4. **Review changes** in the diff preview section
5. **Click "Publish"** to activate the new version
   - Previous active version is automatically deactivated
   - New version becomes immediately active
   - Audit log entry created with PUBLISH_PROMPT_DRAFT action

### Rolling Back to Prior Version

1. **Locate target version** in the version history table
2. **Click "Rollback"** action button
3. **Confirm** the version to activate
   - Previous active version is deactivated
   - Selected historical version becomes active
   - Audit log entry created with ROLLBACK_PROMPT_VERSION action

### Monitoring Prompt Status

1. **Check active version:** GET `/admin/api/prompt-versions?promptKey=chord_suggestions`
2. **Review audit history:** Admin dashboard → Audit Logs tab, filter by prompt_version target type
3. **View all versions:** Version history table shows all published versions with timestamps and editor email

---

## 3. Fallback Behavior

### When Fallback Triggers

The system automatically falls back to `app/api/chord-suggestions/instructions.ts` hardcoded template when:

- ✋ **Database unavailable** (connection failure, timeout)
- ✋ **No active version found** in database
- ✋ **Query error** during prompt lookup
- ✋ **Application initialization** before migrations run

### Fallback Characteristics

- **Source:** `source: 'fallback'` flag in usage events
- **Version:** `versionNumber: null` in usage events
- **Template:** Original DEFAULT_CHORD_SUGGESTION_PROMPT_TEMPLATE
- **Performance:** Immediate (no database call)
- **Audit Trail:** Not logged (fallback is implicit safety mechanism)

### Fallback Detection

**All fallback events are reported to Sentry with severity "warning"** to enable immediate alerting:

- **Event:** Captured as Sentry message with tag `component: prompt-versioning`
- **Reason Tags:** `fallback_reason: db_error | no_active_version | query_timeout`
- **Alert Strategy:** Strict monitoring—every fallback triggers alert

---

## 4. Incident Response

### Alert: Prompt Fallback Triggered

**Severity:** ⚠️ Warning  
**What It Means:** System is using hardcoded prompt instead of DB version

#### Quick Diagnosis (5 min)

1. **Check Sentry:** Search for `component: prompt-versioning` tag with `fallback_reason`
2. **Identify Timing:** When did fallback events start? Correlate with recent deployments or database events
3. **Check Database Health:**
   ```bash
   # Verify database connectivity from application server
   pg_isready -h <DATABASE_HOST> -p 5432
   
   # Check active connections
   psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
   
   # Verify PromptVersion table exists and has data
   psql -c "SELECT COUNT(*), source FROM prompt_version GROUP BY source;"
   ```

#### Mitigation (by severity)

**If Database Connectivity Issue:**
- [ ] Verify database has restarted or become available
- [ ] Check network connectivity between app and database
- [ ] Examine database error logs for clues
- [ ] Restart application containers if DB is now healthy

**If No Active Version Found:**
- [ ] Admin republished a version to make it active again
- [ ] Check audit logs to see when last PUBLISH_PROMPT_DRAFT occurred
- [ ] If missing: Manually activate a version via `psql`:
  ```sql
  -- Activate most recent published version
  UPDATE prompt_version 
  SET is_active = true 
  WHERE prompt_key = 'chord_suggestions' 
  AND version_number = (
    SELECT MAX(version_number) FROM prompt_version 
    WHERE prompt_key = 'chord_suggestions' AND NOT is_draft
  );
  ```

#### Root Cause Analysis (post-incident)

1. **Review Sentry event logs** for:
   - When fallback started
   - Whether it correlates with deployments, database events, or scaling events
   - Stack traces from database errors

2. **Check database metrics:**
   - CPU/memory spike during incident
   - Connection pool exhaustion
   - Query latency increase

3. **Add to incident report** in postmortem

---

## 5. Deployment Checklist

### Pre-Deployment

- [ ] All tests passing: `make test`
- [ ] Admin and main app builds successful: `make build`
- [ ] Migrations tested locally: `make db-migrate-deploy`
- [ ] Feature branch merged to main via pull request
- [ ] Code review approved

### Deployment Steps (Vercel Automated)

1. **Push to main** automatically triggers Vercel deployment
2. **Vercel builds** main and admin apps
3. **Database migrations run** automatically on Vercel during build
4. **Preview environment** tested (optional)
5. **Production deployment** goes live

### Post-Deployment Verification (15 min)

- [ ] **Main app live:** `curl -I https://progressionlab.com/api/chord-suggestions` → 200
- [ ] **Admin app live:** `curl -I https://admin.progressionlab.com` → 200 (with auth redirect)
- [ ] **No Sentry alerts:** Check dashboard for prompt_versioning fallback alerts
- [ ] **Usage events flowing:** Check usage event ingestion in analytics
- [ ] **Database operational:** `SELECT COUNT(*) FROM prompt_version WHERE is_active = true;`

### Rollback Plan (if needed)

1. **Immediate:** Merge rollback commit to main (revert to prior version)
2. **Or:** Manually rollback to last-known-good in Vercel environment
3. **Database:** Migrations are one-way; only rollback if testing showed issues
4. **Notify:** Alert team and update status page

---

## 6. Maintenance Tasks

### Weekly

- [ ] Review Sentry dashboard for any prompt_versioning warnings
- [ ] Check admin audit logs for suspicious publish/rollback activity
- [ ] Verify at least one version is published and active for each prompt key

### Monthly

- [ ] Document any fallback incidents and root causes
- [ ] Audit all published versions for outdated or incorrect content
- [ ] Test rollback functionality in staging environment
- [ ] Update this runbook with any lessons learned

### Quarterly

- [ ] Performance review of prompt loading:
  ```bash
  # Check average query time for prompt fetches
  SELECT 
    EXTRACT(EPOCH FROM (MAX(updated_at) - MIN(created_at))) AS duration_seconds,
    COUNT(*) AS total_fetches
  FROM prompt_version
  WHERE updated_at >= NOW() - INTERVAL '90 days';
  ```
- [ ] Template content audit—verify published versions match intended rules
- [ ] Database schema review—ensure indexes are optimal

---

## 7. Emergency Contacts

- **Database On-Call:** Check Vercel alerts
- **Platform On-Call:** Check deployment status page
- **Engineering Lead:** For incident escalation

---

## 8. Useful Commands

### View Active Prompt Version

```bash
# From application environment
env | grep NEXT_PUBLIC_SENTRY_DSN

# Query active version
psql -c "SELECT prompt_key, version_number, published_at FROM prompt_version WHERE is_active = true;"
```

### Manually Publish a Version

```bash
psql -c "
UPDATE prompt_version SET is_active = false WHERE prompt_key = 'chord_suggestions';
UPDATE prompt_version SET is_active = true WHERE prompt_key = 'chord_suggestions' AND version_number = 5;
"
```

### Check Fallback Events (Last Hour)

```bash
# In Sentry CLI or dashboard
sentry issues search 'component:prompt-versioning is:unresolved'
```

### View Audit Log

```bash
# Most recent prompt changes
psql -c "
SELECT 
  created_at, 
  actor_email, 
  action, 
  (metadata->>'versionNumber') as version,
  (metadata->>'promptKey') as prompt_key
FROM admin_audit_log 
WHERE target_type = 'prompt_version'
ORDER BY created_at DESC LIMIT 20;
"
```

---

## 9. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  User Request to /api/chord-suggestions              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ getRenderedPrompt() │
         └──────────┬──────────┘
                    │
        ┌───────────┴──────────────┐
        │ getActivePromptTemplate()│
        └───────────┬──────────────┘
                    │
        ┌───────────▼──────────────┐
        │  Query PromptVersion     │ ◄──── DB Fallback if fails
        │  (isActive = true)       │
        └───────────┬──────────────┘
                    │
           ┌────────▼────────┐
           │ Success?        │
           └────────┬────────┘
                    │
        ┌───────────┴───────────┐
        │ YES               NO  │
        ▼                       ▼
  Return DB Version    Return Fallback  ──► reportPromptFallback()
  + DB source          + fallback source    ──► Sentry alert
  + version number     + versionNumber: null

```

---

## 10. Questions & Troubleshooting

**Q: Why didn't my published prompt take effect?**  
A: Check that you clicked "Publish" (not just "Save"). Save only saves a draft. Check audit logs for publish confirmation.

**Q: Can I revert a published version?**  
A: Yes! Use the "Rollback" button to activate any previous version. This is safe and creates an audit trail.

**Q: What happens if the database goes down?**  
A: System automatically falls back to hardcoded template. You'll see Sentry warnings. Fix the database and fallback will clear on next request.

**Q: Are prompt changes immediate?**  
A: Yes! No cache used for prompts. Published versions are live within milliseconds.

**Q: Can admins see who changed what?**  
A: Yes! All changes are in the Admin Dashboard Audit Logs including WHO, WHEN, and WHAT.
