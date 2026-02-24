# Day 1 Automated Scan Findings (2026-02-23)

### PERF-BUNDLE-001 Large Production Chunks Exceed Warning Threshold
- Area: Performance / Build
- Severity: Medium
- Files: `muwi/audit/2026-02/outputs/day1-build.txt`
- Summary: Production build emits Vite warnings for multiple chunks larger than 500 kB after minification.
- Evidence:
  - Command/Test: `npm run build`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day1-build.txt`
- Reproduction:
  1. Run `cd muwi && npm run build`.
  2. Review the final Vite output warning block.
- Expected:
  - Chunk sizes are within configured threshold or intentionally split to avoid excessive initial/download cost.
- Observed:
  - Vite warns that several chunks are `> 500 kB` and recommends dynamic imports/manual chunking.
  - Largest emitted asset in baseline snapshot is `dist/assets/diary-academic-UeK10TUh.js` (`3,969,928 bytes`).
- Recommended Fix:
  - Audit route/module splitting for large diary modules (`academic`, `blackboard`) and shared heavy dependencies.
  - Consider manual chunking for large editor/diagram stacks and lazy loading non-core features.
- Regression Tests Needed:
  - Build artifact size snapshot comparison in CI (threshold-based alerting).

### SEC-DEPS-001 Dependency Vulnerabilities Reported by npm audit
- Area: Security / Supply Chain
- Severity: High
- Files: `muwi/audit/2026-02/outputs/day1-audit-deps-json.txt`
- Summary: `npm audit` reports 29 vulnerable packages (23 high, 5 moderate, 1 low), requiring triage of runtime impact and upgrade plan.
- Evidence:
  - Command/Test: `npm run audit:deps:json`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day1-audit-deps-json.txt`
  - Summarized report: `muwi/audit/2026-02/outputs/day1-audit-deps-summary.md`
- Reproduction:
  1. Run `cd muwi && npm run audit:deps:json`.
  2. Review vulnerability totals and affected packages.
- Expected:
  - Zero unmitigated critical/high runtime vulnerabilities; documented exceptions for unavoidable dev-only findings.
- Observed:
  - `Critical: 0`, `High: 23`, `Moderate: 5`, `Low: 1`.
  - High-severity issues are concentrated in transitive chains related to `electron-builder` and `typescript-eslint`.
- Recommended Fix:
  - Triage direct vs transitive and runtime vs dev/build-only exposure.
  - Test upgrade paths for `electron-builder` and `typescript-eslint` stacks in a separate branch.
  - Document accepted residual risk if dev-only vulnerabilities remain temporarily.
- Regression Tests Needed:
  - Re-run `npm audit --json` after dependency updates and diff reports.

### MAINT-DEPS-001 Outdated Dependencies Backlog Identified
- Area: Maintenance / Dependency Health
- Severity: Low
- Files: `muwi/audit/2026-02/outputs/day1-npm-outdated.txt`
- Summary: `npm outdated` reports 26 outdated packages, including core tooling and framework dependencies.
- Evidence:
  - Command/Test: `npm outdated`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day1-npm-outdated.txt`
- Reproduction:
  1. Run `cd muwi && npm outdated`.
  2. Review current/wanted/latest table.
- Expected:
  - Patch/minor updates are periodically applied; majors tracked with planned upgrade windows.
- Observed:
  - 26 outdated packages listed, including `electron`, `react-router-dom`, `tailwindcss`, and multiple `@tiptap/*` packages.
- Recommended Fix:
  - Create a phased upgrade plan: patch/minor first, then risky majors after compatibility testing.
  - Coordinate security triage with outdated backlog to reduce duplicate work.
- Regression Tests Needed:
  - Baseline lint/test/build/e2e rerun after each dependency upgrade batch.

### ENV-E2E-001 Sandboxed E2E Run Can Fail with Localhost Bind EPERM
- Area: Test Infrastructure / Environment
- Severity: Low
- Files: `muwi/audit/2026-02/outputs/day1-test-e2e.txt`
- Summary: Initial sandboxed Playwright run failed to start the configured local web server due to a localhost port bind permission error (`EPERM`).
- Evidence:
  - Command/Test: `npm run test:e2e`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day1-test-e2e.txt`
- Reproduction:
  1. Run `npm run test:e2e` in a restricted sandbox environment.
  2. Observe Playwright `webServer` startup failure (`127.0.0.1:4173`).
- Expected:
  - E2E baseline result reflects application behavior, not sandbox networking restrictions.
- Observed:
  - Initial run failed with `listen EPERM`.
  - Elevated rerun passed (`7 passed (10.4s)`).
- Recommended Fix:
  - Document that Playwright baseline requires localhost bind permissions in restricted environments.
  - Optionally use an already approved E2E prefix/run profile in local audit instructions.
- Regression Tests Needed:
  - None (process/environment documentation issue).

### TOOL-AUDIT-001 Dependency Summary Script Invocation Mismatch in Plan
- Area: Audit Process / Tooling
- Severity: Low
- Files: `AUDIT_PLAN_DETAILED.md`, `muwi/package.json`
- Summary: The plan originally listed `npm run audit:deps:summary` without required script arguments, which causes a usage error and can stall the audit run.
- Evidence:
  - Command/Test: `npm run audit:deps:summary`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day1-audit-deps-summary.txt` (initial usage error was observed before corrected rerun)
- Reproduction:
  1. Run `cd muwi && npm run audit:deps:summary`.
  2. Script prints usage because input path is required.
- Expected:
  - Audit plan command examples are directly runnable.
- Observed:
  - Script requires `npm run audit:deps:summary -- <audit-json-path> [output-md-path]`.
- Recommended Fix:
  - Document the required `--` arguments in audit procedures (applied in `AUDIT_PLAN_DETAILED.md`).
  - Optional: add a wrapper script for “latest baseline” if this workflow is repeated often.
- Regression Tests Needed:
  - None (documentation/process alignment).

