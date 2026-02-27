# Action Plan: Reach Lighthouse Desktop Performance ~95 Across Core Routes + Full PWA (Installable + Offline Shell)

## Summary

Goal: make MUWI’s web build score around **95 in Lighthouse Desktop Performance** across the **shelf and all core diary routes**, while also shipping a **full PWA baseline** (installable app + service worker + offline shell fallback).

`PWA` means **Progressive Web App**: a website that behaves like an app via a web app manifest, installability, icons, theme color, and optional offline support using a service worker.

This plan is tailored to the current repo shape (`muwi/`, Vite, React lazy routes, large `shell.css`, route chunks, existing perf/bundle budget scripts).

## Success Criteria (Acceptance)

1. Lighthouse Desktop Performance score is `>=95` on these routes of a production web build:
   1. `/`
   2. `/scratchpad`
   3. `/blackboard`
   4. `/personal-diary`
   5. `/drafts`
   6. `/long-drafts`
   7. `/academic`
2. Lighthouse Desktop Best Practices remains `>=90`.
3. PWA installability audits pass for manifest/icon/theme-color/service-worker on the web build.
4. Offline behavior works for app shell navigation with a clear offline fallback UI (no claim of full data sync/offline mutation semantics).
5. Existing Electron workflows remain unaffected (no service worker/PWA behavior in Electron runtime).
6. Bundle/perf budget checks are updated and enforced in CI for the new targets.

## Scope

### In Scope

- Web performance for desktop Lighthouse on all core routes.
- JS import graph cleanup and lazy-loading corrections.
- CSS and font delivery optimization for route-specific usage.
- PWA manifest, icons, theme color, service worker, offline shell fallback.
- Lighthouse automation and CI gating for desktop route audits.

### Out of Scope (Phase 1)

- Mobile Lighthouse `95` target.
- Full offline-first data synchronization semantics.
- Electron-specific performance optimization beyond preserving compatibility.
- Search/SEO improvements except where incidental to PWA manifest/head updates.

## Current Repo Facts Driving This Plan

1. App already uses `React.lazy()` in `muwi/src/App.tsx`, but Lighthouse shows initial fetches for `academic-citation` and `diary-personal-diary` on the shelf route.
2. `muwi/src/components/diaries/PersonalDiary/PersonalDiary.tsx` and `muwi/src/components/diaries/academic/Academic.tsx` import from the broad barrel `@/components/common`, which re-exports heavy modules like `ExportPanel`/`BackupPanel`.
3. `muwi/src/components/diaries/personal-diary/index.ts` re-exports multiple subcomponents, which broadens the lazy route chunk surface.
4. `muwi/src/main.tsx` imports global style bundles (`shell.css`, `editor.css`, full font stack) for every route.
5. `muwi/src/styles/shell.css` includes shelf styles plus many diary/editor styles in one file, causing high unused CSS on the shelf route.
6. Existing perf/bundle budget scripts already exist and should be extended instead of reinvented.

## Route and Scenario Matrix (for Desktop Lighthouse)

Use production web build (`vite build` + preview or deployed preview) and run Lighthouse Desktop navigation mode on each route.

| Route | Scenario | Data State | Pass Condition |
|---|---|---|---|
| `/` | Shelf landing | Empty or seeded | Performance `>=95` |
| `/scratchpad` | Route shell + initial content | Seed 1 item | Performance `>=95` |
| `/blackboard` | Route shell + lazy canvas libs | Seed 1 small canvas | Performance `>=95` |
| `/personal-diary` | Route shell + entry view | Seed 1 entry | Performance `>=95` |
| `/drafts` | Route shell + editor | Seed 1 draft | Performance `>=95` |
| `/long-drafts` | Route shell + section editor | Seed 1 document | Performance `>=95` |
| `/academic` | Route shell + paper view | Seed 1 paper | Performance `>=95` |

Default for seeded data: use a deterministic Playwright/DB setup script so Lighthouse runs are reproducible.

## Implementation Plan (Decision-Complete)

## 1. Establish Measurement Harness and Baselines (Desktop Route-Level)

1. Add a dedicated Lighthouse desktop runner script for route audits in `muwi/scripts/web/` that:
   1. Builds or targets a provided preview URL.
   2. Runs Lighthouse Desktop for the route matrix above.
   3. Outputs JSON per route into `muwi/test-results/lighthouse/`.
   4. Produces a summary JSON and console table.
2. Pin Lighthouse version used by the script to avoid score drift from tool updates.
3. Extend CI to run desktop Lighthouse audits against a preview build (or Netlify preview URL when available).
4. Record an initial route baseline file in `muwi/perf-baselines/` for desktop Lighthouse route scores and key metrics (FCP/LCP/TBT).
5. Keep current Playwright perf budget scripts as complementary runtime checks, not replacements.

## 2. Fix the Import Graph Leaks Causing Eager Loading

### 2.1 Replace broad common barrel imports inside lazy diary modules

Change these files to direct imports, not `@/components/common` barrel:

- `muwi/src/components/diaries/PersonalDiary/PersonalDiary.tsx`
- `muwi/src/components/diaries/PersonalDiary/DiaryEntry.tsx`
- `muwi/src/components/diaries/academic/Academic.tsx`

Use path-specific imports such as:

- `@/components/common/Button`
- `@/components/common/DiaryLayout`
- `@/components/common/PasskeyPrompt`
- `@/components/common/Toolbar`

Reason: the `@/components/common/index.ts` barrel currently re-exports heavy modules (`ExportPanel`, `BackupPanel`) which can transitively pull `utils/export.ts` and citation/citeproc code into unrelated chunks.

### 2.2 Narrow lazy route entry points so they export only route components

Refactor route entry modules so each lazy-import target exports only the route component used by `App.tsx`.

Target files:

- `muwi/src/components/diaries/personal-diary/index.ts`
- `muwi/src/components/diaries/academic/index.ts`
- Other route `index.ts` files if they re-export many subcomponents

Rule:
- `App.tsx` lazy import entry modules must export only `PersonalDiary`, `Academic`, etc.
- Subcomponents (`DatePicker`, `DiaryEntry`, etc.) should be imported directly by internal modules or exported from separate dev/test-only barrels if needed.

### 2.3 Keep command palette out of the critical path when closed

`CommandPalette` is always mounted in `App.tsx` and imports all diary stores. Convert it to lazy-loaded-on-first-open behavior.

Changes:
- Introduce `LazyCommandPalette` wrapper in `App.tsx`.
- Mount only a small keyboard shortcut listener / open trigger in the critical path.
- Load `CommandPalette` implementation via `React.lazy()` when the palette is opened the first time.
- Keep first-open UX acceptable with a tiny fallback overlay skeleton.

### 2.4 Audit modulepreload filtering and make it stricter

Current Vite config filters modulepreload only by prefix `diary-` in `muwi/vite.config.ts`. Expand this so desktop shelf route does not preload non-critical deferred chunks such as:

- `academic-citation-*`
- `academic-reference-tools-*`
- `academic-template-selector-*`
- `blackboard-*` deferred vendor chunks where appropriate
- `diary-personal-diary-*` and all diary route chunks

Implement a centralized denylist/prefix matcher in `modulePreload.resolveDependencies` rather than hardcoding a single prefix.

## 3. Reduce Shelf-Route CSS and Font Cost

### 3.1 Split CSS by route family

Current issue: `muwi/src/main.tsx` imports `shell.css` and `editor.css` globally.

Plan:
1. Move shelf-specific styles into a new file (for example `muwi/src/styles/shelf.css`).
2. Move diary/editor-specific styles into one or more route-level CSS files (for example `muwi/src/styles/diary-layout.css`, `muwi/src/styles/diary-editors.css`).
3. Import shelf CSS in `Shelf.tsx` or a shelf module entry.
4. Import diary/editor CSS from route components or `DiaryLayout`.
5. Keep only resets/tokens/themes/utilities as global imports in `muwi/src/main.tsx`.

### 3.2 Reduce default font payload on desktop critical path

Current issue: `muwi/src/styles/fonts.css` imports many font families/weights globally.

Plan:
1. Keep only the shelf/default UI fonts and minimal weights in the critical path.
2. Defer specialized fonts (Crimson Pro, Caveat, JetBrains Mono, extra weights) to diary/editor route CSS imports.
3. Preserve `font-display` behavior and ensure no invisible text regressions.
4. Re-run Lighthouse to verify improved first render and reduced unused CSS/bytes.

### 3.3 Fix shelf overflow and accessibility color contrast while touching shelf styles

Target selectors in `muwi/src/styles/shell.css` (or new shelf CSS file):
- `.muwi-shelf__grid`
- `.muwi-diary-card`
- `.muwi-diary-card__meta`
- `.muwi-shelf__hint`

Required fixes:
1. Eliminate desktop/mobile overflow by adjusting grid template and minimum widths (use container-safe `minmax(0, 1fr)` and route-specific breakpoints).
2. Increase contrast of tertiary text used in metadata/hint to pass Lighthouse contrast checks.
3. Preserve visual design while meeting WCAG contrast for small text.

## 4. Route-Level Performance Work for “All Core Diaries” Desktop 95

### 4.1 Blackboard route

1. Keep Excalidraw stack deferred until the route is entered and the canvas is actually needed.
2. Validate `ExcalidrawWrapper` and vendor chunks are not preloaded on shelf and non-blackboard diary routes.
3. If needed, split blackboard UI shell from Excalidraw runtime mount so route shell paints fast before tool engine initialization.

### 4.2 Academic route

1. Ensure citation/citeproc chunk loads only when bibliography/citation functionality is invoked, not on route shell paint if possible.
2. Split academic route shell/editor from citation tooling panel features (`ReferenceLibraryPanel`, `BibliographyManager`, `CitationPicker`, template selector).
3. Keep route-level skeletons lightweight and deterministic for Lighthouse.

### 4.3 Personal Diary route

1. Confirm lazy chunk contains only required route code after barrel cleanup.
2. Remove indirect heavy common-module dependencies from route entry.
3. Validate no unexpected `modulepreload` remains for this route on shelf load.

### 4.4 Drafts / Long Drafts / Scratchpad routes

1. Verify no unnecessary editor/tooling code is imported at route shell start.
2. Add route-level dynamic imports for non-critical panels/feature tools if still blocking desktop score.
3. Use route-local suspense boundaries for heavy side panels and utilities.

## 5. Full PWA Workstream (Installable + Shell Offline Fallback)

### 5.1 Add Vite PWA plugin and production-only registration

Use `vite-plugin-pwa` in `muwi/vite.config.ts` with a web-only path (no Electron impact).

Plan details:
1. Add plugin dependency and configure only for web builds.
2. Register the service worker from a web entry module guarded against Electron runtime.
3. Ensure dev behavior avoids noisy SW caching during local development unless explicitly enabled.

### 5.2 Add manifest and installability assets

Add/update:
- `manifest.webmanifest`
- `theme-color` meta in `muwi/index.html`
- `apple-touch-icon`
- maskable icon set
- standard icons (192/512)

Manifest fields to include:
- `name`, `short_name`
- `start_url`
- `scope`
- `display` (`standalone`)
- `background_color`
- `theme_color`
- `icons` with maskable purpose
- sensible `id`

### 5.3 Service worker caching strategy (shell offline, not full data sync)

Default strategy (decision locked):
1. Precache app shell assets (HTML entry, critical JS/CSS, icons, manifest).
2. Network-first for HTML navigation with offline fallback to cached shell or offline page.
3. Cache-first (with revisioning) for hashed static assets.
4. No caching claims for IndexedDB data writes/reads beyond normal browser persistence.
5. Clear user-facing offline state messaging when shell loads offline.

### 5.4 Offline fallback UX

1. Add an offline fallback view or banner that explains:
   1. App shell is available offline.
   2. Existing local IndexedDB content may still be available.
   3. Remote/network actions (if any) are unavailable.
2. Ensure the fallback is keyboard accessible and does not trap focus.
3. Verify route navigation offline fails gracefully instead of blank screen.

### 5.5 Update/versioning and SW safety

1. Use plugin/workbox revisioned caches tied to asset hashes.
2. Enable safe update flow (prompt or silent update strategy, one approach chosen and documented).
3. Provide cache cleanup policy for old versions.
4. Document “hard refresh / update” troubleshooting in `muwi/docs/web-launch-checklist.md`.

## 6. Lighthouse and CI Enforcement (Desktop + PWA)

### 6.1 Lighthouse desktop route checks in CI

1. Add CI job step to run desktop Lighthouse route matrix against built preview.
2. Fail CI when any route score is below `95` for Performance.
3. Record artifacts (JSON + HTML reports) per route.

### 6.2 PWA/installability checks in CI

1. Include Lighthouse PWA category checks in the same run.
2. Fail on manifest/service-worker/installability regressions.
3. Keep PWA score target secondary to explicit audit pass criteria (manifest/service worker/installability/offline shell behavior).

### 6.3 Strengthen existing bundle budgets

Update `muwi/perf-baselines/bundle-budgets.json` and budget scripts to:
1. Forbid index HTML/modulepreload references to any deferred diary/panel/citation chunks.
2. Track regression on `academic-citation-*`, `diary-personal-diary-*`, and other critical deferred chunks.
3. Add a stricter initial web entry budget after post-optimization baseline capture.

## Important Changes to Public APIs / Interfaces / Types / Build Contracts

1. New web app manifest (`manifest.webmanifest`) becomes part of the public web surface.
2. New service worker registration module and runtime behavior (public browser contract: offline shell + installability).
3. New PWA plugin configuration in `muwi/vite.config.ts` (build behavior contract).
4. New CI Lighthouse route audit configuration and output schema in `muwi/scripts/web/` and `muwi/perf-baselines/`.
5. Potentially narrower barrel exports in `muwi/src/components/diaries/*/index.ts` and `muwi/src/components/common/index.ts` usage patterns.
6. No intentional changes to end-user data models (`muwi/src/types/*`) or Electron APIs.

## Test Cases and Scenarios

## Functional + Regression Tests

1. Shelf route loads and opens each diary as before.
2. Command palette opens on shortcut and still supports all existing commands after lazy-loading.
3. Settings modal/panel still works on shelf route.
4. Export and backup panels still work on diary routes after barrel-import cleanup.
5. Electron preview/build runs unchanged and does not register/expect service worker behavior.

## Performance / Bundle Tests

1. Verify no `modulepreload` for deferred diary or citation chunks in built `index.html`.
2. Verify shelf route network waterfall excludes `academic-citation-*` and `diary-personal-diary-*` on initial load.
3. Route-level Lighthouse Desktop run for all routes meets `>=95`.
4. Bundle budget script passes with updated thresholds.
5. Existing Playwright perf budget script continues passing (or thresholds intentionally updated once new baseline is captured).

## PWA Tests

1. Manifest is fetched and valid.
2. Installability audits pass (icons, theme color, manifest, service worker).
3. App installs in desktop-capable browser.
4. Offline shell test:
   1. Load once online.
   2. Go offline.
   3. Refresh shelf route.
   4. App shell/fallback renders instead of blank/error page.
5. Update test:
   1. Build/version A cached.
   2. Deploy/version B.
   3. Verify service worker update flow does not break navigation.

## Accessibility Checks (incidental but required due current Lighthouse findings)

1. Contrast for `.muwi-diary-card__meta` and `.muwi-shelf__hint` passes Lighthouse.
2. Shelf heading order is valid (add/adjust top-level heading hierarchy on page if needed).
3. Offline fallback UI and install prompts remain keyboard accessible.

## Risks / Failure Modes and Mitigations

1. Risk: Barrel cleanup breaks imports in tests or internal modules.
   Mitigation: do targeted import rewrites with compile checks and component tests.
2. Risk: CSS splitting causes flash of unstyled content on route transitions.
   Mitigation: import route CSS at route entry and use lightweight suspense fallback styles that are globally available.
3. Risk: Service worker caches stale HTML after deploy.
   Mitigation: use network-first for navigations and hashed-asset revisioning.
4. Risk: PWA plugin affects Electron build behavior.
   Mitigation: conditionally enable plugin for web builds only.
5. Risk: Desktop 95 on all routes is blocked by blackboard/editor-heavy initialization.
   Mitigation: split route shell from heavy editor engines and defer tool runtimes until user interaction where possible.

## Assumptions and Defaults Chosen

1. Primary target is **Lighthouse Desktop Performance 95** (not mobile) for this plan.
2. Scope includes **all core routes**, not only shelf.
3. PWA scope is **full installability + shell offline fallback**, not offline-first data sync.
4. PWA implementation uses **`vite-plugin-pwa`** (recommended path) instead of a custom hand-written SW.
5. Lighthouse audits will run against a **production web build** (preview/deployed), not dev mode.
6. Electron runtime behavior must remain unchanged and is treated as a compatibility constraint.
7. Existing perf/bundle budget scripts are retained and extended rather than replaced.

