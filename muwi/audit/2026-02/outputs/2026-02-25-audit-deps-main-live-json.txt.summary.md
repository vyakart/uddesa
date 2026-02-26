# Dependency Audit Summary (npm audit)

- Generated: 2026-02-25T06:44:25.681Z
- Source: `/Users/ziksartin/tools/uddesa/muwi/audit/2026-02/outputs/2026-02-25-audit-deps-main-live-json.txt`
- Total vulnerable packages: 1

## Severity Totals

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 1 |
| Moderate | 0 |
| Low | 0 |
| Info | 0 |
| Unknown | 0 |

## Package Findings

| Package | Severity | Direct | Fix available | Recommended action | Via | Range |
| --- | --- | --- | --- | --- | --- | --- |
| minimatch | high | no | yes | fix-now | https://github.com/advisories/GHSA-3ppc-4f35-3m26 (high); https://github.com/advisories/GHSA-3ppc-4f35-3m26 (high); +1 more | <=3.1.2 \|\| 5.0.0 - 5.1.6 \|\| 9.0.0 - 9.0.5 |

## Next Steps

1. Copy findings into `security/CVE_TRIAGE_TEMPLATE.md`.
2. Assign owner + target date for every critical/high finding.
3. Re-run `npm audit --json` after upgrades and attach both reports to the same triage entry.