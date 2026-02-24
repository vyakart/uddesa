# Day 7+ Consolidation (Dedupe + Severity Normalization + Remediation + Sign-Off)

Date: 2026-02-24

## Scope

This consolidation merges findings from:

- `muwi/audit/2026-02/findings/day1-automated-scan-findings.md`
- `muwi/audit/2026-02/findings/day2-security-and-perf-findings.md`
- `muwi/audit/2026-02/findings/day3-data-integrity-findings.md`
- `muwi/audit/2026-02/findings/day4-a11y-ux-findings.md`
- `muwi/audit/2026-02/findings/day5-performance-code-quality-findings.md`
- `muwi/audit/2026-02/findings/day6-docs-build-release-findings.md`

It also incorporates outstanding manual-evidence gaps called out in:

- `muwi/audit/2026-02/report/day4-summary.md`
- `muwi/audit/2026-02/report/day5-summary.md`
- `muwi/audit/2026-02/report/day6-summary.md`

## Normalization Rules

### Severity (canonical)

Use the `AUDIT_PLAN_DETAILED.md` model only:

- `Critical`
- `High`
- `Medium`
- `Low`

Notes:

- Upstream `npm audit` uses `Moderate`; this is treated as `Medium` when planning remediation, but raw audit outputs retain original npm labels.

### Status (canonical)

- `Open`: No fix implemented yet.
- `Partially mitigated`: Risk reduced, but additional code work and/or runtime verification remains.
- `Remediated`: Fix implemented and local validation evidence captured.
- `Accepted / Informational`: Non-product-risk process/environment issue; document and proceed.

### Dedupe policy

- Canonical key is the finding ID (for example, `PERF-BUNDLE-001`).
- If an ID appears on multiple days, keep one row and use the latest status/evidence state.
- Earliest discovery day is preserved in the consolidated register.

## Consolidated Snapshot (Unique Findings)

- Total unique findings: `30`
- `Remediated`: `23`
- `Partially mitigated`: `2`
- `Open`: `4`
- `Accepted / Informational`: `1`

### Current Release/Audit Priority Focus

- `High` (open): `SEC-DEPS-001`
- `Medium` (partial/open): `PERF-BUNDLE-001`, `DATA-QUERY-001`, `DATA-SCHEMA-001`, `CQ-STRUCT-001`
- `Low` (partial): none
- Manual evidence gaps still open (sign-off checklist items): Lighthouse, screen reader pass, React Profiler / heap, Blackboard large-canvas runtime profiling

## Deduped Active Findings Register (Open / Partial / Informational)

| ID | Area | Severity | Status | First Seen | Latest Evidence | Notes |
|---|---|---:|---|---|---|---|
| `SEC-DEPS-001` | Security / Supply Chain | High | Open | Day 1 | Day 7 controlled remediation pass + `sec-deps-001-triage.md` refresh | Reduced from `29` to `20` vulnerabilities, but remaining runtime-path Excalidraw chain (`3` moderate) still requires remediation or formal risk acceptance. |
| `PERF-BUNDLE-001` | Performance / Bundle Size | Medium | Partially mitigated | Day 1 | Day 5 carry-forward + build artifacts | Route chunks improved, deferred vendor payloads still oversized. |
| `DATA-QUERY-001` | Data Layer / Transaction Safety | Medium | Partially mitigated | Day 3 | Day 3 findings + Day 5 `PERF-ACAD-REORDER-001` remediation | One high-impact reorder path improved, broader multi-table transaction gaps remain. |
| `DATA-SCHEMA-001` | Data Layer / Migration Readiness | Medium | Open | Day 3 | `day3-data-integrity-findings.md` | No Dexie migration framework/tests beyond schema v1. |
| `CQ-STRUCT-001` | Code Quality / Structure / DRY | Medium | Open | Day 5 | `day5-performance-code-quality-findings.md` | Large-file concentration and duplicated hierarchy helpers remain. |
| `MAINT-DEPS-001` | Maintenance / Dependency Health | Low | Open | Day 1 | Day 1 findings | Backlog item; coordinate with security dependency work. |
| `ENV-E2E-001` | Test Infrastructure / Environment | Low | Accepted / Informational | Day 1 | Day 1 baseline summary | Sandbox localhost bind restriction can false-fail Playwright; not a product defect. |

## Day 7 Validation Update (This Pass)

- `DATA-BACKUP-001` (High): Remediated
  - `restoreBackup(..., clearExisting=true)` now runs clear + restore in one Dexie transaction.
  - Added failure-injection rollback test proving original data remains on restore failure.
  - Evidence: `muwi/audit/2026-02/outputs/day7-data-backup-001-targeted-tests.txt`
- `SEC-ELECTRON-003` (Low): Remediated
  - Runtime Electron smoke verification completed with Playwright Electron test including `webPreferences` assertions for `sandbox`, `contextIsolation`, and `nodeIntegration`.
  - Evidence: `muwi/audit/2026-02/outputs/day7-electron-sandbox-smoke.txt`
- `SEC-DEPS-001` (High): Re-triaged (still open)
  - Fresh rerun established baseline (`29` total; `23` high; `5` moderate; `1` low), then a controlled dependency remediation pass reduced this to `20` total (`17` high; `3` moderate; `0` low).
  - Applied low-risk fixes only: `typescript-eslint` patch upgrade plus transitive patch overrides for `ajv`, `diff`, and `markdown-it`.
  - Remaining findings are `electron-builder` packaging-chain `High` advisories (dev/build tooling) and Excalidraw/Mermaid runtime-path `Moderate` advisories (`@excalidraw/excalidraw`, `@excalidraw/mermaid-to-excalidraw`, `nanoid`).
  - `npm audit fix --dry-run --json` showed noisy peer-resolution warnings and broad install-plan churn, so no blind auto-fix was applied.
  - Residual risk documented in `muwi/audit/2026-02/report/sec-deps-001-triage.md`.
- Automated regression checks rerun:
  - `npm run lint` - PASS (`muwi/audit/2026-02/outputs/day7-lint.txt`)
  - `npm run test:coverage` - PASS (`86` files / `416` tests; All files `88.95/80.00/86.51/89.28`) (`muwi/audit/2026-02/outputs/day7-test-coverage.txt`)
  - `npm run build` - PASS with existing chunk warnings (`muwi/audit/2026-02/outputs/day7-build.txt`)
- Post-dependency-upgrade regression + packaging validation:
  - `npm run lint` - PASS (`muwi/audit/2026-02/outputs/day7-sec-deps-post-upgrade-lint.txt`)
  - `npm run test:coverage` - PASS (`86` files / `416` tests; All files `88.95/80.00/86.51/89.28`) (`muwi/audit/2026-02/outputs/day7-sec-deps-post-upgrade-test-coverage.txt`)
  - `npm run build` - PASS with existing chunk warnings (`muwi/audit/2026-02/outputs/day7-sec-deps-post-upgrade-build.txt`)
  - `npm run electron:build` - Artifact-producing packaging validation completed for current commit range; process remained active in this execution harness after artifact generation (same class of behavior observed previously). Evidence: `muwi/audit/2026-02/outputs/day7-sec-deps-post-upgrade-electron-build.txt`

## Remediated Findings Rollup (Deduped)

### Security / Electron / IPC

- `SEC-IPC-001` (High) - Remediated
- `SEC-ELECTRON-001` (Medium) - Remediated
- `SEC-ELECTRON-002` (Medium) - Remediated
- `SEC-ELECTRON-003` (Low) - Remediated
- `SEC-IPC-002` (Low) - Remediated

### Data Layer / Backup

- `DATA-BACKUP-001` (High) - Remediated

### Accessibility / UX

- `A11Y-STATE-001` (Medium) - Remediated
- `A11Y-NAV-001` (Medium) - Remediated
- `UX-THEME-001` (Medium) - Remediated
- `UX-FLOW-001` (Low) - Remediated

### Performance / Runtime / Rendering

- `PERF-STORE-001` (High) - Remediated
- `PERF-ACAD-REORDER-001` (Medium) - Remediated
- `PERF-EDITOR-001` (Medium) - Remediated
- `PERF-TOC-001` (Medium) - Remediated
- `PERF-RENDER-001` (Medium) - Remediated

### Docs / Build / Release / CI

- `REL-BUILD-001` (High) - Remediated
- `DOC-README-001` (High) - Remediated
- `DOC-IMPL-001` (Medium) - Remediated
- `DOC-TEST-001` (Medium) - Remediated
- `REL-ASSET-001` (Medium) - Remediated
- `REL-CI-001` (Medium) - Remediated
- `REL-META-001` (Low) - Remediated

### Audit Tooling / Process

- `TOOL-AUDIT-001` (Low) - Remediated (procedure corrected in `AUDIT_PLAN_DETAILED.md`)

## Remediation Plan (Day 7+)

## Phase 0: Close Audit Evidence Gaps (same day / next pass)

Goal: complete sign-off evidence for already-remediated areas and performance claims.

1. Run Day 5 manual React Profiler workflow and fill results template:
   - `muwi/audit/2026-02/report/day5-manual-react-profiler-checklist.md`
   - `muwi/audit/2026-02/report/day5-manual-react-profiler-results.md`
2. Run Blackboard large-canvas runtime profiling scenario (500+ elements), capture FPS/CPU/heap observations and screenshots.
3. Run Lighthouse accessibility audit on core flows and save screenshots/output.
4. Run screen reader pass (VoiceOver minimum; NVDA if available) and record announcement/navigation issues.
5. Completed (Day 7): Electron runtime smoke validation for `SEC-ELECTRON-003` (`sandbox: true`) captured in `muwi/audit/2026-02/outputs/day7-electron-sandbox-smoke.txt`.

Exit criteria:

- All manual evidence artifacts saved under `muwi/audit/2026-02/outputs/` and/or `muwi/audit/2026-02/screenshots/`
- `SEC-ELECTRON-003` runtime verification complete (Day 7) and reflected in findings/consolidation status

## Phase 1: Pre-Release Code Fixes (blockers)

### 1. `DATA-BACKUP-001` (High) - Atomic restore fix (Completed Day 7)

Status:

- Completed in Day 7 closeout pass with failure-injection rollback test evidence (`muwi/audit/2026-02/outputs/day7-data-backup-001-targeted-tests.txt`).

Target outcome:

- `restoreBackup(..., clearExisting=true)` becomes atomic (no empty-DB failure window).

Implementation options (pick one, document choice):

- Single Dexie transaction wrapping clear + restore
- Staging restore + swap only on success (safer, more work)

Required validation:

- Failure-injection test: clear succeeds, restore fails, original data remains intact
- Existing backup/restore test suite rerun

### 2. `SEC-DEPS-001` (High) - Dependency vulnerability disposition and execution

Target outcome:

- No unmitigated `High` runtime vulnerabilities, and dev/build-only residuals documented with expiration/owner.

Work steps:

1. Re-run `npm audit --json` and compare with Day 1/Day 2 baseline.
2. Split findings into:
   - runtime-path direct/transitive
   - dev/build-only
   - no-fix/blocked
3. Upgrade safe packages first (patch/minor).
4. Validate `lint`, `test:coverage`, `build`, and targeted Electron packaging checks.
5. Document residual accepted risk (if any) with planned review date.

Required validation:

- Updated audit summary artifact
- Regression command evidence

## Phase 2: Risk Reduction (first patch cycle)

### 1. `PERF-BUNDLE-001` (Medium, partial)

Focus:

- Further split/defer `blackboard-excalidraw` / Mermaid/ELK/Katex stack
- Reduce `academic-citation` deferred payload or load features on demand

Success metrics:

- Fewer/lower Vite chunk warnings
- Reduced deferred vendor payload sizes in build artifact snapshot
- No regression in route switch timing

### 2. `DATA-QUERY-001` (Medium, partial)

Focus:

- Transaction-wrap remaining cross-table aggregate mutations beyond academic reorder path
- Add rollback/failure-injection tests for parent/child drift prevention

Success metrics:

- Inventory of covered query functions
- Targeted rollback tests passing

### 3. `DATA-SCHEMA-001` (Medium, open)

Focus:

- Introduce Dexie schema version bump + migration scaffold + migration tests

Success metrics:

- `version(2).upgrade(...)` path present
- Upgrade fixture test(s) committed

## Phase 3: Maintainability and Backlog Hygiene

### 1. `CQ-STRUCT-001` (Medium)

Work:

- Extract shared hierarchy helpers with tests
- Split top-risk monoliths by feature slice (especially editor/persistence UI modules)

Note:

- This should be planned after active correctness/security risks unless it is required to safely implement Phase 2 changes.

### 2. `MAINT-DEPS-001` (Low)

Work:

- Roll into dependency maintenance cadence after `SEC-DEPS-001` upgrades to avoid duplicate regression effort

### 3. `ENV-E2E-001` (Low, informational)

Work:

- Document execution-environment caveat in audit/runbook docs (if not already documented in operator instructions)

## Sign-Off Checklist (Release Readiness + Audit Closure)

Use this checklist for the Day 7+ closeout pass. Mark `N/A` only with rationale.

## A. Blocking Findings

- [x] `DATA-BACKUP-001` fixed and validated (atomic restore path)
- [ ] `SEC-DEPS-001` re-audited and resolved or formally risk-accepted (runtime exposure explicit)
- [x] No `Critical` findings remain open
- [ ] No `High` findings remain open without written risk acceptance + target date

## B. Partial Mitigations / Verification Completion

- [x] `SEC-ELECTRON-003` runtime Electron smoke verification completed (`sandbox: true`)
- [x] `PERF-BUNDLE-001` latest status documented (accepted residual size risk vs additional splitting)
- [x] `DATA-QUERY-001` scope/status documented (which aggregate mutations are now transaction-safe)

## C. Manual Evidence Gaps (Audit Completeness)

- [ ] Lighthouse accessibility audit run for core flows; screenshots/results saved
- [ ] Screen reader pass run (VoiceOver minimum); findings captured
- [ ] React DevTools Profiler manual capture completed and results file filled
- [ ] Blackboard large-canvas runtime profiling completed with notes/screenshots

## D. Regression Validation

- [x] `npm run lint`
- [x] `npm run test:coverage`
- [x] `npm run build`
- [x] Targeted tests added for each new fix (`DATA-BACKUP-001`, transaction rollback paths, dependency-related regressions as applicable)
- [x] Electron packaging validation run (at least one successful local artifact-producing run captured for current commit range)

## E. Documentation / Audit Record

- [x] Consolidated register updated with final statuses and dates
- [ ] Residual risk acceptances recorded (owner, rationale, expiration/review date)
- [ ] Final audit summary references all evidence artifacts used for sign-off
- [x] Optional Day 6 packaging non-exit behavior note confirmed in plain terminal or explicitly marked as tool-harness artifact

## F. Sign-Off Record (fill on final pass)

- [ ] Engineering sign-off (name/date)
- [ ] QA/Test sign-off (name/date)
- [ ] Accessibility review sign-off (name/date or `N/A` with reason)
- [ ] Security/dependency triage sign-off (name/date)
- [ ] Release owner sign-off (name/date)

## Notes for Next Consolidation Pass

- Recompute counts after Phase 0 and Phase 1 completion (several partial/open items should move to `Remediated`).
- If new findings are discovered during manual profiling or screen reader testing, assign new IDs rather than overloading existing ones.
- Keep `PERF-BUNDLE-001` as the canonical bundle-size thread to avoid reopening duplicate perf IDs for the same root issue.
