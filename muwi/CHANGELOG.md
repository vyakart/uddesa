# Changelog

## Changelog Policy

- Source: generated from git history with `npm run changelog:write` (`muwi/scripts/release/generate-changelog.mjs`)
- Format: category sections derived from Conventional Commit-style prefixes (`feat`, `fix`, `docs`, `test`, etc.)
- Manual curation: allowed and expected for release notes quality (reword entries, merge duplicates, add context)
- Non-conventional commit messages are placed under `Other Changes`
- Recommended release workflow:
  1. Update version in `muwi/package.json`
  2. Run `npm run changelog:write`
  3. Review/edit the top release section
  4. Commit version + changelog together

## [0.0.0] - 2026-02-24

### Features

- add distribution and release automation for Phase 7 (a8fafec)
- complete Phase 7 distribution and release automation (25db7af)
- implement responsive behavior for DiaryLayout and add associated tests (96adb32)
- enhance accessibility compliance across components and implement automated tests for keyboard navigation and screen reader support (99d62d8)
- enhance accessibility and keyboard navigation in CommandPalette and SettingsPanel (6d5df95)
- enhance SectionEditor with a formatting toolbar and improve TableOfContents component (4621266)
- tokenize hard-coded colors in test files; enhance consistency and maintainability across Blackboard and CategoryPicker tests (83ec5fc)
- complete tokenization of hard-coded colors in various components; enhance styling consistency across the application (4d6b79e)
- refactor Toast context and provider structure; separate context logic into ToastContext and useToast hook for improved clarity and maintainability (8319653)
- update PersonalDiary component to implement warm canvas and typographic constraints, enhance sidebar with month/year grouping, and improve entry navigation with mood indicators (87e795b)
- update PersonalDiary component to implement date-grouped sidebar, enhance toolbar and status display, and improve loading/error handling (4daea69)
- update Blackboard component with empty state guidance, enhance canvas styling, and improve status display (0b519c2)
- update Blackboard component to enhance canvas token handling, improve default styles, and refine app state management (9c241aa)
- update Blackboard components with toolbar enhancements, index styling, and improved test coverage (78ab403)
- update Blackboard component to enhance layout with sidebar, status, and right panel, and improve loading/error handling (387e157)
- update progress and tasks documentation for Scratchpad UI migration and component refactoring (118c3b7)
- add command palette functionality with shortcuts (25404e1)
- update SettingsPanel to use shared FormControls components and enhance modal styling (1b93f0e)
- implement Toast component with context provider, auto-dismiss functionality, and styling (b8fde7d)
- enhance Toolbar component with improved styling, icon support, and accessibility features (7dc4dac)
- enhance ContextMenu component with improved keyboard navigation, item states, and styling (1773e76)
- enhance Modal component with close button, focus management, and updated styles (462bc0d)
- implement FormControls component with Input, Select, and Toggle, including tests and styles (bd3b1e5)
- implement Button component with styles and tests (96a38d8)
- normalize import paths for PersonalDiary component and remove duplicate index file (67063bc)
- Refactor and implement shell UI components for MUWI (1161391)
- add theme switching functionality and update styles (c725dfb)
- implement auto-backup functionality with max backups retention policy and enhance BackupPanel with last backup timestamp (dbac9fa)
- update backup utilities with enhanced validation and required table checks (ba3661a)
- implement backup utilities and enhance export features (9882ecf)
- enhance AcademicSectionEditor with figure/table numbering and cross-references (58fbfe2)
- implement ReferenceLibraryPanel for managing references, including import/export functionality and linking to papers (df90c85)
- enhance BibliographyManager with tag organization, filtering, and input handling for tags (1767dfa)
- update progress documentation, enhance citation functionality, and improve citation shortcut handling in AcademicSectionEditor (c713937)
- update ESLint configuration to ignore coverage directory and enhance longDraftsStore tests with type safety (0dc5a67)
- update citation utilities to enhance citation formatting, integrate CitationPicker component, and improve testing coverage (332f884)
- implement citation utilities with citeproc integration, add citation styles, and enhance testing coverage (4c6fb21)
- update progress documentation, enhance LongDrafts component with metadata display, and add integration tests for document flow (846aca0)
- update progress documentation, enhance focus mode functionality, and improve SectionEditor tests (306ecc1)
- Update progress documentation and implement footnote features (e634f4d)
- implement content locking feature for text blocks with passkey prompt (940a5fc)
- implement usePasteHandler hook and integrate with App component; add tests for paste handling and keyboard shortcuts (478a3a3)
- add MUWI progress documentation with testing updates and task lists (04c1a4e)
- add unit tests for Blackboard, BlackboardToolbar, ExcalidrawWrapper, IndexPanel, and blackboardStore (152dee8)
- add unit tests for ErrorBoundary, useGlobalShortcuts, and useKeyboardShortcuts hooks (4ba73b5)
- complete foundation components and shelf settings workflow (aa56374)
- add dexie and dexie-react-hooks for improved database management (ae53a1f)
- add Playwright for end-to-end testing and update related configurations (c0dabcd)
- implement end-to-end testing with Playwright and enhance database utilities (4f2c229)
- add ExportPanel and BackupPanel components (8a30428)
- add export utilities for PDF, Word, and LaTeX document generation (2a25397)
- add academic store and citation utilities (6d7d22f)
- enhance DraftList and TableOfContents components with sorting and memoization optimizations (8f58e88)
- add Table of Contents component for long drafts with section management (224476a)
- enhance draft management with improved selectors and performance optimizations (1b96448)
- implement draft management features (0922ba1)
- enhance Scratchpad and PageStack components with improved layout, debug logging, and error handling (d9a06cd)
- implement Scratchpad feature with page navigation, text blocks, and category selection (06b3482)
- refine DiaryLayout and ExcalidrawWrapper components for improved layout and performance (19d48b0)
- enhance Excalidraw integration with improved canvas settings and initial render handling (1385c60)
- add blackboard feature with Excalidraw integration (5177c16)
- Enhance Personal Diary components with date handling and error states (4276e60)
- Implement Personal Diary feature with entry navigation and rich text editor (da5a254)
- initialize project structure with React, Zustand, and TypeScript (9888724)
- Implement light theme and paper-like UI for scratchpad and blackboard components (34e08fb)
- Redesign UI with a "Luminous Archive" theme, new color palette, typography, and glassmorphism effects. (897a042)
- Lazy load Excalidraw component and stabilize Excalidraw API and index point references with `useRef`. (a8d7fc1)
- implement advanced features and polish Writer's IDE (8718583)
- Added scratchpad and blackboard presets so they appear on the shelf and load their Excalidraw canvases (src/features/diaries/diaryPresets.ts:10-27). (e4a6a1b)
- add bundle visualizer and externalize Excalidraw via CDN (e1abddc)
- lazy-load Excalidraw and helpers; split Footnote/Math templates; reduce entry bundle Lazy-load Excalidraw in Canvas with Suspense; add lightweight loading UI Dynamically import Excalidraw exports in export utilities to avoid upfront cost Extract Footnote helpers to separate module to stop mixed static/dynamic import warning Extract Math templates from MathNode to keep extension lean and splittable Route-level lazy loading remains; ShortcutsModal confirmed as separate 1.9 kB chunk Add manualChunks for Excalidraw assets/mermaid and tiptap core grouping Minor CSS addition for canvas loader (cd3b080)
- lazy‑load routes/modal, fix TS6133, tighten typings, and optimize editors (0b17616)
- lock/unlock diaries, shortcuts modal, a11y polish, PWA icons, README (7e8eb99)
- Implement Drafts, Security, Longform, and Academic presets (5662f21)
- Implemented Draft Presets  DRAFTS PRESET Focused writing environment with title+body structure and word tracking. Components Created: - TitleNode (Tiptap extension): Single-line title with Enter navigation - WordCount: Real-time metrics (words, chars, paragraphs, reading time) - useDrafts: State management with 2s autosave - DraftsView: Clean UI with export buttons DATA & SECURITY Enterprise-grade encryption, backup, and session management. Security Infrastructure: - backup.ts: Export/import with validation & versioning - crypto.ts: AES-GCM encryption with PBKDF2 (100k iterations) - session.ts: 15-min timeout with activity tracking - shortcuts.ts: Platform-aware keyboard manager - LockDialog: Password UI with strength meter - ShortcutsModal: Keyboard reference Encryption Details: • PBKDF2 key derivation (100,000 iterations) • AES-GCM 256-bit encryption • Unique salt per diary • Password strength validation (0-4 scoring) • Session auto-lock after inactivity • Cmd/Ctrl platform detection Keyboard Shortcuts: • Cmd/Ctrl+N: New diary • Cmd/Ctrl+S: Manual save • Cmd/Ctrl+E: Export • Cmd/Ctrl+K: Show shortcuts • Cmd/Ctrl+L: Lock/unlock • Editor: Bold, Italic, Underline (e82caf0)
- Implement core writing features and security infrastructure New Components: - TitleNode: Custom Tiptap extension for single-line document titles   - Prevents line breaks, moves focus to body on Enter   - "Untitled" placeholder, always first element - WordCount: Real-time writing statistics   - Words, characters (with/without spaces), paragraphs   - Reading time estimate - useDrafts: State management hook with 2-second autosave - DraftsView: Clean, minimal UI (720px max-width) Features: - Title + body structure enforced - HTML/Markdown export - Debounced autosave to IndexedDB - Accessible with ARIA labels (f7f0187)
- Add backup/restore and encryption services Implements core security infrastructure: Backup System (backup.ts) - Full data export/import with validation - Timestamped backup files - Schema version checking - Backup inspection without importing (06d066d)
- Implement PR5 - Drafts Preset (df949b8)
- fix TipTap TS errors, harden paste/serialize, add journal logs; build green (82b60d8)
- add OutlinePanel + heading heuristics with Excalidraw navigation (6414f00)
- integrate Excalidraw and ship Scratchpad diary (b203d10)
- fresh start (88ba433)

### Bug Fixes

- update execution stage to Phase 4.1.2 and mark acceptance criteria as complete for Long Drafts store (9173d02)
- Restricted the app to the four supported diary types only. DiaryKind now allows just journal, drafts, longform, and academic (src/services/db.ts:4). Removed the Scratchpad and Blackboard presets so the shelf and creator UI only exposes those four options (src/features/diaries/diaryPresets.ts:10). Updated the router’s lazy view map so only the remaining diary kinds resolve to screens (src/features/diaries/DiaryRouter.tsx:27) (d970b2e)
- Updated the Excalidraw loader to import the library from the local bundle in every environment while still pointing assets at the CDN, eliminating the runtime pull of React 19 (src/editors/excalidraw/loadExcalidraw.ts:24). (9c1cff5)
- resolve production deployment issues and React 18 compatibility (f674752)
- Add Netlify configuration and resolve deployment issues (6bbb109)
- Ensured the global Excalidraw API unregisters cleanly on unmount without clobbering mid-session state (c6160b5)
- Stopped the remount loop by guarding when load(scene) runs inside the Excalidraw canvas lifecycle. (81bab43)

### Performance

- lazy‑load diary views; cheap page counts; reliable Dexie reads (a866cf1)

### Refactoring

- Tokenize hard-coded colors in AcademicSectionEditor, CitationPicker, TemplateSelector, FootnoteManager, and LongDrafts components (231f115)
- enhance Scratchpad component with improved toolbar and sidebar functionality (b97f79e)
- remove SettingsModal and SketchModal components along with their styles (1a6fcd9)
- Memoize Tiptap editor extensions and simplify diary entry database query. (ed79498)

### Chores

- Downgrade Tiptap dependencies and refine import statements. (27f2a23)

### Other Changes

- Complete day 6 docs and packaging audit follow-ups (d7ec6d1)
- Complete Day 4/5 audit remediations and profiling prep (a2acd13)
- Add audit artifacts through Day 4 and ship Electron/a11y remediations (d812730)
- Refactor AcademicSectionEditor and ReferenceLibraryPanel components (dbf67f0)
- Refactor DraftEditor and DraftList components for improved toolbar functionality and styling (13284e2)
- Refactor styles in SectionEditor and TableOfContents components to use CSS variables for colors and backgrounds; enhance consistency across the application. Add new styles for personal canvas and entry components, improving layout and visual hierarchy. (9a2ae55)
- Refactor code structure for improved readability and maintainability (da5f912)
- Add comprehensive tests for various stores with error handling and fallback paths (072acce)
- Update progress documentation and enhance test coverage (961863d)
- Add comprehensive tests for academicStore, longDraftsStore, backup utilities, citation utilities, and export functionalities (c46cd43)
- Add tests for DraftList, Drafts, StatusBadge, CategoryPicker, PageStack, Scratchpad, ScratchpadPage, TextBlock, and store functionality (e073d62)
- Add tests and refactor personal diary and academic components (a3efe27)
- Global Theme: A warm, off-white paper background (#fdfbf7) with a subtle grain texture. Typography: Dark ink colors (#2c241b) for clear, high-contrast reading. Blackboard: Now uses the light-mode Excalidraw, looking like a clean sketchpad. Scratchpad: Styled as a stack of index cards with grid lines. Personal Diary: A minimalist, centered writing experience on "paper". (4458114)
- Deploy with 4 working diary types: Journal, Drafts, Longform, Academic (f9bfdf0)
- Added a guarded, dynamic Dexie loader so the module is only imported after we’ve confirmed IndexedDB can be used; rejected imports disable Dexie for the session and keep the app alive (9882ec3)
- Added a resilience layer to the persistence service so the app no longer white-screens when IndexedDB is blocked or fails to open (common on some browsers/private modes). (d6bd02e)
- Set up the new workspace, routing, persistence, and UI skeleton for Uddesa (5876c18)
