# Dependency CVE Triage Template

Use this after generating scan output via `security/DEPENDENCY_CVE_AUDIT_RUNBOOK.md`.

## Scan Metadata

- Scan date:
- Executor:
- Branch/commit:
- Node version:
- npm version:
- Scan command:
- Report files:

## Severity Summary

| Severity | Count |
| --- | ---: |
| Critical | |
| High | |
| Moderate | |
| Low | |
| Info | |
| Unknown | |

## Decision SLA

| Severity | Target decision window | Target fix window |
| --- | --- | --- |
| Critical | Same day | 24-72h |
| High | 1 business day | 7 days |
| Moderate | 3 business days | Current or next sprint |
| Low/Info | Next planning cycle | Best effort / opportunistic |

## Findings Triage

| Advisory (CVE/GHSA/source) | Package | Severity | Direct dep | Affected range | Fix available | Recommended action | Owner | Decision | Due date | Mitigation notes | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GHSA-pqxr-3g65-p328; GHSA-95fx-jjr5-f39c (+5 advisories via npm audit) | jspdf | High | yes | <=4.1.0 | yes (`4.2.0`) | fix-now | MUWI maintainers | fix-now (completed 2026-02-20) | 2026-02-20 | Upgraded direct dep to `^4.2.0`; added PDF export regression assertions that `addJS` is never called and adversarial strings remain plain text. | `security/reports/npm-audit-2026-02-20-post-jspdf.json`; `security/reports/npm-audit-2026-02-20-post-jspdf-summary.md`; `npm run lint`; `npm run test -- --run`; `npm run build` |
| GHSA-3ppc-4f35-3m26 (+eslint chain advisories via npm audit) | eslint | High | yes | 0.7.1 - 2.0.0-rc.1 \|\| >=4.1.0 | yes (`eslint@10.0.1`, semver-major) | fix-now | MUWI maintainers | fix-now (completed 2026-02-20) | 2026-02-20 | Removed `eslint-plugin-react-hooks` constraint path from lint configuration/dependencies, upgraded to `eslint@^10.0.1` + `@eslint/js@^10.0.1`, and fixed new ESLint 10 rule regressions. Dev-time-only exposure remains non-runtime. | `npm ls eslint-plugin-react-hooks` (empty), `npm run lint`, `npm run test -- --run`, `npm run build`, `security/reports/npm-audit-2026-02-20-post-eslint10.json` (intermittent registry DNS failures during capture) |
| GHSA-3ppc-4f35-3m26 (+typescript-eslint chain advisories via npm audit) | typescript-eslint | High | yes | * | yes (`typescript-eslint@8.36.0`, semver-major per audit recommendation) | fix-next-sprint | MUWI maintainers | fix-now (partial) + defer-with-mitigation for semver-major recommendation | 2026-02-27 | Upgraded to `^8.56.0` and removed duplicate direct pins for `@typescript-eslint/parser`/`eslint-plugin`; remaining advisory path is semver-major recommendation per npm audit. Dev-time-only exposure (lint/build tooling). | `security/reports/npm-audit-2026-02-20-post-lint-electron-builder.json`; `security/reports/npm-audit-2026-02-20-post-lint-electron-builder-summary.md`; `npm run lint`; `npm run test -- --run`; `npm run build` |
| GHSA-3ppc-4f35-3m26 + builder-chain advisories via npm audit (`@electron/asar`, `app-builder-lib`, `tar` path) | electron-builder | High | yes | 19.25.0 \|\| >=22.10.0 | yes (`electron-builder@22.14.13`, semver-major per audit recommendation) | fix-next-sprint | MUWI maintainers | fix-now (partial) + defer-with-mitigation for semver-major/backlevel path (analysis complete 2026-02-23) | 2026-02-27 | Upgraded to latest non-major `^26.8.1`; advisory chain reduced but not eliminated. Explicit go/no-go analysis (2026-02-23) records `GO` for staying on `26.8.1` with CI containment controls and `NO-GO` for production backlevel/forced-major builder-chain changes without full packaging matrix parity. Audit recommendations varied across snapshots (`22.14.13`, `25.1.8`), so they are treated as triage input rather than direct execution guidance. See `security/ELECTRON_BUILDER_REMEDIATION_ANALYSIS.md`. | `security/reports/npm-audit-2026-02-20-post-lint-electron-builder.json`; `security/reports/npm-audit-2026-02-20-post-lint-electron-builder-summary.md`; `npm run lint`; `npm run test -- --run`; `npm run build`; `npm ls electron-builder app-builder-lib @electron/asar minimatch ajv --depth=4`; `security/ELECTRON_BUILDER_REMEDIATION_ANALYSIS.md` |
| GHSA-mwcw-c2x4-8c55 (+Excalidraw chain advisories via npm audit) | @excalidraw/excalidraw | Moderate | yes | 0.17.1-08b13f9 - 0.17.1-test \|\| >=0.18.0-6135548 | yes (`@excalidraw/excalidraw@0.17.6`, semver-major downgrade) | fix-next-sprint | MUWI maintainers | fix-now (partial) + defer-with-mitigation | 2026-02-27 | Full downgrade is blocked by React peer mismatch (`0.17.6` requires React `^17 || ^18`). Added targeted overrides to reduce Excalidraw transitive risk (`@excalidraw/excalidraw -> nanoid@3.3.11`, `@excalidraw/mermaid-to-excalidraw -> mermaid@10.9.5`). Follow-up experiment on 2026-02-23 tested nested npm override `@excalidraw/mermaid-to-excalidraw -> nanoid@3.3.11`, but npm did not converge the installed tree (nested `nanoid@4.0.2` remained) and `npm ls` reported `ELSPROBLEMS` invalid dependency state, so the override was reverted and recorded as a no-go. | `security/reports/npm-audit-2026-02-20-post-lint-electron-builder-summary.md`; `security/reports/npm-audit-2026-02-20-post-excalidraw-mermaid-override.json`; `security/reports/npm-audit-2026-02-20-post-excalidraw-mermaid-override-summary.md`; `npm run lint`; `npm run test -- --run`; `npm run build`; `npm install --package-lock-only`; `npm install`; `npm ls @excalidraw/mermaid-to-excalidraw nanoid --depth=3` (shows nested `nanoid@4.0.2` / invalid when nested override is present) |

## Decision Notes

- `fix-now`: patch immediately and re-scan.
- `fix-next-sprint`: patch with dated ticket and owner.
- `defer-with-mitigation`: temporary controls documented (for example feature disable, runtime guard, or exploit precondition blocked).
- `accepted-risk`: explicit risk sign-off with rationale and review date.

## Re-Scan Log

| Date | Scope | Result | Follow-up needed |
| --- | --- | --- | --- |
| 2026-02-23 | Electron-builder semver-major/backlevel remediation analysis | `GO` keep `electron-builder@26.8.1` with CI containment controls. `NO-GO` production backlevel (`22.x`) or forced major builder-chain overrides without full packaging matrix parity. | Implement CI packaging isolation, pinned Node/npm, and signed clean-runner release gates before accepting residual build-time highs long-term. |
| 2026-02-23 | Excalidraw nested override feasibility (`@excalidraw/mermaid-to-excalidraw -> nanoid@3.3.11`) | No-go: npm recognized override intent but retained nested `nanoid@4.0.2`; `npm ls` returned `ELSPROBLEMS` invalid dependency tree when override was present. | Keep current partial mitigation + upstream watch; evaluate patch-package or feature-gating only if policy requires deeper reduction before upstream fix. |
| | | | |
