# Multi-Utility Writing Interface (MUWI)
## Design Documentation for Development

---

## 1. Project Overview

### 1.1 Vision Statement
A minimalist, distraction-free writing application that mimics the tactile experience of selecting and using physical notebooks. Each "diary" offers a distinct writing environment with purpose-specific tools, aesthetics, and functionality—bridging the gap between digital convenience and analog warmth.

### 1.2 Core Philosophy
- **Intentional friction**: Unlike typical apps that auto-create blank documents, MUWI preserves the physical notebook experience where users see their accumulated pages and consciously choose where to write
- **Purpose-built environments**: Each diary type is optimized for its specific use case, not a one-size-fits-all editor
- **Analog aesthetics, digital benefits**: Drawing/writing feels natural (imperfect), while data is safely stored and searchable

### 1.3 Target Users
- Writers who journal, draft, and brainstorm
- Creatives who think spatially and visually
- Academics who need structured long-form writing
- Anyone who misses the tactile experience of physical notebooks

---

## 2. Information Architecture

```
MUWI App
├── Homepage ("Shelf")
│   ├── Diary Grid/List View
│   │   ├── Diary 0: Scratchpad
│   │   ├── Diary 1: Blackboard
│   │   ├── Diary 2: Personal Diary
│   │   ├── Diary 3: Drafts
│   │   ├── Diary 4: Long Drafts
│   │   └── Diary 5: Academic Papers
│   └── Settings (gear icon)
│       ├── Global Preferences
│       ├── Per-Diary Configuration
│       ├── Backup & Export
│       └── Privacy & Security
└── Writing Interface (per diary)
    ├── Canvas/Page Area
    ├── Navigation (diary-specific)
    ├── Toolbar (diary-specific)
    └── Context Menu (right-click)
```

---

## 3. Feature Specifications by Diary Type

### 3.0 Diary 0: Scratchpad

**Purpose**: Quick capture of fleeting ideas, thoughts, to-dos—like a pocket notebook.

#### Canvas Specifications
| Property | Value |
|----------|-------|
| Canvas Type | Paginated (fixed-size pages) |
| Page Size | Small rectangular (configurable: ~400x600px default) |
| Page Orientation | Portrait (default), Landscape (optional) |
| Background | Solid color (category-coded) |

#### Core Features

**Free-position typing**
- Click anywhere on page to place cursor and begin typing
- Text boxes are created dynamically at click position
- Text boxes have no visible border by default (appears on hover/focus)
- Text boxes auto-expand as user types
- Multiple text boxes can exist on single page

**Color-coded categories**
```
Default Category Colors (user-customizable):
- Ideas: Soft yellow (#FFF9C4)
- To-dos: Soft green (#C8E6C9)
- Notes: Soft blue (#BBDEFB)
- Questions: Soft purple (#E1BEE7)
- Misc: Soft gray (#F5F5F5)
```

**Page management (Physical notebook feel)**
- Visual page stack indicator on right edge showing:
  - Total page count
  - Pages with content (slightly darker/thicker marks)
  - Current page position
- Page navigation:
  - Click on stack indicator to jump to page
  - Swipe/drag to flip pages
  - Keyboard: Page Up/Down, or customizable shortcuts
- "Find fresh page" button: jumps to first blank page
- Pages are NOT auto-created; user must explicitly "add page"
- Optional: slight page curl animation on flip

**Data Model: Scratchpad**
```typescript
interface ScratchpadPage {
  id: string;
  pageNumber: number;
  categoryColor: string;
  categoryName: string;
  textBlocks: TextBlock[];
  createdAt: DateTime;
  modifiedAt: DateTime;
  isLocked: boolean;
}

interface TextBlock {
  id: string;
  content: string;
  position: { x: number; y: number }; // relative to page
  width: number; // auto or fixed
  fontSize: number;
  createdAt: DateTime;
}

interface ScratchpadDiary {
  id: string;
  name: string;
  pages: ScratchpadPage[];
  settings: ScratchpadSettings;
}
```

---

### 3.1 Diary 1: Blackboard

**Purpose**: Complex idea mapping, concept breakdowns, visual thinking—like a massive chalkboard or whiteboard.

#### Canvas Specifications
| Property | Value |
|----------|-------|
| Canvas Type | Infinite canvas (pageless) |
| Canvas Size | Virtually unlimited (viewport-based rendering) |
| Background | Dark slate (#2D3436) or configurable |
| Grid | Optional subtle grid for alignment reference |

#### Core Features

**Infinite canvas navigation**
- Pan: Click-drag on empty space, or two-finger drag
- Zoom: Scroll wheel, pinch gesture, or zoom controls
- Minimap: Small overview in corner showing content distribution
- "Fit all" button: Zooms to show all content

**Free-position typing**
- Same as Scratchpad: click anywhere to type
- Text color defaults to light (for dark background)

**Sketch tools (imperfect drawing)**
- Tools available:
  - Freehand line
  - Straight line (with slight wobble)
  - Circle/Ellipse (hand-drawn feel)
  - Rectangle/Square (hand-drawn feel)
  - Arrow (straight or curved)
  - Table (simple grid)
- **Imperfection algorithm**: 
  - Lines have subtle variance (±2-4px deviation)
  - Shapes "approximate" perfection—close but not pixel-perfect
  - Corners slightly rounded naturally
  - Stroke width has subtle variation
- Color picker for strokes
- Stroke width: 3 presets (thin, medium, thick)

**Auto-generated index (Content Hierarchy)**
- Triggered when user creates "Heading" text blocks
- Index panel (collapsible) appears at top or side
- Index entries are clickable (navigates to that area)
- Hierarchy based on heading levels (H1, H2, H3)
- Index updates in real-time

```
Example Index:
├── Main Concept [H1]
│   ├── Sub-idea A [H2]
│   │   └── Detail 1 [H3]
│   └── Sub-idea B [H2]
└── Another Main Concept [H1]
```

**Font selection**
- User can configure 3-5 preferred fonts in settings
- Right-click > Fonts > [list of configured fonts]
- Default: System fonts that feel handwritten or clean

**Data Model: Blackboard**
```typescript
interface BlackboardCanvas {
  id: string;
  name: string;
  elements: CanvasElement[];
  viewportState: ViewportState;
  index: IndexEntry[];
  settings: BlackboardSettings;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'line' | 'circle' | 'rectangle' | 'arrow' | 'table' | 'freehand';
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  points?: Point[]; // for lines, freehand
  content?: string; // for text
  style: ElementStyle;
  headingLevel?: 1 | 2 | 3 | null; // for index generation
  isLocked: boolean;
  createdAt: DateTime;
}

interface ElementStyle {
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  fontFamily?: string;
  fontSize?: number;
  imperfectionSeed: number; // for consistent wobble
}

interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
}

interface IndexEntry {
  id: string;
  elementId: string;
  title: string;
  level: number;
  position: { x: number; y: number };
}
```

---

### 3.2 Diary 2: Personal Diary

**Purpose**: Daily journaling with date-based organization—like a traditional diary.

#### Canvas Specifications
| Property | Value |
|----------|-------|
| Canvas Type | Paginated (fixed-size pages) |
| Page Size | Standard (configurable: ~600x800px default) |
| Page Layout | Date header + lined/plain writing area |
| Background | Warm paper texture (cream, off-white) |

#### Core Features

**Date field**
- Automatically populated with current date on new entry
- Editable (for backdating entries)
- Format configurable: "January 18, 2026" / "18/01/2026" / "2026-01-18"
- Positioned at top of page, styled distinctly

**Traditional typing**
- Cursor starts at top-left of writing area (below date)
- Standard text flow: left-to-right, top-to-bottom
- Optional: Lined paper background for visual guidance
- Line height matches lines if lined paper enabled

**Fixed font**
- Single font configured in diary settings
- No font switching within diary (intentional constraint)
- Recommended: Serif or handwriting-style fonts

**Entry navigation**
- Calendar view for jumping to specific dates
- "Today" button
- Previous/Next entry arrows
- Entry list view (sidebar, optional)

**Data Model: Personal Diary**
```typescript
interface DiaryEntry {
  id: string;
  date: Date;
  content: string; // rich text or markdown
  wordCount: number;
  mood?: string; // optional mood tag
  isLocked: boolean;
  createdAt: DateTime;
  modifiedAt: DateTime;
}

interface PersonalDiary {
  id: string;
  name: string;
  entries: DiaryEntry[];
  settings: PersonalDiarySettings;
}

interface PersonalDiarySettings {
  font: string;
  dateFormat: string;
  showLines: boolean;
  paperTexture: string;
  paperColor: string;
}
```

---

### 3.3 Diary 3: Drafts

**Purpose**: Drafting medium-length thoughtful pieces—essays, blog posts, letters.

#### Canvas Specifications
| Property | Value |
|----------|-------|
| Canvas Type | Paginated (soft page breaks) |
| Page Size | Standard document (~650x900px) |
| Page Layout | Title field + body area |
| Background | Clean white or subtle texture |

#### Core Features

**Title field**
- Prominent position at top
- Larger font size than body
- Placeholder: "Untitled Draft"

**Traditional typing**
- Standard word processor flow
- Top-left start, standard paragraphs
- Soft page breaks (visual indicator, content flows)

**Limited font selection**
- 3-5 fonts configured in settings
- Quick switch via toolbar or right-click
- Fonts should be readable body fonts

**Draft management**
- Draft list in sidebar (collapsible)
- Sort by: Date modified, Date created, Title
- Draft status: In Progress, Review, Complete (optional tags)

**Basic formatting**
- Bold, Italic, Underline
- Headings (H1, H2, H3)
- Block quotes
- Bullet/numbered lists (minimal use encouraged)

**Data Model: Drafts**
```typescript
interface Draft {
  id: string;
  title: string;
  content: string; // rich text
  status: 'in-progress' | 'review' | 'complete';
  wordCount: number;
  tags: string[];
  isLocked: boolean;
  createdAt: DateTime;
  modifiedAt: DateTime;
}

interface DraftsDiary {
  id: string;
  name: string;
  drafts: Draft[];
  settings: DraftsSettings;
}
```

---

### 3.4 Diary 4: Long Drafts

**Purpose**: Long-form structured writing—books, theses, extensive reports.

#### Canvas Specifications
| Property | Value |
|----------|-------|
| Canvas Type | Paginated with structure |
| Page Size | Standard document |
| Page Layout | Title + Section hierarchy + Body |
| Background | Clean white |

#### Core Features

**Document structure**
- Title page option
- Table of Contents (auto-generated)
- Sections and subsections (collapsible in sidebar)
- Chapter/Part divisions

**Section management**
- Create new section: keyboard shortcut or menu
- Drag-and-drop reordering in sidebar
- Section word counts
- Section status/notes (for tracking progress)

**Footnotes & Endnotes**
- Inline footnote insertion (Ctrl/Cmd + Shift + F)
- Footnotes appear at page bottom or document end
- Clickable references (jump to/from)

**Advanced formatting**
- All Drafts features plus:
- Page breaks (hard)
- Headers and footers
- Page numbers
- Margin notes (optional)

**Focus mode**
- Hide all UI except current section
- Typewriter mode (current line stays centered)

**Data Model: Long Drafts**
```typescript
interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  parentId: string | null; // for nested sections
  footnotes: Footnote[];
  status: string;
  notes: string; // author's private notes
  wordCount: number;
  isLocked: boolean;
}

interface Footnote {
  id: string;
  marker: number;
  content: string;
  position: number; // character position in section
}

interface LongDraft {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  sections: Section[];
  settings: LongDraftSettings;
  metadata: DocumentMetadata;
  createdAt: DateTime;
  modifiedAt: DateTime;
}
```

---

### 3.5 Diary 5: Academic Papers

**Purpose**: Academic writing with citations, references, and formal structure.

#### Canvas Specifications
| Property | Value |
|----------|-------|
| Canvas Type | Paginated (strict) |
| Page Size | A4 or Letter (configurable) |
| Page Layout | Academic template |
| Background | White |

#### Core Features

**Academic structure templates**
- Abstract section
- Keywords field
- Introduction, Methods, Results, Discussion (IMRAD)
- Conclusion
- References/Bibliography
- Appendices
- Customizable structure

**Citation management**
- Inline citation insertion
- Citation styles: APA, MLA, Chicago, Harvard, IEEE
- Bibliography auto-generation
- Citation picker/search
- Import from: DOI, ISBN, BibTeX, manual entry

**Reference library**
- Personal reference database
- Organize with tags/folders
- Search references
- Import from Zotero, Mendeley, EndNote (nice-to-have)

**Formatting requirements**
- Margin controls
- Line spacing (1.0, 1.5, 2.0)
- Font size requirements
- Word/character count
- Figure and table numbering
- Cross-references

**Export options**
- PDF (formatted)
- Word (.docx)
- LaTeX (.tex)
- Plain text with citations

**Data Model: Academic Papers**
```typescript
interface AcademicPaper {
  id: string;
  title: string;
  authors: Author[];
  abstract: string;
  keywords: string[];
  sections: AcademicSection[];
  citations: Citation[];
  bibliography: BibliographyEntry[];
  figures: Figure[];
  tables: Table[];
  settings: AcademicSettings;
  metadata: PaperMetadata;
}

interface Citation {
  id: string;
  bibliographyEntryId: string;
  inTextFormat: string;
  pageNumbers?: string;
  positionInDocument: number;
}

interface BibliographyEntry {
  id: string;
  type: 'article' | 'book' | 'chapter' | 'conference' | 'website' | 'thesis' | 'other';
  authors: string[];
  title: string;
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  accessedDate?: Date;
  bibtex?: string;
}

interface AcademicSettings {
  citationStyle: 'apa7' | 'mla9' | 'chicago' | 'harvard' | 'ieee';
  pageSize: 'a4' | 'letter';
  margins: MarginSettings;
  lineSpacing: number;
  fontFamily: string;
  fontSize: number;
}
```

---

## 4. Global Features

### 4.1 Homepage ("Shelf")

**Visual design**
- Clean, minimal interface
- Diary representations as visual cards/book spines
- Subtle shadows and depth to evoke physicality
- Each diary has distinct visual identity (color, icon, texture)

**Interactions**
- Click diary to open
- Hover shows: last modified, entry count, preview
- Drag to reorder (optional)
- Right-click: Open, Rename, Settings, Delete

**Layout options**
- Grid view (cards)
- List view (detailed)
- Shelf view (book spines, 3D-ish)

### 4.2 Settings System

#### Global Settings
```
├── Appearance
│   ├── App theme (Light / Dark / System)
│   ├── Accent color
│   └── Shelf layout preference
├── Keyboard Shortcuts
│   ├── View/customize all shortcuts
│   └── Conflict detection
├── Backup & Sync
│   ├── Auto-backup frequency
│   ├── Backup location (local folder)
│   ├── Export all data
│   └── Import data
├── Privacy & Security
│   ├── Master passkey (for locks)
│   ├── Change passkey
│   └── Auto-lock timeout
└── About
    ├── Version info
    └── Licenses
```

#### Per-Diary Settings
```
├── Font Configuration
│   ├── Fixed Font mode (single font, no switching)
│   └── Font List mode (multiple fonts available)
│       └── Select fonts for list (3-5 fonts)
├── Tools
│   ├── Enable/disable Sketch tools
│   └── Sketch tool defaults (stroke width, color)
├── Aesthetics
│   ├── Page size presets
│   ├── Custom page dimensions
│   ├── Background color picker
│   ├── Background texture (None, Paper, Canvas, Chalkboard, etc.)
│   └── Line visibility (for lined paper types)
└── Danger Zone
    ├── Delete all content
    └── Reset to defaults
```

### 4.3 Content Locking

**Lock feature**
- Select content (text, shapes, entire pages)
- Right-click > Lock (or keyboard shortcut: Ctrl/Cmd + L)
- Locked content shows visual indicator (subtle lock icon, slight dimming)
- Locked content cannot be edited or deleted

**Unlock feature**
- Select locked content
- Right-click > Unlock (or keyboard shortcut: Ctrl/Cmd + Shift + L)
- Passkey prompt appears
- Single passkey for entire app (set in global settings)

**Passkey management**
- Set passkey in Settings > Privacy & Security
- Passkey hint option
- "Forgot passkey" flow (requires app restart + confirmation)

### 4.4 Paste Formatting

**Behavior**
- All paste operations strip source formatting
- Pasted content inherits:
  - Current font family
  - Current font size
  - Current text color
  - Current line spacing
- Preserves: Line breaks, basic structure (lists become plain lists)

**Implementation**
- Intercept paste event
- Extract plain text (or minimal markdown)
- Apply current context formatting
- Optional: "Paste with formatting" in right-click menu for edge cases

---

## 5. Technical Architecture

### 5.1 Recommended Technology Stack

#### Option A: Web-based (Electron for Desktop)
```
Frontend:
- Framework: React 18+ with TypeScript
- State Management: Zustand (lightweight) or Redux Toolkit
- Canvas/Drawing: Excalidraw library (for Blackboard) or Fabric.js
- Rich Text: TipTap (ProseMirror-based) or Slate.js
- Styling: Tailwind CSS + CSS Modules for component isolation
- Animations: Framer Motion

Desktop Wrapper:
- Electron (cross-platform desktop)
- Local storage: SQLite via better-sqlite3 or IndexedDB

Alternative - Pure Web PWA:
- Service Workers for offline
- IndexedDB for storage
- Could add Tauri later for native wrapper (lighter than Electron)
```

#### Option B: Native Desktop (if performance is critical)
```
Framework: Tauri (Rust backend, web frontend)
Benefits:
- Smaller bundle size than Electron
- Better performance
- Native file system access
- Still uses web frontend (React)
```

#### Recommended: Option A with Tauri consideration
Start with React + Electron for fastest development, architect for potential Tauri migration.

### 5.2 Project Structure
```
muwi/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts
│   │   ├── storage.ts           # SQLite/file operations
│   │   └── backup.ts
│   ├── renderer/                # React app
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── common/          # Shared components
│   │   │   │   ├── ContextMenu/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Toolbar/
│   │   │   │   └── PageStack/
│   │   │   ├── homepage/
│   │   │   │   ├── Shelf.tsx
│   │   │   │   ├── DiaryCard.tsx
│   │   │   │   └── SettingsPanel.tsx
│   │   │   └── diaries/
│   │   │       ├── scratchpad/
│   │   │       │   ├── ScratchpadEditor.tsx
│   │   │       │   ├── PageStack.tsx
│   │   │       │   └── FreeTextBlock.tsx
│   │   │       ├── blackboard/
│   │   │       │   ├── BlackboardCanvas.tsx
│   │   │       │   ├── InfiniteCanvas.tsx
│   │   │       │   ├── SketchTools.tsx
│   │   │       │   └── AutoIndex.tsx
│   │   │       ├── personal-diary/
│   │   │       ├── drafts/
│   │   │       ├── long-drafts/
│   │   │       └── academic/
│   │   ├── hooks/
│   │   │   ├── useCanvas.ts
│   │   │   ├── usePaste.ts
│   │   │   ├── useLocking.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   ├── diaryStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── utils/
│   │   │   ├── imperfection.ts  # Drawing wobble algorithm
│   │   │   ├── formatting.ts
│   │   │   └── export.ts
│   │   └── styles/
│   │       ├── global.css
│   │       ├── themes/
│   │       └── textures/
│   └── shared/                  # Shared types and constants
│       ├── types.ts
│       └── constants.ts
├── assets/
│   ├── fonts/
│   ├── textures/
│   └── icons/
├── public/
├── electron/
│   └── electron.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 5.3 Data Storage Strategy

**Local-first architecture**
```
Primary: SQLite database (single file)
Location: User's app data directory

Tables:
- diaries (metadata for each diary instance)
- scratchpad_pages
- scratchpad_text_blocks
- blackboard_elements
- diary_entries
- drafts
- long_draft_sections
- academic_papers
- academic_citations
- bibliography_entries
- settings
- locked_content (stores encrypted references)

File storage (for textures, exports):
- App data directory / assets
```

**Backup format**
```json
{
  "version": "1.0.0",
  "exportedAt": "2026-01-18T10:00:00Z",
  "data": {
    "diaries": [...],
    "settings": {...}
  }
}
```

### 5.4 Key Technical Challenges & Solutions

#### Challenge 1: Free-position typing (Scratchpad & Blackboard)
```
Solution:
- Create absolutely positioned contenteditable divs on click
- Track position relative to page/canvas
- Store as text blocks with x,y coordinates
- Handle overlapping (z-index management)
- Consider collision detection for auto-positioning
```

#### Challenge 2: Infinite canvas performance (Blackboard)
```
Solution:
- Viewport-based rendering (only render visible elements)
- Use canvas element for drawing, DOM for text
- Spatial indexing (quadtree) for element lookup
- Consider using Excalidraw's engine (MIT licensed)
- Debounce/throttle pan and zoom events
```

#### Challenge 3: Imperfect drawing (hand-drawn feel)
```
Solution:
- Use Rough.js library (hand-drawn style graphics)
- Or implement custom: add Perlin noise to line points
- Store "seed" value for consistent imperfection on re-render
- Slight stroke width variation using noise
```

#### Challenge 4: Physical page stack indicator
```
Solution:
- Visual component on page edge
- Small rectangles representing each page
- Shade/mark pages with content
- Click region detection for page jumping
- Smooth scroll animation between pages
```

#### Challenge 5: Paste without formatting
```
Solution:
- Intercept paste event globally
- Use clipboard API to get plain text
- Insert text with current editor's styles
- Handle edge cases (images, tables)

// Pseudo-code
editor.on('paste', (event) => {
  event.preventDefault();
  const plainText = event.clipboardData.getData('text/plain');
  editor.insertText(plainText);
});
```

---

## 6. UI/UX Specifications

### 6.1 Design Principles

1. **Calm computing**: Minimal visual noise, no unnecessary animations
2. **Analog warmth**: Textures, subtle shadows, paper-like feel
3. **Focused writing**: Hide tools until needed, distraction-free by default
4. **Consistent grammar**: Similar interactions across all diaries
5. **Respectful defaults**: Sensible out-of-box, deeply customizable

### 6.2 Color System

```css
/* Base palette */
--bg-primary: #FAFAFA;        /* Main background */
--bg-secondary: #F5F5F5;      /* Secondary surfaces */
--bg-paper: #FFFEF9;          /* Paper/page background */
--text-primary: #1A1A1A;      /* Main text */
--text-secondary: #666666;    /* Secondary text */
--accent: #4A90A4;            /* Accent (customizable) */
--border: #E0E0E0;            /* Borders and dividers */

/* Scratchpad category colors */
--cat-ideas: #FFF9C4;
--cat-todos: #C8E6C9;
--cat-notes: #BBDEFB;
--cat-questions: #E1BEE7;
--cat-misc: #F5F5F5;

/* Blackboard dark theme */
--bb-bg: #2D3436;
--bb-text: #F5F5F5;
--bb-accent: #74B9FF;

/* Status colors */
--success: #4CAF50;
--warning: #FF9800;
--error: #F44336;
--locked: #9E9E9E;
```

### 6.3 Typography

```css
/* System font stack (default) */
--font-system: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Recommended writing fonts (user installs or bundled) */
--font-serif: "Crimson Pro", "Crimson Text", Georgia, serif;
--font-sans: "Inter", "Source Sans Pro", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
--font-handwriting: "Caveat", "Patrick Hand", cursive;

/* Scale */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 24px;
--text-2xl: 32px;
--text-3xl: 40px;
```

### 6.4 Component Specifications

#### Context Menu (Right-click)
```
┌─────────────────────────┐
│ Cut              Ctrl+X │
│ Copy             Ctrl+C │
│ Paste            Ctrl+V │
│─────────────────────────│
│ Lock             Ctrl+L │
│ Unlock       Ctrl+Sft+L │
│─────────────────────────│
│ Fonts                 ▶ │  (if Font List mode)
│   ├─ Crimson Pro        │
│   ├─ Inter              │
│   └─ Caveat             │
│─────────────────────────│
│ Delete                  │
└─────────────────────────┘
```

#### Page Stack Indicator (Scratchpad)
```
┌──────────────────────────────┬──┐
│                              │▓▓│ ← Pages with content (darker)
│                              │▓▓│
│                              │░░│ ← Empty pages (lighter)
│      [Page Content]          │░░│
│                              │▓▓│ ← Current page (highlighted)
│                              │░░│
│                              │░░│
└──────────────────────────────┴──┘
```

### 6.5 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New page/entry | Ctrl/Cmd + N |
| Save (explicit, if needed) | Ctrl/Cmd + S |
| Lock selection | Ctrl/Cmd + L |
| Unlock selection | Ctrl/Cmd + Shift + L |
| Bold | Ctrl/Cmd + B |
| Italic | Ctrl/Cmd + I |
| Underline | Ctrl/Cmd + U |
| Heading 1 | Ctrl/Cmd + 1 |
| Heading 2 | Ctrl/Cmd + 2 |
| Heading 3 | Ctrl/Cmd + 3 |
| Find | Ctrl/Cmd + F |
| Zoom in (Blackboard) | Ctrl/Cmd + = |
| Zoom out (Blackboard) | Ctrl/Cmd + - |
| Reset zoom | Ctrl/Cmd + 0 |
| Next page | Page Down / Ctrl + → |
| Previous page | Page Up / Ctrl + ← |
| Home (shelf) | Ctrl/Cmd + H |
| Settings | Ctrl/Cmd + , |
| Insert footnote | Ctrl/Cmd + Shift + F |
| Insert citation | Ctrl/Cmd + Shift + C |

---

## 7. Development Roadmap

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Basic app shell and one complete diary

- [ ] Project setup (React + TypeScript + Electron)
- [ ] Homepage shell with placeholder diary cards
- [ ] Settings infrastructure (Zustand store, persistence)
- [ ] **Diary 2: Personal Diary** (simplest, validates core patterns)
  - [ ] Date-based entries
  - [ ] Basic rich text editor
  - [ ] Entry navigation
- [ ] Basic theming (light mode)
- [ ] Local storage with SQLite

**Deliverable**: Working app with homepage and functional Personal Diary

### Phase 2: Core Diaries (Weeks 5-10)
**Goal**: Implement unique canvas types

- [ ] **Diary 0: Scratchpad**
  - [ ] Paginated canvas component
  - [ ] Free-position text blocks
  - [ ] Color-coded pages
  - [ ] Page stack indicator
- [ ] **Diary 3: Drafts**
  - [ ] Title + body layout
  - [ ] Draft list management
  - [ ] Basic formatting toolbar
- [ ] Global paste formatting handler
- [ ] Content locking system

**Deliverable**: 3 fully functional diaries, locking works

### Phase 3: Advanced Canvas (Weeks 11-16)
**Goal**: Infinite canvas and drawing tools

- [ ] **Diary 1: Blackboard**
  - [ ] Infinite canvas (pan/zoom)
  - [ ] Free-position typing on canvas
  - [ ] Sketch tools with imperfection
  - [ ] Auto-generated index
- [ ] Font configuration system
- [ ] Sketch tool toggle for other diaries

**Deliverable**: Blackboard fully functional, sketch tools available

### Phase 4: Long-form Writing (Weeks 17-22)
**Goal**: Structured document support

- [ ] **Diary 4: Long Drafts**
  - [ ] Section management
  - [ ] Table of contents
  - [ ] Footnotes system
  - [ ] Focus mode
- [ ] Export to PDF, Word
- [ ] Backup and restore system

**Deliverable**: Long Drafts complete, export working

### Phase 5: Academic Features (Weeks 23-28)
**Goal**: Academic writing tools

- [ ] **Diary 5: Academic Papers**
  - [ ] Academic templates
  - [ ] Citation insertion
  - [ ] Bibliography management
  - [ ] Citation style formatting
- [ ] Reference library
- [ ] LaTeX export

**Deliverable**: Academic Papers complete

### Phase 6: Polish & Launch (Weeks 29-32)
**Goal**: Production readiness

- [ ] Dark mode
- [ ] Texture/aesthetic options
- [ ] Performance optimization
- [ ] Accessibility audit (keyboard nav, screen readers)
- [ ] Bug fixes and edge cases
- [ ] Documentation
- [ ] Distribution setup (code signing, auto-update)

**Deliverable**: v1.0 release

---

## 8. Testing Strategy

### Unit Tests
- Data model operations
- Formatting utilities
- Imperfection algorithms
- Storage operations

### Integration Tests
- Diary CRUD operations
- Settings persistence
- Lock/unlock flow
- Paste handling

### E2E Tests (Playwright or Cypress)
- Homepage navigation
- Create and edit entries in each diary
- Keyboard shortcut functionality
- Export/backup flows

### Manual Testing
- Cross-platform (Windows, macOS, Linux)
- Different screen sizes
- Performance with large documents
- Edge cases (very long text, many pages, etc.)

---

## 9. Future Considerations (Post-v1)

### Potential Features
- Cloud sync (optional, privacy-focused)
- Mobile companion app (view-only or simplified editing)
- Plugin system for diary types
- AI writing assistance (optional, on-device or API)
- Collaboration features
- Version history
- Search across all diaries
- Tags and cross-diary linking
- Templates marketplace
- Voice notes integration

### Technical Improvements
- WebAssembly for performance-critical operations
- Tauri migration (smaller bundle, better performance)
- Custom font loading from user's system
- Better offline support

---

## 10. Open Questions for Development

1. **Data format**: Should rich text be stored as HTML, Markdown, or a custom JSON format?
   - *Recommendation*: TipTap JSON format (round-trips well, supports all features)

2. **Sketch tool library**: Build custom or use existing?
   - *Recommendation*: Start with Rough.js for hand-drawn style, evaluate Excalidraw for Blackboard

3. **Font management**: Bundle fonts or use system fonts?
   - *Recommendation*: Bundle a small set of quality fonts, allow system font selection too

4. **Backup format**: Proprietary or open standard?
   - *Recommendation*: JSON export for portability, SQLite file is the "native" format

5. **Academic citations**: Build or integrate?
   - *Recommendation*: Integrate citeproc-js for citation formatting, build simple reference manager

---

## Appendix A: Wireframes Reference

### Homepage (Shelf View)
```
┌────────────────────────────────────────────────────────────┐
│  MUWI                                           [⚙️]       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│   │         │  │         │  │         │  │         │      │
│   │ Scratch │  │  Black  │  │Personal │  │  Drafts │      │
│   │   pad   │  │  board  │  │  Diary  │  │         │      │
│   │         │  │         │  │         │  │         │      │
│   │   📝    │  │   🖤    │  │   📔    │  │   ✏️    │      │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                            │
│   ┌─────────┐  ┌─────────┐                                │
│   │         │  │         │                                │
│   │  Long   │  │Academic │                                │
│   │ Drafts  │  │ Papers  │                                │
│   │         │  │         │                                │
│   │   📚    │  │   🎓    │                                │
│   └─────────┘  └─────────┘                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Scratchpad Interface
```
┌────────────────────────────────────────────────────────────┬────┐
│  ← Shelf    Scratchpad                        [Category ▼] │░░░░│
├────────────────────────────────────────────────────────────┤▓▓▓▓│
│ ┌────────────────────────────────────────────────────────┐ │░░░░│
│ │                                                        │ │▓▓▓▓│
│ │     "Meeting notes for                                 │ │░░░░│
│ │      tomorrow"                                         │ │░░░░│
│ │                                                        │ │░░░░│
│ │              "Buy milk                                 │ │▓▓▓▓│ ← Stack
│ │               eggs                                     │ │░░░░│   indicator
│ │               bread"                                   │ │░░░░│
│ │                                                        │ │    │
│ │                        "Call dentist"                  │ │    │
│ │                                                        │ │    │
│ └────────────────────────────────────────────────────────┘ │    │
│                          Page 5 of 12                      │    │
└────────────────────────────────────────────────────────────┴────┘
```

### Blackboard Interface
```
┌────────────────────────────────────────────────────────────────┐
│  ← Shelf    Blackboard     [✏️ 📏 ⭕ ▭ ↗️]        Index ▼     │
├────────────────────────────────────────────────────────────────┤
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░ ┌─────────────────┐                                      ░░░│
│░░░ │  MAIN CONCEPT   │                                      ░░░│
│░░░ └────────┬────────┘                                      ░░░│
│░░░          │                                               ░░░│
│░░░    ┌─────┴─────┐                                         ░░░│
│░░░    ▼           ▼                                         ░░░│
│░░░ ┌──────┐   ┌──────┐     "Related                        ░░░│
│░░░ │Sub A │───│Sub B │      thought"                        ░░░│
│░░░ └──────┘   └──────┘                                      ░░░│
│░░░                                                          ░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├────────────────────────────────────────────────────────────────┤
│ [−] [100%] [+]                              ┌──┐ ← minimap     │
│                                             │▪ │               │
│                                             └──┘               │
└────────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Diary | A distinct writing environment within MUWI |
| Canvas | The main writing/drawing area within a diary |
| Text Block | A freely positioned text element (Scratchpad/Blackboard) |
| Page Stack | Visual indicator showing page count and content status |
| Imperfection | Intentional slight randomness in drawing to mimic hand-drawn |
| Lock | Feature to protect content with passkey |
| Shelf | Homepage view showing all diaries |

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Prepared for: Claude Code Development*
