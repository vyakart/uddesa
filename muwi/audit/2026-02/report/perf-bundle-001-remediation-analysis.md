# PERF-BUNDLE-001 Bundle Size Remediation Analysis (Day 2)

## Remediation Status Update (Post-Fix Implementation)

- Update date: 2026-02-23
- Status: `Partially mitigated`
- Validation evidence:
  - `muwi/audit/2026-02/outputs/fix-validation-3-build.txt`
  - `muwi/audit/2026-02/outputs/fix-validation-3-build-artifacts.txt`

### Implemented Changes

- Academic:
  - Lazy-loaded `BibliographyManager`, `ReferenceLibraryPanel`, `TemplateSelector`
  - Split citation-related code into dedicated chunks (`academic-citation`, `academic-reference-tools`, `academic-template-selector`)
- Blackboard:
  - Lazy-loaded `ExcalidrawWrapper`
  - Split deferred Excalidraw stack into `blackboard-excalidraw-wrapper` + `blackboard-excalidraw-vendor`

### Measured Impact (Current)

- `diary-academic-*`
  - Day 1 baseline: ~`3,969,928` bytes
  - Current: ~`1,136,790` bytes
  - Delta: about `-2.83 MB`
- `diary-blackboard-*`
  - Pre-blackboard-split build: ~`1,137,949` bytes
  - Current: ~`10,546` bytes
  - Delta: about `-1.13 MB` from route chunk (payload deferred)
- New deferred Blackboard vendor chunk:
  - `blackboard-excalidraw-vendor-*`: ~`7,521,007` bytes

### Remaining Issue

- Initial route chunks are much smaller, but deferred Blackboard vendor payload remains very large and still triggers bundle warnings.
- Further work should focus on splitting/deferring Mermaid/diagram support from core Excalidraw usage where possible.

## Baseline Evidence (Day 1 Build)

From `muwi/audit/2026-02/outputs/day1-build.txt` and `muwi/audit/2026-02/outputs/day1-build-artifacts.txt`:

- `dist/assets/diary-academic-UeK10TUh.js` ≈ `3,969,928` bytes
- `dist/assets/subset-shared.chunk-lRIfjqMm.js` ≈ `1,820,546` bytes
- `dist/assets/flowchart-elk-definition-6af322e1-CeimiMre.js` ≈ `1,451,589` bytes
- `dist/assets/diary-blackboard-C6wv-VLi.js` ≈ `1,137,350` bytes
- `dist/assets/mindmap-definition-8da855dc-BPpDVvop.js` ≈ `541,913` bytes

Vite warning confirms multiple chunks exceed 500 kB after minification.

## What Is Already Good

### Route-Level Lazy Loading Is Already Implemented
- Diary routes are `React.lazy(...)` loaded in `muwi/src/App.tsx:17` through `muwi/src/App.tsx:45`
- Route render is wrapped in `Suspense` (`muwi/src/App.tsx:239`)

### Route-Oriented Manual Chunking Exists
- Diary-specific `manualChunks` are configured in `muwi/vite.config.ts:10` through `muwi/vite.config.ts:36`
- HTML module preload excludes `diary-*` chunks (`muwi/vite.config.ts:89` through `muwi/vite.config.ts:97`)

This means `PERF-BUNDLE-001` is not a “missing lazy loading” problem at the route layer. The remaining issue is heavy dependencies inside already-lazy route chunks.

## Root Cause Analysis (Likely Contributors)

## 1. Blackboard Route Pulls In Excalidraw + Mermaid/ELK/Katex Stack

Evidence:
- `muwi/src/components/diaries/blackboard/ExcalidrawWrapper.tsx:2` imports `@excalidraw/excalidraw`
- `muwi/src/components/diaries/blackboard/ExcalidrawWrapper.tsx:7` imports Excalidraw CSS
- Build outputs contain many Mermaid/diagram-related chunks (`flowchart-elk-definition`, `mindmap-definition`, `katex`, multiple locale chunks)
- Security triage also flags runtime vulnerability chain through `@excalidraw/mermaid-to-excalidraw` (see `SEC-DEPS-001`)

Impact:
- Blackboard route is lazy, but opening it still downloads a very heavy dependency graph.
- Mermaid/diagram conversion support appears to drive many large ancillary chunks.

## 2. Academic Route Eagerly Imports Large Subfeatures

Evidence:
- `muwi/src/components/diaries/academic/Academic.tsx:22` imports `AcademicSectionEditor`
- `muwi/src/components/diaries/academic/Academic.tsx:23` imports `BibliographyManager`
- `muwi/src/components/diaries/academic/Academic.tsx:24` imports `ReferenceLibraryPanel`
- `muwi/src/components/diaries/academic/Academic.tsx:25` imports `TemplateSelector`
- `muwi/src/components/diaries/academic/BibliographyManager.tsx:8` imports `@/utils/citation`
- `muwi/src/utils/citation.ts:1` and `muwi/src/utils/citation.ts:2` import `citation-js` and `citeproc`

Impact:
- Academic route loads editor + bibliography/reference tooling up front, even if the user only edits text and never opens bibliography/reference panels.

## 3. Heavy Editor Stacks (TipTap) Are Embedded in Route Chunks

Evidence:
- `muwi/src/components/diaries/academic/AcademicSectionEditor.tsx:2` imports `@tiptap/react` and extensions
- `muwi/src/components/diaries/long-drafts/SectionEditor.tsx:2` imports `@tiptap/react` and extensions
- `muwi/src/components/diaries/drafts/DraftEditor.tsx:2` imports `@tiptap/react` and extensions

Impact:
- Expected for editing features, but still a key reason route chunks remain large.
- Academic route is impacted more due combining TipTap with citation/reference features.

## Confirmed Non-Issue (Current Build)

- `BackupPanel` appears unused in production callsites and its strings were not found in emitted JS/CSS bundles during the audit check.
- `ExportPanel` UI strings were not found in emitted diary/shared chunks during the audit check.

Conclusion:
- Current `PERF-BUNDLE-001` is primarily driven by active route features (Academic and Blackboard), not dead code from backup/export panels.

## Recommended Remediation Plan (Ordered)

## Phase A (High Impact / Lower Risk)

### A1. Lazy-load Academic right-panel features on demand
Candidates:
- `BibliographyManager`
- `ReferenceLibraryPanel`
- `TemplateSelector` (modal only)

Why:
- These are not needed for the initial Academic route shell or basic section editing.
- `BibliographyManager` pulls citation formatting/parsing utilities through `@/utils/citation`.

Implementation direction:
- Use `React.lazy` for these components within `Academic.tsx`.
- Render with `Suspense` only when corresponding panel/modal is opened.

### A2. Split citation utilities from core Academic editor path
Candidates:
- `citation-js`
- `citeproc`

Why:
- Bibliography and citation formatting/import flows are feature-specific.
- They should not block initial academic editor load.

Implementation direction:
- Move `@/utils/citation` heavy imports behind async helper functions or dedicated lazily imported modules.
- Keep lightweight types and UI state logic in the base Academic chunk.

### A3. Add manual chunks for Excalidraw/Mermaid subgraph
Why:
- `Blackboard` is already route-split, but its dependency graph is still monolithic/heavy in practice.
- Explicit vendor chunk boundaries can make follow-up lazy loading and cache behavior clearer.

Implementation direction (example targets):
- `excalidraw-vendor`
- `mermaid-vendor`
- `elk-vendor` / `katex-vendor` (if resolvable via package IDs)

Note:
- This alone may not reduce total transferred bytes for Blackboard, but it can improve cacheability and isolate heavy optional subsystems.

## Phase B (High Impact / Medium Risk)

### B1. Lazy-load ExcalidrawWrapper (or Excalidraw itself) inside Blackboard route
Why:
- Blackboard shell (toolbar/sidebar/list/navigation) can render before full Excalidraw payload is available.
- Useful if users switch into Blackboard but do not immediately interact with the canvas.

Implementation direction:
- Wrap `ExcalidrawWrapper` in `React.lazy` with a canvas loading placeholder.
- Consider deferring Excalidraw import until a canvas is selected/opened.

### B2. Evaluate disabling or deferring Mermaid support in Excalidraw path
Why:
- Build output shows many Mermaid/diagram chunks and `flowchart-elk`/`mindmap` artifacts.
- Security triage indicates runtime vuln chain through `@excalidraw/mermaid-to-excalidraw`.

Implementation direction:
- Check Excalidraw integration options for disabling Mermaid conversion if not required in MVP.
- If feature is required, consider loading Mermaid conversion tools only when importing Mermaid diagrams.

## Phase C (Optimization / Cleanup)

### C1. Format-specific export splitting (future-proof)
Why:
- `muwi/src/utils/export.ts` is large (~909 LOC), imports `jspdf` and `docx`.
- If/when `ExportPanel` is mounted in production flows, this is a likely future bundle hotspot.

Implementation direction:
- Split `export.ts` into `export-pdf.ts`, `export-docx.ts`, `export-tex.ts`, and a thin dispatcher.
- Dynamically import the selected format generator in export action handlers.

## Suggested Success Metrics (for Re-test)

After Phase A/B changes:
- Rebuild and compare top 10 emitted assets against `muwi/audit/2026-02/outputs/day1-build-artifacts.txt`
- Track:
  - `diary-academic-*` size delta
  - `diary-blackboard-*` size delta
  - count of chunks > 500 kB
  - first-open latency for Academic and Blackboard routes (`muwi/e2e/performance-baseline.spec.ts`)

## Cross-Link to Security Triage

Bundle/perf and security priorities overlap in the Blackboard/Excalidraw stack:
- Runtime vulnerability chain includes `@excalidraw/excalidraw` and `@excalidraw/mermaid-to-excalidraw`
- Splitting or deferring Mermaid-related features may improve both performance and security risk containment
