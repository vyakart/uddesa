# uddesa

Local-first writing environment blending spatial and linear editors. This first milestone (PR1) sets up the Vite + React + TypeScript scaffold, IndexedDB persistence via Dexie, application routing, the diary shelf, and a settings placeholder.

## Available scripts

- `npm run dev` – start the Vite dev server.
- `npm run build` – create a production build.
- `npm run preview` – preview the production build locally.
- `npm run lint` – run TypeScript checks.

## Project layout

```
src/
  app/            # shell and routing
  features/
    diaries/      # shelf, diary router, feature views
  editors/        # Excalidraw & Tiptap integrations (stubs for now)
  services/       # Dexie database + service helpers
  ui/             # shared UI components
```

Upcoming PRs will flesh out canvas and text editors, diary presets, encryption, and offline enhancements.
