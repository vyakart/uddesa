# Day 2 Security and Performance Findings (2026-02-23)

## Remediation Status Update (Post-Fix Implementation)

- Update date: 2026-02-23
- Validation evidence:
  - `muwi/audit/2026-02/outputs/fix-validation-2-tsc.txt`
  - `muwi/audit/2026-02/outputs/fix-validation-3-build.txt`
  - `muwi/audit/2026-02/outputs/fix-validation-targeted-tests-2.txt` (`15/15` targeted tests passed)
- Status legend:
  - `Remediated`: code fix implemented and validated in local typecheck/build/tests (as applicable)
  - `Partially mitigated`: risk reduced, but additional work or runtime verification remains

### SEC-IPC-001 Main Process `load-backup` Reads Selected File Before Size/Type Validation
- Area: Security / IPC / Data Import
- Severity: High
- Files: `muwi/electron/main.ts:261`, `muwi/src/utils/backup.ts:354`
- Summary: Backup file content is read into main-process memory before explicit size validation; backup JSON validation occurs later in renderer.
- Evidence:
  - `muwi/electron/main.ts:270` reads file directly with `fs.readFile(...)`
  - Renderer validates size after receiving string (`muwi/src/utils/backup.ts:359`)
- Recommended Fix:
  - Add `fs.stat` size guard and extension validation in the main handler before reading.
- Remediation Status:
  - `Remediated` (implemented in `muwi/electron/main.ts`; pre-read extension/file/size checks added)

### SEC-ELECTRON-001 Missing CSP in Renderer HTML
- Area: Security / Electron Hardening
- Severity: Medium
- Files: `muwi/index.html:1`
- Summary: No CSP meta tag is present in the renderer HTML, reducing defense-in-depth against injection bugs.
- Recommended Fix:
  - Add production CSP (and document dev exceptions if needed).
- Remediation Status:
  - `Remediated` (CSP meta added in `muwi/index.html` with packaged-app defaults and localhost dev allowances)

### SEC-ELECTRON-002 Navigation Allowlist Allows Any `file:` URL
- Area: Security / Electron Hardening
- Severity: Medium
- Files: `muwi/electron/main.ts:116`
- Summary: Navigation filtering permits any `file:` URL, not only app-owned files.
- Recommended Fix:
  - Restrict `file:` navigation to packaged app assets or a narrow allowlist.
- Remediation Status:
  - `Remediated` (file URL navigation now restricted to packaged renderer entry)

### SEC-ELECTRON-003 BrowserWindow `sandbox` Not Enabled
- Area: Security / Electron Hardening
- Severity: Low
- Files: `muwi/electron/main.ts:174`
- Summary: `webPreferences` does not explicitly enable `sandbox: true`.
- Recommended Fix:
  - Evaluate enabling sandbox and document compatibility constraints if deferred.
- Remediation Status:
  - `Remediated` (`sandbox: true` enabled in code and runtime-verified via Electron Playwright smoke test)
  - Day 7 runtime evidence: `muwi/audit/2026-02/outputs/day7-electron-sandbox-smoke.txt`
  - Validation includes runtime assertion of `webPreferences.sandbox === true` (plus `contextIsolation === true`, `nodeIntegration === false`) in `muwi/e2e/electron-smoke.spec.ts`

### PERF-BUNDLE-001 Oversized Route Chunks Persist Despite Route-Level Lazy Loading
- Area: Performance / Bundle Size
- Severity: Medium
- Files: `muwi/audit/2026-02/outputs/day1-build.txt`, `muwi/vite.config.ts:10`, `muwi/src/App.tsx:17`
- Summary: Route-level lazy loading and manual chunking are present, but Academic/Blackboard chunks remain oversized due heavy in-route dependencies (Excalidraw/Mermaid stack; academic citation/bibliography/editor features).
- Recommended Fix:
  - Lazy-load academic panels (`BibliographyManager`, `ReferenceLibraryPanel`, `TemplateSelector`)
  - Split/defer citation utilities
  - Lazy-load `ExcalidrawWrapper` and evaluate Mermaid feature deferral
  - Add vendor chunk boundaries for Excalidraw/Mermaid/ELK/Katex
- Remediation Status:
  - `Partially mitigated`
  - Academic route chunk reduced from ~`3.97 MB` to ~`1.15 MB` after panel lazy-loading + citation chunk split
  - Blackboard route chunk reduced from ~`1.14 MB` to ~`10.5 KB` after `ExcalidrawWrapper` lazy-loading + vendor split
  - Deferred `blackboard-excalidraw-vendor` chunk remains very large (~`7.52 MB`), so bundle warnings/risk are reduced but not eliminated

### SEC-IPC-002 Renderer `selectBackupLocation` Rejection Handling Was Inconsistent
- Area: Security / IPC / UX Robustness
- Severity: Low
- Files: `muwi/src/components/shelf/SettingsPanel.tsx`, `muwi/src/components/common/BackupPanel/BackupPanel.tsx`
- Summary: UI callsites previously awaited `selectBackupLocation()` without `try/catch`.
- Remediation Status:
  - `Remediated` (both callsites now catch IPC rejections and show user-facing error messages)
