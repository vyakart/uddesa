# Day 5 Performance + Code Quality Deep Review

Date: 2026-02-24

## Status

- Day 5 review: In progress (static/code review completed, build + baseline timing captured)
- Manual CPU/heap profiling screenshots: Pending (requires interactive DevTools session)

## Scope Reviewed

- Runtime baseline evidence via Playwright perf spec (`muwi/e2e/performance-baseline.spec.ts`)
- Build/bundle outputs and chunk sizes (`muwi/dist/assets`)
- Main-process performance risk scan (`muwi/electron/main.ts`)
- Large-file structural review (top offenders from `muwi/src/**`)
- React/rendering follow-up review (Academic + Long Drafts editors/TOC/stores)

## Evidence Collected

- Build log: `muwi/audit/2026-02/outputs/day5-build.txt`
- Build artifacts (size-sorted): `muwi/audit/2026-02/outputs/day5-build-artifacts.txt`
- Local perf baseline E2E: `muwi/audit/2026-02/outputs/day5-performance-baseline-e2e.txt`
- PERF-STORE-001 targeted store tests: `muwi/audit/2026-02/outputs/day5-perf-store-001-targeted-tests.txt`
- PERF-ACAD-REORDER-001 targeted tests: `muwi/audit/2026-02/outputs/day5-perf-acad-reorder-001-targeted-tests.txt`
- PERF-EDITOR-001 targeted tests: `muwi/audit/2026-02/outputs/day5-perf-editor-001-targeted-tests.txt`
- PERF-TOC-001 targeted tests: `muwi/audit/2026-02/outputs/day5-perf-toc-001-targeted-tests.txt`
- PERF-RENDER-001 targeted tests: `muwi/audit/2026-02/outputs/day5-perf-render-001-targeted-tests.txt`
- Manual React Profiler checklist: `muwi/audit/2026-02/report/day5-manual-react-profiler-checklist.md`
- Manual React Profiler results template: `muwi/audit/2026-02/report/day5-manual-react-profiler-results.md`
- Largest files scan: `muwi/audit/2026-02/outputs/day5-largest-files.txt`
- React hooks/key scan: `muwi/audit/2026-02/outputs/day5-react-hooks-key-scan.txt`
- TODO/FIXME/HACK scan: `muwi/audit/2026-02/outputs/day5-todo-scan.txt`
- Sync-FS scan (main/export/backup): `muwi/audit/2026-02/outputs/day5-sync-fs-scan.txt`
- Hierarchy-helper duplication scan: `muwi/audit/2026-02/outputs/day5-hierarchy-helper-scan.txt`

## Summary

- Local baseline route-switch timings are usable on this machine (sub-second startup and ~0.9-1.0s cold diary route switches in the captured run), but this is a coarse smoke metric, not a profiler trace.
- Main-process review did not find blocking sync filesystem calls in `electron/main.ts`, `src/utils/backup.ts`, or `src/utils/export.ts`.
- Highest Day 5 performance risks are in renderer/store hot paths:
  - autosave write amplification in Academic + Long Drafts stores
  - academic editor per-keystroke derived-metrics scans
  - TOC hierarchy rebuild cost during reorder operations
  - academic outline reordering doing sequential per-item DB writes
- Code-quality debt remains concentrated in several large modules (multiple 650-1160 LOC files) plus duplicated hierarchy utilities.
- Bundle warnings persist; the remaining large chunks are mostly deferred Blackboard/Academic dependencies, consistent with prior `PERF-BUNDLE-001` analysis.

## Runtime Baseline (Captured)

From `muwi/audit/2026-02/outputs/day5-performance-baseline-e2e.txt` (Chromium local run):

- Startup
  - Shelf visible: `383ms`
  - DOMContentLoaded: `167ms`
  - Load event: `173ms`
- Shelf -> Diary route switches
  - `cold:scratchpad`: `937ms`
  - `cold:long-drafts`: `892ms`
  - `cold:blackboard`: `1028ms`
  - `cold:academic`: `899ms`
  - `warm:academic`: `413ms`

Notes:
- This spec measures route-shell readiness and not editor-interaction latency, memory growth, or FPS.
- First attempt failed under sandboxed port binding (`127.0.0.1:4173`); rerun succeeded with elevated permissions for local web server startup.

## Build + Bundle Snapshot (Day 5)

From `muwi/audit/2026-02/outputs/day5-build.txt`:

- Build status: PASS
- Build duration: `21.64s`
- Vite chunk warnings: Present (`>500kB` chunks)

Largest relevant JS chunks (current):

- `blackboard-excalidraw-core-*.js` ~`4.08 MB`
- `blackboard-mermaid-vendor-*.js` ~`3.13 MB`
- `academic-citation-*.js` ~`2.65 MB`
- `diary-academic-*.js` ~`1.14 MB`

Interpretation:
- Route-level lazy loading improvements remain effective, but large deferred payloads still dominate first-use costs for Blackboard and some Academic workflows.

## Main-Process Performance Review (Electron)

Reviewed `muwi/electron/main.ts` for startup and IPC blocking risks.

Findings:

- No synchronous filesystem APIs detected in reviewed main/export/backup paths (`day5-sync-fs-scan.txt` is empty).
- IPC handlers (`select-backup-location`, `save-backup`, `load-backup`, `export-file`) use async dialog and `fs/promises` operations.
- Startup path (`app.whenReady().then(createWindow)`) is minimal and does not perform heavy pre-window computation.

Residual note:

- Export and backup writes still occur on demand and can be large, but they are async and user-initiated; no immediate stop-ship issue identified in main-process code quality/perf review.

## Code Quality / Structure Review Highlights

Largest-file scan confirms continued concentration in a few modules:

- `BibliographyManager.tsx` (~`1166` LOC)
- `SectionEditor.tsx` (~`960` LOC)
- `export.ts` (~`909` LOC)
- `academicStore.ts` (~`855` LOC)
- `AcademicSectionEditor.tsx` (~`759` LOC)
- `LongDrafts.tsx` (~`678` LOC)
- `backup.ts` (~`669` LOC)
- `TableOfContents.tsx` (~`652` LOC)
- `longDraftsStore.ts` (~`581` LOC)

Structural concerns observed:

- Mixed responsibilities inside large UI files (data transforms, keyboard handlers, modal flows, render markup, persistence orchestration).
- Duplicated section hierarchy builders in:
  - `muwi/src/components/diaries/long-drafts/TableOfContents.tsx:35`
  - `muwi/src/stores/longDraftsStore.ts:80`
  - `muwi/src/stores/academicStore.ts:141`

## React / Rendering Follow-Up Review Notes

High-impact hotspots identified in source review:

- `AcademicSectionEditor` `onUpdate` performs multiple immediate content scans per editor event (`muwi/src/components/diaries/academic/AcademicSectionEditor.tsx:174`)
- `Academic` recomputes section hierarchy through a store getter during render (`muwi/src/components/diaries/academic/Academic.tsx:203`)
- `TableOfContents` reorder flow rebuilds + flattens hierarchy for drop processing (`muwi/src/components/diaries/long-drafts/TableOfContents.tsx:231`)
- Store section updates in both domains trigger follow-on metadata writes (see findings file for exact refs)

## Refactor Candidates (Prioritized)

1. Autosave + metadata write coalescing layer
- Targets: `muwi/src/stores/longDraftsStore.ts`, `muwi/src/stores/academicStore.ts`
- Goal: batch/throttle section persistence and document metadata updates to reduce DB churn and typing latency risk.

2. Shared hierarchy utilities with indexed implementation
- Targets: `muwi/src/components/diaries/long-drafts/TableOfContents.tsx`, `muwi/src/stores/longDraftsStore.ts`, `muwi/src/stores/academicStore.ts`
- Goal: replace repeated recursive `filter/sort` helpers with a tested shared utility and parent-child index map.

3. Academic reorder query API (transactional)
- Targets: `muwi/src/stores/academicStore.ts`, `muwi/src/db/queries/academic.ts`
- Goal: move reorder loop into a Dexie transaction helper, matching Long Drafts behavior.

4. Academic editor derived-metrics pipeline split
- Targets: `muwi/src/components/diaries/academic/AcademicSectionEditor.tsx`
- Goal: defer heavy derived calculations (headings/figure/table counts) off the typing-critical path.

5. `export.ts` format-specific split + on-demand loaders (carry-forward)
- Targets: `muwi/src/utils/export.ts`
- Goal: improve maintainability and future bundle/perf behavior by separating PDF/DOCX/LaTeX generators and lazy-loading heavy libs.

6. `BibliographyManager.tsx` and `SectionEditor.tsx` subcomponent extraction
- Targets: `muwi/src/components/diaries/academic/BibliographyManager.tsx`, `muwi/src/components/diaries/long-drafts/SectionEditor.tsx`
- Goal: isolate toolbar/modals/forms/list rows/utility transforms for easier profiling and test coverage improvements.

## Findings Index (Day 5)

Detailed entries: `muwi/audit/2026-02/findings/day5-performance-code-quality-findings.md`

- High: `PERF-STORE-001` autosave write amplification across Academic + Long Drafts (remediated in follow-up code change on 2026-02-24)
- Medium: `PERF-ACAD-REORDER-001` sequential academic reorder DB writes (remediated in follow-up code change on 2026-02-24)
- Medium: `PERF-EDITOR-001` academic editor per-keystroke document scans (remediated in follow-up code change on 2026-02-24)
- Medium: `PERF-TOC-001` TOC reorder hierarchy rebuild cost (remediated in follow-up code change on 2026-02-24)
- Medium: `PERF-RENDER-001` academic hierarchy recomputed during render (remediated in follow-up code change on 2026-02-24)
- Medium: `CQ-STRUCT-001` large-file concentration + duplicated hierarchy helpers
- Carry-forward: `PERF-BUNDLE-001` oversized deferred chunks still present

## Pending Day 5 Work (Manual)

- Run `muwi/audit/2026-02/report/day5-manual-react-profiler-checklist.md` and record results in `muwi/audit/2026-02/report/day5-manual-react-profiler-results.md`
- React DevTools Profiler capture for:
  - Long Drafts section editing
  - Academic section editing
  - TOC drag/drop reorder on larger documents
- Memory snapshots for repeated Command Palette open/close and route switching
- Blackboard large-canvas interaction profiling (500+ elements) with FPS observations
