# MUWI Progress (Simple Status)

Last updated: February 17, 2026

## 1) Where we are now

- App development is active and stable.
- Unit tests are passing (`62` files, `240` tests).
- Latest full coverage snapshot: lines `91.03%`, statements `90.37%`, functions `86.24%`, branches `80.26%`.
- Recent focus has been adding reliable tests module by module.
- Blackboard coverage moved from almost none to strong coverage.
- Current execution stage: Phase `2.3` (Global Features).

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
| Test wave 14 | Expanded `citation.ts` branch coverage (fallbacks, DOI edge mapping, BibTeX fallbacks, helper edge cases) | Citation-targeted tests + eslint + full run + coverage rerun |
| Test wave 15 | Expanded `backup.ts` branch/function coverage (web fallback, restore branches, scheduler intervals, error paths, size formatting) | Backup-targeted tests + eslint + full run + coverage rerun |
| Test wave 16 | Expanded branch-heavy Drafts UI tests (`Drafts`, `DraftList`, `DraftEditor`, `StatusBadge`) | Drafts-targeted tests + eslint + full run + coverage rerun |
| Task wave 17 | Added global `usePasteHandler`, integrated it in app root, and expanded shortcut tests (special keys + cleanup) | Hook-targeted tests + app tests + full run + coverage rerun |

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

## 4) Current quality state

- Nothing is broken.
- Test suite is healthy and passing.
- Global coverage threshold (`80%`) is now passing.
- Current status:
  - Lines `91.03%`
  - Statements `90.37%`
  - Functions `86.24%`
  - Branches `80.26%`
- Active work is now focused on feature-stage completion (Phase `2.3` onward), not threshold rescue.

## 5) How tasks are being completed (process)

For each module, we follow the same steady flow:

1. Read the module and list key behaviors.
2. Write focused tests for user-visible behavior and store actions.
3. Run only that module’s tests and fix issues.
4. Run full unit test suite to catch regressions.
5. Run lint for new files.
6. Record progress and move to next module.

## 6) Next steady task list

1. Complete Phase `2.3.4`: apply keyboard shortcuts consistently across diary flows (`Ctrl+N`, `PageUp/PageDown`, heading and formatting combos).
2. Move to Phase `2.4`: passkey + content locking implementation (`useContentLocking`, prompt UI, diary integration).
3. Keep periodic full coverage reruns while feature stages advance to prevent regressions.
