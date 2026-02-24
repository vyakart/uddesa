# Electron Manual Smoke Checklist (Preload + Sandbox)

Date: 2026-02-24
Target: Desktop runtime verification after enabling `webPreferences.sandbox = true`

## Launch

1. Run `npm run electron:preview:cleanenv`
2. Confirm the app window opens and remains stable for at least 10 seconds
3. Confirm no immediate crash dialogs / blank window

## Preload / IPC Wiring (Settings)

1. Open the Settings panel
2. Trigger the backup location picker (`Select Backup Location` / equivalent control)
3. Expected:
   - Native directory picker opens (proves preload-exposed API + IPC path is working under sandbox)
   - Canceling the picker does not crash the app
   - UI remains responsive after cancel
4. Reopen picker and select a valid directory
5. Expected:
   - Selected path is shown in UI (or persisted indicator updates)
   - No console/runtime error dialog

## Preload / IPC Wiring (Backup Panel)

1. Open the backup panel / backup controls
2. Trigger `Select Backup Location`
3. Expected:
   - Native directory picker opens
   - Cancel path handled gracefully (message shown or no-op, no crash)
4. If available, trigger a manual backup save
5. Expected:
   - File dialog opens (or backup writes to configured folder)
   - Success message/path appears

## `load-backup` Rejection Paths (Security Hardening Spot Check)

1. Trigger backup import / load backup
2. In the file picker, attempt to choose a non-`.json` file (if picker filters allow override)
3. Expected:
   - Import is rejected with a safe error message
   - App remains stable
4. Attempt to import a very large `.json` file (>100 MB) if practical
5. Expected:
   - Rejected before the app becomes unresponsive
   - No crash, no long freeze

## Navigation Allowlist / External Window Guard

1. Attempt any UI action that opens external links (if present)
2. Expected:
   - No unexpected in-app navigation to arbitrary `file:` URLs
   - New windows/popups are blocked unless explicitly supported

## Blackboard Lazy Load / Deferred Engine

1. Navigate to Blackboard diary
2. Expected:
   - Route shell loads quickly (toolbar/sidebar/status visible)
   - Canvas shows loading fallback briefly (`Loading canvas engine...`) before Excalidraw initializes
   - No runtime error after Excalidraw loads
3. Interact minimally:
   - Click canvas
   - Toggle index visibility
   - Open context font menu (right click)
4. Expected:
   - No crash/hang
   - Blackboard remains interactive

## Pass Criteria

- App launches and stays running
- Native dialogs invoked via preload-backed IPC open successfully under sandbox
- Cancel paths do not throw visible crashes
- Blackboard route loads with deferred Excalidraw chunk and remains interactive
- No preload/sandbox regression observed during the above flows
