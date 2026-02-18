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
  - [x] Custom font stack configured
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
  - [x] TipTap installed with starter-kit
  - [x] Placeholder extension added
  - [x] Basic extensions configured (bold, italic, lists)
  - [x] Editor renders and accepts input
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
  - [x] entries state array
  - [x] currentEntry state
  - [x] loadEntries action
  - [x] loadEntry action (by date)
  - [x] createEntry action
  - [x] updateEntry action
  - [x] Word count tracking
- **Testing**: Unit tests for all actions

#### Task 1.3.3: Create DatePicker Component
- **Description**: Date picker with calendar view
- **Dependencies**: 0.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Displays current date formatted
  - [x] Click opens calendar
  - [x] Calendar navigation (prev/next month)
  - [x] Date selection updates parent
  - [x] Keyboard accessible
  - [x] Date format configurable
- **Packages**: `npm install date-fns`
- **Testing**: Component tests

#### Task 1.3.4: Create EntryNavigation Component
- **Description**: Sidebar with entry list and navigation
- **Dependencies**: 1.3.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Lists entries by date
  - [x] Shows entry preview/word count
  - [x] Click navigates to entry
  - [x] Previous/Next buttons
  - [x] "Today" button
  - [x] Collapsible sidebar
- **Testing**: Component tests

#### Task 1.3.5: Create DiaryEntry Component
- **Description**: Main entry editor with date header
- **Dependencies**: 1.3.1, 1.3.3, 1.3.4
- **Effort**: L
- **Acceptance Criteria**:
  - [x] Date header with picker
  - [x] TipTap editor for content
  - [x] Lined paper background option
  - [x] Fixed font from settings
  - [x] Word count display
  - [x] Auto-save on change
- **Testing**: Component tests, integration tests

#### Task 1.3.6: Create PersonalDiary Container
- **Description**: Main container assembling diary components
- **Dependencies**: 1.3.2, 1.3.4, 1.3.5
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Loads entries on mount
  - [x] Displays entry navigation
  - [x] Shows current entry editor
  - [x] Handles date changes
  - [x] Applies paper texture from settings
- **Testing**: Integration tests
- **E2E**: Create and edit diary entry

### 1.4 Navigation and Routing

#### Task 1.4.1: Create App Router
- **Description**: Set up client-side routing
- **Dependencies**: 1.2.2, 1.3.6
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Shelf route (/)
  - [x] Personal Diary route (/personal-diary)
  - [x] Route params for document ID
  - [x] Back navigation works
  - [x] Deep linking supported
- **Note**: Use simple state-based routing (no react-router needed for Electron)

#### Task 1.4.2: Create Navigation Header
- **Description**: Header with back button and diary title
- **Dependencies**: 0.5.2
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Shows "← Shelf" back link
  - [x] Shows current diary name
  - [x] Keyboard shortcut (Ctrl+H) for home
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
  - [x] pages state array
  - [x] currentPageIndex state
  - [x] textBlocks Map (pageId → blocks)
  - [x] loadPages action
  - [x] createPage action
  - [x] deletePage action
  - [x] navigateToPage action
  - [x] findFreshPage action
  - [x] CRUD actions for text blocks
- **Testing**: Unit tests for all actions

#### Task 2.1.2: Create TextBlock Component
- **Description**: Free-position editable text block
- **Dependencies**: 0.1.3
- **Effort**: L
- **Acceptance Criteria**:
  - [x] Positioned absolutely by x,y coordinates
  - [x] contentEditable for editing
  - [x] Auto-expands as user types
  - [x] Draggable by edge
  - [x] Focus ring on focus
  - [x] Updates store on input
  - [x] Deletes if empty on blur
  - [x] Shows lock indicator when locked
- **Testing**: Component tests, drag tests

#### Task 2.1.3: Create PageStack Component
- **Description**: Visual page stack indicator on right edge
- **Dependencies**: 2.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Shows indicator for each page
  - [x] Darker shade for pages with content
  - [x] Highlights current page
  - [x] Click navigates to page
  - [x] Tooltip shows page number
- **Testing**: Component tests

#### Task 2.1.4: Create CategoryPicker Component
- **Description**: Dropdown to select page category
- **Dependencies**: 0.5.3
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Shows current category with color
  - [x] Dropdown lists all categories
  - [x] Selection updates page color
  - [x] Uses colors from settings
- **Testing**: Component tests

#### Task 2.1.5: Create ScratchpadPage Component
- **Description**: Single page canvas with text blocks
- **Dependencies**: 2.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Fixed size from settings
  - [x] Background color from category
  - [x] Click on empty space creates text block
  - [x] Renders all text blocks
  - [x] Page shadow/depth effect
- **Testing**: Component tests, integration tests

#### Task 2.1.6: Create Scratchpad Container
- **Description**: Main container with page navigation
- **Dependencies**: 2.1.1, 2.1.3, 2.1.4, 2.1.5
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Loads pages on mount
  - [x] Shows current page
  - [x] Page stack indicator
  - [x] Category picker
  - [x] Page count display
  - [x] Keyboard navigation (PageUp/Down)
  - [x] Ctrl+N creates new page
- **Testing**: Integration tests
- **E2E**: Create pages, add text, navigate

### 2.2 Drafts

#### Task 2.2.1: Create Drafts Store
- **Description**: Zustand store for drafts state
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] drafts state array
  - [x] currentDraft state
  - [x] loadDrafts action
  - [x] createDraft action
  - [x] updateDraft action
  - [x] deleteDraft action
  - [x] Sort by date/title/status
- **Testing**: Unit tests for all actions

#### Task 2.2.2: Create DraftList Component
- **Description**: Sidebar listing all drafts
- **Dependencies**: 2.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Lists drafts with title preview
  - [x] Shows status badge
  - [x] Shows word count
  - [x] Sort dropdown
  - [x] Click selects draft
  - [x] Right-click context menu
- **Testing**: Component tests

#### Task 2.2.3: Create StatusBadge Component
- **Description**: Visual badge for draft status
- **Dependencies**: 0.1.3
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Shows status text
  - [x] Color-coded (in-progress, review, complete)
  - [x] Click to cycle status
- **Testing**: Component tests

#### Task 2.2.4: Create DraftEditor Component
- **Description**: Title + body editor for drafts
- **Dependencies**: 1.3.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Title input field (large font)
  - [x] TipTap body editor
  - [x] Basic formatting toolbar
  - [x] Word count display
  - [x] Auto-save on change
  - [x] Soft page breaks
- **Testing**: Component tests

#### Task 2.2.5: Create Drafts Container
- **Description**: Main container with list and editor
- **Dependencies**: 2.2.1, 2.2.2, 2.2.4
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Loads drafts on mount
  - [x] Shows draft list in sidebar
  - [x] Shows selected draft in editor
  - [x] Handles create new draft
  - [x] Handles delete draft
- **Testing**: Integration tests
- **E2E**: Create, edit, delete drafts

### 2.3 Global Features

#### Task 2.3.1: Create usePasteHandler Hook
- **Description**: Hook to strip formatting from pasted content
- **Dependencies**: 0.1.4
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Intercepts paste event
  - [x] Extracts plain text
  - [x] Preserves line breaks
  - [x] Inserts with current styles
  - [x] Works with contentEditable and TipTap
- **Testing**: Hook tests with clipboard mocking

#### Task 2.3.2: Create useKeyboardShortcuts Hook
- **Description**: Global keyboard shortcut handler
- **Dependencies**: 0.1.4
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Matches Ctrl/Cmd + key combinations
  - [x] Supports Shift modifier
  - [x] Prevents default for matched shortcuts
  - [x] Handles special keys (PageUp, PageDown)
  - [x] Cleans up on unmount
- **Testing**: Hook tests with keyboard events

#### Task 2.3.3: Apply Paste Handler Globally
- **Description**: Integrate paste handler into all editors
- **Dependencies**: 2.3.1, 1.3.5, 2.1.2, 2.2.4
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Paste strips formatting in Personal Diary
  - [x] Paste strips formatting in Scratchpad text blocks
  - [x] Paste strips formatting in Drafts
- **Testing**: Integration tests for each diary

#### Task 2.3.4: Apply Keyboard Shortcuts Globally
- **Description**: Integrate keyboard shortcuts across app
- **Dependencies**: 2.3.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Ctrl+H goes to shelf
  - [x] Ctrl+, opens settings
  - [x] Ctrl+N creates new (page/entry/draft)
  - [x] PageUp/PageDown for navigation
  - [x] Ctrl+1/2/3 for headings
  - [x] Ctrl+B/I/U for formatting
- **Testing**: E2E tests for shortcuts

### 2.4 Content Locking

#### Task 2.4.1: Create Passkey Utilities
- **Description**: Cryptographic utilities for passkey
- **Dependencies**: 0.1.4
- **Effort**: M
- **Acceptance Criteria**:
  - [x] hashPasskey function (PBKDF2)
  - [x] verifyPasskey function
  - [x] Salt generation
  - [x] Hex encoding/decoding
- **Testing**: Unit tests for crypto functions

#### Task 2.4.2: Create useContentLocking Hook
- **Description**: Hook to manage content lock state
- **Dependencies**: 2.4.1, 0.5.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] isLocked state
  - [x] lock action (requires passkey set)
  - [x] unlock action (requires correct passkey)
  - [x] toggleLock action
  - [x] Stores lock state in database
- **Testing**: Hook tests

#### Task 2.4.3: Create PasskeyPrompt Component
- **Description**: Modal for entering passkey
- **Dependencies**: 1.1.1
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Password input field
  - [x] Show/hide toggle
  - [x] "Show hint" button
  - [x] Submit button
  - [x] Error message display
- **Testing**: Component tests

#### Task 2.4.4: Add Locking to Context Menu
- **Description**: Add lock/unlock options to context menu
- **Dependencies**: 1.1.2, 2.4.2, 2.4.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] "Lock" option when unlocked
  - [x] "Unlock" option when locked
  - [x] Lock prompts passkey setup if not set
  - [x] Unlock shows passkey prompt
  - [x] Locked content shows visual indicator
- **Testing**: Integration tests

#### Task 2.4.5: Integrate Locking in All Diaries
- **Description**: Add locking support to all components
- **Dependencies**: 2.4.4
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Scratchpad text blocks lockable
  - [x] Scratchpad pages lockable
  - [x] Diary entries lockable
  - [x] Drafts lockable
  - [x] Locked content not editable
  - [x] Locked content has visual indicator
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
  - [x] @excalidraw/excalidraw installed
  - [x] Basic Excalidraw renders
  - [x] Dark theme configured
  - [x] Custom background color works
- **Packages**:
  ```bash
  npm install @excalidraw/excalidraw
  ```

#### Task 3.1.2: Create Blackboard Store
- **Description**: Zustand store for blackboard state
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] canvas state (elements, viewport)
  - [x] loadCanvas action
  - [x] saveElements action (debounced)
  - [x] updateViewport action
  - [x] Index entries derived from elements
- **Testing**: Unit tests for all actions

#### Task 3.1.3: Create ExcalidrawWrapper Component
- **Description**: Wrapper component for Excalidraw
- **Dependencies**: 3.1.1, 3.1.2
- **Effort**: L
- **Acceptance Criteria**:
  - [x] Excalidraw renders with initial data
  - [x] Changes save to store
  - [x] Viewport state persists
  - [x] Custom UI options
  - [x] Grid toggle from settings
- **Testing**: Component tests

### 3.2 Index Panel

#### Task 3.2.1: Create IndexPanel Component
- **Description**: Auto-generated index from headings
- **Dependencies**: 3.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Collapsible panel
  - [x] Shows H1/H2/H3 hierarchy
  - [x] Updates in real-time
  - [x] Click navigates to element
  - [x] Indentation by level
- **Testing**: Component tests

#### Task 3.2.2: Implement Heading Detection
- **Description**: Detect headings in Excalidraw elements
- **Dependencies**: 3.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Parse text elements for heading markers
  - [x] Build hierarchical index
  - [x] Update on element changes
  - [x] Sort by y-position
- **Testing**: Unit tests for detection logic

### 3.3 Blackboard Assembly

#### Task 3.3.1: Create BlackboardToolbar Component
- **Description**: Toolbar with Blackboard-specific tools
- **Dependencies**: 1.1.3
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Tool selection buttons
  - [x] Color picker
  - [x] Stroke width selector
  - [x] Grid toggle
- **Testing**: Component tests

#### Task 3.3.2: Create Blackboard Container
- **Description**: Main container for Blackboard
- **Dependencies**: 3.1.3, 3.2.1, 3.3.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Loads canvas on mount
  - [x] Full-height layout
  - [x] Toolbar at top
  - [x] Index panel toggle
  - [x] Saves on change
- **Testing**: Integration tests
- **E2E**: Draw elements, navigate with index

### 3.4 Font Configuration

#### Task 3.4.1: Bundle Custom Fonts
- **Description**: Bundle and configure custom fonts
- **Dependencies**: 0.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Crimson Pro font bundled
  - [x] Inter font bundled
  - [x] Caveat font bundled
  - [x] JetBrains Mono font bundled
  - [x] @font-face declarations
  - [x] Fonts load correctly
- **Files**: Download from Google Fonts, add to `assets/fonts/`

#### Task 3.4.2: Create Font Selector Component
- **Description**: Component for selecting fonts
- **Dependencies**: 3.4.1, 0.5.3
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Shows available fonts
  - [x] Preview in actual font
  - [x] Selection updates setting
  - [x] Works in context menu
- **Testing**: Component tests

#### Task 3.4.3: Integrate Font Selection in Blackboard
- **Description**: Add font selection to Blackboard
- **Dependencies**: 3.4.2, 3.3.2
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Font picker in context menu
  - [x] Text elements use selected font
  - [x] Font persists with element
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
  - [x] documents state
  - [x] currentDocument state
  - [x] sections state (nested)
  - [x] loadDocument action
  - [x] createSection action
  - [x] updateSection action
  - [x] reorderSection action
  - [x] deleteSection action
- **Testing**: Unit tests for all actions

#### Task 4.1.2: Create TableOfContents Component
- **Description**: Navigable table of contents
- **Dependencies**: 4.1.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Auto-generated from sections
  - [x] Nested section display
  - [x] Click navigates to section
  - [x] Drag-and-drop reordering
  - [x] Section word counts
- **Testing**: Component tests

#### Task 4.1.3: Create SectionEditor Component
- **Description**: Editor for a single section
- **Dependencies**: 1.3.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Section title input
  - [x] TipTap body editor
  - [x] Footnote support
  - [x] Status indicator
  - [x] Section notes field
- **Testing**: Component tests

### 4.2 Footnotes

#### Task 4.2.1: Create TipTap Footnote Extension
- **Description**: Custom TipTap extension for footnotes
- **Dependencies**: 1.3.1
- **Effort**: L
- **Acceptance Criteria**:
  - [x] Footnote node type
  - [x] Footnote marker in text
  - [x] Footnote content at bottom
  - [x] Click jumps between marker and content
  - [x] Auto-numbering
- **Testing**: Extension tests

#### Task 4.2.2: Create FootnoteManager Component
- **Description**: UI for managing footnotes
- **Dependencies**: 4.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] List of footnotes
  - [x] Edit footnote content
  - [x] Delete footnote
  - [x] Navigate to footnote in text
- **Testing**: Component tests

### 4.3 Focus Mode

#### Task 4.3.1: Create FocusMode Component
- **Description**: Distraction-free writing mode
- **Dependencies**: 4.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Hides all UI except editor
  - [x] Typewriter mode (current line centered)
  - [x] Keyboard shortcut to toggle
  - [x] Smooth enter/exit animation
- **Testing**: Component tests

### 4.4 Long Drafts Assembly

#### Task 4.4.1: Create LongDrafts Container
- **Description**: Main container for Long Drafts
- **Dependencies**: 4.1.1, 4.1.2, 4.1.3, 4.3.1
- **Effort**: L
- **Acceptance Criteria**:
  - [x] Document list/selection
  - [x] TOC sidebar
  - [x] Section editor
  - [x] Focus mode toggle
  - [x] Document metadata
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
  - [x] citeproc-js installed
  - [x] Citation style files bundled (APA, MLA, Chicago)
  - [x] Basic citation formatting works
- **Packages**: Research best citation library for browser

#### Task 5.1.2: Create Citation Utilities
- **Description**: Utility functions for citations
- **Dependencies**: 5.1.1
- **Effort**: L
- **Acceptance Criteria**:
  - [x] formatCitation function
  - [x] formatBibliography function
  - [x] parseBibTeX function
  - [x] fetchFromDOI function
  - [x] Style switching
- **Testing**: Unit tests for each function

#### Task 5.1.3: Create CitationPicker Component
- **Description**: UI for inserting citations
- **Dependencies**: 5.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Search references
  - [x] Select reference(s)
  - [x] Page number input
  - [x] Insert formatted citation
  - [x] Keyboard shortcut (Ctrl+Shift+C)
- **Testing**: Component tests

### 5.2 Reference Library

#### Task 5.2.1: Create Academic Store
- **Description**: Zustand store for academic papers
- **Dependencies**: 0.5.1, 0.4.3
- **Effort**: L
- **Acceptance Criteria**:
  - [x] papers state
  - [x] currentPaper state
  - [x] bibliographyEntries state
  - [x] All CRUD actions
  - [x] Citation insertion action
- **Testing**: Unit tests

#### Task 5.2.2: Create BibliographyManager Component
- **Description**: UI for managing references
- **Dependencies**: 5.2.1
- **Effort**: L
- **Acceptance Criteria**:
  - [x] List all references
  - [x] Add reference (manual, DOI, BibTeX)
  - [x] Edit reference
  - [x] Delete reference
  - [x] Tag/folder organization
  - [x] Search references
- **Testing**: Component tests

#### Task 5.2.3: Create ReferenceLibrary Panel
- **Description**: Global reference library
- **Dependencies**: 5.2.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Separate from papers
  - [x] Import/export references
  - [x] Link to papers
- **Testing**: Component tests

### 5.3 Academic Paper Assembly

#### Task 5.3.1: Create AcademicSection Component
- **Description**: Section editor with academic features
- **Dependencies**: 4.1.3, 5.1.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Citation insertion
  - [x] Cross-references
  - [x] Figure/table numbering
  - [x] Academic formatting
- **Testing**: Component tests

#### Task 5.3.2: Create AcademicTemplate Selector
- **Description**: Template for paper structure
- **Dependencies**: 5.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] IMRAD template
  - [x] Custom structure
  - [x] Abstract/Keywords fields
  - [x] Author fields
- **Testing**: Component tests

#### Task 5.3.3: Create AcademicPaper Container
- **Description**: Main container for Academic Papers
- **Dependencies**: 5.3.1, 5.3.2, 5.2.2
- **Effort**: L
- **Acceptance Criteria**:
  - [x] Template selection
  - [x] Section navigation
  - [x] Bibliography panel
  - [x] Citation style selector
  - [x] Word/character count
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
  - [x] jsPDF or similar installed
  - [x] Text content exports
  - [x] Formatting preserved
  - [x] Page size options
  - [x] Headers/footers
- **Packages**: `npm install jspdf`
- **Testing**: Unit tests

#### Task 6.1.2: Create Word Export Utility
- **Description**: Export documents to .docx
- **Dependencies**: 0.1.1
- **Effort**: L
- **Acceptance Criteria**:
  - [x] docx library installed
  - [x] Text content exports
  - [x] Formatting preserved
  - [x] Styles applied
- **Packages**: `npm install docx`
- **Testing**: Unit tests

#### Task 6.1.3: Create ExportPanel Component
- **Description**: UI for export options
- **Dependencies**: 6.1.1, 6.1.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Format selection (PDF, Word, LaTeX)
  - [x] Options per format
  - [x] Progress indicator
  - [x] Download or save to location
- **Testing**: Component tests

### 6.2 Backup System

#### Task 6.2.1: Create Backup Utilities
- **Description**: Backup and restore functions
- **Dependencies**: 0.4.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] createBackup function (all tables)
  - [x] restoreBackup function
  - [x] Version validation
  - [x] JSON format
- **Testing**: Unit tests

#### Task 6.2.2: Create BackupPanel Component
- **Description**: UI for backup/restore
- **Dependencies**: 6.2.1
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Manual backup button
  - [x] Restore from file
  - [x] Backup location selector
  - [x] Auto-backup toggle
  - [x] Last backup timestamp
- **Testing**: Component tests

#### Task 6.2.3: Implement Auto-Backup
- **Description**: Automatic periodic backups
- **Dependencies**: 6.2.1, 0.5.3
- **Effort**: M
- **Acceptance Criteria**:
  - [x] Backup on schedule (hourly/daily/weekly)
  - [x] Background operation
  - [x] Notification on completion
  - [x] Cleanup old backups
- **Testing**: Integration tests

---

## Phase 7: Design System v2 UI Refactor
**Goal**: Execute the full visual refactor from `muwi-design-system.md` without changing data/store/business logic
**Duration**: Weeks 23-31

### 7.0 Execution Rules (Read Before Starting)

#### Task 7.0.1: Adopt Slice-by-Slice Refactor Flow
- **Description**: Execute Phase 7 as vertical slices, not as one large rewrite
- **Dependencies**: Phase 6 complete
- **Effort**: S
- **Acceptance Criteria**:
  - [x] Every slice follows sequence: implement -> test -> manual verify -> merge
  - [x] No slice leaves the app in a broken runtime state
  - [x] No data model/store logic changes are mixed into visual refactor commits
  - [x] Progress logged in `PROGRESS.md` after each slice

#### Task 7.0.2: Define Phase 7 Done Criteria
- **Description**: Lock explicit exit criteria to avoid scope drift
- **Dependencies**: 7.0.1
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] All CSS magic numbers in shared UI replaced by design tokens
  - [ ] All 6 diary types run inside the new shared shell
  - [ ] Command palette available globally (`Cmd+K` / `Ctrl+K`)
  - [ ] Accessibility checks pass (keyboard + ARIA + contrast + reduced motion)
  - [ ] Existing unit/integration tests updated and green

### 7.1 Foundation: Tokens, Themes, Fonts, CSS Architecture

#### Task 7.1.1: Create Style File Skeleton
- **Description**: Create style architecture required by design system
- **Dependencies**: 7.0.2
- **Effort**: S
- **Files to Create**:
  - `muwi/src/styles/tokens.css`
  - `muwi/src/styles/reset.css`
  - `muwi/src/styles/fonts.css`
  - `muwi/src/styles/utilities.css`
  - `muwi/src/styles/themes/light.css`
  - `muwi/src/styles/themes/dark.css`
- **Acceptance Criteria**:
  - [x] All files exist and are imported in deterministic order
  - [x] No token values duplicated across files

#### Task 7.1.2: Implement Token Set from Design System
- **Description**: Port spacing/radius/shadow/z-index/transition/type scale tokens
- **Dependencies**: 7.1.1
- **Effort**: M
- **Files to Modify**: `muwi/src/styles/tokens.css`
- **Acceptance Criteria**:
  - [x] Spacing scale and semantic aliases match design spec
  - [x] Radius, shadow, z-index, and transition tokens match design spec
  - [x] Typography tokens for chrome + content are present
  - [x] Motion-reduction media query exists

#### Task 7.1.3: Implement Light and Dark Theme Token Overrides
- **Description**: Add light/dark color token layers
- **Dependencies**: 7.1.2
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/styles/themes/light.css`
  - `muwi/src/styles/themes/dark.css`
- **Acceptance Criteria**:
  - [x] `:root` / `[data-theme="light"]` tokens complete
  - [x] `[data-theme="dark"]` overrides complete
  - [x] Blackboard and scratchpad-specific color tokens included
  - [ ] No component hard-codes theme colors

#### Task 7.1.4: Add CSS Reset and Base Element Rules
- **Description**: Normalize base rendering and remove conflicting defaults
- **Dependencies**: 7.1.1
- **Effort**: S
- **Files to Modify**: `muwi/src/styles/reset.css`
- **Acceptance Criteria**:
  - [x] Reset includes box-sizing, body margin, default typography base
  - [x] Buttons/inputs inherit font settings
  - [x] Focus outline defaults do not conflict with token focus ring

#### Task 7.1.5: Add Font Strategy (Geist chrome + content fonts)
- **Description**: Wire chrome/content font loading to match spec
- **Dependencies**: 7.1.1
- **Effort**: S
- **Files to Modify**:
  - `muwi/package.json`
  - `muwi/src/styles/fonts.css`
- **Acceptance Criteria**:
  - [x] Geist packages installed (`@fontsource/geist-sans`, `@fontsource/geist-mono`)
  - [x] Existing content fonts retained (Inter, Crimson Pro, JetBrains Mono, Caveat)
  - [ ] `font-display: swap` behavior retained

#### Task 7.1.6: Wire Global Style Imports and Decompose `index.css`
- **Description**: Move token/theme/font ownership out of `index.css`
- **Dependencies**: 7.1.2, 7.1.3, 7.1.4, 7.1.5
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/main.tsx`
  - `muwi/src/index.css`
- **Acceptance Criteria**:
  - [x] `main.tsx` imports style stack in stable order
  - [x] `index.css` reduced to app-specific/editor-specific rules only
  - [x] App renders with no missing variable warnings

#### Task 7.1.7: Add Tailwind Token Mapping Layer
- **Description**: Expose token names to Tailwind usage pattern used in repo
- **Dependencies**: 7.1.2, 7.1.3
- **Effort**: M
- **Files to Modify**:
  - `muwi/tailwind.config.ts` (if needed for current Tailwind mode)
  - `muwi/src/styles/utilities.css`
- **Acceptance Criteria**:
  - [x] Token-backed color/spacing/radius/shadow utilities are available
  - [x] Mapping works with the project's active Tailwind v4 setup (`@import "tailwindcss"`) without breaking build
  - [x] Existing component classes continue to compile
  - [x] No breaking changes to existing tests due to class generation

#### Task 7.1.8: Add Foundation Style Tests
- **Description**: Ensure token and theme wiring remain stable
- **Dependencies**: 7.1.6, 7.1.7
- **Effort**: S
- **Files to Create**:
  - `muwi/src/styles/tokens.test.ts`
  - `muwi/src/styles/theme-switching.test.tsx`
- **Acceptance Criteria**:
  - [x] Tests confirm key CSS variables exist
  - [x] Tests confirm `[data-theme]` switching updates effective values

#### Task 7.1.9: Extract Editor Base Styles from `index.css`
- **Description**: Move TipTap/editor styles into dedicated stylesheet(s) to avoid global sprawl
- **Dependencies**: 7.1.6
- **Effort**: S
- **Files to Create/Modify**:
  - `muwi/src/styles/editor.css` (create)
  - `muwi/src/index.css`
  - `muwi/src/main.tsx`
- **Acceptance Criteria**:
  - [x] Editor heading/list/code/placeholder styles moved out of `index.css`
  - [x] Editor visuals remain unchanged before diary-specific refinements
  - [x] No global style regressions in non-editor components

### 7.2 Theme Runtime

#### Task 7.2.1: Implement Theme Resolver Utility
- **Description**: Resolve effective theme from `light|dark|system`
- **Dependencies**: 7.1.3
- **Effort**: S
- **Files to Create**: `muwi/src/utils/theme.ts`
- **Acceptance Criteria**:
  - [x] Utility resolves theme based on settings + `prefers-color-scheme`
  - [x] Utility supports realtime OS theme change handling

#### Task 7.2.2: Apply Theme to `<html data-theme>`
- **Description**: Drive theme via DOM attribute as single source
- **Dependencies**: 7.2.1
- **Effort**: S
- **Files to Modify**: `muwi/src/App.tsx`
- **Acceptance Criteria**:
  - [x] `<html>` gets `data-theme="light|dark"`
  - [x] `color-scheme` is set to match effective theme
  - [x] No full-page reload needed on theme toggle

#### Task 7.2.3: Wire Settings Theme State to Runtime
- **Description**: Ensure persisted settings fully control runtime theme
- **Dependencies**: 7.2.2, 0.5.3
- **Effort**: S
- **Files to Modify**:
  - `muwi/src/stores/settingsStore.ts`
  - `muwi/src/components/shelf/SettingsPanel.tsx`
- **Acceptance Criteria**:
  - [x] Settings exposes Light, Dark, System options
  - [x] Theme preference persists and rehydrates correctly
  - [x] System mode reacts to OS theme changes after app startup

#### Task 7.2.4: Add Theme Integration Tests
- **Description**: Validate theme behavior across render/reload flow
- **Dependencies**: 7.2.3
- **Effort**: S
- **Files to Modify**:
  - `muwi/src/components/shelf/SettingsPanel.test.tsx`
  - `muwi/src/stores/settingsStore.test.ts`
- **Acceptance Criteria**:
  - [x] Tests cover all three theme modes
  - [x] Tests cover persisted reload behavior

#### Task 7.2.5: Remove Legacy Theme Branching in Components
- **Description**: Replace ad-hoc theme checks with token-driven styles
- **Dependencies**: 7.2.2
- **Effort**: M
- **Acceptance Criteria**:
  - [x] No component branches on literal light/dark color values
  - [x] Components rely on CSS variables for appearance

### 7.3 Shared Shell Refactor (Three-Region Model)

#### Task 7.3.1: Build `TitleBar` Component
- **Description**: Implement Electron-aware title bar per spec
- **Dependencies**: 7.1.6
- **Effort**: S
- **Files to Create**:
  - `muwi/src/components/common/TitleBar/TitleBar.tsx`
  - `muwi/src/components/common/TitleBar/index.ts`
- **Acceptance Criteria**:
  - [x] Height and typography match tokenized title bar spec
  - [x] macOS drag region behavior preserved
  - [x] Context label shows `MUWI` or `MUWI — {Diary}`

#### Task 7.3.2: Build Generic `Sidebar` Shell Component
- **Description**: Create standardized left-region container
- **Dependencies**: 7.3.1
- **Effort**: M
- **Files to Create**:
  - `muwi/src/components/common/Sidebar/Sidebar.tsx`
  - `muwi/src/components/common/Sidebar/index.ts`
- **Acceptance Criteria**:
  - [x] Width = 240px open, collapsible to hidden
  - [x] Header/body/footer slots available
  - [x] Shared item styles use tokens and support active/hover states

#### Task 7.3.3: Build Generic `StatusBar` Component
- **Description**: Create shared bottom information strip
- **Dependencies**: 7.3.1
- **Effort**: S
- **Files to Create**:
  - `muwi/src/components/common/StatusBar/StatusBar.tsx`
  - `muwi/src/components/common/StatusBar/index.ts`
- **Acceptance Criteria**:
  - [x] Height/padding/border match tokenized status bar spec
  - [x] Supports left and right slot content
  - [x] Includes `role="status"` with polite updates

#### Task 7.3.4: Build Generic `RightPanel` Component
- **Description**: Create on-demand right panel surface
- **Dependencies**: 7.3.1
- **Effort**: M
- **Files to Create**:
  - `muwi/src/components/common/RightPanel/RightPanel.tsx`
  - `muwi/src/components/common/RightPanel/index.ts`
- **Acceptance Criteria**:
  - [x] Width = 280px and slide-in animation matches tokens
  - [x] Header includes title + close affordance
  - [x] Panel can host subviews with optional back control

#### Task 7.3.5: Refactor `DiaryLayout` to Slot-Based Shell
- **Description**: Replace current top-nav layout with three-region structure
- **Dependencies**: 7.3.2, 7.3.3, 7.3.4
- **Effort**: L
- **Files to Modify**:
  - `muwi/src/components/common/DiaryLayout/DiaryLayout.tsx`
  - `muwi/src/components/common/index.ts`
- **Acceptance Criteria**:
  - [x] Layout exposes explicit slots: sidebar, toolbar, canvas, status, right panel
  - [x] Canvas region remains centered and width-constrained by tokens
  - [x] Sidebar and right panel can toggle independently

#### Task 7.3.6: Extend App Store for Shell UI State
- **Description**: Add shell controls needed by new layout
- **Dependencies**: 7.3.5
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/stores/appStore.ts`
  - `muwi/src/stores/appStore.test.ts`
- **Acceptance Criteria**:
  - [x] Sidebar open/close defaults correct for diary view
  - [x] Right panel state includes open, panel type, and context
  - [x] Existing store consumers remain compatible

#### Task 7.3.7: Update Layout-Level Tests
- **Description**: Cover shell behavior before diary migrations
- **Dependencies**: 7.3.6
- **Effort**: S
- **Files to Create/Modify**:
  - `muwi/src/components/common/DiaryLayout/DiaryLayout.test.tsx` (create if absent)
  - `muwi/src/components/common/NavigationHeader/NavigationHeader.test.tsx`
- **Acceptance Criteria**:
  - [x] Tests verify sidebar collapse/expand
  - [x] Tests verify right panel mount/unmount behavior
  - [x] Tests verify toolbar/status bar slot rendering

#### Task 7.3.8: Normalize Diary Module Pathing
- **Description**: Remove naming ambiguity between `PersonalDiary` and `personal-diary` module paths
- **Dependencies**: 7.3.5
- **Effort**: S
- **Files to Modify**:
  - `muwi/src/components/diaries/index.ts`
  - `muwi/src/components/diaries/personal-diary/index.ts`
  - imports referencing duplicated aliases
- **Acceptance Criteria**:
  - [x] Single canonical import path for Personal Diary modules
  - [x] No duplicate barrel paths causing confusion during refactor
  - [x] All tests continue passing after path normalization

### 7.4 Shared UI Primitives and Overlays

#### Task 7.4.1: Rebuild Button Variants
- **Description**: Standardize `primary|secondary|ghost|danger` variants
- **Dependencies**: 7.1.2
- **Effort**: M
- **Files to Create**:
  - `muwi/src/components/common/Button/Button.tsx`
  - `muwi/src/components/common/Button/index.ts`
  - `muwi/src/components/common/Button/Button.test.tsx`
- **Acceptance Criteria**:
  - [x] Sizes 28/32/36 implemented
  - [x] Focus ring uses tokenized double-ring
  - [x] Disabled and active states match spec

#### Task 7.4.2: Rebuild Form Input Primitives
- **Description**: Standardize text input/select/toggle controls
- **Dependencies**: 7.4.1
- **Effort**: M
- **Files to Create**:
  - `muwi/src/components/common/FormControls/FormControls.tsx`
  - `muwi/src/components/common/FormControls/index.ts`
  - `muwi/src/components/common/FormControls/FormControls.test.tsx`
- **Acceptance Criteria**:
  - [x] Input, select, and toggle match height/radius/focus/error states
  - [x] Placeholder and disabled styles use token values
  - [x] Keyboard and screen reader behavior verified

#### Task 7.4.3: Refactor Modal to Spec
- **Description**: Update generic modal animations, structure, and focus trap behavior
- **Dependencies**: 7.1.2, 7.4.1
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/common/Modal/Modal.tsx`
  - `muwi/src/components/common/Modal/Modal.test.tsx`
- **Acceptance Criteria**:
  - [x] Backdrop, border radius, shadow, and animations match tokens
  - [x] `Esc`, backdrop click, and explicit close button all close modal
  - [x] Focus returns to trigger element on close

#### Task 7.4.4: Refactor Context Menu to Spec
- **Description**: Update context menu visual and keyboard behavior
- **Dependencies**: 7.4.1
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/common/ContextMenu/ContextMenu.tsx`
  - `muwi/src/components/common/ContextMenu/ContextMenu.test.tsx`
- **Acceptance Criteria**:
  - [x] Item sizing, hover, disabled, separator, destructive styles match spec
  - [x] Submenu behavior remains functional
  - [x] Keyboard dismissal and focus behavior verified

#### Task 7.4.5: Refactor Toolbar Component to Group Model
- **Description**: Align toolbar visuals and behavior to grouped action spec
- **Dependencies**: 7.4.1
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/common/Toolbar/Toolbar.tsx`
  - `muwi/src/components/common/Toolbar/Toolbar.test.tsx`
- **Acceptance Criteria**:
  - [x] 44px toolbar lane with 28px controls
  - [x] Group separators rendered as subtle 1px lines
  - [x] Active formatting states use accent tokens
  - [x] Horizontal overflow scroll support preserved

#### Task 7.4.6: Implement Toast Notification System
- **Description**: Add shared toast container for non-blocking feedback
- **Dependencies**: 7.4.1
- **Effort**: M
- **Files to Create**:
  - `muwi/src/components/common/Toast/ToastProvider.tsx`
  - `muwi/src/components/common/Toast/Toast.tsx`
  - `muwi/src/components/common/Toast/index.ts`
  - `muwi/src/components/common/Toast/Toast.test.tsx`
- **Acceptance Criteria**:
  - [ ] Bottom-center position, tokenized visuals, and icon slot implemented
  - [ ] Auto-dismiss = 4s with pause-on-hover/focus
  - [ ] Supports success/warning/error/info variants

#### Task 7.4.7: Rebuild Settings Modal Layout
- **Description**: Convert settings UI to left-nav + content-pane structure
- **Dependencies**: 7.4.2, 7.4.3
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/shelf/SettingsPanel.tsx`
  - `muwi/src/components/shelf/SettingsPanel.test.tsx`
- **Acceptance Criteria**:
  - [ ] 640x480 layout with 160px nav rail implemented
  - [ ] Nav items follow sidebar item interaction model
  - [ ] Existing settings controls remain functional

#### Task 7.4.8: Replace Inline Style Objects in Shared Components
- **Description**: Move shared component styling to classes/tokenized CSS
- **Dependencies**: 7.4.1 through 7.4.7
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Shared components do not rely on literal inline color/spacing values
  - [ ] Styling is token-driven and easy to audit

#### Task 7.4.9: Refactor Export/Backup Panels to Tokenized Surfaces
- **Description**: Migrate highly styled panel components to design-system tokens
- **Dependencies**: 7.4.1 through 7.4.8
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/common/ExportPanel/ExportPanel.tsx`
  - `muwi/src/components/common/BackupPanel/BackupPanel.tsx`
  - related tests in both folders
- **Acceptance Criteria**:
  - [ ] No hard-coded color literals remain in these panels
  - [ ] Layout/controls use shared button/input patterns where applicable
  - [ ] Existing export/backup behavior and tests remain intact

#### Task 7.4.10: Refactor Passkey/ErrorBoundary/FontSelector Visuals
- **Description**: Tokenize remaining shared utility components with heavy inline styling
- **Dependencies**: 7.4.1 through 7.4.8
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/common/PasskeyPrompt/PasskeyPrompt.tsx`
  - `muwi/src/components/common/ErrorBoundary/ErrorBoundary.tsx`
  - `muwi/src/components/common/FontSelector/FontSelector.tsx`
- **Acceptance Criteria**:
  - [ ] Components use shared tokens and focus treatments
  - [ ] Accessibility roles and labels preserved or improved
  - [ ] Existing tests updated and passing

### 7.5 Shelf (Homepage) Rebuild

#### Task 7.5.1: Install and Wire Lucide Icons
- **Description**: Replace emoji/icon drift with Lucide system
- **Dependencies**: 7.1.6
- **Effort**: S
- **Files to Modify**:
  - `muwi/package.json`
  - `muwi/src/components/shelf/DiaryCard.tsx`
- **Acceptance Criteria**:
  - [ ] `lucide-react` installed
  - [ ] All 6 diary types mapped to spec icons
  - [ ] Icon sizing for shelf cards uses 24px

#### Task 7.5.2: Normalize Diary Card Structure
- **Description**: Rebuild card layout to title/description/meta hierarchy
- **Dependencies**: 7.5.1
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/shelf/DiaryCard.tsx`
  - `muwi/src/components/shelf/DiaryCard.test.tsx`
- **Acceptance Criteria**:
  - [ ] Card visual treatment matches border/radius/shadow specs
  - [ ] No diary-specific card background colors
  - [ ] Hover/active/selected states match transition spec

#### Task 7.5.3: Add Metadata Line from Real Counts + Relative Time
- **Description**: Populate card metadata line with meaningful values
- **Dependencies**: 7.5.2, 0.4.3
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/shelf/DiaryCard.tsx`
  - `muwi/src/components/shelf/Shelf.tsx`
- **Acceptance Criteria**:
  - [ ] Metadata format: `{count} {unit} · {relative_time}`
  - [ ] Empty diary shows `No entries yet` style copy
  - [ ] Relative time uses `date-fns` distance formatting

#### Task 7.5.4: Rebuild Shelf Header and Grid Layout
- **Description**: Align shelf structure to MUWI v2 layout rules
- **Dependencies**: 7.5.2
- **Effort**: M
- **Files to Modify**: `muwi/src/components/shelf/Shelf.tsx`
- **Acceptance Criteria**:
  - [ ] Header shows `MUWI` without subtitle
  - [ ] Grid max width = 960px
  - [ ] Grid columns: 4 (>=1024), 3 (>=768), 2 (<768)
  - [ ] Padding and spacing use token aliases

#### Task 7.5.5: Add Bottom Command Palette Hint
- **Description**: Add subtle bottom hint for keyboard discovery
- **Dependencies**: 7.5.4
- **Effort**: S
- **Files to Modify**: `muwi/src/components/shelf/Shelf.tsx`
- **Acceptance Criteria**:
  - [ ] Hint text appears at bottom area on shelf
  - [ ] Styling uses tertiary text token and xs size

#### Task 7.5.6: Implement Shelf -> Diary Transition
- **Description**: Add non-jarring navigation animation sequence
- **Dependencies**: 7.5.4, 7.3.5
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Card highlight + fade out + diary fade in sequence implemented
  - [ ] Transition total remains under ~300ms
  - [ ] No blank screen during transition

#### Task 7.5.7: Add Return Highlight for Last Opened Diary
- **Description**: Improve user orientation when returning to shelf
- **Dependencies**: 7.5.6
- **Effort**: S
- **Files to Modify**:
  - `muwi/src/stores/appStore.ts`
  - `muwi/src/components/shelf/Shelf.tsx`
- **Acceptance Criteria**:
  - [ ] Last-opened diary card has selected state for ~2 seconds after return
  - [ ] State clears automatically and does not persist incorrectly

#### Task 7.5.8: Add Shelf Regression Tests
- **Description**: Lock shelf behavior before diary migrations
- **Dependencies**: 7.5.1 through 7.5.7
- **Effort**: S
- **Files to Modify**:
  - `muwi/src/components/shelf/Shelf.test.tsx`
  - `muwi/src/components/shelf/DiaryCard.test.tsx`
- **Acceptance Criteria**:
  - [ ] Tests cover icon rendering, metadata, layout mode, and selected return state

### 7.6 Command Palette

#### Task 7.6.1: Add Command Palette State to App Store
- **Description**: Add open/close/query/history state
- **Dependencies**: 7.3.6
- **Effort**: S
- **Files to Modify**: `muwi/src/stores/appStore.ts`
- **Acceptance Criteria**:
  - [ ] Store tracks open state, query, highlighted index, recent commands
  - [ ] Actions exist for open/close/update/execute

#### Task 7.6.2: Create Command Registry
- **Description**: Build declarative command definition list
- **Dependencies**: 7.6.1
- **Effort**: M
- **Files to Create**: `muwi/src/utils/commands.ts`
- **Acceptance Criteria**:
  - [ ] Commands grouped by Navigation/Actions/Settings
  - [ ] Supports scope filtering by current diary/context
  - [ ] Includes starter command set from spec

#### Task 7.6.3: Build Command Palette Component
- **Description**: Implement modal/combobox UI with tokenized styling
- **Dependencies**: 7.6.2, 7.4.3
- **Effort**: M
- **Files to Create**:
  - `muwi/src/components/common/CommandPalette/CommandPalette.tsx`
  - `muwi/src/components/common/CommandPalette/index.ts`
- **Acceptance Criteria**:
  - [ ] Palette position/size/background/shadow match spec
  - [ ] Input and results list implement combobox/listbox roles
  - [ ] Keyboard controls (`↑↓`, `Enter`, `Esc`) work

#### Task 7.6.4: Wire Global Shortcut and App Mount Point
- **Description**: Open palette from anywhere using keyboard shortcut
- **Dependencies**: 7.6.3
- **Effort**: S
- **Files to Modify**:
  - `muwi/src/hooks/useGlobalShortcuts.ts`
  - `muwi/src/App.tsx`
- **Acceptance Criteria**:
  - [ ] `Cmd+K` / `Ctrl+K` opens palette globally
  - [ ] Palette closes on outside click and on command execution

#### Task 7.6.5: Implement Fuzzy Search + Recents
- **Description**: Improve command discovery and reuse
- **Dependencies**: 7.6.3
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Query performs fuzzy matching on command labels/aliases
  - [ ] Empty query shows up to 3 recent commands
  - [ ] Context-aware commands appear first when in diary

#### Task 7.6.6: Add Command Palette Tests
- **Description**: Protect keyboard-first behavior
- **Dependencies**: 7.6.4, 7.6.5
- **Effort**: S
- **Files to Create/Modify**:
  - `muwi/src/components/common/CommandPalette/CommandPalette.test.tsx`
  - `muwi/src/hooks/useGlobalShortcuts.test.tsx`
- **Acceptance Criteria**:
  - [ ] Tests cover open/close/search/navigation/execute
  - [ ] Tests cover context-aware command ordering

### 7.7 Scratchpad UI Migration

#### Task 7.7.1: Migrate Scratchpad to New Shell Slots
- **Description**: Move Scratchpad layout onto new `DiaryLayout` slots
- **Dependencies**: 7.3.5, 7.4.5
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/scratchpad/Scratchpad.tsx`
- **Acceptance Criteria**:
  - [ ] Sidebar, toolbar, canvas, and status bar rendered via shared shell
  - [ ] No legacy top-header layout remains

#### Task 7.7.2: Implement Scratchpad Sidebar and Toolbar Specs
- **Description**: Align pages list, category indicators, and page controls
- **Dependencies**: 7.7.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Sidebar has `PAGES` label and category dots
  - [ ] Bottom action shows `+ New Page`
  - [ ] Toolbar contains only category + page controls

#### Task 7.7.3: Implement Fixed Page Canvas Visuals
- **Description**: Match fixed page size and stack indicator behavior
- **Dependencies**: 7.7.1
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/diaries/scratchpad/ScratchpadPage.tsx`
  - `muwi/src/components/diaries/scratchpad/PageStack.tsx`
  - `muwi/src/components/diaries/scratchpad/TextBlock.tsx`
- **Acceptance Criteria**:
  - [ ] Page size 400x600 centered in canvas region
  - [ ] Page background follows category tint tokens
  - [ ] Text block hover/drag/lock visuals match spec

#### Task 7.7.4: Add Scratchpad Status Bar + Empty State
- **Description**: Add diary-specific status and first-use guidance
- **Dependencies**: 7.7.2, 7.7.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Status bar shows `Page {n} of {total} · {category}`
  - [ ] Empty state matches icon/headline/body/action pattern

### 7.8 Blackboard UI Migration

#### Task 7.8.1: Migrate Blackboard to New Shell Slots
- **Description**: Move Blackboard onto shared shell with right panel support
- **Dependencies**: 7.3.5
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/blackboard/Blackboard.tsx`
- **Acceptance Criteria**:
  - [ ] Blackboard uses shell slots for sidebar/toolbar/canvas/status/right panel
  - [ ] Existing Excalidraw integration remains functional

#### Task 7.8.2: Implement Index Sidebar and Toolbar Groups
- **Description**: Align Blackboard controls to design grouping
- **Dependencies**: 7.8.1
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/diaries/blackboard/IndexPanel.tsx`
  - `muwi/src/components/diaries/blackboard/BlackboardToolbar.tsx`
- **Acceptance Criteria**:
  - [ ] Sidebar shows heading tree with empty guidance text
  - [ ] Toolbar groups match tool/stroke/font/zoom model

#### Task 7.8.3: Apply Blackboard Canvas Theme Tokens
- **Description**: Ensure blackboard canvas and grid visuals use dedicated tokens
- **Dependencies**: 7.1.3
- **Effort**: S
- **Files to Modify**: `muwi/src/components/diaries/blackboard/ExcalidrawWrapper.tsx`
- **Acceptance Criteria**:
  - [ ] Blackboard canvas always dark regardless of app theme
  - [ ] Grid tone and text defaults follow Blackboard token set

#### Task 7.8.4: Add Blackboard Status Bar + Empty State
- **Description**: Add zoom/info strip and first-use copy
- **Dependencies**: 7.8.2, 7.8.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Status bar left shows zoom percentage
  - [ ] Empty state matches diary icon + guidance action

### 7.9 Personal Diary UI Migration

#### Task 7.9.1: Migrate Personal Diary to New Shell Slots
- **Description**: Adopt shared shell while preserving diary behavior
- **Dependencies**: 7.3.5
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/PersonalDiary/PersonalDiary.tsx`
- **Acceptance Criteria**:
  - [ ] Sidebar, toolbar lane, canvas, and status bar run through shell slots
  - [ ] Existing entry CRUD behavior unchanged

#### Task 7.9.2: Implement Date-Grouped Sidebar + Today Action
- **Description**: Align sidebar structure and actions to spec
- **Dependencies**: 7.9.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Sidebar entries grouped by month/year headers
  - [ ] Optional mood indicator support retained
  - [ ] Bottom action is `Today`

#### Task 7.9.3: Apply Warm Canvas + Typographic Constraints
- **Description**: Personal Diary canvas must feel journal-like and constrained
- **Dependencies**: 7.1.3, 7.9.1
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Canvas uses warm background token
  - [ ] Line height defaults to relaxed setting
  - [ ] Toolbar limited to Undo/Redo + B/I/U + font display

#### Task 7.9.4: Add Personal Diary Status Bar + Empty State
- **Description**: Add date and reading metrics in status strip
- **Dependencies**: 7.9.2, 7.9.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Left side shows formatted entry date
  - [ ] Right side shows word count + read time

### 7.10 Drafts UI Migration

#### Task 7.10.1: Migrate Drafts to New Shell Slots
- **Description**: Move Drafts layout to shared shell
- **Dependencies**: 7.3.5
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/drafts/Drafts.tsx`
- **Acceptance Criteria**:
  - [ ] Draft list in sidebar slot
  - [ ] Editor canvas in canvas slot
  - [ ] Status bar present

#### Task 7.10.2: Rebuild Draft Sidebar Visual Hierarchy
- **Description**: Align draft list rows and status dots to token system
- **Dependencies**: 7.10.1
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/diaries/drafts/DraftList.tsx`
  - `muwi/src/components/diaries/drafts/StatusBadge.tsx`
- **Acceptance Criteria**:
  - [ ] Rows use standardized sidebar item styles
  - [ ] Status dots map to in-progress/review/complete tokens
  - [ ] Sort controls remain functional

#### Task 7.10.3: Align Draft Editor Toolbar to Shared Model
- **Description**: Replace custom inline toolbar visuals with shared system
- **Dependencies**: 7.4.5, 7.10.1
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/drafts/DraftEditor.tsx`
- **Acceptance Criteria**:
  - [ ] Toolbar groups match Drafts spec
  - [ ] Button active states use accent token treatment

#### Task 7.10.4: Add Drafts Status Bar + Empty State
- **Description**: Add status strip and first-use state
- **Dependencies**: 7.10.2, 7.10.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Left side shows draft status text
  - [ ] Right side shows word count + read time

### 7.11 Long Drafts UI Migration

#### Task 7.11.1: Migrate Long Drafts to New Shell Slots
- **Description**: Move Long Drafts container to shared shell
- **Dependencies**: 7.3.5
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/long-drafts/LongDrafts.tsx`
- **Acceptance Criteria**:
  - [ ] Section tree occupies sidebar slot
  - [ ] Editor canvas and status bar integrated
  - [ ] Focus mode still works

#### Task 7.11.2: Refactor TOC Sidebar to Spec
- **Description**: Align section tree visuals and interactions
- **Dependencies**: 7.11.1
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/long-drafts/TableOfContents.tsx`
- **Acceptance Criteria**:
  - [ ] Collapsible tree with drag handles and counts
  - [ ] Active/hover/sidebar section label styling matches tokens

#### Task 7.11.3: Align Long Drafts Toolbar Groups
- **Description**: Apply spec toolbar groups including footnotes and focus
- **Dependencies**: 7.11.1, 7.4.5
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/diaries/long-drafts/LongDrafts.tsx`
  - `muwi/src/components/diaries/long-drafts/SectionEditor.tsx`
- **Acceptance Criteria**:
  - [ ] Grouping/order follows Long Drafts spec
  - [ ] Focus mode toggle icon/state reflect spec

#### Task 7.11.4: Implement Right Panel for TOC/Document Settings
- **Description**: Use on-demand right panel when sidebar collapsed or settings requested
- **Dependencies**: 7.3.4, 7.11.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] TOC panel view available in right panel
  - [ ] Document settings panel view available in right panel

#### Task 7.11.5: Add Long Drafts Status Bar + Empty State
- **Description**: Add section-aware metrics and empty guidance
- **Dependencies**: 7.11.2, 7.11.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Status bar shows `Section: {name}` and `{section_words}/{total_words}`
  - [ ] Empty state uses long-drafts specific copy/action

### 7.12 Academic UI Migration

#### Task 7.12.1: Migrate Academic Container to New Shell Slots
- **Description**: Move Academic diary layout to shared shell
- **Dependencies**: 7.3.5
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/academic/Academic.tsx`
- **Acceptance Criteria**:
  - [ ] Sidebar, toolbar, canvas, status bar, and right panel integrated
  - [ ] Existing citation/reference logic preserved

#### Task 7.12.2: Refactor Academic Sidebar Structure
- **Description**: Implement structure template and bibliography shortcut model
- **Dependencies**: 7.12.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Sidebar shows section template structure
  - [ ] Bibliography shortcut visible and actionable
  - [ ] New section/new paper actions available

#### Task 7.12.3: Align Academic Toolbar Groups and Controls
- **Description**: Apply full academic toolbar grouping from spec
- **Dependencies**: 7.12.1, 7.4.5
- **Effort**: M
- **Files to Modify**: `muwi/src/components/diaries/academic/AcademicSectionEditor.tsx`
- **Acceptance Criteria**:
  - [ ] Includes line spacing, citation, cross-reference, and table actions
  - [ ] Group separators and active states match tokenized toolbar

#### Task 7.12.4: Implement Academic Right Panel Workflows
- **Description**: Move bibliography/reference flows into right panel
- **Dependencies**: 7.12.1, 7.3.4
- **Effort**: M
- **Files to Modify**:
  - `muwi/src/components/diaries/academic/BibliographyManager.tsx`
  - `muwi/src/components/diaries/academic/ReferenceLibraryPanel.tsx`
  - `muwi/src/components/diaries/academic/CitationPicker.tsx`
- **Acceptance Criteria**:
  - [ ] Bibliography manager opens in right panel
  - [ ] Reference library opens in right panel
  - [ ] Citation style selector is available in panel context

#### Task 7.12.5: Apply Academic Canvas + Status Specs
- **Description**: Implement academic page simulation and metrics strip
- **Dependencies**: 7.12.1
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Page margins/header/footer zones visually represented
  - [ ] Default line spacing is double-spaced
  - [ ] Status bar shows citation style, page size, word/char metrics

### 7.13 Accessibility and Keyboard Compliance

#### Task 7.13.1: Keyboard Navigation Matrix Implementation
- **Description**: Ensure all global/editor shortcuts and focus traversal work
- **Dependencies**: 7.6.4, 7.7 through 7.12
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Global shortcuts (`Cmd/Ctrl+K`, `Cmd+,`, `Cmd+B`, `Cmd+1-6`, `Esc`) work
  - [ ] Editor shortcuts remain functional in each diary
  - [ ] Focus order follows visual order

#### Task 7.13.2: ARIA and Semantic Roles Pass
- **Description**: Add/fix semantic roles and labels per spec
- **Dependencies**: 7.7 through 7.12
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Toolbar, sidebar, modal, command palette, status, and toast roles applied
  - [ ] Decorative icons use `aria-hidden`
  - [ ] Interactive icons have explicit labels

#### Task 7.13.3: Focus Ring and Focus Restoration Pass
- **Description**: Standardize focus visibility and return behavior
- **Dependencies**: 7.4.1 through 7.4.6
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] All interactive controls show tokenized focus ring
  - [ ] Overlay close returns focus to trigger
  - [ ] Focus is never trapped outside active modal/palette

#### Task 7.13.4: Contrast and Color-State Validation
- **Description**: Verify WCAG contrast and non-color-only status indicators
- **Dependencies**: 7.1.3, 7.7 through 7.12
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Normal text meets 4.5:1 where required
  - [ ] Large text and controls meet applicable ratios
  - [ ] Status indicators combine text/icon with color

#### Task 7.13.5: Reduced Motion Compliance
- **Description**: Ensure all transitions respect reduced-motion preference
- **Dependencies**: 7.1.2, 7.5.6, 7.6.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Reduced-motion mode effectively neutralizes non-essential animations
  - [ ] Critical information remains visible without animation cues

#### Task 7.13.6: Accessibility Test Suite + Manual Audit
- **Description**: Automate and manually validate accessibility baseline
- **Dependencies**: 7.13.1 through 7.13.5
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Automated checks (axe or equivalent) run in CI
  - [ ] Manual keyboard-only audit complete
  - [ ] Manual screen reader spot-check complete

#### Task 7.13.7: Resolve Shortcut Conflicts and Document Final Map
- **Description**: Eliminate collisions in shortcut assignments across global and diary scopes
- **Dependencies**: 7.6.4, 7.13.1
- **Effort**: S
- **Files to Modify**:
  - `muwi/src/hooks/useKeyboardShortcuts.ts`
  - `muwi/src/hooks/useGlobalShortcuts.ts`
  - `muwi/src/components/shelf/SettingsPanel.tsx`
- **Acceptance Criteria**:
  - [ ] No conflicting shortcut combinations for different actions in same context
  - [ ] Shortcut map is visible in settings/help copy
  - [ ] Shortcut-related tests updated and passing

### 7.14 Responsive and Window-Resize Behavior

#### Task 7.14.1: Implement In-Diary Breakpoint Rules
- **Description**: Add responsive behavior for sidebar/right panel/canvas at width thresholds
- **Dependencies**: 7.3.5
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Behavior at `>=1200`, `960-1199`, `800-959`, `<800` matches spec
  - [ ] Sidebar overlays canvas below 800px

#### Task 7.14.2: Implement Shelf Grid Responsiveness
- **Description**: Enforce 4/3/2 column shelf layout thresholds
- **Dependencies**: 7.5.4
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Shelf cards reflow without overlap or clipping
  - [ ] Card minimum widths respect spec

#### Task 7.14.3: Enforce Electron Minimum Window Size
- **Description**: Ensure minimum app size matches design constraints
- **Dependencies**: 0.2.2
- **Effort**: S
- **Files to Modify**: `muwi/electron/main.ts`
- **Acceptance Criteria**:
  - [ ] Minimum window set to 800x600
  - [ ] UI remains usable at minimum size

#### Task 7.14.4: Add Responsive Regression Tests
- **Description**: Capture layout behavior across key widths
- **Dependencies**: 7.14.1, 7.14.2
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Test coverage for shelf and in-diary breakpoints
  - [ ] No major layout regressions across width classes

#### Task 7.14.5: Add E2E Resize Smoke Coverage
- **Description**: Validate critical layout behaviors through browser-level resize tests
- **Dependencies**: 7.14.1, 7.14.2
- **Effort**: S
- **Files to Modify**:
  - `muwi/e2e/smoke.spec.ts`
- **Acceptance Criteria**:
  - [ ] E2E smoke covers at least desktop and narrow-width transitions
  - [ ] Sidebar/right panel behavior at small widths is validated

### 7.15 Performance and Refactor Stabilization

#### Task 7.15.0: Fix Production Typecheck Boundary
- **Description**: Ensure production build typecheck excludes test-only globals and test files
- **Dependencies**: 7.1.6
- **Effort**: S
- **Files to Modify**:
  - `muwi/tsconfig.app.json`
  - `muwi/tsconfig.json`
  - build scripts if needed
- **Acceptance Criteria**:
  - [x] `npm run build` no longer fails on `describe`/`it`/`vi` test globals
  - [x] Test typing remains available in Vitest context
  - [x] Production bundle build path is cleanly separated from test typechecking

#### Task 7.15.1: Profile Initial Render and Diary Switching
- **Description**: Measure and record performance after refactor
- **Dependencies**: 7.12.5
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Baseline profile captured for startup and diary switch
  - [ ] Regressions documented with follow-up tasks if needed

#### Task 7.15.2: Remove Remaining Inline Style Bottlenecks
- **Description**: Eliminate remaining heavy inline style usage in diary components
- **Dependencies**: 7.7 through 7.12
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] No high-churn components create large inline style objects per render
  - [ ] Styling is largely class/token driven

#### Task 7.15.3: Add Code Splitting for Heavy Diary Views
- **Description**: Lazy-load heavy diary surfaces to improve startup time
- **Dependencies**: 7.15.1
- **Effort**: M
- **Files to Modify**: `muwi/src/App.tsx`
- **Acceptance Criteria**:
  - [ ] Heavy diaries loaded via dynamic import boundaries
  - [ ] Loading states are accessible and non-jarring

#### Task 7.15.4: Bundle and Runtime Verification
- **Description**: Validate bundle size and runtime behavior post-refactor
- **Dependencies**: 7.15.2, 7.15.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] Build completes with no new critical warnings
  - [ ] Runtime memory/CPU does not regress significantly from baseline

#### Task 7.15.5: Stabilize Tests Against Styling Refactors
- **Description**: Reduce brittle tests that assert raw style literals likely to change with tokenization
- **Dependencies**: 7.4.8, 7.15.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Style-literal assertions replaced with semantic assertions where possible
  - [ ] Snapshot noise reduced for style-only churn
  - [ ] Test suite remains green during ongoing UI migration

### 7.16 Distribution and Release (Post-Refactor)

#### Task 7.16.1: Configure Electron Builder Targets
- **Description**: Prepare production packaging for desktop platforms
- **Dependencies**: 7.15.4
- **Effort**: L
- **Acceptance Criteria**:
  - [ ] macOS build (DMG/zip)
  - [ ] Windows build (NSIS/portable)
  - [ ] Linux build (AppImage/deb)
  - [ ] Signing/update settings wired where applicable

#### Task 7.16.2: Update CI Workflow for Phase 7 Gates
- **Description**: Require tests/build checks for refactor stability
- **Dependencies**: 7.13.6, 7.15.4
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Unit + integration tests run on PR
  - [ ] E2E smoke tests run on PR/release branch
  - [ ] Build artifacts uploaded for tagged releases

#### Task 7.16.3: Release Automation and Changelog
- **Description**: Finalize automated release process with versioning
- **Dependencies**: 7.16.1, 7.16.2
- **Effort**: M
- **Acceptance Criteria**:
  - [ ] Semantic version workflow established
  - [ ] Changelog generated from commits
  - [ ] Release artifacts and update manifest published

#### Task 7.16.4: Final Phase 7 Go/No-Go Checklist
- **Description**: Explicit final verification before declaring Phase 7 complete
- **Dependencies**: 7.16.3
- **Effort**: S
- **Acceptance Criteria**:
  - [ ] All Phase 7 tasks either complete or explicitly deferred
  - [ ] UI matches design-system invariants (tokens, layout model, typography hierarchy)
  - [ ] No open P0/P1 regressions

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
| Phase 7: Design System v2 UI Refactor | 96 | ~10 weeks |
| **Total** | **178** | **~33 weeks** |

---

## Dependency Graph (Critical Path)

```
0.1.1 (Vite setup)
├── 0.1.2 (Aliases) ─────────────────────────────────────────────┐
├── 0.1.3 (Tailwind) ─────────────────────────────────────────┐  │
├── 0.2.1 (Electron) ───────────────────────────────────────┐ │  │
│   └── 0.2.2 (Main process)                                │ │  │
│       └── 7.16.1 (Distribution targets)                   │ │  │
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
All Phase 0-6 features complete ────────────────────────────┘
    └── 7.0.1 (Slice-by-slice execution)
        └── 7.1.1 (Style architecture)
            └── 7.1.6 (Global style wiring)
                └── 7.2.2 (Runtime theming)
                    └── 7.3.5 (Shared shell)
                        ├── 7.4.8 (Shared primitives complete)
                        ├── 7.5.8 (Shelf complete)
                        ├── 7.6.6 (Command palette complete)
                        └── 7.7-7.12 (Diary migrations)
                            └── 7.13.6 (Accessibility suite)
                                └── 7.14.5 (Responsive + resize e2e tests)
                                    └── 7.15.0 (Production build typecheck boundary)
                                        └── 7.15.5 (Performance + test stabilization)
                                            └── 7.16.4 (Go/No-Go checklist)
```

---

## How to Use This Document

1. **Start with Phase 0**: Complete all infrastructure tasks before any features
2. **Follow dependencies**: Never start a task before its dependencies are complete
3. **Include tests**: Every task with testing requirements must have tests before marking complete
4. **Update progress**: Check off acceptance criteria as you complete them
5. **Track blockers**: Note any issues that prevent progress

---

*Document Version: 1.4*
*Last Updated: February 2026*
