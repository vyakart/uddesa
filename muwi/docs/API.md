# MUWI Electron API (Preload / IPC Surface)

This document describes the Electron API exposed from `muwi/electron/preload.ts` to the renderer via `window.electronAPI`.

## Status

- Scope: current preload bridge + corresponding `ipcMain.handle(...)` handlers in `muwi/electron/main.ts`
- Audience: renderer developers, test authors, release/audit reviewers

## Source of Truth

- Preload bridge: `muwi/electron/preload.ts`
- Main-process handlers: `muwi/electron/main.ts`
- Renderer typings: `muwi/src/types/electron.ts`

## Security Model

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Renderer does **not** receive raw `ipcRenderer`; it receives a narrow frozen API object (`window.electronAPI`)
- Preload performs argument validation before invoking IPC
- Main process performs additional validation/path checks before file I/O

## Renderer Surface (`window.electronAPI`)

Type reference: `muwi/src/types/electron.ts`

### `selectBackupLocation(): Promise<string | undefined>`

Opens a native directory picker and returns:

- directory path (`string`) on success
- `undefined` if user cancels or selection is invalid

IPC channel:

- `select-backup-location`

Main-process behavior:

- Uses `dialog.showOpenDialog(..., { properties: ['openDirectory'] })`
- Resolves the selected path
- Verifies the selected path exists and is a directory

### `saveBackup(backup: string, location?: string, maxBackups?: number): Promise<string | null>`

Saves a backup payload either manually (save dialog) or automatically (direct write to backup directory).

Parameters:

- `backup`: serialized backup JSON string (required)
- `location`: existing directory for auto-backups (optional)
- `maxBackups`: retention count for auto-backups (optional)

Returns:

- saved file path (`string`) on success
- `null` if manual save dialog is canceled
- may reject on validation/write errors

IPC channel:

- `save-backup`

Validation highlights:

- Preload:
  - `backup` must be string
  - `location` must be string when provided
  - `maxBackups` must be finite number when provided
- Main process:
  - payload size capped (`MAX_BACKUP_BYTES`)
  - `location` must resolve to an existing directory
  - retention count is clamped to safe bounds

Auto-backup behavior:

- File naming pattern: `muwi-backup-<timestamp>.json`
- Old backups beyond retention limit are deleted best-effort

### `loadBackup(): Promise<string | null>`

Opens a native file picker, validates the selected backup file, and returns the raw JSON contents.

Returns:

- backup JSON (`string`) on success
- `null` if picker canceled
- may reject for invalid file type/path/size/read failures

IPC channel:

- `load-backup`

Validation highlights (`muwi/electron/backupImport.ts`):

- selected path must be a `.json` file
- file must exist and be a regular file
- file size must be within `MAX_BACKUP_BYTES`

### `exportFile(content: Uint8Array, defaultName: string): Promise<string | null>`

Saves generated document export bytes via native save dialog.

Parameters:

- `content`: binary export payload (`Uint8Array` or buffer-like view accepted by preload validation)
- `defaultName`: suggested filename (must include supported extension)

Returns:

- saved file path (`string`) on success
- `null` if save dialog canceled
- may reject on validation/write errors

IPC channel:

- `export-file`

Validation highlights:

- content size capped (`MAX_EXPORT_BYTES`)
- filename is normalized to basename
- filename length and null-byte checks
- allowed extensions only: `.pdf`, `.docx`, `.tex`

### `platform: Platform`

Read-only platform string from Electron preload (`process.platform`).

Possible values are defined in `muwi/src/types/electron.ts` (e.g. `darwin`, `linux`, `win32`).

## IPC Handler Inventory (Main Process)

Defined in `muwi/electron/main.ts`:

- `select-backup-location`
- `save-backup`
- `load-backup`
- `export-file`

All current handlers are request/response handlers using `ipcMain.handle(...)` and `ipcRenderer.invoke(...)`.

## Error Handling Expectations (Renderer)

Renderer call sites should assume:

- cancellation returns `null` / `undefined` depending on method
- invalid arguments or file-system errors may reject with `Error`
- user-facing components should convert thrown errors to safe UI messages (do not surface raw stack traces)

## Example Usage (Renderer)

```ts
const path = await window.electronAPI?.selectBackupLocation?.();
if (!path) {
  // user canceled
  return;
}

await window.electronAPI?.saveBackup?.(jsonPayload, path, 10);
```

## Change Management

When adding/changing preload methods:

1. Update `muwi/electron/preload.ts`
2. Update `muwi/electron/main.ts` handler(s)
3. Update `muwi/src/types/electron.ts`
4. Update this file (`muwi/docs/API.md`)
5. Add/adjust tests for validation and error paths

