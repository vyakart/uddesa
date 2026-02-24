# Day 2 Electron Security Review (Main / Preload)

## Remediation Status Update (Post-Fix Implementation)

- Update date: 2026-02-23
- Validation completed:
  - `npx tsc -b --noEmit` (`muwi/audit/2026-02/outputs/fix-validation-2-tsc.txt`)
  - `npm run build` (`muwi/audit/2026-02/outputs/fix-validation-3-build.txt`)
  - Targeted UI/unit tests (`muwi/audit/2026-02/outputs/fix-validation-targeted-tests-2.txt`)
- Status by finding:
  - `SEC-IPC-001`: `Remediated` (main-process backup pre-read validation added)
  - `SEC-ELECTRON-001`: `Remediated` (CSP meta added)
  - `SEC-ELECTRON-002`: `Remediated` (file navigation allowlist tightened)
  - `SEC-ELECTRON-003`: `Partially mitigated` (`sandbox: true` enabled; Electron runtime smoke verification still pending)
  - `SEC-IPC-002`: `Remediated` (renderer `selectBackupLocation` callsites now handle rejections)

The findings below reflect the original audit observations and recommended fixes; use the status block above as the current implementation state.

## Reviewed Files

- `muwi/electron/main.ts`
- `muwi/electron/preload.ts`
- `muwi/index.html` (CSP check)

## Security Posture Summary

### Strengths (Observed)

- `nodeIntegration: false` is set in `BrowserWindow` webPreferences (`muwi/electron/main.ts:175`)
- `contextIsolation: true` is set (`muwi/electron/main.ts:176`)
- Preload exposes a minimal `electronAPI` bridge instead of raw `ipcRenderer` (`muwi/electron/preload.ts:55`, `muwi/electron/preload.ts:75`)
- New windows are blocked (`setWindowOpenHandler -> deny`) (`muwi/electron/main.ts:135`)
- Navigation is restricted via `will-navigate` allowlist function (`muwi/electron/main.ts:136`)
- IPC handlers validate critical file-export/backup inputs in main process (`muwi/electron/main.ts:30`, `muwi/electron/main.ts:65`, `muwi/electron/main.ts:89`)
- Preload also validates IPC argument types for backup/export calls (`muwi/electron/preload.ts:5`, `muwi/electron/preload.ts:13`, `muwi/electron/preload.ts:25`, `muwi/electron/preload.ts:37`)

### Findings (Prioritized)

### SEC-IPC-001 `load-backup` Reads Unvalidated File Into Main Process Memory
- Severity: High
- Files: `muwi/electron/main.ts:261`, `muwi/electron/main.ts:270`
- Summary: `load-backup` reads the selected file directly with `fs.readFile` before main-process size validation. Backup format/size validation only happens later in renderer (`muwi/src/utils/backup.ts:354`, `muwi/src/utils/backup.ts:359`).
- Risk:
  - Main-process memory pressure / DoS from very large selected files.
  - Trusting dialog filters as a security boundary (filters are UX aids, not sufficient validation).
- Recommendation:
  - `fs.stat` the selected file first and reject if size exceeds backup limit.
  - Validate extension (`.json`) after selection.
  - Return structured error messages for renderer display.

### SEC-ELECTRON-001 Missing CSP in Renderer HTML
- Severity: Medium
- Files: `muwi/index.html:1`
- Summary: `muwi/index.html` contains no Content Security Policy meta tag.
- Risk:
  - Increases impact of any XSS or HTML injection bug in renderer code.
  - Weakens defense-in-depth for an Electron app, even with `contextIsolation` and `nodeIntegration: false`.
- Recommendation:
  - Add a restrictive CSP for production (and a dev-tolerant variant if needed).
  - Explicitly document allowed script/style sources for Vite dev vs packaged app.

### SEC-ELECTRON-002 Navigation Allowlist Permits Any `file:` URL
- Severity: Medium
- Files: `muwi/electron/main.ts:116`, `muwi/electron/main.ts:119`
- Summary: `isAllowedNavigationUrl()` returns `true` for any `file:` URL, not just the packaged app entry file.
- Risk:
  - If a renderer bug can trigger navigation, the window may navigate to arbitrary local files.
  - This expands the attack surface beyond the packaged app UI.
- Recommendation:
  - Restrict `file:` navigation to the packaged app’s own `dist/index.html` (or a narrow allowlist of app-owned file URLs).
  - Keep dev-server origin allowlist behavior for development.

### SEC-ELECTRON-003 `sandbox` Not Explicitly Enabled (Defense-in-Depth Gap)
- Severity: Low
- Files: `muwi/electron/main.ts:174`
- Summary: `webPreferences` does not explicitly set `sandbox: true`.
- Risk:
  - Reduced renderer isolation compared with Electron’s stronger sandboxed configuration.
- Recommendation:
  - Evaluate enabling `sandbox: true` and test preload compatibility (`process.platform` access and any preload assumptions).
  - If unsupported, document why and track as accepted risk.

### SEC-IPC-002 Inconsistent Renderer-Side Handling of `select-backup-location` IPC Rejections
- Severity: Low
- Files: `muwi/src/components/shelf/SettingsPanel.tsx:198`, `muwi/src/components/common/BackupPanel/BackupPanel.tsx:122`
- Summary: UI callsites await `selectBackupLocation()` without `try/catch`, unlike `backup.ts`/`ExportPanel` flows that normalize errors.
- Risk:
  - IPC or dialog failures could surface as unhandled promise rejections / poor UX.
- Recommendation:
  - Wrap these handlers in `try/catch` and show a user-facing error message.

## Notes / Non-Findings

- DevTools are opened in dev mode only (`muwi/electron/main.ts:184`, `muwi/electron/main.ts:187`), which is acceptable.
- `webSecurity` is not explicitly set, but no evidence was found that it is disabled.
- `setWindowOpenHandler(() => ({ action: 'deny' }))` is a strong default for external window creation.

## Recommended Fix Order

1. `SEC-IPC-001` (`load-backup` pre-read validation in main process)
2. `SEC-ELECTRON-001` (CSP)
3. `SEC-ELECTRON-002` (`file:` navigation allowlist tightening)
4. `SEC-ELECTRON-003`, `SEC-IPC-002` (hardening/robustness)
