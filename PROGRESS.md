# MUWI Progress (Simple Status)

Last updated: February 17, 2026

## 1) Where we are now

- App development is active and stable.
- Unit tests are passing (`67` files, `276` tests).
- Latest full coverage snapshot: lines `90.82%`, statements `90.22%`, functions `86.44%`, branches `80.07%`.
- Recent focus has been adding reliable tests module by module.
- Blackboard coverage moved from almost none to strong coverage.
- Current execution stage: Phase `4.4.1` (Long Drafts container assembly).

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
| Task wave 18 | Added shared editor formatting/heading shortcuts, added Personal Diary keyboard navigation/new-entry shortcuts, and resolved Academic shortcut conflict with editor focus | Editor/hook-targeted tests + diary shortcut tests + full run + coverage rerun |
| Task wave 19 | Added PBKDF2-based passkey utilities (`hashPasskey`, `verifyPasskey`, `generateSalt`, hex helpers) and wired settings passkey flows to use hashed+salted values | Crypto utility tests + settings/panel passkey tests + full run + coverage rerun |
| Task wave 20 | Added `useContentLocking` with `isLocked`, `lock`, `unlock`, `toggleLock`, and DB-backed lock refresh flow | Hook tests for lock/unlock/toggle + full run + coverage rerun |
| Task wave 21 | Added shared `PasskeyPrompt` modal component with passkey input, show/hide toggle, hint reveal button, submit/cancel actions, and inline/external error rendering | Component tests + targeted eslint + full run green |
| Task wave 22 | Added lock/unlock actions to Draft and Long Draft section context menus, passkey-setup prompting, unlock modal flow, and fixed a race in `useContentLocking.unlock` by checking DB lock state before passkey validation | Context-menu integration tests + hook regression test + targeted eslint + full run green |
| Task wave 23 | Integrated locking across Scratchpad pages/text blocks and Personal Diary entries, added store lock-update actions, enforced read-only behavior for locked content, and added per-diary unlock passkey flows | Scratchpad/PersonalDiary component+store tests + targeted eslint + full run green |
| Task wave 24 | Verified existing Excalidraw integration coverage against `3.1.1` acceptance criteria and marked task complete without redundant reimplementation | Codebase audit (`package.json`, `ExcalidrawWrapper`, blackboard tests) |
| Task wave 25 | Verified `blackboardStore` already satisfied `3.1.2` criteria (canvas/elements+viewport state, load/save/update actions, and derived index entries) and marked task complete | Store code + unit test audit (`blackboardStore.ts`, `blackboardStore.test.ts`) |
| Task wave 26 | Completed `3.1.3` viewport persistence by wiring Excalidraw `onChange` app state to `updateViewport`, loading persisted viewport into `initialData`, and extending wrapper tests | Blackboard wrapper tests + targeted eslint + full run green |
| Task wave 27 | Completed `3.2.1` click navigation from index to canvas by wiring IndexPanel navigation targets through Blackboard to Excalidraw viewport updates, with navigation lifecycle tests | Blackboard component+wrapper tests + targeted eslint + full run green |
| Task wave 28 | Verified heading detection/index derivation logic already covered `3.2.2` criteria (`#`/`##`/`###` parsing, level-based hierarchy representation, y-position sorting, and rebuild on element changes) | Store + component/test audit (`blackboardStore.ts`, `Blackboard.tsx`, `blackboardStore.test.ts`) |
| Task wave 29 | Completed `3.3.1` by adding Blackboard tool selection buttons, stroke color picker, stroke width selector, and retaining grid toggle behavior with test coverage | Blackboard toolbar tests + targeted eslint + full run green |
| Task wave 30 | Verified `3.3.2` Blackboard container criteria remained satisfied after navigation/toolbar changes (load on mount, full-height layout, toolbar/index behavior, save-on-change path) | Container + integration test audit (`Blackboard.tsx`, `Blackboard.test.tsx`) |
| Task wave 31 | Completed `3.4.1` font bundling by installing `@fontsource` packages (`Inter`, `Crimson Pro`, `Caveat`, `JetBrains Mono`) and importing them in global styles | Dependency + CSS import audit, targeted tests, full run green |
| Task wave 32 | Completed `3.4.2` by adding shared `FontSelector` (select + context-menu variants), wiring Blackboard toolbar font selection, and extending settings/defaults with `defaultFont` | New component tests + Blackboard toolbar tests + targeted eslint + full run green |
| Task wave 33 | Completed `3.4.3` by adding Blackboard right-click font context menu and integrating selected-font application/persistence in `ExcalidrawWrapper` for selected text/new text defaults | Blackboard integration tests + wrapper tests + targeted eslint + full run green |
| Task wave 34 | Completed `4.1.1` Long Drafts store acceptance by validating document/current-document state, nested section handling, and section CRUD/reorder actions against existing store implementation | `vitest src/stores/longDraftsStore.test.ts` (9 tests passing) |
| Task wave 35 | Completed `4.1.2` TableOfContents acceptance by validating auto-generated nested hierarchy, click navigation, per-section/total word counts, and adding sibling drag-and-drop reorder wired to store persistence | Long Drafts targeted sweep: `vitest src/components/diaries/long-drafts src/stores/longDraftsStore.test.ts` (32 tests passing) |
| Task wave 36 | Completed `4.1.3` SectionEditor acceptance by validating title + TipTap body editing, status updates, notes panel editing, and enabling integrated footnote insertion/management UI in-editor | Full run green: `vitest` (`67` files, `275` tests) |
| Task wave 37 | Completed `4.2.1` Footnote extension acceptance by adding marker/content attributes, auto-marker insertion, bottom footnote rendering in-editor, and click routing between markers and footnote list entries | Extension + Long Drafts sweep: `vitest src/extensions/footnote.test.ts src/components/diaries/long-drafts src/stores/longDraftsStore.test.ts` (36 tests passing) |
| Task wave 38 | Completed `4.2.2` FootnoteManager acceptance by validating list rendering, inline editing, deletion, and navigation-to-text flows, and wiring manager interactions through `SectionEditor` footnote panel actions | Component + integration tests (`FootnoteManager.test.tsx`, `SectionEditor.test.tsx`) + full run green |
| Task wave 39 | Completed `4.3.1` FocusMode acceptance by adding full-screen distraction-free overlay behavior, keyboard toggles (`Esc`, `F11`, `Cmd/Ctrl+Shift+F`), typewriter centering in focus editor scroll, and smooth overlay transitions | Long Drafts targeted tests + full run green: `vitest --run` (`67` files, `276` tests) |

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
  - Lines `90.82%`
  - Statements `90.22%`
  - Functions `86.44%`
  - Branches `80.07%`
- Active work is now focused on feature-stage completion (Phase `3.x` onward), not threshold rescue.

## 5) How tasks are being completed (process)

For each module, we follow the same steady flow:

1. Read the module and list key behaviors.
2. Write focused tests for user-visible behavior and store actions.
3. Run only that module’s tests and fix issues.
4. Run full unit test suite to catch regressions.
5. Run lint for new files.
6. Record progress and move to next module.

## 6) Next steady task list

1. Implement Phase `4.4.1`: create LongDrafts container.
2. Keep periodic full coverage reruns while feature stages advance to prevent regressions.
