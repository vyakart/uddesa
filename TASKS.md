# MUWI Task Execution Plan

## Strategic Task Breakdown for Implementation

---

## Overview

This document breaks down the MUWI implementation into executable tasks. Each task includes:
- **Description**: What needs to be done
- **Dependencies**: What must be completed first
- **Acceptance Criteria**: How we know it's done
- **Estimated Effort**: T-shirt sizing (S/M/L/XL)
- **Testing Requirements**: What tests must accompany this task

### Effort Guide
- **S (Small)**: < 4 hours
- **M (Medium)**: 4-8 hours (1 day)
- **L (Large)**: 2-3 days
- **XL (Extra Large)**: 4-5 days

---

## Phase 0: Project Infrastructure
**Goal**: Set up the development environment and foundational architecture
**Duration**: Week 1

### 0.1 Initialize Project

#### Task 0.1.1: Create Vite + React + TypeScript Project
- **Description**: Initialize the project with Vite, React 18, and TypeScript 5
- **Dependencies**: None
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] `npm create vite@latest muwi -- --template react-ts` executed
  - [ ] Project runs with `npm run dev`
  - [ ] TypeScript strict mode enabled
  - [ ] ESLint and Prettier configured
- **Commands**:
  ```bash
  npm create vite@latest muwi -- --template react-ts
  cd muwi
  npm install
  npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
  npm install -D prettier eslint-config-prettier
  ```

#### Task 0.1.2: Configure Path Aliases
- **Description**: Set up TypeScript and Vite path aliases for clean imports
- **Dependencies**: 0.1.1
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] `@/` alias points to `src/`
  - [ ] `@components/`, `@stores/`, `@hooks/`, `@utils/`, `@db/`, `@types/` aliases configured
  - [ ] Aliases work in both TypeScript and Vite
- **Files to Modify**: `tsconfig.json`, `vite.config.ts`

#### Task 0.1.3: Set Up Tailwind CSS
- **Description**: Install and configure Tailwind CSS with custom design tokens
- **Dependencies**: 0.1.1
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Tailwind installed and configured
  - [ ] Custom color palette from design doc added
  - [ ] Custom font stack configured
  - [ ] Base styles applied
- **Design Tokens to Include**:
  ```css
  --bg-primary: #FAFAFA
  --bg-paper: #FFFEF9
  --text-primary: #1A1A1A
  --accent: #4A90A4
  ```

#### Task 0.1.4: Create Folder Structure
- **Description**: Create the complete folder structure per implementation doc
- **Dependencies**: 0.1.2
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] All directories from implementation doc exist
  - [ ] Index files created for each module
  - [ ] README.md placeholder in project root
- **Structure**:
  ```
  src/
  ├── components/
  │   ├── common/
  │   ├── shelf/
  │   └── diaries/
  ├── stores/
  ├── hooks/
  ├── db/
  ├── utils/
  ├── types/
  └── styles/
  ```

### 0.2 Set Up Electron

#### Task 0.2.1: Install Electron and Vite Plugin
- **Description**: Add Electron support with vite-plugin-electron
- **Dependencies**: 0.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Electron installed as dev dependency
  - [ ] vite-plugin-electron configured
  - [ ] App launches in Electron window
  - [ ] Hot reload works in development
- **Files to Create**: `electron/main.ts`, `electron/preload.ts`

#### Task 0.2.2: Configure Electron Main Process
- **Description**: Set up Electron main process with window management
- **Dependencies**: 0.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] BrowserWindow created with correct dimensions
  - [ ] macOS traffic light positioning configured
  - [ ] Dev tools open in development mode
  - [ ] App quits properly on all platforms
- **Key Settings**:
  - Window: 1200x800, min 800x600
  - titleBarStyle: 'hiddenInset' (macOS)
  - contextIsolation: true

#### Task 0.2.3: Set Up Preload Script with Context Bridge
- **Description**: Create preload script exposing safe Electron APIs
- **Dependencies**: 0.2.1
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] contextBridge exposes electronAPI
  - [ ] File dialog methods exposed
  - [ ] Platform detection exposed
  - [ ] TypeScript declarations for window.electronAPI

### 0.3 Set Up Testing Infrastructure

#### Task 0.3.1: Install and Configure Vitest
- **Description**: Set up Vitest for unit and integration testing
- **Dependencies**: 0.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Vitest installed with UI and coverage
  - [x] vitest.config.ts created with jsdom environment
  - [x] Path aliases work in tests
  - [x] Coverage thresholds set (80%)
  - [x] `npm test` runs successfully
- **Packages**:
  ```bash
  npm install -D vitest @vitest/ui @vitest/coverage-v8
  npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
  npm install -D jsdom
  ```

#### Task 0.3.2: Create Test Setup and Utilities
- **Description**: Create test setup file and helper utilities
- **Dependencies**: 0.3.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] `src/test/setup.ts` with global mocks
  - [x] `src/test/utils.tsx` with custom render
  - [x] `src/test/db-utils.ts` with database seeders
  - [x] `src/test/store-utils.ts` with store resetters
  - [x] fake-indexeddb configured
- **Packages**:
  ```bash
  npm install -D fake-indexeddb @faker-js/faker
  ```

#### Task 0.3.3: Install and Configure Playwright
- **Description**: Set up Playwright for E2E testing
- **Dependencies**: 0.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Playwright installed with browsers
  - [x] playwright.config.ts configured
  - [x] E2E folder structure created
  - [x] Web server configuration for tests
  - [x] Sample E2E test passes
- **Commands**:
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```

### 0.4 Set Up Database Layer

#### Task 0.4.1: Install and Configure Dexie.js
- **Description**: Set up Dexie.js for IndexedDB storage
- **Dependencies**: 0.1.4
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Dexie installed with React hooks
  - [x] Database class created with all tables
  - [x] Schema version 1 defined
  - [x] Database instance exported
- **Packages**:
  ```bash
  npm install dexie dexie-react-hooks
  ```

#### Task 0.4.2: Define All Entity Types
- **Description**: Create TypeScript interfaces for all data models
- **Dependencies**: 0.1.4
- **Effort**: M
- **Acceptance Criteria**:
  - [x] `src/types/scratchpad.ts` - ScratchpadPage, TextBlock
  - [x] `src/types/blackboard.ts` - BlackboardCanvas, CanvasElement
  - [x] `src/types/diary.ts` - DiaryEntry
  - [x] `src/types/drafts.ts` - Draft
  - [x] `src/types/longDrafts.ts` - LongDraft, Section, Footnote
  - [x] `src/types/academic.ts` - AcademicPaper, Citation, BibliographyEntry
  - [x] `src/types/settings.ts` - GlobalSettings, DiarySettings
  - [x] All types match design doc specifications

#### Task 0.4.3: Create Database Query Functions
- **Description**: Create query functions for each entity type
- **Dependencies**: 0.4.1, 0.4.2
- **Effort**: L
- **Acceptance Criteria**:
  - [x] `src/db/queries/scratchpad.ts` with CRUD operations
  - [x] `src/db/queries/blackboard.ts` with CRUD operations
  - [x] `src/db/queries/diary.ts` with CRUD operations
  - [x] `src/db/queries/drafts.ts` with CRUD operations
  - [x] `src/db/queries/settings.ts` with get/update operations
  - [x] All queries have TypeScript return types
- **Testing**: Unit tests for each query function

### 0.5 Set Up State Management

#### Task 0.5.1: Install and Configure Zustand
- **Description**: Set up Zustand with persist middleware
- **Dependencies**: 0.1.4
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Zustand installed
  - [x] Store folder structure created
  - [x] Persist middleware configured for settings
- **Packages**:
  ```bash
  npm install zustand
  ```

#### Task 0.5.2: Create App Store
- **Description**: Create global app state store
- **Dependencies**: 0.5.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Navigation state (currentView, currentDiary)
  - [x] UI state (sidebar, settings modal, context menu)
  - [x] Lock state (isAppLocked, lastActivity)
  - [x] Actions for all state changes
- **Testing**: Unit tests for all actions

#### Task 0.5.3: Create Settings Store
- **Description**: Create settings store with persistence
- **Dependencies**: 0.5.1, 0.4.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Global settings state
  - [x] Per-diary settings state
  - [x] loadSettings action (from database)
  - [x] updateGlobalSettings action
  - [x] updateDiarySettings action
  - [x] Passkey management (set, verify, clear)
- **Testing**: Unit tests with mocked database

---

## Phase 1: Foundation
**Goal**: Basic app shell and one complete diary
**Duration**: Weeks 2-4

### 1.1 Core UI Components

#### Task 1.1.1: Create Modal Component
- **Description**: Reusable modal with portal, backdrop, and focus trap
- **Dependencies**: 0.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Modal renders in portal
  - [x] Backdrop closes modal on click
  - [x] Escape key closes modal
  - [x] Focus trapped inside modal
  - [x] Accessible (role="dialog", aria-modal)
  - [x] Smooth enter/exit animations
- **Testing**: Component tests for all behaviors

#### Task 1.1.2: Create Context Menu Component
- **Description**: Right-click context menu with keyboard navigation
- **Dependencies**: 0.1.3
- **Effort**: L
- **Acceptance Criteria**:
  - [x] Appears at click position
  - [x] Stays within viewport bounds
  - [x] Keyboard navigation (arrows, enter, escape)
  - [x] Nested submenus supported
  - [x] Click outside closes
  - [x] Accessible (role="menu")
- **Testing**: Component tests, keyboard navigation tests

#### Task 1.1.3: Create Toolbar Component
- **Description**: Flexible toolbar with button groups
- **Dependencies**: 0.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Horizontal button layout
  - [x] Separator support
  - [x] Active state for toggle buttons
  - [x] Tooltip support
  - [x] Keyboard accessible
- **Testing**: Component tests

### 1.2 Shelf (Homepage)

#### Task 1.2.1: Create DiaryCard Component
- **Description**: Visual card representing each diary type
- **Dependencies**: 1.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Displays diary name, icon, color
  - [x] Hover state shows preview info
  - [x] Click triggers navigation
  - [x] Right-click shows context menu
  - [x] Supports grid, list, and shelf layouts
- **Testing**: Component tests, interaction tests

#### Task 1.2.2: Create Shelf Component
- **Description**: Homepage showing all diary cards
- **Dependencies**: 1.2.1, 0.5.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Displays all 6 diary cards
  - [x] Layout switches (grid/list/shelf)
  - [x] Settings button in header
  - [x] Navigates to diary on card click
- **Testing**: Component tests, layout tests
- **E2E**: Homepage navigation test

#### Task 1.2.3: Create Settings Panel Component
- **Description**: Settings modal with all configuration options
- **Dependencies**: 1.1.1, 0.5.3
- **Effort**: L
- **Acceptance Criteria**:
  - [x] Tabbed navigation (Appearance, Shortcuts, Backup, Privacy)
  - [x] Theme selector
  - [x] Accent color picker
  - [x] Layout preference selector
  - [x] Passkey management
  - [x] Backup location selector
  - [x] Settings persist on close
- **Testing**: Component tests, integration tests with settings store

### 1.3 Personal Diary (First Diary)

#### Task 1.3.1: Install and Configure TipTap
- **Description**: Set up TipTap rich text editor
- **Dependencies**: 0.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] TipTap installed with starter-kit
  - [ ] Placeholder extension added
  - [ ] Basic extensions configured (bold, italic, lists)
  - [ ] Editor renders and accepts input
- **Packages**:
  ```bash
  npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
  npm install @tiptap/pm
  ```

#### Task 1.3.2: Create Personal Diary Store
- **Description**: Zustand store for personal diary state
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] entries state array
  - [ ] currentEntry state
  - [ ] loadEntries action
  - [ ] loadEntry action (by date)
  - [ ] createEntry action
  - [ ] updateEntry action
  - [ ] Word count tracking
- **Testing**: Unit tests for all actions

#### Task 1.3.3: Create DatePicker Component
- **Description**: Date picker with calendar view
- **Dependencies**: 0.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Displays current date formatted
  - [ ] Click opens calendar
  - [ ] Calendar navigation (prev/next month)
  - [ ] Date selection updates parent
  - [ ] Keyboard accessible
  - [ ] Date format configurable
- **Packages**: `npm install date-fns`
- **Testing**: Component tests

#### Task 1.3.4: Create EntryNavigation Component
- **Description**: Sidebar with entry list and navigation
- **Dependencies**: 1.3.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Lists entries by date
  - [ ] Shows entry preview/word count
  - [ ] Click navigates to entry
  - [ ] Previous/Next buttons
  - [ ] "Today" button
  - [ ] Collapsible sidebar
- **Testing**: Component tests

#### Task 1.3.5: Create DiaryEntry Component
- **Description**: Main entry editor with date header
- **Dependencies**: 1.3.1, 1.3.3, 1.3.4
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] Date header with picker
  - [ ] TipTap editor for content
  - [ ] Lined paper background option
  - [ ] Fixed font from settings
  - [ ] Word count display
  - [ ] Auto-save on change
- **Testing**: Component tests, integration tests

#### Task 1.3.6: Create PersonalDiary Container
- **Description**: Main container assembling diary components
- **Dependencies**: 1.3.2, 1.3.4, 1.3.5
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Loads entries on mount
  - [ ] Displays entry navigation
  - [ ] Shows current entry editor
  - [ ] Handles date changes
  - [ ] Applies paper texture from settings
- **Testing**: Integration tests
- **E2E**: Create and edit diary entry

### 1.4 Navigation and Routing

#### Task 1.4.1: Create App Router
- **Description**: Set up client-side routing
- **Dependencies**: 1.2.2, 1.3.6
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Shelf route (/)
  - [ ] Personal Diary route (/personal-diary)
  - [ ] Route params for document ID
  - [ ] Back navigation works
  - [ ] Deep linking supported
- **Note**: Use simple state-based routing (no react-router needed for Electron)

#### Task 1.4.2: Create Navigation Header
- **Description**: Header with back button and diary title
- **Dependencies**: 0.5.2
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Shows "← Shelf" back link
  - [ ] Shows current diary name
  - [ ] Keyboard shortcut (Ctrl+H) for home
- **Testing**: Component tests

---

## Phase 2: Core Diaries
**Goal**: Implement Scratchpad and Drafts with shared features
**Duration**: Weeks 5-8

### 2.1 Scratchpad

#### Task 2.1.1: Create Scratchpad Store
- **Description**: Zustand store for scratchpad state
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] pages state array
  - [ ] currentPageIndex state
  - [ ] textBlocks Map (pageId → blocks)
  - [ ] loadPages action
  - [ ] createPage action
  - [ ] deletePage action
  - [ ] navigateToPage action
  - [ ] findFreshPage action
  - [ ] CRUD actions for text blocks
- **Testing**: Unit tests for all actions

#### Task 2.1.2: Create TextBlock Component
- **Description**: Free-position editable text block
- **Dependencies**: 0.1.3
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] Positioned absolutely by x,y coordinates
  - [ ] contentEditable for editing
  - [ ] Auto-expands as user types
  - [ ] Draggable by edge
  - [ ] Focus ring on focus
  - [ ] Updates store on input
  - [ ] Deletes if empty on blur
  - [ ] Shows lock indicator when locked
- **Testing**: Component tests, drag tests

#### Task 2.1.3: Create PageStack Component
- **Description**: Visual page stack indicator on right edge
- **Dependencies**: 2.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Shows indicator for each page
  - [ ] Darker shade for pages with content
  - [ ] Highlights current page
  - [ ] Click navigates to page
  - [ ] Tooltip shows page number
- **Testing**: Component tests

#### Task 2.1.4: Create CategoryPicker Component
- **Description**: Dropdown to select page category
- **Dependencies**: 0.5.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Shows current category with color
  - [ ] Dropdown lists all categories
  - [ ] Selection updates page color
  - [ ] Uses colors from settings
- **Testing**: Component tests

#### Task 2.1.5: Create ScratchpadPage Component
- **Description**: Single page canvas with text blocks
- **Dependencies**: 2.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Fixed size from settings
  - [ ] Background color from category
  - [ ] Click on empty space creates text block
  - [ ] Renders all text blocks
  - [ ] Page shadow/depth effect
- **Testing**: Component tests, integration tests

#### Task 2.1.6: Create Scratchpad Container
- **Description**: Main container with page navigation
- **Dependencies**: 2.1.1, 2.1.3, 2.1.4, 2.1.5
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Loads pages on mount
  - [ ] Shows current page
  - [ ] Page stack indicator
  - [ ] Category picker
  - [ ] Page count display
  - [ ] Keyboard navigation (PageUp/Down)
  - [ ] Ctrl+N creates new page
- **Testing**: Integration tests
- **E2E**: Create pages, add text, navigate

### 2.2 Drafts

#### Task 2.2.1: Create Drafts Store
- **Description**: Zustand store for drafts state
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] drafts state array
  - [ ] currentDraft state
  - [ ] loadDrafts action
  - [ ] createDraft action
  - [ ] updateDraft action
  - [ ] deleteDraft action
  - [ ] Sort by date/title/status
- **Testing**: Unit tests for all actions

#### Task 2.2.2: Create DraftList Component
- **Description**: Sidebar listing all drafts
- **Dependencies**: 2.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Lists drafts with title preview
  - [ ] Shows status badge
  - [ ] Shows word count
  - [ ] Sort dropdown
  - [ ] Click selects draft
  - [ ] Right-click context menu
- **Testing**: Component tests

#### Task 2.2.3: Create StatusBadge Component
- **Description**: Visual badge for draft status
- **Dependencies**: 0.1.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Shows status text
  - [ ] Color-coded (in-progress, review, complete)
  - [ ] Click to cycle status
- **Testing**: Component tests

#### Task 2.2.4: Create DraftEditor Component
- **Description**: Title + body editor for drafts
- **Dependencies**: 1.3.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Title input field (large font)
  - [ ] TipTap body editor
  - [ ] Basic formatting toolbar
  - [ ] Word count display
  - [ ] Auto-save on change
  - [ ] Soft page breaks
- **Testing**: Component tests

#### Task 2.2.5: Create Drafts Container
- **Description**: Main container with list and editor
- **Dependencies**: 2.2.1, 2.2.2, 2.2.4
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Loads drafts on mount
  - [ ] Shows draft list in sidebar
  - [ ] Shows selected draft in editor
  - [ ] Handles create new draft
  - [ ] Handles delete draft
- **Testing**: Integration tests
- **E2E**: Create, edit, delete drafts

### 2.3 Global Features

#### Task 2.3.1: Create usePasteHandler Hook
- **Description**: Hook to strip formatting from pasted content
- **Dependencies**: 0.1.4
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Intercepts paste event
  - [ ] Extracts plain text
  - [ ] Preserves line breaks
  - [ ] Inserts with current styles
  - [ ] Works with contentEditable and TipTap
- **Testing**: Hook tests with clipboard mocking

#### Task 2.3.2: Create useKeyboardShortcuts Hook
- **Description**: Global keyboard shortcut handler
- **Dependencies**: 0.1.4
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Matches Ctrl/Cmd + key combinations
  - [ ] Supports Shift modifier
  - [ ] Prevents default for matched shortcuts
  - [ ] Handles special keys (PageUp, PageDown)
  - [ ] Cleans up on unmount
- **Testing**: Hook tests with keyboard events

#### Task 2.3.3: Apply Paste Handler Globally
- **Description**: Integrate paste handler into all editors
- **Dependencies**: 2.3.1, 1.3.5, 2.1.2, 2.2.4
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Paste strips formatting in Personal Diary
  - [ ] Paste strips formatting in Scratchpad text blocks
  - [ ] Paste strips formatting in Drafts
- **Testing**: Integration tests for each diary

#### Task 2.3.4: Apply Keyboard Shortcuts Globally
- **Description**: Integrate keyboard shortcuts across app
- **Dependencies**: 2.3.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Ctrl+H goes to shelf
  - [ ] Ctrl+, opens settings
  - [ ] Ctrl+N creates new (page/entry/draft)
  - [ ] PageUp/PageDown for navigation
  - [ ] Ctrl+1/2/3 for headings
  - [ ] Ctrl+B/I/U for formatting
- **Testing**: E2E tests for shortcuts

### 2.4 Content Locking

#### Task 2.4.1: Create Passkey Utilities
- **Description**: Cryptographic utilities for passkey
- **Dependencies**: 0.1.4
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] hashPasskey function (PBKDF2)
  - [ ] verifyPasskey function
  - [ ] Salt generation
  - [ ] Hex encoding/decoding
- **Testing**: Unit tests for crypto functions

#### Task 2.4.2: Create useContentLocking Hook
- **Description**: Hook to manage content lock state
- **Dependencies**: 2.4.1, 0.5.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] isLocked state
  - [ ] lock action (requires passkey set)
  - [ ] unlock action (requires correct passkey)
  - [ ] toggleLock action
  - [ ] Stores lock state in database
- **Testing**: Hook tests

#### Task 2.4.3: Create PasskeyPrompt Component
- **Description**: Modal for entering passkey
- **Dependencies**: 1.1.1
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Password input field
  - [ ] Show/hide toggle
  - [ ] "Show hint" button
  - [ ] Submit button
  - [ ] Error message display
- **Testing**: Component tests

#### Task 2.4.4: Add Locking to Context Menu
- **Description**: Add lock/unlock options to context menu
- **Dependencies**: 1.1.2, 2.4.2, 2.4.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] "Lock" option when unlocked
  - [ ] "Unlock" option when locked
  - [ ] Lock prompts passkey setup if not set
  - [ ] Unlock shows passkey prompt
  - [ ] Locked content shows visual indicator
- **Testing**: Integration tests

#### Task 2.4.5: Integrate Locking in All Diaries
- **Description**: Add locking support to all components
- **Dependencies**: 2.4.4
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Scratchpad text blocks lockable
  - [ ] Scratchpad pages lockable
  - [ ] Diary entries lockable
  - [ ] Drafts lockable
  - [ ] Locked content not editable
  - [ ] Locked content has visual indicator
- **Testing**: Integration tests for each diary

---

## Phase 3: Advanced Canvas (Blackboard)
**Goal**: Implement infinite canvas with drawing tools
**Duration**: Weeks 9-12

### 3.1 Excalidraw Integration

#### Task 3.1.1: Install Excalidraw
- **Description**: Install and configure Excalidraw library
- **Dependencies**: 0.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] @excalidraw/excalidraw installed
  - [ ] Basic Excalidraw renders
  - [ ] Dark theme configured
  - [ ] Custom background color works
- **Packages**:
  ```bash
  npm install @excalidraw/excalidraw
  ```

#### Task 3.1.2: Create Blackboard Store
- **Description**: Zustand store for blackboard state
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] canvas state (elements, viewport)
  - [ ] loadCanvas action
  - [ ] saveElements action (debounced)
  - [ ] updateViewport action
  - [ ] Index entries derived from elements
- **Testing**: Unit tests for all actions

#### Task 3.1.3: Create ExcalidrawWrapper Component
- **Description**: Wrapper component for Excalidraw
- **Dependencies**: 3.1.1, 3.1.2
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] Excalidraw renders with initial data
  - [ ] Changes save to store
  - [ ] Viewport state persists
  - [ ] Custom UI options
  - [ ] Grid toggle from settings
- **Testing**: Component tests

### 3.2 Index Panel

#### Task 3.2.1: Create IndexPanel Component
- **Description**: Auto-generated index from headings
- **Dependencies**: 3.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Collapsible panel
  - [ ] Shows H1/H2/H3 hierarchy
  - [ ] Updates in real-time
  - [ ] Click navigates to element
  - [ ] Indentation by level
- **Testing**: Component tests

#### Task 3.2.2: Implement Heading Detection
- **Description**: Detect headings in Excalidraw elements
- **Dependencies**: 3.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Parse text elements for heading markers
  - [ ] Build hierarchical index
  - [ ] Update on element changes
  - [ ] Sort by y-position
- **Testing**: Unit tests for detection logic

### 3.3 Blackboard Assembly

#### Task 3.3.1: Create BlackboardToolbar Component
- **Description**: Toolbar with Blackboard-specific tools
- **Dependencies**: 1.1.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Tool selection buttons
  - [ ] Color picker
  - [ ] Stroke width selector
  - [ ] Grid toggle
- **Testing**: Component tests

#### Task 3.3.2: Create Blackboard Container
- **Description**: Main container for Blackboard
- **Dependencies**: 3.1.3, 3.2.1, 3.3.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Loads canvas on mount
  - [ ] Full-height layout
  - [ ] Toolbar at top
  - [ ] Index panel toggle
  - [ ] Saves on change
- **Testing**: Integration tests
- **E2E**: Draw elements, navigate with index

### 3.4 Font Configuration

#### Task 3.4.1: Bundle Custom Fonts
- **Description**: Bundle and configure custom fonts
- **Dependencies**: 0.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Crimson Pro font bundled
  - [ ] Inter font bundled
  - [ ] Caveat font bundled
  - [ ] JetBrains Mono font bundled
  - [ ] @font-face declarations
  - [ ] Fonts load correctly
- **Files**: Download from Google Fonts, add to `assets/fonts/`

#### Task 3.4.2: Create Font Selector Component
- **Description**: Component for selecting fonts
- **Dependencies**: 3.4.1, 0.5.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Shows available fonts
  - [ ] Preview in actual font
  - [ ] Selection updates setting
  - [ ] Works in context menu
- **Testing**: Component tests

#### Task 3.4.3: Integrate Font Selection in Blackboard
- **Description**: Add font selection to Blackboard
- **Dependencies**: 3.4.2, 3.3.2
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Font picker in context menu
  - [ ] Text elements use selected font
  - [ ] Font persists with element
- **Testing**: Integration tests

---

## Phase 4: Long-form Writing
**Goal**: Implement Long Drafts with sections and footnotes
**Duration**: Weeks 13-16

### 4.1 Section Management

#### Task 4.1.1: Create Long Drafts Store
- **Description**: Zustand store for long drafts
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] documents state
  - [ ] currentDocument state
  - [ ] sections state (nested)
  - [ ] loadDocument action
  - [ ] createSection action
  - [ ] updateSection action
  - [ ] reorderSection action
  - [ ] deleteSection action
- **Testing**: Unit tests for all actions

#### Task 4.1.2: Create TableOfContents Component
- **Description**: Navigable table of contents
- **Dependencies**: 4.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Auto-generated from sections
  - [ ] Nested section display
  - [ ] Click navigates to section
  - [ ] Drag-and-drop reordering
  - [ ] Section word counts
- **Testing**: Component tests

#### Task 4.1.3: Create SectionEditor Component
- **Description**: Editor for a single section
- **Dependencies**: 1.3.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Section title input
  - [ ] TipTap body editor
  - [ ] Footnote support
  - [ ] Status indicator
  - [ ] Section notes field
- **Testing**: Component tests

### 4.2 Footnotes

#### Task 4.2.1: Create TipTap Footnote Extension
- **Description**: Custom TipTap extension for footnotes
- **Dependencies**: 1.3.1
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] Footnote node type
  - [ ] Footnote marker in text
  - [ ] Footnote content at bottom
  - [ ] Click jumps between marker and content
  - [ ] Auto-numbering
- **Testing**: Extension tests

#### Task 4.2.2: Create FootnoteManager Component
- **Description**: UI for managing footnotes
- **Dependencies**: 4.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] List of footnotes
  - [ ] Edit footnote content
  - [ ] Delete footnote
  - [ ] Navigate to footnote in text
- **Testing**: Component tests

### 4.3 Focus Mode

#### Task 4.3.1: Create FocusMode Component
- **Description**: Distraction-free writing mode
- **Dependencies**: 4.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Hides all UI except editor
  - [ ] Typewriter mode (current line centered)
  - [ ] Keyboard shortcut to toggle
  - [ ] Smooth enter/exit animation
- **Testing**: Component tests

### 4.4 Long Drafts Assembly

#### Task 4.4.1: Create LongDrafts Container
- **Description**: Main container for Long Drafts
- **Dependencies**: 4.1.1, 4.1.2, 4.1.3, 4.3.1
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] Document list/selection
  - [ ] TOC sidebar
  - [ ] Section editor
  - [ ] Focus mode toggle
  - [ ] Document metadata
- **Testing**: Integration tests
- **E2E**: Create document, add sections, reorder

---

## Phase 5: Academic Features
**Goal**: Implement Academic Papers with citations
**Duration**: Weeks 17-20

### 5.1 Citation System

#### Task 5.1.1: Install Citation Libraries
- **Description**: Install citeproc-js for citation formatting
- **Dependencies**: 0.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] citeproc-js installed
  - [ ] Citation style files bundled (APA, MLA, Chicago)
  - [ ] Basic citation formatting works
- **Packages**: Research best citation library for browser

#### Task 5.1.2: Create Citation Utilities
- **Description**: Utility functions for citations
- **Dependencies**: 5.1.1
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] formatCitation function
  - [ ] formatBibliography function
  - [ ] parseBibTeX function
  - [ ] fetchFromDOI function
  - [ ] Style switching
- **Testing**: Unit tests for each function

#### Task 5.1.3: Create CitationPicker Component
- **Description**: UI for inserting citations
- **Dependencies**: 5.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Search references
  - [ ] Select reference(s)
  - [ ] Page number input
  - [ ] Insert formatted citation
  - [ ] Keyboard shortcut (Ctrl+Shift+C)
- **Testing**: Component tests

### 5.2 Reference Library

#### Task 5.2.1: Create Academic Store
- **Description**: Zustand store for academic papers
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] papers state
  - [ ] currentPaper state
  - [ ] bibliographyEntries state
  - [ ] All CRUD actions
  - [ ] Citation insertion action
- **Testing**: Unit tests

#### Task 5.2.2: Create BibliographyManager Component
- **Description**: UI for managing references
- **Dependencies**: 5.2.1
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] List all references
  - [ ] Add reference (manual, DOI, BibTeX)
  - [ ] Edit reference
  - [ ] Delete reference
  - [ ] Tag/folder organization
  - [ ] Search references
- **Testing**: Component tests

#### Task 5.2.3: Create ReferenceLibrary Panel
- **Description**: Global reference library
- **Dependencies**: 5.2.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Separate from papers
  - [ ] Import/export references
  - [ ] Link to papers
- **Testing**: Component tests

### 5.3 Academic Paper Assembly

#### Task 5.3.1: Create AcademicSection Component
- **Description**: Section editor with academic features
- **Dependencies**: 4.1.3, 5.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Citation insertion
  - [ ] Cross-references
  - [ ] Figure/table numbering
  - [ ] Academic formatting
- **Testing**: Component tests

#### Task 5.3.2: Create AcademicTemplate Selector
- **Description**: Template for paper structure
- **Dependencies**: 5.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] IMRAD template
  - [ ] Custom structure
  - [ ] Abstract/Keywords fields
  - [ ] Author fields
- **Testing**: Component tests

#### Task 5.3.3: Create AcademicPaper Container
- **Description**: Main container for Academic Papers
- **Dependencies**: 5.3.1, 5.3.2, 5.2.2
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] Template selection
  - [ ] Section navigation
  - [ ] Bibliography panel
  - [ ] Citation style selector
  - [ ] Word/character count
- **Testing**: Integration tests
- **E2E**: Create paper, add citations, generate bibliography

---

## Phase 6: Export and Backup
**Goal**: Implement export and backup functionality
**Duration**: Weeks 21-22

### 6.1 Export System

#### Task 6.1.1: Create PDF Export Utility
- **Description**: Export documents to PDF
- **Dependencies**: 0.1.1
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] jsPDF or similar installed
  - [ ] Text content exports
  - [ ] Formatting preserved
  - [ ] Page size options
  - [ ] Headers/footers
- **Packages**: `npm install jspdf`
- **Testing**: Unit tests

#### Task 6.1.2: Create Word Export Utility
- **Description**: Export documents to .docx
- **Dependencies**: 0.1.1
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] docx library installed
  - [ ] Text content exports
  - [ ] Formatting preserved
  - [ ] Styles applied
- **Packages**: `npm install docx`
- **Testing**: Unit tests

#### Task 6.1.3: Create ExportPanel Component
- **Description**: UI for export options
- **Dependencies**: 6.1.1, 6.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Format selection (PDF, Word, LaTeX)
  - [ ] Options per format
  - [ ] Progress indicator
  - [ ] Download or save to location
- **Testing**: Component tests

### 6.2 Backup System

#### Task 6.2.1: Create Backup Utilities
- **Description**: Backup and restore functions
- **Dependencies**: 0.4.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] createBackup function (all tables)
  - [ ] restoreBackup function
  - [ ] Version validation
  - [ ] JSON format
- **Testing**: Unit tests

#### Task 6.2.2: Create BackupPanel Component
- **Description**: UI for backup/restore
- **Dependencies**: 6.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Manual backup button
  - [ ] Restore from file
  - [ ] Backup location selector
  - [ ] Auto-backup toggle
  - [ ] Last backup timestamp
- **Testing**: Component tests

#### Task 6.2.3: Implement Auto-Backup
- **Description**: Automatic periodic backups
- **Dependencies**: 6.2.1, 0.5.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Backup on schedule (hourly/daily/weekly)
  - [ ] Background operation
  - [ ] Notification on completion
  - [ ] Cleanup old backups
- **Testing**: Integration tests

---

## Phase 7: Polish and Launch
**Goal**: Final polish, accessibility, and distribution
**Duration**: Weeks 23-26

### 7.1 Dark Mode

#### Task 7.1.1: Create Dark Theme CSS
- **Description**: Dark mode color scheme
- **Dependencies**: 0.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] All colors have dark variants
  - [ ] CSS variables for theming
  - [ ] Smooth transition between themes
  - [ ] No contrast issues
- **Testing**: Visual regression tests

#### Task 7.1.2: Implement Theme Switching
- **Description**: Runtime theme switching
- **Dependencies**: 7.1.1, 0.5.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Light/Dark/System options
  - [ ] System preference detection
  - [ ] Persists across sessions
  - [ ] Updates immediately
- **Testing**: Integration tests

### 7.2 Accessibility

#### Task 7.2.1: Accessibility Audit
- **Description**: Comprehensive accessibility review
- **Dependencies**: All UI tasks
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] All interactive elements keyboard accessible
  - [ ] ARIA labels on all controls
  - [ ] Focus visible at all times
  - [ ] Color contrast meets WCAG AA
  - [ ] Screen reader compatible
- **Testing**: axe-core automated tests

#### Task 7.2.2: Fix Accessibility Issues
- **Description**: Address audit findings
- **Dependencies**: 7.2.1
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] All issues resolved
  - [ ] Automated tests pass
  - [ ] Manual screen reader testing
- **Testing**: Re-run accessibility tests

### 7.3 Performance

#### Task 7.3.1: Performance Profiling
- **Description**: Identify performance bottlenecks
- **Dependencies**: All features
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Initial load < 3s
  - [ ] Page navigation < 100ms
  - [ ] Large document handling
  - [ ] Memory usage stable
- **Testing**: Performance tests

#### Task 7.3.2: Optimize Bundle Size
- **Description**: Reduce bundle size
- **Dependencies**: 7.3.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Code splitting implemented
  - [ ] Lazy loading for heavy components
  - [ ] Tree shaking verified
  - [ ] Bundle < 5MB
- **Testing**: Bundle analysis

### 7.4 Distribution

#### Task 7.4.1: Configure Electron Builder
- **Description**: Set up cross-platform builds
- **Dependencies**: 0.2.2
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] macOS build (DMG, zip)
  - [ ] Windows build (NSIS, portable)
  - [ ] Linux build (AppImage, deb)
  - [ ] Code signing configured
  - [ ] Auto-update configured
- **Files**: `electron-builder.config.js`

#### Task 7.4.2: Create GitHub Actions CI/CD
- **Description**: Automated testing and builds
- **Dependencies**: 0.3.1, 0.3.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Unit tests run on PR
  - [ ] E2E tests run on PR
  - [ ] Builds created on release
  - [ ] Artifacts uploaded
- **Files**: `.github/workflows/`

#### Task 7.4.3: Create Release Workflow
- **Description**: Automated release process
- **Dependencies**: 7.4.1, 7.4.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Semantic versioning
  - [ ] Changelog generation
  - [ ] GitHub release creation
  - [ ] Binary upload
  - [ ] Update manifest

---

## Task Summary

| Phase | Tasks | Estimated Effort |
|-------|-------|-----------------|
| Phase 0: Infrastructure | 16 | ~2 weeks |
| Phase 1: Foundation | 14 | ~3 weeks |
| Phase 2: Core Diaries | 17 | ~4 weeks |
| Phase 3: Blackboard | 10 | ~4 weeks |
| Phase 4: Long Drafts | 8 | ~4 weeks |
| Phase 5: Academic | 10 | ~4 weeks |
| Phase 6: Export/Backup | 6 | ~2 weeks |
| Phase 7: Polish | 9 | ~3 weeks |
| **Total** | **90** | **~26 weeks** |

---

## Dependency Graph (Critical Path)

```
0.1.1 (Vite setup)
├── 0.1.2 (Aliases) ─────────────────────────────────────────────┐
├── 0.1.3 (Tailwind) ─────────────────────────────────────────┐  │
├── 0.2.1 (Electron) ───────────────────────────────────────┐ │  │
│   └── 0.2.2 (Main process)                                │ │  │
│       └── 7.4.1 (Distribution)                            │ │  │
├── 0.3.1 (Vitest) ───────────────────────────────────────┐ │ │  │
│   └── 0.3.2 (Test utilities)                            │ │ │  │
└── 0.4.1 (Dexie) ──────────────────────────────────────┐ │ │ │  │
    └── 0.4.2 (Types) ───────────────────────────────┐  │ │ │ │  │
        └── 0.4.3 (Queries) ───────────────────────┐ │  │ │ │ │  │
            └── 0.5.2 (App store) ───────────────┐ │ │  │ │ │ │  │
                └── 1.2.2 (Shelf) ─────────────┐ │ │ │  │ │ │ │  │
                    └── 1.4.1 (Router)         │ │ │ │  │ │ │ │  │
                                               │ │ │ │  │ │ │ │  │
0.1.4 (Folders) ───────────────────────────────┴─┴─┴─┴──┴─┴─┴─┴──┘
    └── 1.1.1 (Modal) ──────────────────────────────────────┐
        └── 1.2.3 (Settings panel)                          │
        └── 2.4.3 (Passkey prompt)                          │
    └── 1.1.2 (Context menu) ───────────────────────────────┤
        └── 2.4.4 (Locking in menu)                         │
    └── 1.3.1 (TipTap) ─────────────────────────────────────┤
        └── 1.3.5 (DiaryEntry) ─────────────────────────────┤
            └── 1.3.6 (PersonalDiary)                       │
        └── 2.2.4 (DraftEditor)                             │
            └── 2.2.5 (Drafts)                              │
        └── 4.1.3 (SectionEditor)                           │
            └── 4.4.1 (LongDrafts)                          │
    └── 2.1.2 (TextBlock) ──────────────────────────────────┤
        └── 2.1.5 (ScratchpadPage)                          │
            └── 2.1.6 (Scratchpad)                          │
    └── 3.1.1 (Excalidraw) ─────────────────────────────────┤
        └── 3.1.3 (ExcalidrawWrapper)                       │
            └── 3.3.2 (Blackboard)                          │
                                                            │
All UI components ──────────────────────────────────────────┘
    └── 7.2.1 (Accessibility audit)
        └── 7.2.2 (Fix issues)
            └── 7.4.3 (Release)
```

---

## How to Use This Document

1. **Start with Phase 0**: Complete all infrastructure tasks before any features
2. **Follow dependencies**: Never start a task before its dependencies are complete
3. **Include tests**: Every task with testing requirements must have tests before marking complete
4. **Update progress**: Check off acceptance criteria as you complete them
5. **Track blockers**: Note any issues that prevent progress

---

*Document Version: 1.0*
*Last Updated: January 2026*
