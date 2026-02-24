# MUWI (Multi-Utility Writing Interface)

MUWI is a local-first writing workspace with six focused "diary" modes in one app:

- Scratchpad
- Blackboard
- Personal Diary
- Drafts
- Long Drafts
- Academic Papers

It is built with React + TypeScript + Vite and packaged as an Electron desktop app.

## Requirements

- Node.js 20+ (recommended)
- npm 10+ (recommended)
- macOS/Linux/Windows for local development

## Quick Start

```bash
cd muwi
npm install
npm run dev
```

This starts the Vite renderer app (browser mode).

## Development Workflows

## Web / Renderer Dev

```bash
cd muwi
npm run dev
```

- Default Vite dev server starts (see terminal output for URL).
- Useful for most UI and store development.

## Local Electron Smoke Run (built renderer)

```bash
cd muwi
npm run electron:preview
```

If Electron launches with `ELECTRON_RUN_AS_NODE` issues in your environment:

```bash
cd muwi
npm run electron:preview:cleanenv
```

## Linting and Tests

```bash
cd muwi
npm run lint
npm run test
npm run test:coverage
```

Playwright E2E (browser):

```bash
cd muwi
npx playwright install
npm run test:e2e
```

Playwright Electron smoke:

```bash
cd muwi
npm run test:e2e:electron
```

## Build and Packaging

## Web Build

```bash
cd muwi
npm run build
```

## Electron Packaging

```bash
cd muwi
npm run electron:build
```

Platform-specific packaging:

```bash
cd muwi
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

Artifacts are written to `muwi/release/<version>/` (for example `muwi/release/0.0.0/`).

### Packaging Notes

- `muwi/build/icons/` contains platform icon assets used by `electron-builder`.
- Local packaging may skip code signing/notarization if you do not have Apple signing credentials installed.
- The repo includes `muwi/scripts/notarize.cjs`; notarization is skipped automatically when Apple credentials are missing.

## Key User Workflows

## Command Palette

- Open with `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux).
- Use it to navigate diaries and open utility panels (including export flows).
- `Escape` closes the command palette and other overlays.

## Backup / Restore

- Open **Settings** and use the **Backup** tab.
- Configure backup location and auto-backup options there.
- Restore/import is handled through the backup UI and Electron file dialogs.

## Export

- Use the in-app Export panel.
- Supported export formats in the UI include `PDF`, `DOCX`, and `TeX`.

## Project Structure (high level)

```text
muwi/
  electron/        Electron main + preload
  src/             React app, stores, DB, components, styles
  e2e/             Playwright specs
  scripts/         Release/security utility scripts
  build/           Packaging resources (icons, entitlements)
  audit/           Audit reports and evidence
```

## Technology Highlights

- React 19 + TypeScript
- Vite 7
- Electron 40
- Zustand (state)
- Dexie / IndexedDB (local data)
- TipTap (rich text)
- Excalidraw (blackboard/canvas)
- Playwright + Vitest (tests)

## Troubleshooting

## Packaging warnings about `description` / `author`

- These fields are defined in `muwi/package.json` and are required for clean release metadata.

## macOS signing/notarization warnings during local builds

- Expected on machines without a valid Developer ID signing identity and Apple notarization credentials.
- Packaging can still produce local artifacts for validation.

## Large bundle warnings during `vite build`

- The project intentionally uses route-level splitting, but some heavy deferred chunks (e.g. Excalidraw / citation tooling) still trigger size warnings.
- These are tracked as performance/bundle optimization follow-up work.

## Related Docs

- `../AUDIT_PLAN.md`
- `../AUDIT_PLAN_DETAILED.md`
- `../TESTING.md` (strategy/reference; may lag current config details)
- `../IMPLEMENTATION.md` (historical/technical design reference; may lag current implementation)

