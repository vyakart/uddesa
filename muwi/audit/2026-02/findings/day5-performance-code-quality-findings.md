# Day 5 Performance + Code Quality Findings (2026-02-24)

## Status Legend

- `Open`: identified during Day 5 review, no remediation implemented yet.
- `Carry-forward`: existing known issue revalidated during Day 5 evidence capture.

### PERF-STORE-001 Autosave Paths Trigger Metadata Write Amplification on Every Section Update
- Status: `Remediated` (2026-02-24 follow-up)
- Area: Performance / Data Layer / Editor Runtime
- Severity: High
- Files: `muwi/src/stores/longDraftsStore.ts:314`, `muwi/src/stores/longDraftsStore.ts:528`, `muwi/src/stores/academicStore.ts:392`, `muwi/src/stores/academicStore.ts:779`, `muwi/src/components/diaries/long-drafts/SectionEditor.tsx:256`, `muwi/src/components/diaries/academic/AcademicSectionEditor.tsx:174`
- Summary: Both editors debounce content saves, but each save still performs a section write followed by a document/paper metadata write, increasing IndexedDB churn on primary typing flows.
- Evidence:
  - `SectionEditor` and `AcademicSectionEditor` autosave content after 500ms (`onUpdate`)
  - `updateSection()` in both stores calls `update*Metadata()` after section persistence
  - `update*Metadata()` calls `updateLongDraft()` / `updatePaper()` (additional DB write)
- Impact:
  - Each autosave pause causes at least two async DB writes instead of one.
  - The pattern also applies to non-content section updates (title/status/notes/footnotes), amplifying write volume.
- Recommended Fix:
  - Coalesce metadata updates (throttle or batch per document/paper).
  - Avoid immediate metadata writes for every section mutation; compute totals lazily or on idle.
  - Consider transaction/batched mutation APIs for section+metadata updates.
- Remediation Notes:
  - `updateSection()` in `longDraftsStore` and `academicStore` now schedules trailing metadata syncs (300ms debounce) instead of awaiting immediate metadata writes for every section update.
  - Direct `updateDocumentMetadata()` / `updatePaperMetadata()` calls cancel pending timers for the same entity to preserve explicit-call semantics.
  - Added scheduler reset helpers for deterministic unit tests.
  - Validation: `muwi/audit/2026-02/outputs/day5-perf-store-001-targeted-tests.txt` (`22` tests passed across both store suites).

### PERF-ACAD-REORDER-001 Academic Section Reordering Uses Sequential Per-Item IndexedDB Writes
- Status: `Remediated` (2026-02-24 follow-up)
- Area: Performance / Data Layer / Academic
- Severity: Medium
- Files: `muwi/src/stores/academicStore.ts:469`, `muwi/src/db/queries/academic.ts:51`, `muwi/src/db/queries/longDrafts.ts:93`
- Summary: Academic reordering updates section order with a per-section awaited loop in the store, unlike Long Drafts which uses a dedicated transactional query helper.
- Evidence:
  - `academicStore.reorderSections()` loops `await academicQueries.updateAcademicSection(...)` for each ID
  - `longDraftsQueries.reorderSections()` wraps updates in `db.transaction(...)`
- Impact:
  - Reordering large academic outlines scales linearly in round-trips and can feel sluggish.
  - No transaction boundary increases partial-update risk if an operation fails mid-loop.
- Recommended Fix:
  - Add `academicQueries.reorderSections(paperId, sectionIds)` with Dexie transaction semantics.
  - Reuse the Long Drafts reorder approach and keep the store focused on orchestration only.
- Remediation Notes:
  - Added `reorderAcademicSections(paperId, sectionIds)` query helper with Dexie transaction over `academicSections` + `academicPapers`.
  - `academicStore.reorderSections()` now calls the transactional query helper instead of awaiting `updateAcademicSection()` in a loop.
  - Query helper also updates `academicPapers.sectionIds` ordering and `modifiedAt`.
  - Validation: `muwi/audit/2026-02/outputs/day5-perf-acad-reorder-001-targeted-tests.txt` (`16` tests passed across query + store suites).

### PERF-EDITOR-001 Academic Editor Performs Multiple Full-Document Scans on Every Keystroke
- Status: `Remediated` (2026-02-24 follow-up)
- Area: Performance / React / Editor Runtime
- Severity: Medium
- Files: `muwi/src/components/diaries/academic/AcademicSectionEditor.tsx:174`
- Summary: `AcademicSectionEditor` recomputes word count, figure count, table count, and heading references on every editor update before the save debounce, causing avoidable CPU work during typing.
- Evidence:
  - `onUpdate` calls `editor.getHTML()` and `editor.getText()`
  - Immediate recomputation via `getHighestNumber(...)` (twice) and `extractHeadingReferences(...)`
  - Debounce only delays persistence, not these content scans
- Impact:
  - Larger sections will incur repeated regex/string scans on each edit event.
  - UI responsiveness risk increases in the Day 5 “long draft/academic” scenarios.
- Recommended Fix:
  - Throttle/defer derived metrics computation (e.g., `requestIdleCallback`, debounce, or transition).
  - Split “typing-critical” work from “derived metrics” work.
  - Recompute heading/figure/table metadata only when relevant commands or idle windows occur.
- Remediation Notes:
  - `AcademicSectionEditor` now debounces derived metrics recomputation (`wordCount`, `figureCount`, `tableCount`, `headingReferences`) instead of running full `getHTML/getText` scans on every editor update event.
  - Save payload HTML is now read inside the save debounce callback, removing per-keystroke HTML serialization from the hot path.
  - Added cleanup for the new metrics timer on unmount.
  - Validation: `muwi/audit/2026-02/outputs/day5-perf-editor-001-targeted-tests.txt` (`5` tests passed).

### PERF-TOC-001 TOC Drag/Drop Rebuilds Recursive Hierarchies with Repeated Filter/Sort Passes
- Status: `Remediated` (2026-02-24 follow-up)
- Area: Performance / React / Long Drafts TOC
- Severity: Medium
- Files: `muwi/src/components/diaries/long-drafts/TableOfContents.tsx:35`, `muwi/src/components/diaries/long-drafts/TableOfContents.tsx:195`, `muwi/src/components/diaries/long-drafts/TableOfContents.tsx:231`
- Summary: The TOC drag/drop path rebuilds and flattens a recursive hierarchy using helper functions that repeatedly `filter` and `sort`, which becomes increasingly expensive as section counts grow.
- Evidence:
  - `buildSectionHierarchy()` recursively filters/sorts the full section list at each depth
  - `handleDropOnSection()` computes `allSectionIds = flattenSectionHierarchy(buildSectionHierarchy(normalizedSections))`
- Impact:
  - Drag/drop reorder cost grows quickly with nested documents.
  - Day 5 manual scenario for 20+ sections is likely to expose this path.
- Recommended Fix:
  - Build a parent->children index map once per sections snapshot.
  - Reuse a shared, optimized hierarchy utility across store/component paths.
  - Avoid rebuilding full hierarchy during reorder when only sibling order changes.
- Remediation Notes:
  - `TableOfContents` now builds a parent-indexed children map and uses it for hierarchy rendering instead of recursive `filter/sort` passes on the full section array.
  - Reorder path now flattens IDs directly from a parent-indexed structure (`flattenSectionsByHierarchyOrder(normalizedSections)`) instead of `buildSectionHierarchy(...)` + `flattenSectionHierarchy(...)`.
  - Validation: `muwi/audit/2026-02/outputs/day5-perf-toc-001-targeted-tests.txt` (`5` tests passed).

### PERF-RENDER-001 Academic Screen Recomputes Section Hierarchy via Store Getter on Every Render
- Status: `Remediated` (2026-02-24 follow-up)
- Area: Performance / React Rendering / Academic
- Severity: Medium
- Files: `muwi/src/components/diaries/academic/Academic.tsx:203`, `muwi/src/stores/academicStore.ts:753`, `muwi/src/stores/academicStore.ts:141`
- Summary: `Academic` calls the store getter `getSectionHierarchy(currentPaperId)` directly during render, and the getter rebuilds the recursive hierarchy each time.
- Evidence:
  - `Academic.tsx` computes `sectionHierarchy` without `useMemo`
  - Store getter delegates to recursive `buildSectionHierarchy(...)`
- Impact:
  - Non-outline UI updates (toolbar state, panel toggles, typing side effects) can still trigger hierarchy recomputation.
  - Increases render cost for academic papers with many sections/subsections.
- Recommended Fix:
  - Move hierarchy derivation to memoized selectors keyed by the current sections array.
  - Or compute in component `useMemo` from `currentSections`.
- Remediation Notes:
  - `Academic` now memoizes `sectionHierarchy` on `currentPaperId` + `currentSections`, preventing repeated `getSectionHierarchy()` execution on unrelated renders (e.g., `appStore` panel state changes).
  - `structureRows` derivation was also memoized on `currentSections` to avoid repeated template matching scans during unrelated renders.
  - Added regression test asserting no extra hierarchy recomputation on unrelated `appStore` re-render.
  - Validation: `muwi/audit/2026-02/outputs/day5-perf-render-001-targeted-tests.txt` (`6` tests passed).

### CQ-STRUCT-001 Large File Concentration and Duplicate Hierarchy Helpers Increase Maintenance Risk
- Status: `Open`
- Area: Code Quality / Structure / DRY
- Severity: Medium
- Files: `muwi/src/components/diaries/academic/BibliographyManager.tsx:1`, `muwi/src/components/diaries/long-drafts/SectionEditor.tsx:1`, `muwi/src/utils/export.ts:1`, `muwi/src/stores/academicStore.ts:1`, `muwi/src/components/diaries/long-drafts/TableOfContents.tsx:35`, `muwi/src/stores/longDraftsStore.ts:80`, `muwi/src/stores/academicStore.ts:141`
- Summary: Several core files remain far above the plan’s 300-line heuristic and duplicate hierarchy-building logic across component/store layers, making performance fixes and behavior changes harder to apply consistently.
- Evidence:
  - Largest-file scan: `muwi/audit/2026-02/outputs/day5-largest-files.txt`
  - Duplicate hierarchy helper scan: `muwi/audit/2026-02/outputs/day5-hierarchy-helper-scan.txt`
- Impact:
  - Increases regression risk when changing outline ordering/hierarchy behavior.
  - Slows targeted performance tuning because logic is split across multiple implementations.
- Recommended Fix:
  - Extract shared hierarchy utilities (build/flatten/indexing) with tests.
  - Split monolithic files by feature slices (data transforms, dialogs, toolbar/actions, persistence adapters).

## Carry-Forward (Revalidated Day 5)

### PERF-BUNDLE-001 Oversized Deferred Bundles Still Exceed Chunk Warning Thresholds
- Status: `Carry-forward`
- Area: Performance / Bundle Size
- Severity: Medium
- Files: `muwi/audit/2026-02/outputs/day5-build.txt`, `muwi/audit/2026-02/outputs/day5-build-artifacts.txt`
- Summary: Day 5 build confirms large chunk warnings persist, primarily in deferred Blackboard/Academic vendor chunks.
- Evidence:
  - `blackboard-excalidraw-core-*.js` ~`4.08 MB`
  - `blackboard-mermaid-vendor-*.js` ~`3.13 MB`
  - `academic-citation-*.js` ~`2.65 MB`
  - `diary-academic-*.js` ~`1.14 MB`
- Recommended Fix:
  - Continue Phase B/C work from `muwi/audit/2026-02/report/perf-bundle-001-remediation-analysis.md`.
