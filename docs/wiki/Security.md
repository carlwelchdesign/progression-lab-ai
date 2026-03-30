# Security

## Security Documentation Model

Security detail is split between wiki navigation and versioned in-repo artifacts.

Primary in-repo references:

- `SECURITY_AUDIT_2025.md`
- `SECURITY_DEPENDENCIES.md`
- `SECURITY_DEPLOYMENT.md`
- `SECURITY_FIXES_APPLIED.md`

## Core Practices

1. Keep dependency and deployment security checklists current.
2. Validate auth and API access controls after major feature changes.
3. Apply migration and billing changes with explicit rollback plans.
4. Track high-severity findings with owner and remediation status.

## Deployment Security

For release-time controls, use:

- `SECURITY_DEPLOYMENT.md`

## Audit and Follow-up

For historical findings and remediations, use:

- `SECURITY_AUDIT_2025.md`
- `SECURITY_FIXES_APPLIED.md`

## Related Pages

- Deployment: `Deployment`
- Architecture: `Architecture`
