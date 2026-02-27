# Day 5 Summary (Performance + Code Quality Deep Review)

Date: 2026-02-24

## Status

- Day 5 review: Started and materially progressed
- Completed in this pass:
  - Build + bundle evidence capture
  - Local runtime baseline timing capture (Playwright perf baseline spec)
  - Main-process performance code review
  - Large-file structural review
  - React/rendering hotspot review with findings
- Pending to fully close Day 5:
  - Manual CPU/heap profiling and screenshots (DevTools)
  - Blackboard large-canvas runtime profiling scenario
  - React DevTools manual capture requires interactive browser tooling; checklist/template prepared for operator-run capture

## Deliverables Produced (This Pass)

- Day 5 detailed review: `muwi/audit/2026-02/report/day5-performance-code-quality-review.md`
- Day 5 findings: `muwi/audit/2026-02/findings/day5-performance-code-quality-findings.md`
- Build output: `muwi/audit/2026-02/outputs/day5-build.txt`
- Build artifacts (size-sorted): `muwi/audit/2026-02/outputs/day5-build-artifacts.txt`
- Runtime baseline E2E output: `muwi/audit/2026-02/outputs/day5-performance-baseline-e2e.txt`
- PERF-STORE-001 targeted store tests: `muwi/audit/2026-02/outputs/day5-perf-store-001-targeted-tests.txt`
- PERF-ACAD-REORDER-001 targeted tests: `muwi/audit/2026-02/outputs/day5-perf-acad-reorder-001-targeted-tests.txt`
- PERF-EDITOR-001 targeted tests: `muwi/audit/2026-02/outputs/day5-perf-editor-001-targeted-tests.txt`
- PERF-TOC-001 targeted tests: `muwi/audit/2026-02/outputs/day5-perf-toc-001-targeted-tests.txt`
- PERF-RENDER-001 targeted tests: `muwi/audit/2026-02/outputs/day5-perf-render-001-targeted-tests.txt`
- Manual React Profiler checklist: `muwi/audit/2026-02/report/day5-manual-react-profiler-checklist.md`
- Manual React Profiler results template: `muwi/audit/2026-02/report/day5-manual-react-profiler-results.md`
- Largest files scan: `muwi/audit/2026-02/outputs/day5-largest-files.txt`
- React hooks/key scan: `muwi/audit/2026-02/outputs/day5-react-hooks-key-scan.txt`
- TODO scan: `muwi/audit/2026-02/outputs/day5-todo-scan.txt`
- Sync-FS scan: `muwi/audit/2026-02/outputs/day5-sync-fs-scan.txt`
- Hierarchy-helper duplication scan: `muwi/audit/2026-02/outputs/day5-hierarchy-helper-scan.txt`

## Highest-Priority New Finding

- `PERF-STORE-001` (High): Autosave flows in Academic + Long Drafts triggered metadata write amplification (section write + metadata write per autosave).
- Follow-up status: Remediated in code on 2026-02-24 via metadata write coalescing in `academicStore` and `longDraftsStore` (`updateSection()` path).

## Notable Day 5 Observations

- Local baseline route switches were roughly `0.9s-1.0s` cold and `~0.4s` warm for Academic in the captured run.
- Build still reports oversized chunks (`Blackboard`/`Academic` deferred payloads), confirming `PERF-BUNDLE-001` remains open.
- Electron main process review found no sync FS calls in reviewed startup/IPC backup/export paths.
- `PERF-ACAD-REORDER-001` remediated: academic section reorder now uses a transactional query helper instead of sequential per-item store writes.
- `PERF-EDITOR-001` remediated: `AcademicSectionEditor` derived metrics and content serialization work are no longer executed on every editor update event.
- `PERF-TOC-001` remediated: TOC hierarchy/render + reorder flattening now use a parent-indexed structure instead of repeated recursive `filter/sort` passes.
- `PERF-RENDER-001` remediated: `Academic` no longer recomputes section hierarchy on unrelated renders; outline and structure rows are memoized on `currentSections`.

## Follow-Up Priorities

1. Run `muwi/audit/2026-02/report/day5-manual-react-profiler-checklist.md` and fill `muwi/audit/2026-02/report/day5-manual-react-profiler-results.md`.
2. Consider extending metadata coalescing to create/delete/reorder flows if profiling still shows write pressure outside `updateSection()`.
3. Run Blackboard large-canvas runtime profiling scenario (500+ elements) and attach screenshots/FPS observations.

## 2026-02-26 Follow-Up (Web Gates / Launch Checklist)

- Local web-gate validation + checklist evidence: `muwi/audit/2026-02/report/2026-02-26-web-gates-validation.md`
- Added web fallback E2E coverage for backup/export panel browser fallbacks: `muwi/e2e/web-fallback-panels.spec.ts`
- Lighthouse mobile audit run captured for Netlify preview (`2026-02-26T18:16:39Z`, Moto G4 emulation, Lighthouse `9.6.8`).

### Lighthouse Snapshot (Mobile, Netlify Preview)

- Target URL: `https://69a08dcb9472fe0008624d2b--uddesa.netlify.app/`
- Category scores:
  - Performance: `46`
  - Accessibility: `94`
  - Best Practices: `92`
  - SEO: `82`
  - PWA: `20`
- Core metrics (simulated mobile):
  - FCP: `5.3s`
  - LCP: `6.3s`
  - TTI: `6.9s`
  - TBT: `510ms`
  - CLS: `0.014` (good)

### Key Findings (Most Actionable)

- Initial page is over-fetching deferred feature bundles on shelf load:
  - `academic-citation-*.js` transferred `~605KB` (resource `~2.65MB`)
  - `diary-personal-diary-*.js` transferred `~387KB` (resource `~1.27MB`)
  - Total transfer `~1.12MB` across only `7` requests
- Lighthouse flags high unused JS on initial load (estimated savings `~454KiB`), with the largest waste in `diary-personal-diary-*.js`.
- Main-thread long tasks align with bundle execution:
  - `index-*.js` long task `~486ms`
  - `diary-personal-diary-*.js` long task `~123ms`
  - `academic-citation-*.js` long task `~62ms`
- CSS is mostly unused on the shelf route (estimated unused CSS `~24KB` of `~26KB` stylesheet); stylesheet is also render-blocking (`~140ms` potential savings).
- Mobile layout overflow present (`content-width` failed): rendered content width exceeded viewport (`408px` vs `360px`).

### Accessibility / SEO Follow-Up Items from Lighthouse

- Accessibility:
  - Low contrast on `.muwi-diary-card__meta` and `.muwi-shelf__hint` (`#9a9a9e` on white, `11px`)
  - Heading order invalid (starts with `h3` in card titles without higher-level heading context)
- SEO:
  - Missing meta description
  - `robots.txt` invalid (appears to return `index.html` instead of a robots file)

### Best-Practice / PWA Notes (Lower Priority for Day 5 Perf, Still Open)

- Console warning: CSP `frame-ancestors` delivered via `<meta>` is ignored (should be header-based if required).
- No web app manifest / service worker / theme color / app icons (`apple-touch-icon`, maskable icon).

### Day 5 Performance Follow-Up Priority (Web)

1. Prevent shelf route from eagerly importing `academic-citation` and `diary-personal-diary` bundles; load only on card open/route transition.
2. Split/prune route CSS so shelf view ships only shelf-critical styles.
3. Fix mobile shelf grid overflow (card widths/gap/container math) and re-run Lighthouse mobile.
4. Raise muted text contrast and add correct heading hierarchy on shelf page.
5. Add `robots.txt` + meta description for deployed web preview/build.

## 2026-02-27 Follow-Up (Chunk Graph Cleanup: Scratchpad + Shell Ownership)

- Objective: remove route chunk leakage where shell/scratchpad paths were pulling unrelated diary route chunks.
- Implemented ownership fixes:
  - `App` now imports shell hooks directly (`useGlobalShortcuts`, `usePasteHandler`) instead of `@/hooks` barrel.
  - Personal diary lazy import now targets component source directly (`@/components/diaries/PersonalDiary/PersonalDiary`) to avoid re-export inlining side effects.
  - Shelf no longer uses `date-fns/formatDistanceToNow`; replaced with a local `Intl.RelativeTimeFormat` helper (`formatRelativeTime`) to avoid dragging date-fns ownership into route chunks.
  - Added explicit manual chunk ownership:
    - `app-shell-hooks` for shell keyboard/shortcut hooks + `utils/keyboard`.
    - `app-shell-ui` for shared `ContextMenu`.
    - `app-shell-command-palette` for command palette modules.
    - Existing scratchpad/shared-ui/app-shell-state chunk rules retained.
- Verification (`npm run build`):
  - No circular chunk warnings.
  - `dist/assets/index-*.js` now imports shell hook symbols from `app-shell-hooks-*` rather than `diary-personal-diary-*`.
  - `dist/assets/diary-scratchpad-*.js` imports `vendor-react`, `diary-shared-ui`, `app-shell-state`, `vendor-icons`, and `app-shell-hooks`, with no imports of `diary-personal-diary` or `diary-blackboard`.
  - Shell route bundle remains lean (`index-*.js` ~21.44 kB minified in latest run), with route-heavy bundles still deferred.

## 2026-02-27 Follow-Up (Deeper Route Dependency Trimming: Common Barrel Decoupling)

- Objective: remove deferred chain leakage where diary route modules inherited `app-shell-panels`, `academic-citation`, and command-palette dependencies through `@/components/common` barrel imports.
- Implemented route import rewires:
  - `blackboard`: replaced `@/components/common` import with direct imports from `Button`, `DiaryLayout`, `FontSelector`.
  - `drafts` + `long-drafts`: replaced `@/components/common` imports with direct `Toolbar` / `PasskeyPrompt` module imports.
  - Updated Blackboard component test mocks to target direct module paths (`DiaryLayout`, `FontSelector`, `Button`) so targeted suite behavior remains unchanged.
- Verification (`npm run build` + targeted tests):
  - No circular chunk warnings in final build.
  - `dist/assets/diary-blackboard-*.js` no longer imports `app-shell-panels-*`, `academic-citation-*`, or `app-shell-command-palette-*`.
  - `dist/assets/diary-drafts-*.js` and `dist/assets/diary-long-drafts-*.js` no longer import `app-shell-panels-*` / `academic-citation-*`.
  - Build size shifts (minified):
    - `diary-academic`: ~`1,138 kB` -> ~`22.94 kB` (route shell now small; heavy citation/vendor payloads remain deferred chunks).
    - `diary-blackboard`: ~`10.5 kB` -> ~`13.9 kB` (small increase from direct module ownership, with heavy Excalidraw/Mermaid still deferred).
    - `app-shell-panels`: reduced to tiny stub (`~0.15 kB`) and no longer appears in blackboard/drafts/long-drafts route dependency chains.
  - Targeted tests passed:
    - `src/components/diaries/blackboard/Blackboard.test.tsx`
    - `src/components/diaries/long-drafts/LongDrafts.test.tsx`
    - `src/components/diaries/drafts/Drafts.test.tsx`
