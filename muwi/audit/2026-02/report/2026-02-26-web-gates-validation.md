# Web Gates Validation + Launch Checklist Evidence (Local)

Date: 2026-02-26
Owner: Codex (local workspace run)

## Scope

- Added web fallback E2E coverage for `BackupPanel`/`ExportPanel` fallback flows.
- Ran local CI-equivalent commands for web E2E + perf/bundle gates.
- Attempted Netlify smoke and documented result.
- Documented manual checklist items that cannot be executed in this headless/sandbox environment.

## Remote CI / PR Status

- `N/A` (not executed): Could not run/inspect GitHub Actions on a branch/PR from this environment (no GitHub remote auth/session available here).
- Local CI-equivalent evidence produced instead:
  - `muwi/audit/2026-02/outputs/2026-02-26-ci-local-lint.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-coverage.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-ci-local-build.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-ci-local-bundle-budget-check.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-e2e-web-ci.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-ci-local-perf-baseline-web.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-ci-local-perf-baseline.json`
  - `muwi/audit/2026-02/outputs/2026-02-26-ci-local-perf-budget-check.txt`

## New E2E Coverage Added

- Spec: `muwi/e2e/web-fallback-panels.spec.ts`
- Dev-only harness route: `muwi/src/e2e/WebFallbackHarness.tsx` via `muwi/src/main.tsx`
- Coverage includes:
  - Backup save browser download fallback
  - Backup load file-picker fallback
  - Export save browser download fallback
  - Auto-backup Electron-only limitation error message

## Checklist Evidence (`muwi/docs/web-launch-checklist.md`)

Status values used: `PASS`, `FAIL`, `N/A`

### Build + Unit Coverage

| Item | Status | Evidence | Notes |
|---|---|---|---|
| `npm run lint` | PASS | `muwi/audit/2026-02/outputs/2026-02-26-ci-local-lint.txt` | Completed locally. |
| `npm run test:coverage` | FAIL | `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-coverage.txt` | Global branch coverage is `79.26%` (threshold `80%`). |
| `npm run build` | PASS | `muwi/audit/2026-02/outputs/2026-02-26-ci-local-build.txt` | Build completed; Vite emitted chunk-size warnings only. |

### Multi-Browser E2E

| Item | Status | Evidence | Notes |
|---|---|---|---|
| Chromium web E2E | FAIL | `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-e2e-web-ci.txt` | Fails `routing-web.spec.ts` deep-link refresh check (`/academic`). |
| Firefox web E2E | FAIL | `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-e2e-web-ci.txt` | Fails `routing-web.spec.ts` deep-link refresh check (`/academic`). |
| WebKit web E2E | FAIL | `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-e2e-web-ci.txt` | Fails `routing-web.spec.ts` deep-link refresh + WebKit focus-order assertion in `accessibility-audit.spec.ts`. |

### Web Fallback Flows

| Item | Status | Evidence | Notes |
|---|---|---|---|
| Backup save (browser download fallback) | PASS | `muwi/e2e/web-fallback-panels.spec.ts`, `muwi/test-results/` | Validated via Playwright download event + attached JSON artifact. |
| Backup load (file picker fallback) | PASS | `muwi/e2e/web-fallback-panels.spec.ts`, `muwi/test-results/` | Validated via Playwright file chooser + restore success message. |
| Export save (browser download fallback) | PASS | `muwi/e2e/web-fallback-panels.spec.ts`, `muwi/test-results/` | Validated via Playwright download event for `.tex` export. |
| Auto-backup Electron-only limitation fails gracefully | PASS | `muwi/e2e/web-fallback-panels.spec.ts`, `muwi/test-results/` | Validated `Browse` shows desktop-app limitation error in web harness. |

### Deep-Link / Routing Checks

| Item | Status | Evidence | Notes |
|---|---|---|---|
| `/` loads | PASS | `muwi/e2e/smoke.spec.ts`, `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-e2e-web-ci.txt` | Passes in current local suite run. |
| `/academic` refresh works | FAIL | `muwi/e2e/routing-web.spec.ts`, `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-e2e-web-ci.txt` | App falls back to shelf; back button not found. |
| `/drafts/draft-123` refresh works | FAIL | `muwi/e2e/routing-web.spec.ts`, `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-e2e-web-ci.txt` | Same test blocked by `/academic` failure before second assertion. |
| Unknown route safely falls back to shelf | PASS | `muwi/e2e/routing-web.spec.ts`, `muwi/audit/2026-02/outputs/2026-02-26-ci-local-test-e2e-web-ci.txt` | Passes in local multi-browser run. |

### Bundle / Performance Regression Gates

| Item | Status | Evidence | Notes |
|---|---|---|---|
| Bundle budget checker passes | PASS | `muwi/audit/2026-02/outputs/2026-02-26-ci-local-bundle-budget-check.txt` | Reported `PASS` (initial bytes `2,989,070`). |
| Perf baseline budget checker passes | PASS | `muwi/audit/2026-02/outputs/2026-02-26-ci-local-perf-baseline-web.txt`, `muwi/audit/2026-02/outputs/2026-02-26-ci-local-perf-baseline.json`, `muwi/audit/2026-02/outputs/2026-02-26-ci-local-perf-budget-check.txt` | Chromium perf baseline captured and budget check passed. |

### Manual Evidence (Blocking)

| Item | Status | Evidence | Notes |
|---|---|---|---|
| React Profiler capture (Long Drafts) | N/A | — | Requires interactive browser + React DevTools Profiler. |
| React Profiler capture (Academic) | N/A | — | Requires interactive browser + React DevTools Profiler. |
| React Profiler capture (TOC reorder) | N/A | — | Requires interactive browser + React DevTools Profiler. |
| Blackboard large-canvas runtime profile (500+ elements) | N/A | — | Requires manual interactive profiling. |
| Lighthouse accessibility audit artifacts | N/A | — | Requires browser/CLI network + target deploy selection. |
| Screen reader pass notes (VoiceOver minimum) | N/A | — | Requires macOS VoiceOver/manual operator. |

### Netlify Config / Deploy / Rollback

| Item | Status | Evidence | Notes |
|---|---|---|---|
| `netlify.toml` matches live settings | N/A | `netlify.toml` | Repo config inspected locally; live Netlify settings could not be confirmed from this environment. |
| SPA rewrite verified on production URL | N/A | `muwi/audit/2026-02/outputs/2026-02-26-smoke-netlify.txt` | `npm run smoke:netlify` failed with `getaddrinfo ENOTFOUND uddesa.netlify.app` (environment DNS and/or invalid URL). |
| Rollback procedure documented | N/A | — | Not reviewed in this run. |
| Rollback verification smoke documented | N/A | — | Not reviewed in this run. |

### Share Readiness

| Item | Status | Evidence | Notes |
|---|---|---|---|
| `muwi/README.md` updated for web demo + browser/Electron differences | N/A | — | Not evaluated in this run. |
| Feedback path (GitHub Issues and/or form) documented | N/A | — | Not evaluated in this run. |

## Local Multi-Browser E2E Summary (Final Run)

- Command: `npm run test:e2e:web:ci`
- Result: `29 passed / 4 failed` (local run)
- Failing tests:
  - `muwi/e2e/routing-web.spec.ts` deep-link refresh (`chromium`, `firefox`, `webkit`)
  - `muwi/e2e/accessibility-audit.spec.ts` keyboard focus order (`webkit`)

## Netlify Smoke Attempt

- Command: `npm run smoke:netlify`
- Result: `FAIL`
- Evidence: `muwi/audit/2026-02/outputs/2026-02-26-smoke-netlify.txt`
- Error: `getaddrinfo ENOTFOUND uddesa.netlify.app`

