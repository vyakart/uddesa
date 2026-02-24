# Day 5 Manual React DevTools Profiling Checklist (Academic + TOC)

Date: 2026-02-24
Purpose: Close the remaining Day 5 runtime evidence gap with component-level React Profiler captures and screenshots.

## Scope

- `Academic` route render/update behavior
- Academic section editing (post-`PERF-EDITOR-001`)
- Long Drafts TOC drag/drop reorder flow (post-`PERF-TOC-001`)

## Setup

1. Start the renderer in a browser-friendly mode:
   - `cd muwi`
   - `npm run dev`
2. Open the local URL shown by Vite in Chromium/Chrome with the React DevTools extension enabled.
3. Open React DevTools and switch to `Profiler`.
4. Ensure DevTools recording settings include:
   - `Record why each component rendered` (if available)
   - CPU throttling: `Off` for first pass (optional second pass at 4x slowdown)

## Evidence Output Locations

- Screenshots: `muwi/audit/2026-02/screenshots/`
- Profiler export JSONs (if exported): `muwi/audit/2026-02/outputs/`
- Results summary: `muwi/audit/2026-02/report/day5-manual-react-profiler-results.md`

Suggested filenames:

- `day5-react-profiler-academic-panel-toggle.png`
- `day5-react-profiler-academic-typing.png`
- `day5-react-profiler-toc-reorder.png`
- `day5-react-profiler-academic-panel-toggle.json`
- `day5-react-profiler-academic-typing.json`
- `day5-react-profiler-toc-reorder.json`

## Scenario A: Academic Panel Toggle (Validate `PERF-RENDER-001`)

Goal:
- Confirm unrelated panel state changes do not trigger expensive outline recomputation work in `Academic`.

Steps:

1. Load a paper with multiple sections (prefer `10+` sections if available).
2. Start a React Profiler recording.
3. Toggle right panel states:
   - Bibliography open/close
   - Reference Library open/close
   - Repeat `5-10` times
4. Stop recording.

Capture:

1. Screenshot of flamegraph/ranked view for the toggle sequence.
2. Screenshot (or note) showing whether `Academic` re-renders and the render reasons.
3. Export profiler session JSON (optional but preferred).

What to look for:

- `Academic` should still re-render for panel-state changes, but expensive hierarchy work should not dominate commits.
- Reduced time spent in outline/structure derivation compared with pre-fix expectations.

## Scenario B: Academic Typing / Metrics Updates (Validate `PERF-EDITOR-001`)

Goal:
- Confirm typing commits are smoother and full metrics scans are no longer on every keystroke.

Steps:

1. Open an existing Academic section with enough content (or paste a medium block of text).
2. Start React Profiler recording.
3. Type continuously for `5-10` seconds.
4. Pause for ~`1s` to allow debounced metrics/save updates.
5. Stop recording.

Capture:

1. Screenshot of flamegraph for typing commits.
2. Screenshot of commits immediately after typing pause (debounced updates).
3. Export profiler session JSON (optional).

What to look for:

- Many lightweight typing commits instead of heavy per-keystroke content parsing.
- Debounced work clustering after pauses (metrics/save callbacks).
- No obvious long commit spikes tied to `AcademicSectionEditor` on each keypress.

## Scenario C: Long Drafts TOC Drag/Drop Reorder (Validate `PERF-TOC-001`)

Goal:
- Confirm TOC reorder commits are not dominated by repeated hierarchy rebuild work.

Steps:

1. Open Long Drafts with a document containing nested sections (prefer `20+` sections, multiple levels).
2. Expand relevant branches.
3. Start React Profiler recording.
4. Perform `5-10` drag/drop reorders among siblings.
5. Stop recording.

Capture:

1. Screenshot of flamegraph/ranked view for reorder commits.
2. Screenshot of component list highlighting `TableOfContents` / `TOCSectionItem` commit cost.
3. Export profiler session JSON (optional).

What to look for:

- `TableOfContents` may re-render, but commit durations should remain reasonable.
- No repeated heavy hierarchy rebuild signatures dominating each drop commit.

## Optional Memory / Heap Spot Checks (Chrome DevTools)

1. Open Chrome DevTools `Memory` panel.
2. Take heap snapshot before and after:
   - `20` Academic panel toggles
   - `20` TOC drag/drop operations
3. Record notable retained objects (if any).

## Pass / Fail Guidance (Day 5 Closure)

- `Pass`:
  - No obvious heavy commit spikes caused by the remediated hotspots.
  - Commit durations remain stable across repeated interactions.
  - No visible renderer degradation during Academic typing or TOC reorders.
- `Needs follow-up`:
  - `Academic` panel toggles still show expensive `Academic` work unrelated to visible changes.
  - TOC reorders show large commit spikes dominated by TOC tree recalculation.
  - Typing commits remain heavy on every keystroke.

## Notes

- This checklist validates the Day 5 code changes for:
  - `PERF-EDITOR-001`
  - `PERF-TOC-001`
  - `PERF-RENDER-001`
- If anomalies are found, link profiler screenshots/JSONs in the findings entries and reopen the relevant item(s).
