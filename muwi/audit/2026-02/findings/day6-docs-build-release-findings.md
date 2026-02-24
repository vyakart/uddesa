### [REL-BUILD-001] `electron-builder` Linux Desktop Config Fails Schema Validation and Blocks Packaging
- Status: Remediated (2026-02-24)
- Area: Build & Release
- Severity: High
- Files: `muwi/electron-builder.config.cjs:98`, `muwi/electron-builder.config.cjs:99`, `muwi/electron-builder.config.cjs:100`, `muwi/electron-builder.config.cjs:101`, `muwi/electron-builder.config.cjs:102`
- Summary: The configured `linux.desktop` object uses unsupported keys (`Name`, `Comment`, `Categories`, `Keywords`) for `electron-builder` 26.8.1, causing `npm run electron:build` to fail before artifacts are produced.
- Evidence:
  - Command/Test: `cd muwi && npm run electron:build`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day6-electron-build.txt`
  - Build log shows schema validation error and points to `configuration.linux.desktop` unknown properties.
- Reproduction:
  1. Run `cd muwi`.
  2. Run `npm run electron:build`.
  3. Observe `electron-builder` validation error after web build completes.
- Expected:
  - Packaging configuration validates and build proceeds to artifact generation.
- Observed:
  - Build exits with code `1` due to invalid `linux.desktop` config keys.
- Recommended Fix:
  - Update `linux.desktop` to the schema supported by current `electron-builder` (likely `desktop.entry`-based structure or remove unsupported keys).
  - Re-run `npm run electron:build` and save a clean packaging log.
- Remediation Notes:
  - Updated `muwi/electron-builder.config.cjs` to move Linux desktop metadata under `linux.desktop.entry`.
  - Validation rerun no longer reports the `configuration.linux.desktop` schema error; packaging now advances to native rebuild/icon processing.
  - Follow-up evidence: `muwi/audit/2026-02/outputs/day6-electron-build-after-config-fix.txt`, `muwi/audit/2026-02/outputs/day6-electron-build-after-config-fix-escalated.txt`

### [DOC-README-001] App README Is Still the Default Vite Template
- Status: Remediated (2026-02-24)
- Area: Documentation
- Severity: High
- Files: `muwi/README.md:1`
- Summary: The app-level README is unchanged Vite template content and does not document MUWI setup, usage, backup/restore, testing, or Electron workflows.
- Evidence:
  - Code review: `muwi/README.md` begins with Vite template title/content (`React + TypeScript + Vite`) and contains template ESLint/React Compiler guidance unrelated to the shipped app.
  - Inventory: `muwi/audit/2026-02/outputs/day6-docs-inventory.txt`
- Reproduction:
  1. Open `muwi/README.md`.
  2. Review the first sections and command guidance.
- Expected:
  - README should describe MUWI, prerequisites, install/run/test/build commands, and user-facing workflows.
- Observed:
  - README documents the starter template instead of the application.
- Recommended Fix:
  - Replace template content with a production README covering app overview, setup, dev modes (web/Electron), tests, build/package, backup/restore, and troubleshooting.
- Remediation Notes:
  - Replaced `muwi/README.md` template content with MUWI-specific setup, dev/test/build/package, backup/export, and troubleshooting documentation.

### [DOC-IMPL-001] `IMPLEMENTATION.md` Does Not Reflect Current Shipped Stack and File Layout
- Area: Documentation
- Severity: Medium
- Files: `IMPLEMENTATION.md:13`, `IMPLEMENTATION.md:15`, `IMPLEMENTATION.md:16`, `IMPLEMENTATION.md:21`, `IMPLEMENTATION.md:22`, `IMPLEMENTATION.md:101`, `IMPLEMENTATION.md:154`, `IMPLEMENTATION.md:157`, `muwi/package.json:51`, `muwi/package.json:70`, `muwi/package.json:80`, `muwi/package.json:83`
- Summary: The implementation guide contains outdated version claims and stale file/path examples, so it cannot be trusted as a shipped-state technical reference.
- Evidence:
  - Version mismatch examples:
    - React `18.3+` vs `19.2.0`
    - Vite `5.x` vs `7.2.4`
    - Electron `28+` vs `40.0.0`
    - Tailwind `3.4+` vs `4.1.18`
  - Dependency mismatch: Framer Motion listed in doc but not present in `muwi/package.json`.
  - Structure mismatch: `electron/ipc/*` and several component file names differ from current codebase.
- Reproduction:
  1. Compare `IMPLEMENTATION.md` stack table and structure tree to `muwi/package.json` and current `muwi/src` / `muwi/electron` files.
  2. Attempt to use the doc as a source of truth.
- Expected:
  - Implementation guide should either match the current codebase or be clearly marked as historical design documentation.
- Observed:
  - Multiple core stack and path references are stale.
- Recommended Fix:
  - Either (a) update `IMPLEMENTATION.md` to current shipped reality, or (b) relabel it as historical design/spec and add a current architecture reference.

### [DOC-TEST-001] `TESTING.md` Is Out of Sync with Current Test Configuration and Scripts
- Area: Documentation / Testing
- Severity: Medium
- Files: `TESTING.md:16`, `TESTING.md:25`, `TESTING.md:166`, `TESTING.md:187`, `TESTING.md:188`, `muwi/playwright.config.ts:11`, `muwi/playwright.config.ts:17`, `muwi/playwright.config.ts:18`, `muwi/playwright.config.ts:22`, `muwi/playwright.electron.config.ts:1`, `muwi/package.json:15`, `muwi/package.json:17`, `muwi/package.json:77`
- Summary: The testing documentation describes a different test stack/config than the current repository, including stale dependencies, Playwright project layout, and web server address.
- Evidence:
  - `TESTING.md` references MSW and `happy-dom`; current package manifest does not include `msw` and uses `jsdom`.
  - `TESTING.md` shows multi-browser+electron projects in `playwright.config.ts`; current repo uses Chromium-only in `playwright.config.ts` and separate `playwright.electron.config.ts`.
  - `TESTING.md` documents `localhost:5173`; current config uses `127.0.0.1:4173`.
  - E2E inventory: `muwi/audit/2026-02/outputs/day6-e2e-spec-inventory.txt`
- Reproduction:
  1. Follow `TESTING.md` Playwright/Vitest examples.
  2. Compare against `muwi/playwright.config.ts`, `muwi/playwright.electron.config.ts`, `muwi/vitest.config.ts`, and `muwi/package.json`.
- Expected:
  - Testing docs should reflect current commands/configs or clearly state they are a conceptual strategy document.
- Observed:
  - Multiple concrete config snippets and assumptions are stale.
- Recommended Fix:
  - Replace example-heavy stale config snippets with current command references and short links to actual config files, plus a maintained test matrix.

### [REL-ASSET-001] Packaging Icon Assets Are Missing (Placeholder-Only `build/icons`)
- Status: Remediated (2026-02-24)
- Area: Build & Release
- Severity: Medium
- Files: `muwi/electron-builder.config.cjs:24`, `muwi/electron-builder.config.cjs:37`, `muwi/electron-builder.config.cjs:70`, `muwi/electron-builder.config.cjs:96`, `muwi/build/icons/README.md:1`
- Summary: The packaging config expects platform icon assets under `build/icons`, but the directory currently contains only a README placeholder and no actual icon files.
- Evidence:
  - Build resources inventory: `muwi/audit/2026-02/outputs/day6-build-resources-inventory.txt`
  - `muwi/build/icons/README.md` documents how to create icons and implies they have not been supplied.
  - Packaging rerun after config fix fails on icon collection: `muwi/audit/2026-02/outputs/day6-electron-build-after-config-fix-escalated.txt`
- Reproduction:
  1. Inspect `muwi/build/icons/`.
  2. Compare expected icon paths in `muwi/electron-builder.config.cjs`.
- Expected:
  - Production-ready icon files (`icon.icns`, `icon.ico`, Linux PNG set) exist and match config references.
- Observed:
  - Only placeholder documentation file is present.
- Recommended Fix:
  - Add production icon assets and verify all config-referenced paths exist before packaging validation reruns.
- Remediation Notes:
  - Added generated production icon assets under `muwi/build/icons`:
    - `icon.icns`
    - `icon.ico`
    - Linux PNG sizes (`16x16` through `512x512`)
  - Packaging rerun progressed past icon collection and produced macOS artifacts (`.zip`, `.dmg`, blockmaps) in `muwi/release/0.0.0/`.
  - Evidence: `muwi/audit/2026-02/outputs/day6-electron-build-after-icons.txt`

### [REL-CI-001] No CI Workflow Configuration for PR/Release Gating
- Area: Build & Release / CI-CD
- Severity: Medium
- Files: `.github/workflows` (missing)
- Summary: The repository currently has no `.github/workflows/` directory, so there is no visible CI pipeline enforcing lint/test/build checks or release packaging validation.
- Evidence:
  - Command/Test: `ls -la .github/workflows`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day6-ci-workflows-check.txt`
- Reproduction:
  1. Inspect repo root for `.github/workflows/`.
  2. Confirm no workflow files are present.
- Expected:
  - At least one CI workflow should run baseline validation (lint, tests, build) on PRs.
- Observed:
  - No CI workflow configuration detected.
- Recommended Fix:
  - Add a minimal CI workflow with PR gating for `npm run lint`, `npm run test:coverage` (or targeted tests), and `npm run build`; add a release packaging workflow separately if needed.

### [REL-META-001] Package Metadata Missing `description` and `author` for Release Artifacts
- Status: Remediated (2026-02-24)
- Area: Build & Release / Metadata
- Severity: Low
- Files: `muwi/package.json:1`
- Summary: `electron-builder` reports missing `description` and `author` fields in `muwi/package.json`, which weakens artifact metadata quality and indicates incomplete release metadata setup.
- Evidence:
  - Packaging log warnings in `muwi/audit/2026-02/outputs/day6-electron-build.txt`
  - Package scan output: `muwi/audit/2026-02/outputs/day6-package-metadata-and-scripts-scan.txt`
- Reproduction:
  1. Run `cd muwi && npm run electron:build`.
  2. Review electron-builder warnings in the log.
- Expected:
  - Release package metadata includes `description` and `author`.
- Observed:
  - electron-builder warns both fields are missing.
- Recommended Fix:
  - Add `description` and `author` fields to `muwi/package.json` and re-run packaging validation.
- Remediation Notes:
  - Added `description` and `author` to `muwi/package.json`.
  - Evidence snapshot: `muwi/audit/2026-02/outputs/day6-package-metadata-after-fix.txt`
