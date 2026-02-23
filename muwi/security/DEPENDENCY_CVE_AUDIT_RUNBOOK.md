# Dependency CVE Audit Runbook

This runbook operationalizes the external dependency scan step that cannot run in restricted/offline environments.

## 1) When to run

- Before release candidate builds.
- After dependency upgrades.
- After any high/critical advisory disclosure affecting frontend/Electron ecosystems.

## 2) Prerequisites

- Run from `muwi/`.
- Network access to `registry.npmjs.org`.
- Installed dependencies (`npm install`).

## 3) Required scan commands

```bash
# from muwi/
mkdir -p security/reports
DATE_TAG="$(date +%F)"

npm run audit:deps:json > "security/reports/npm-audit-${DATE_TAG}.json"
npm run audit:deps:summary -- \
  "security/reports/npm-audit-${DATE_TAG}.json" \
  "security/reports/npm-audit-${DATE_TAG}-summary.md"
```

## 4) Optional secondary scanners

Run one additional scanner to reduce blind spots:

```bash
# OSV scanner (if installed)
osv-scanner --lockfile=package-lock.json --format json \
  > "security/reports/osv-${DATE_TAG}.json"

# Snyk (if configured)
snyk test --json > "security/reports/snyk-${DATE_TAG}.json"
```

## 5) Triage workflow

1. Open `security/CVE_TRIAGE_TEMPLATE.md`.
2. Paste summary counts and advisories from `npm-audit-*-summary.md`.
3. Assign owner and due date for each critical/high issue.
4. Classify each item: `fix-now`, `fix-next-sprint`, `defer-with-mitigation`, or `accepted-risk`.
5. Re-run scan after fixes and link the follow-up report in the same row.

## 6) Exit criteria

- Every discovered advisory has a tracked decision and owner.
- No unresolved critical vulnerabilities without documented mitigation and ETA.
- Post-fix re-scan artifacts are attached.
- Progress note added to `PROGRESS.md` with scan date and status.
