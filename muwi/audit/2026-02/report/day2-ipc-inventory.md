# Day 2 IPC Inventory (Electron Main/Preload)

## Remediation Status Update (Post-Fix Implementation)

- Update date: 2026-02-23
- `select-backup-location` renderer callsites now catch and surface IPC errors (`SettingsPanel`, `BackupPanel`)
- `load-backup` main handler now validates cancel state, extension, file existence, and size before `readFile`

The inventory table below reflects the original audit snapshot; see notes in the updated rows/sections for current status.

## Scope

- Main process handlers: `muwi/electron/main.ts`
- Preload bridge: `muwi/electron/preload.ts`
- Renderer callers: `muwi/src/utils/backup.ts`, `muwi/src/utils/export.ts`, UI callsites

## IPC Channel Inventory

| Channel | Direction | Preload API | Main Handler | Input Validation (Preload) | Input Validation (Main) | Return Type | Renderer Error Handling |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `select-backup-location` | Renderer -> Main (`invoke`) | `electronAPI.selectBackupLocation()` (`electron/preload.ts:57`) | `ipcMain.handle('select-backup-location', ...)` (`electron/main.ts:212`) | n/a (no args) | Normalizes returned path with `path.resolve`, checks directory exists (`electron/main.ts:221`, `electron/main.ts:222`) | `string \| undefined` | Updated: renderer UI callsites now wrap in `try/catch` and display user-facing errors |
| `save-backup` | Renderer -> Main (`invoke`) | `electronAPI.saveBackup(backup, location?, maxBackups?)` (`electron/preload.ts:58`) | `ipcMain.handle('save-backup', ...)` (`electron/main.ts:230`) | `assertString`, `assertOptionalString`, `assertOptionalFiniteNumber` (`electron/preload.ts:5`, `electron/preload.ts:13`, `electron/preload.ts:25`) | Payload size/type, directory validation, retention clamp (`electron/main.ts:30`, `electron/main.ts:42`, `electron/main.ts:21`) | `string \| null` | Good: renderer utility catches and returns structured error (`src/utils/backup.ts:237`, `src/utils/backup.ts:268`) |
| `load-backup` | Renderer -> Main (`invoke`) | `electronAPI.loadBackup()` (`electron/preload.ts:65`) | `ipcMain.handle('load-backup', ...)` (`electron/main.ts:261`) | n/a (no args) | Updated: cancel check + extension + `fs.stat` file/size validation before `readFile` | `string \| null` | Good in `backup.ts`: type check + parse/size validation + `catch` (`src/utils/backup.ts:464`, `src/utils/backup.ts:495`, `src/utils/backup.ts:501`) |
| `export-file` | Renderer -> Main (`invoke`) | `electronAPI.exportFile(content, defaultName)` (`electron/preload.ts:68`) | `ipcMain.handle('export-file', ...)` (`electron/main.ts:274`) | `assertUint8Array`, `assertString` (`electron/preload.ts:37`, `electron/preload.ts:69`) | Content size/type and default filename/extension checks (`electron/main.ts:89`, `electron/main.ts:65`) | `string \| null` | Good: `ExportPanel` wraps export flow in `try/catch` (`src/components/common/ExportPanel/ExportPanel.tsx:73`, `src/components/common/ExportPanel/ExportPanel.tsx:116`) |

## Preload Surface Summary

`electronAPI` exposed via `contextBridge.exposeInMainWorld` at `muwi/electron/preload.ts:75` contains:

- `selectBackupLocation`
- `saveBackup`
- `loadBackup`
- `exportFile`
- `platform` (readonly `process.platform`)

This is a narrow, least-privilege bridge relative to exposing raw `ipcRenderer`.

## Validation Strength (By Channel)

### Strong
- `save-backup`: validation occurs in both preload and main process.
- `export-file`: binary payload and filename validation in preload + main.

### Moderate
- `select-backup-location`: no args, returned path normalized and directory-checked in main; renderer callsites now handle rejection paths after follow-up remediation.

### Improved (Previously Weak)
- `load-backup`: main process now performs extension/file/size validation before reading. Renderer validation remains an additional layer.

## Renderer Callsite Map

- `selectBackupLocation`
  - `muwi/src/components/shelf/SettingsPanel.tsx:198`
  - `muwi/src/components/common/BackupPanel/BackupPanel.tsx:122`
- `saveBackup`
  - `muwi/src/utils/backup.ts:243`
  - `muwi/src/utils/backup.ts:541`
- `loadBackup`
  - `muwi/src/utils/backup.ts:469`
- `exportFile`
  - `muwi/src/utils/export.ts:896`

## Immediate Follow-ups (Updated)

1. Add/extend tests covering `load-backup` rejection paths for invalid extension and oversized file (main-process level where feasible).
2. Perform an Electron runtime smoke test with `sandbox: true` enabled to verify preload bridge behavior end-to-end.
