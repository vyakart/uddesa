# MUWI Progress (Simple Status)

Last updated: February 12, 2026

## 1) Where we are now

- App development is active and stable.
- Unit tests are passing (`61` files, `187` tests).
- Latest full coverage snapshot: lines `82.89%`, statements `82.19%`, functions `79.16%`, branches `65.65%`.
- Recent focus has been adding reliable tests module by module.
- Blackboard coverage moved from almost none to strong coverage.

## 2) Completed tasks so far (brief)

| Task | What was done | How it was verified |
| --- | --- | --- |
| Project foundation | Vite + React + TypeScript app structure created and configured | App runs, build/test/lint scripts work |
| Core UI shell | Shared layout, modal, header, context menu, toolbar, shelf and settings flow implemented | Component tests + manual render checks |
| Data layer | Dexie database tables + query modules added for diaries and settings | Query tests for CRUD behavior |
| Diary modules (initial) | Personal Diary, Drafts, Scratchpad core flows implemented | Store tests + component behavior tests |
| Utilities (initial) | Export, backup, and citation utility foundations added | Core utility code reviewed and prepared for direct tests |
| Test wave 1 | Added tests for Drafts + Scratchpad modules and related stores | Full test run green |
| Test wave 2 | Added tests for `ErrorBoundary`, `useKeyboardShortcuts`, `useGlobalShortcuts` | Targeted tests + full run green |
| Test wave 3 | Added tests for Blackboard UI and `blackboardStore` | Targeted tests + full run green |
| Test wave 4 | Added tests for `longDraftsStore` actions, hierarchy/getters/selectors, footnotes, reorder/toggles | Targeted tests + full run green |
| Test wave 5 | Added Long Drafts UI tests for `LongDrafts`, `SectionEditor`, `TableOfContents`, `FootnoteManager`, `FocusMode` | Targeted tests + full run green |
| Test wave 6 | Added Academic tests for `academicStore`, `Academic` container, and `useCitationShortcut` | Targeted tests + full run green |
| Test wave 7 | Expanded Academic component coverage for `AcademicSectionEditor`, `CitationPicker`, and `TemplateSelector` | Targeted tests + full run green |
| Test wave 8 | Added `BibliographyManager` tests (search/select/edit/delete + DOI/BibTeX import flows) | Targeted tests + full run green |
| Test wave 9 | Added utility tests for `citation.ts`, `backup.ts`, and `export.ts` (success/failure and scheduler flows) | Utility-targeted tests + full run green + eslint green |
| Test wave 10 | Re-ran full coverage after utility tests and recorded exact project-wide numbers | Coverage report captured; global threshold failure confirmed with current percentages |
| Test wave 11 | Added panel tests for `BackupPanel` and `ExportPanel` (open/close, success/error, settings/scheduler, export options/timeout close) | Targeted panel tests + eslint + full run + coverage rerun |
| Test wave 12 | Added extension tests for `footnote.ts` (attributes, commands, and click plugin behavior) | Targeted extension tests + eslint + full run + coverage rerun |
| Test wave 13 | Expanded `export.ts` tests across PDF/DOCX routes and long-draft/academic wrappers | Targeted util tests + eslint + full run + coverage rerun |

## 3) Blackboard testing progress

- New tested files:
  - `muwi/src/components/diaries/blackboard/Blackboard.test.tsx`
  - `muwi/src/components/diaries/blackboard/BlackboardToolbar.test.tsx`
  - `muwi/src/components/diaries/blackboard/ExcalidrawWrapper.test.tsx`
  - `muwi/src/components/diaries/blackboard/IndexPanel.test.tsx`
  - `muwi/src/stores/blackboardStore.test.ts`
- Coverage movement:
  - `src/components/diaries/blackboard` lines: `0.00% -> 89.21%`
  - `src/stores/blackboardStore.ts` lines: `10.95% -> 93.15%`

## 4) Important clarification

- Nothing is broken.
- Test suite is healthy and passing.
- Coverage command still exits with error because global threshold is `80%`.
- Current status:
  - Lines `82.89%` (meets threshold)
  - Statements `82.19%` (meets threshold)
  - Functions `79.16%` (still below threshold)
  - Branches `65.65%` (still below threshold)
- Movement after export block:
  - Lines: `78.70% -> 82.89%` (`+4.19`)
  - Statements: `78.24% -> 82.19%` (`+3.95`)
  - Functions: `78.28% -> 79.16%` (`+0.88`)
  - Branches: `61.92% -> 65.65%` (`+3.73`)
- Utility movement:
  - `src/utils/export.ts` lines: `37.50% -> 95.96%`

## 5) How tasks are being completed (process)

For each module, we follow the same steady flow:

1. Read the module and list key behaviors.
2. Write focused tests for user-visible behavior and store actions.
3. Run only that module’s tests and fix issues.
4. Run full unit test suite to catch regressions.
5. Run lint for new files.
6. Record progress and move to next module.

## 6) Next steady task list

1. Focus on branch/function-heavy gaps (`src/components/diaries/drafts/*`, `src/utils/backup.ts`, `src/utils/citation.ts`).
2. Re-run full coverage and track movement in functions/branches specifically.
3. Update this document after each completed block.
