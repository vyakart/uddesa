# Dependency Audit Summary (npm audit)

- Generated: 2026-02-25T04:23:45.478Z
- Source: `/Users/ziksartin/tools/uddesa/muwi/audit/2026-02/outputs/day8-audit-deps-before-excalidraw-fork-json.txt`
- Total vulnerable packages: 4

## Severity Totals

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 1 |
| Moderate | 3 |
| Low | 0 |
| Info | 0 |
| Unknown | 0 |

## Package Findings

| Package | Severity | Direct | Fix available | Recommended action | Via | Range |
| --- | --- | --- | --- | --- | --- | --- |
| minimatch | high | no | yes | fix-now | https://github.com/advisories/GHSA-3ppc-4f35-3m26 (high); https://github.com/advisories/GHSA-3ppc-4f35-3m26 (high); +1 more | <=3.1.2 \|\| 5.0.0 - 5.1.6 \|\| 9.0.0 - 9.0.5 |
| @excalidraw/excalidraw | moderate | yes | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | @excalidraw/mermaid-to-excalidraw | 0.17.1-08b13f9 - 0.17.1-test \|\| >=0.18.0-6135548 |
| @excalidraw/mermaid-to-excalidraw | moderate | no | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | nanoid | * |
| nanoid | moderate | no | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | https://github.com/advisories/GHSA-mwcw-c2x4-8c55 (moderate) | 4.0.0 - 5.0.8 |

## Next Steps

1. Copy findings into `security/CVE_TRIAGE_TEMPLATE.md`.
2. Assign owner + target date for every critical/high finding.
3. Re-run `npm audit --json` after upgrades and attach both reports to the same triage entry.