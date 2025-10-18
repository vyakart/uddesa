# Uddesa

Local-first writing environment for research notes, longform drafts, and visual thinking. Recent work (PR5–PR9) layers in dedicated writing presets, academic tooling, keyboard shortcut discovery, and end-to-end encryption with PWA polish so the app can be installed directly on desktop.

## Quick start

```bash
npm install
npm run dev
```

Run `npm run build && npm run preview` to exercise the production bundle before shipping.

## Feature highlights

- **Drafts preset** – Title node stays anchored at the top of the doc, autosave runs every two seconds, word/character counts update live, and HTML/Markdown exports are a click away in the footer.
- **Longform preset** – Hierarchical outline panel with collapsible sections, smooth scroll-to navigation, and live footnote extraction rendered at the bottom of the page.
- **Academic preset** – KaTeX-backed inline and block math, reusable citation library with bibliography generation, and quick template buttons for common equation structures.
- **Security & sessions** – Password-lock any diary. Content is encrypted with AES-GCM, diaries auto-lock after 15 minutes of inactivity, and sessions can optionally be remembered per device. Backup/import flows are crypto-aware.
- **Keyboard shortcuts modal** – Press `Cmd/Ctrl + K` or use the header button to open the shortcuts dialog that documents global and editor-specific commands. `Cmd/Ctrl + L` toggles the lock dialog for the current diary.
- **PWA ready** – Fresh 192×192 and 512×512 icons, manifest updates, and build verification mean the app can be installed from supporting browsers for an offline-first experience.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Show shortcuts modal | `Cmd/Ctrl + K` |
| Lock/unlock diary | `Cmd/Ctrl + L` |
| Export current diary | `Cmd/Ctrl + E` |
| Editor formatting | `Cmd/Ctrl + B`, `Cmd/Ctrl + I`, `Cmd/Ctrl + U` |

The shortcuts modal surfaces additional context-aware bindings and can be opened from any screen.

## Accessibility & UX notes

- Shelf actions, status messages, and diary controls expose ARIA labels and live regions for assistive tech.
- Outline toggles in the longform preset are real buttons, enabling keyboard traversal without extra scripts.
- Lock and shortcut dialogs announce themselves via `aria-modal` and are referenced by header controls with `aria-controls` for predictable focus management.

## Project layout

```
src/
  app/            # application shell + router
  editors/        # Tiptap + Excalidraw integrations and extensions
  features/
    diaries/      # shelf, presets, and supporting hooks
  services/       # Dexie persistence, crypto, backups, shortcuts, sessions
  ui/             # shared modals, dialogs, and utility components
```

## Available scripts

- `npm run dev` – start the Vite dev server.
- `npm run build` – compile TypeScript and generate the production bundle.
- `npm run preview` – preview the production bundle locally.
- `npm run lint` – run TypeScript + ESLint checks.

## Progressive Web App installation

1. `npm run build`
2. `npm run preview`
3. Visit the preview URL in a Chromium-based browser and choose **Install Uddesa** from the address bar install menu.

The generated icons in `public/icon-192.png` and `public/icon-512.png` are maskable and match the updated manifest so the installed app looks crisp across launch surfaces.
