# UDDESA (MUWI) - Detailed Audit Execution Plan

**Purpose**: Low-level execution plan for the high-level `AUDIT_PLAN.md`
**Scope**: Application code in `muwi/` (repo root contains planning/docs)
**Audit Window**: February 2026 (post-development production readiness audit)
**Status**: Draft v1

---

## 0. Scope, Assumptions, and Working Rules

### 0.1 Scope Normalization (important)
`AUDIT_PLAN.md` references app paths like `src/...` and `electron/...`. In this repo, those paths live under:

- `muwi/src/...`
- `muwi/electron/...`
- `muwi/e2e/...`

This detailed plan uses the `muwi/`-prefixed paths for all commands and reviews.

### 0.2 Audit Objectives
- Verify production readiness across code quality, security, performance, accessibility, testing, docs, build/deploy, data layer, UX/UI, and maintenance.
- Produce evidence-backed findings (not opinion-only review comments).
- Convert findings into remediations with severity and owner-ready tasks.

### 0.3 Severity Model (use consistently)
- `Critical`: Stop-ship. Security/data loss/corruption or severe privacy risk.
- `High`: Must fix before release or before public distribution.
- `Medium`: Fix in first patch cycle or tracked with target date.
- `Low`: Cleanup / maintainability improvements.

### 0.4 Evidence Requirements (for every finding)
For each issue, capture:
- `ID` (e.g., `SEC-IPC-001`)
- `Area`
- `Severity`
- `File(s)`
- `Repro/verification steps`
- `Observed behavior`
- `Expected behavior`
- `Suggested fix`
- `Evidence` (command output, screenshot, test result, code reference)

### 0.5 Audit Artifacts (create during execution)
Recommended folder:
- `muwi/audit/2026-02/`

Subfolders:
- `muwi/audit/2026-02/outputs/` (raw command outputs)
- `muwi/audit/2026-02/screenshots/` (accessibility/perf evidence)
- `muwi/audit/2026-02/findings/` (issue drafts)
- `muwi/audit/2026-02/report/` (final report)

---

## 1. Pre-Audit Setup (Day 0 / 1 hour)

### 1.1 Environment Preparation
- [ ] Confirm Node/npm versions used for the audit.
- [ ] Run all audit commands from `muwi/`.
- [ ] Install dependencies if not already installed: `npm install`
- [ ] Confirm scripts exist via `cat package.json` (already verified in planning)

### 1.2 Create Audit Workspace
- [ ] Create `muwi/audit/2026-02/` and subfolders listed above.
- [ ] Create tracking sheet/file (CSV/Markdown) for findings.
- [ ] Create `muwi/audit/2026-02/README.md` describing environment + audit date.

### 1.3 Baseline Snapshot (before any fixes)
Run and save outputs:
```bash
cd muwi
npm run lint
npm run test:coverage
npm run test:e2e
npm run build
```

Capture:
- [ ] Lint result
- [ ] Coverage summary
- [ ] E2E pass/fail summary
- [ ] Build result + warnings
- [ ] Build artifact sizes

---

## 2. Audit Inventory (Current Codebase Snapshot)

Use this inventory to plan review order and sampling.

### 2.1 Key Inventory Counts (observed)
- Components files under `muwi/src/components`: `130`
- Unit/component test files under `muwi/src` (`*.test.ts|*.test.tsx`): `85`
- Store tests: `8`
- Utils tests: `9`
- Hook tests: `5`
- E2E specs: `5`

### 2.2 Largest Files (priority manual review candidates)
These exceed the high-level plan's 300-line heuristic by a wide margin:
- `muwi/src/components/diaries/academic/BibliographyManager.tsx` (~1166)
- `muwi/src/components/diaries/long-drafts/SectionEditor.tsx` (~960)
- `muwi/src/utils/export.ts` (~909)
- `muwi/src/stores/academicStore.ts` (~855)
- `muwi/src/components/diaries/academic/AcademicSectionEditor.tsx` (~759)
- `muwi/src/components/diaries/long-drafts/LongDrafts.tsx` (~678)
- `muwi/src/utils/backup.ts` (~669)
- `muwi/src/components/diaries/long-drafts/TableOfContents.tsx` (~652)
- `muwi/src/stores/longDraftsStore.ts` (~581)

These should be reviewed first for structure, correctness, and regression risk.

---

## 3. Detailed Execution Plan by Audit Domain

## 3.1 Code Quality Audit (Detailed)

### 3.1.1 Static Checks and Lint Hygiene
Commands:
```bash
cd muwi
npm run lint
npx eslint . --report-unused-disable-directives
```

Tasks:
- [ ] Save raw ESLint outputs to `audit/2026-02/outputs/eslint.txt`
- [ ] Count warnings vs errors
- [ ] Review every `eslint-disable` comment for justification
- [ ] Flag disabled rules hiding safety issues (especially `any`, hooks, or unsafe casts)

Acceptance:
- [ ] Zero lint errors
- [ ] Zero unused disable directives
- [ ] All remaining suppressions documented in findings or accepted debt list

### 3.1.2 TypeScript and Type-Safety Review
Target files:
- `muwi/tsconfig.json`
- `muwi/tsconfig.app.json`
- `muwi/tsconfig.node.json`
- `muwi/src/types/*.ts`
- `muwi/src/stores/*.ts`
- `muwi/src/utils/*.ts`

Commands:
```bash
cd muwi
rg -n "\\bany\\b" src electron
rg -n "as unknown as|@ts-ignore|@ts-expect-error" src electron
npx tsc -b --noEmit
```

Tasks:
- [ ] Confirm `strict` mode and relevant strictness flags
- [ ] Inventory all `any` usage and classify:
  - [ ] necessary boundary typing
  - [ ] temporary workaround
  - [ ] fixable misuse
- [ ] Review unsafe double-casts (`as unknown as`)
- [ ] Review `@ts-ignore`/`@ts-expect-error` for justification + expiration
- [ ] Check null/undefined guards around IndexedDB, Electron APIs, and optional props

Acceptance:
- [ ] No unexplained `any`
- [ ] No silent type suppression without comment
- [ ] TS build passes

### 3.1.3 Structure, Modularity, and Dependency Hygiene
Commands:
```bash
cd muwi
find src -type f \\( -name '*.ts' -o -name '*.tsx' \\) -print0 | xargs -0 wc -l | sort -nr | head -30
rg -n "TODO|FIXME|HACK" src electron
```

Optional tooling (if installed):
```bash
cd muwi
npx madge --circular --extensions ts,tsx src
```

Tasks:
- [ ] Review top 20 largest files for single-responsibility violations
- [ ] Mark duplicate logic >10 lines for extraction candidates
- [ ] Check for circular imports (manual or `madge`)
- [ ] Review TODO/FIXME/HACK comments and ensure they are tracked

Acceptance:
- [ ] No circular dependencies in app core paths
- [ ] High-risk large files documented with refactor recommendations

### 3.1.4 React-Specific Review (Hooks, Rendering, State Placement)
Priority directories:
- `muwi/src/components/common/`
- `muwi/src/components/diaries/academic/`
- `muwi/src/components/diaries/long-drafts/`
- `muwi/src/hooks/`
- `muwi/src/stores/`

Commands:
```bash
cd muwi
rg -n "useEffect\\(" src/components src/hooks
rg -n "useMemo\\(|useCallback\\(" src/components src/hooks
rg -n "key=\\{" src/components
```

Tasks:
- [ ] Verify hook rules are respected (no conditional hooks)
- [ ] Review `useEffect` cleanup for event listeners, timers, subscriptions
- [ ] Review list key stability in dynamic lists
- [ ] Review state colocation vs over-centralization in stores
- [ ] Note expensive render paths in large editors/panels for perf follow-up

Acceptance:
- [ ] No hook rule violations
- [ ] All side effects have cleanup where applicable
- [ ] No unstable key usage in user-editable lists

---

## 3.2 Security Audit (Detailed)

## 3.2.1 Dependency Vulnerability and Supply-Chain Review
Commands (existing scripts available in `muwi/package.json`):
```bash
cd muwi
npm run audit:deps:json
npm run audit:deps:summary -- audit/2026-02/outputs/day1-audit-deps-json.txt audit/2026-02/outputs/day1-audit-deps-summary.md
npm outdated
```

Note: `audit:deps:summary` expects an audit JSON input path (and optional output path). Running it without arguments returns a usage error.

Optional:
```bash
cd muwi
npx license-checker --summary
```

Tasks:
- [ ] Save audit JSON and summary outputs
- [ ] Classify vulnerabilities by:
  - [ ] prod dependency vs dev dependency
  - [ ] runtime reachable vs build-time only
  - [ ] patch/minor/major upgrade path
- [ ] Review `overrides` in `package.json` for rationale and freshness
- [ ] Review Electron version and known security advisories

Acceptance:
- [ ] Zero unmitigated high/critical runtime vulnerabilities
- [ ] Override usage documented
- [ ] Upgrade/remediation actions filed for remaining issues

## 3.2.2 Electron Hardening Review (Critical)
Mandatory files:
- `muwi/electron/main.ts`
- `muwi/electron/preload.ts`

Checklist:
- [ ] `contextIsolation` enabled
- [ ] `nodeIntegration` disabled in renderer
- [ ] `sandbox` setting reviewed and justified
- [ ] `webSecurity` not disabled (or justification exists)
- [ ] Navigation/`new-window` behavior restricted
- [ ] External URL opening uses safe allowlist patterns
- [ ] Dev-only behaviors gated by environment

Tasks:
- [ ] Inventory all `BrowserWindow` options
- [ ] Inventory all IPC channels exposed in preload
- [ ] Verify renderer receives minimal API surface only
- [ ] Check for direct shell/file/network access leakage to renderer

Acceptance:
- [ ] No unsafe Electron defaults
- [ ] Preload exposes least-privilege API

## 3.2.3 IPC Input Validation and Error Handling
Files:
- `muwi/electron/main.ts`
- `muwi/electron/preload.ts`
- Any renderer callers in `muwi/src/**`

Commands:
```bash
cd muwi
rg -n "ipcMain\\.|handle\\(|on\\(" electron/main.ts
rg -n "contextBridge|ipcRenderer" electron/preload.ts
rg -n "window\\.|electron|ipc" src
```

Tasks:
- [ ] Build IPC endpoint inventory table:
  - channel name
  - direction
  - input schema
  - validation present?
  - error path tested?
- [ ] Validate path/file arguments against traversal (`..`, absolute path injection, unexpected extensions)
- [ ] Confirm structured errors returned to renderer (no raw stack leakage to UI)
- [ ] Confirm rejected promises are handled in renderer callsites

Acceptance:
- [ ] Every IPC handler validates input shape and path constraints
- [ ] Error paths are deterministic and user-safe

## 3.2.4 Content Handling / XSS / Injection Surfaces
Priority files:
- `muwi/src/utils/export.ts`
- `muwi/src/utils/backup.ts`
- TipTap-related components in `muwi/src/components/diaries/**`
- Excalidraw integration components in `muwi/src/components/diaries/blackboard/`

Tasks:
- [ ] Review any HTML rendering (`dangerouslySetInnerHTML`, raw HTML imports/exports)
- [ ] Confirm pasted/imported content sanitization boundaries
- [ ] Review export generation for scriptable payload injection risks
- [ ] Validate file-name sanitization for export/backup outputs

Commands:
```bash
cd muwi
rg -n "dangerouslySetInnerHTML|innerHTML|DOMParser|createObjectURL" src
rg -n "export|backup|saveAs|blob" src/utils src/components
```

Acceptance:
- [ ] No untrusted HTML rendered without sanitization
- [ ] Exported filenames/paths sanitized

## 3.2.5 Cryptography and Content Locking Review
Mandatory files:
- `muwi/src/utils/crypto.ts`
- `muwi/src/hooks/useContentLocking.ts`
- `muwi/src/components/common/PasskeyPrompt/` (UI flow sanity)

Tasks:
- [ ] Verify KDF type and parameters (PBKDF2 iteration count, hash, key length)
- [ ] Verify random salt generation and uniqueness
- [ ] Verify secrets are not stored in plaintext in localStorage/IndexedDB
- [ ] Verify lock/unlock failure handling (no partial decrypt state leaks)
- [ ] Review timing-safe comparison usage where applicable

Commands:
```bash
cd muwi
rg -n "PBKDF2|subtle|crypto\\.subtle|salt|localStorage|sessionStorage" src/utils src/hooks src/stores
```

Acceptance:
- [ ] KDF parameters meet baseline security target
- [ ] No plaintext passkey or derived key persisted

---

## 3.3 Performance Audit (Detailed)

## 3.3.1 Build and Bundle Profiling
Commands:
```bash
cd muwi
npm run build
```

Optional bundle analysis:
```bash
cd muwi
npx vite-bundle-visualizer
```

Tasks:
- [ ] Capture build time
- [ ] Capture final bundle asset sizes (JS/CSS/assets)
- [ ] Identify largest bundles/chunks
- [ ] Flag heavy modules loaded on initial route
- [ ] Confirm code splitting for editor-heavy features if intended

Acceptance:
- [ ] Build succeeds with no critical warnings
- [ ] Main entry bundle within target (or justified with mitigation plan)

## 3.3.2 Runtime Profiling Scenarios (Manual + Existing E2E)
Relevant E2E spec:
- `muwi/e2e/performance-baseline.spec.ts`

Manual scenarios (record metrics):
1. Create 50+ diary entries and measure list render responsiveness.
2. Create Blackboard with 500+ elements; observe input latency/FPS.
3. Load Long Draft with 20+ sections; measure initial render and interactions.
4. Open/close Command Palette 50 times; check memory growth.

Tasks:
- [ ] Record CPU profile for each scenario
- [ ] Record memory snapshot before/after repeated actions
- [ ] Identify top render offenders (React DevTools Profiler)
- [ ] Link findings back to specific components/stores

Acceptance:
- [ ] No obvious leaks or unbounded memory growth
- [ ] Major interaction paths remain usable on target hardware

## 3.3.3 Electron Main Process Performance
Files:
- `muwi/electron/main.ts`
- `muwi/src/utils/backup.ts`
- `muwi/src/utils/export.ts`

Tasks:
- [ ] Check for synchronous FS/CPU-heavy work in main process paths
- [ ] Check long-running IPC handlers for UI blocking risk
- [ ] Confirm startup path does not do unnecessary heavy work before window ready
- [ ] Measure startup time (`app ready` to first usable UI)

Acceptance:
- [ ] No blocking sync operations in critical startup/IPC paths
- [ ] Startup time meets target or is documented

---

## 3.4 Accessibility Audit (Detailed)

## 3.4.1 Automated Accessibility Checks
Relevant test file:
- `muwi/e2e/accessibility-audit.spec.ts`

Commands:
```bash
cd muwi
npm run test:e2e -- accessibility-audit.spec.ts
```

Tasks:
- [ ] Run automated accessibility spec and save results
- [ ] Run Lighthouse accessibility audit on core flows (manual browser)
- [ ] Capture screenshots of failing nodes/issues
- [ ] Convert repeated issues into component-level findings

Acceptance:
- [ ] No critical/serious automated a11y failures on key screens

## 3.4.2 Keyboard Navigation and Focus Management (Manual)
Priority components from plan + actual codebase:
- `muwi/src/components/common/CommandPalette/`
- `muwi/src/components/common/Modal/`
- `muwi/src/components/common/Sidebar/`
- `muwi/src/components/common/Toolbar/`
- `muwi/src/components/common/Toast/`
- `muwi/src/components/common/DiaryLayout/`

Tasks per component:
- [ ] Tab order is logical
- [ ] Focus visible at all times
- [ ] Escape closes modal/palette where expected
- [ ] Focus trap works (modals/dialogs)
- [ ] Focus restoration works after close
- [ ] Arrow key navigation works where documented
- [ ] Button/icon controls have accessible names

Acceptance:
- [ ] All primary workflows complete via keyboard only

## 3.4.3 Screen Reader Review (minimum scope)
Priority:
- `VoiceOver` on macOS (required)
- `NVDA` on Windows (recommended if available)

Test flows:
1. Launch app and identify main landmarks/regions.
2. Open Command Palette and switch views.
3. Create/edit a diary entry.
4. Trigger export flow.
5. Trigger backup flow.

Tasks:
- [ ] Verify headings/labels/announcements are meaningful
- [ ] Verify toast/error messages are announced (`aria-live`)
- [ ] Verify hidden decorative elements are not read

Acceptance:
- [ ] Core flows are understandable and operable with screen reader

---

## 3.5 Testing Audit (Detailed)

## 3.5.1 Coverage and Test Health Baseline
Commands:
```bash
cd muwi
npm run test:coverage
npm test -- --run
```

Tasks:
- [ ] Save coverage summary and compare against targets in `AUDIT_PLAN.md`
- [ ] Identify low-coverage hotspots by file
- [ ] Record flaky/failing tests if any
- [ ] Check runtime (slow suites) for optimization opportunities

Acceptance:
- [ ] Coverage meets stated targets
- [ ] No unexplained flaky tests

## 3.5.2 Test Suite Quality Review (by category)
Observed categories:
- Stores: `8` tests (`muwi/src/stores/*.test.ts`)
- Utils: `9` tests (`muwi/src/utils/*.test.ts`)
- Hooks: `5` tests (`muwi/src/hooks/*.test.tsx`)
- DB queries: embedded in `muwi/src/db/queries/*.test.ts`
- E2E: `5` specs in `muwi/e2e/`

Tasks:
- [ ] Review representative tests for isolation and deterministic setup
- [ ] Check external dependency mocking quality (IndexedDB, Electron, timers)
- [ ] Verify error-path assertions exist, not just happy-path tests
- [ ] Check boundary cases (empty datasets, large payloads, corrupted backup)
- [ ] Review `muwi/src/test/setup.ts` for hidden global coupling

Acceptance:
- [ ] Test failures are meaningful (not brittle snapshots / weak assertions)
- [ ] Critical error paths covered or explicitly listed as gaps

## 3.5.3 Missing Test Area Validation (from high-level plan)
Convert each gap into a concrete test task:
- [ ] Backup restoration with corrupted data -> add unit/integration tests around `muwi/src/utils/backup.ts`
- [ ] Concurrent IndexedDB operations -> add DB/query concurrency tests in `muwi/src/db/queries/*.test.ts`
- [ ] Large document performance regression -> strengthen `muwi/e2e/performance-baseline.spec.ts`
- [ ] Offline/online state transitions -> verify feature relevance and add tests if app behavior depends on it
- [ ] Electron IPC error handling -> add tests or harness around `muwi/electron/main.ts` / renderer callers

---

## 3.6 Documentation Audit (Detailed)

## 3.6.1 Documentation Inventory and Accuracy Review
Root docs present:
- `AUDIT_PLAN.md`
- `IMPLEMENTATION.md`
- `PROGRESS.md`
- `TASKS.md`
- `TESTING.md`
- `multi-utility-writing-interface-design-doc.md`
- `muwi-design-system.md`

App docs present:
- `muwi/README.md`

Tasks:
- [ ] Verify `IMPLEMENTATION.md` reflects actual shipped features
- [ ] Verify `TESTING.md` matches current scripts/tests
- [ ] Verify `muwi/README.md` setup commands still work
- [ ] Identify stale references to renamed paths/components

### 3.6.2 Missing Docs from High-Level Plan
Tasks:
- [ ] Evaluate need for repo-root `README.md` vs app-level `muwi/README.md`
- [ ] Add/complete `CHANGELOG.md` in `muwi/` if release process requires it
- [ ] Document Electron IPC API (new `muwi/docs/API.md` or equivalent)
- [ ] Add user docs for backup/restore and shortcuts (if not already present)

Acceptance:
- [ ] Documentation set covers setup, usage, backup/restore, shortcuts, and release notes

---

## 3.7 Build & Deployment Audit (Detailed)

## 3.7.1 Build Reproducibility and Warning Audit
Commands:
```bash
cd muwi
npm run build
npm run electron:build
```

Optional platform-specific:
```bash
cd muwi
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

Tasks:
- [ ] Record build duration and warnings
- [ ] Verify output directories and artifact naming
- [ ] Verify source maps generated as intended
- [ ] Re-run build to compare deterministic outputs (hashes/sizes where feasible)

Acceptance:
- [ ] No build-breaking warnings/errors
- [ ] Artifact generation is consistent

## 3.7.2 Packaging Configuration Review
Mandatory file:
- `muwi/electron-builder.config.cjs`

Tasks:
- [ ] Review target formats by platform
- [ ] Review signing/notarization placeholders and env var handling
- [ ] Review included/excluded files (no secrets/dev artifacts)
- [ ] Review auto-update settings (if present)

Acceptance:
- [ ] Packaging config is production-safe and excludes unnecessary files

## 3.7.3 CI/CD Readiness (if pipeline exists)
Tasks:
- [ ] Check repo for CI config (`.github/workflows/`, etc.)
- [ ] Verify lint/test/build gating on PRs
- [ ] Verify release automation steps and artifact retention policy

Acceptance:
- [ ] Release path is documented and repeatable

---

## 3.8 Data Layer Audit (Detailed)

## 3.8.1 IndexedDB Schema and Migration Review (Critical)
Mandatory files:
- `muwi/src/db/database.ts`
- `muwi/src/db/index.ts`

Tasks:
- [ ] Inventory schema versions and migration steps
- [ ] Verify migrations are idempotent / safe on existing data
- [ ] Verify indexes align with read/query patterns
- [ ] Check default values and nullable fields for consistency
- [ ] Validate delete/update behavior for related records

Acceptance:
- [ ] All supported upgrade paths are safe
- [ ] Query-critical fields are indexed

## 3.8.2 Query Layer Review (Functional + Transaction Safety)
Target query modules:
- `muwi/src/db/queries/academic.ts`
- `muwi/src/db/queries/blackboard.ts`
- `muwi/src/db/queries/diary.ts`
- `muwi/src/db/queries/drafts.ts`
- `muwi/src/db/queries/longDrafts.ts`
- `muwi/src/db/queries/scratchpad.ts`
- `muwi/src/db/queries/settings.ts`

Tasks:
- [ ] Review create/update/delete operations for transaction usage
- [ ] Review multi-entity operations for partial failure behavior
- [ ] Check validation at query boundaries
- [ ] Review query performance patterns and repeated reads
- [ ] Cross-check with corresponding tests (`*.test.ts`)

Acceptance:
- [ ] No data corruption risk from non-transactional multi-step writes
- [ ] Error paths handled consistently

## 3.8.3 Backup/Restore Integrity Review (Critical)
Mandatory file:
- `muwi/src/utils/backup.ts`

Tasks:
- [ ] Verify all tables/entities are included in export
- [ ] Verify import version checks and schema validation
- [ ] Verify corrupted/partial backup handling (fail-safe behavior)
- [ ] Verify large backup memory usage and file size handling
- [ ] Verify restore rollback behavior on mid-import failure

Acceptance:
- [ ] Backup export/import is complete and resilient
- [ ] Corrupted backups do not partially corrupt local DB

---

## 3.9 UX/UI Audit (Detailed)

## 3.9.1 Design Token and Styling Consistency Review
Target areas:
- `muwi/src/styles/`
- `muwi/src/styles/themes/`
- Component styles under `muwi/src/components/**`

Commands:
```bash
cd muwi
rg -n "#[0-9a-fA-F]{3,8}|rgb\\(|hsl\\(" src --glob '*.{css,ts,tsx}'
rg -n "!important" src --glob '*.{css,ts,tsx}'
```

Tasks:
- [ ] Identify hardcoded color/spacing values bypassing tokens
- [ ] Check theme parity (light/dark) on core surfaces
- [ ] Review hover/focus/disabled states for shared components
- [ ] Verify typography hierarchy in major diary/editor screens

Acceptance:
- [ ] No unexplained hardcoded design values in shared UI
- [ ] Core components have complete interaction states

## 3.9.2 Responsive Layout Validation
Breakpoints from high-level plan:
- `<768px`
- `768-1280px`
- `>1280px`

Tasks (repeat per breakpoint):
- [ ] Shelf view layout check
- [ ] Diary entry/edit flow check
- [ ] Long Drafts editor check
- [ ] Blackboard canvas/tool panels check
- [ ] Sidebar/nav collapse behavior check
- [ ] No clipped modals or off-screen actions

Acceptance:
- [ ] Core flows remain usable across target breakpoints

## 3.9.3 User Flow Validation (Manual + E2E Cross-check)
Primary flows:
1. Create diary entry
2. Export document
3. Backup/restore
4. Switch themes
5. Lock/unlock content

Tasks per flow:
- [ ] Execute manually start-to-finish
- [ ] Record expected vs actual steps
- [ ] Note friction points and UI ambiguity
- [ ] Cross-check if E2E coverage exists and is current

Acceptance:
- [ ] No broken primary flows
- [ ] Major friction points logged with severity

## 3.9.4 Error State UX Review
Scenarios (from high-level plan + implementation likely):
- IndexedDB unavailable
- Export failure
- Backup location inaccessible
- Invalid passkey

Tasks:
- [ ] Trigger each error intentionally where possible
- [ ] Verify message clarity and recovery path
- [ ] Verify no silent failures
- [ ] Verify errors are visible to keyboard/screen reader users

Acceptance:
- [ ] Error states are recoverable and understandable

---

## 3.10 Maintenance & Technical Debt Audit (Detailed)

## 3.10.1 Dependency Health and Upgrade Plan
Commands:
```bash
cd muwi
npm outdated
```

Tasks:
- [ ] Group updates by risk (security patch / minor / major)
- [ ] Highlight framework-critical upgrades (Electron, React, Vite, TipTap, Excalidraw)
- [ ] Review lockfile drift and unused deps (optional tooling if desired)

Acceptance:
- [ ] Prioritized upgrade backlog created (immediate / next cycle / later)

## 3.10.2 Technical Debt Register (Concrete Sweep)
Commands:
```bash
cd muwi
find src -type f \\( -name '*.ts' -o -name '*.tsx' \\) -print0 | xargs -0 wc -l | sort -nr | head -50
rg -n "TODO|FIXME|HACK" src electron
rg -n "!important" src --glob '*.{css,ts,tsx}'
```

Tasks:
- [ ] Record oversized files and refactor candidates
- [ ] Record test setup complexity debt in `muwi/src/test/setup.ts`
- [ ] Record styling specificity debt (`!important`)
- [ ] Record bundle growth concerns (from perf section)

Acceptance:
- [ ] Technical debt register includes severity + estimated effort + owner suggestion

---

## 4. Execution Schedule (Granular)

## Day 1 - Automated Scans + Baseline (6-8 hours)
- [ ] Pre-audit setup (Section 1)
- [ ] Lint + TS + dependency audits
- [ ] Coverage + E2E baseline
- [ ] Build + bundle size capture
- [ ] Create findings for immediate blockers

Deliverables by end of Day 1:
- [ ] Baseline command outputs saved
- [ ] Initial findings list (security/build/test failures)

## Day 2 - Security + Electron + Crypto (6-8 hours)
- [ ] Electron hardening review (`main.ts`, `preload.ts`)
- [ ] IPC inventory and validation review
- [ ] Crypto/content-locking review
- [ ] File operation path validation review (`backup.ts`, `export.ts`)

Deliverables by end of Day 2:
- [ ] Security findings with evidence and severity
- [ ] IPC channel inventory table

## Day 3 - Data Layer + Backup Integrity (6-8 hours)
- [ ] Schema/migration review (`database.ts`)
- [ ] Query module review + tests cross-check
- [ ] Backup/restore integrity review
- [ ] Corrupted/partial restore behavior validation

Deliverables by end of Day 3:
- [ ] Data integrity findings
- [ ] Backup/restore test gap list

## Day 4 - Accessibility + UX/UI (6-8 hours)
- [ ] Automated a11y spec + Lighthouse
- [ ] Keyboard/focus testing for common components
- [ ] Screen reader pass (VoiceOver minimum)
- [ ] UX flow validation and error state checks

Deliverables by end of Day 4:
- [ ] A11y findings
- [ ] UX friction and error-state issues list

## Day 5 - Performance + Code Quality Deep Review (6-8 hours)
- [ ] Runtime profiling scenarios
- [ ] Main-process perf review
- [ ] Large file structural review (top offenders)
- [ ] React/rendering review follow-ups

Deliverables by end of Day 5:
- [ ] Perf findings with profiles/screenshots
- [ ] Refactor candidates list

## Day 6 - Docs + Build/Release Audit (4-6 hours)
- [ ] Documentation accuracy and gaps review
- [ ] Packaging config review (`electron-builder.config.cjs`)
- [ ] CI/CD readiness check (if configured)

Deliverables by end of Day 6:
- [ ] Documentation gap list
- [ ] Build/release readiness findings

## Days 7-10 - Reporting + Remediation Planning
- [ ] Consolidate duplicate findings
- [ ] Final severity normalization
- [ ] Create issue tracker entries
- [ ] Create remediation plan by priority and effort
- [ ] Produce sign-off checklist

---

## 5. Required Review Order (High-Risk Files First)

Audit these files before broad sampling:
- [ ] `muwi/electron/main.ts`
- [ ] `muwi/electron/preload.ts`
- [ ] `muwi/src/utils/crypto.ts`
- [ ] `muwi/src/utils/backup.ts`
- [ ] `muwi/src/utils/export.ts`
- [ ] `muwi/src/db/database.ts`
- [ ] `muwi/src/db/queries/*.ts`
- [ ] `muwi/src/stores/academicStore.ts`
- [ ] `muwi/src/stores/longDraftsStore.ts`
- [ ] `muwi/src/components/diaries/academic/BibliographyManager.tsx`
- [ ] `muwi/src/components/diaries/long-drafts/SectionEditor.tsx`

---

## 6. Findings Template (Copy/Paste)

```md
### [ID] Short Title
- Area: Security / Data Layer / Accessibility / ...
- Severity: Critical | High | Medium | Low
- Files: `muwi/path/to/file.ts`
- Summary: One-sentence statement of the issue.
- Evidence:
  - Command/Test: `...`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/...`
- Reproduction:
  1. ...
  2. ...
- Expected:
  - ...
- Observed:
  - ...
- Recommended Fix:
  - ...
- Regression Tests Needed:
  - ...
```

---

## 7. Final Deliverables Checklist

- [ ] `Audit Report` (summary + all findings)
- [ ] `Issue Tracker Items` for all `Critical`/`High` findings
- [ ] `Remediation Plan` with sequencing and effort estimates
- [ ] `Documentation Updates` (or explicit backlog)
- [ ] `Release Sign-off Checklist` (pass/fail with exceptions)

---

## 8. Notes / Deviations from `AUDIT_PLAN.md`

- `AUDIT_PLAN.md` assumes app code at repo root; actual app code is under `muwi/`.
- `AUDIT_PLAN_DETAILED.md` uses observed codebase inventory and current scripts from `muwi/package.json`.
- Any missing tooling (`madge`, `license-checker`, bundle visualizer) should be treated as optional setup items unless required by release policy.
