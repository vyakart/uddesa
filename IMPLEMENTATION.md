# MUWI Implementation Guide

## Technical Implementation Documentation

---

## 1. Technology Stack & Setup

### 1.1 Core Technologies

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Framework | React | 18.3+ | Component model, hooks, concurrent features |
| Language | TypeScript | 5.4+ | Type safety, better DX, refactoring support |
| Build Tool | Vite | 5.x | Fast HMR, ESBuild bundling, Electron plugin |
| Desktop | Electron | 28+ | Cross-platform, mature ecosystem |
| State | Zustand | 4.5+ | Lightweight, TypeScript-first, middleware support |
| Rich Text | TipTap | 2.x | ProseMirror-based, extensible, JSON storage |
| Canvas | Excalidraw | 0.17+ | Infinite canvas, hand-drawn style, MIT license |
| Database | Dexie.js | 4.x | IndexedDB wrapper, reactive queries, TypeScript |
| Styling | Tailwind CSS | 3.4+ | Utility-first, consistent design tokens |
| Animation | Framer Motion | 11+ | Declarative animations, gesture support |
| Testing | Vitest + Playwright | Latest | Fast unit tests, reliable E2E |

### 1.2 Project Initialization

```bash
# Create project with Vite
npm create vite@latest muwi -- --template react-ts

# Install core dependencies
npm install zustand @tiptap/react @tiptap/starter-kit @tiptap/pm
npm install @excalidraw/excalidraw
npm install dexie dexie-react-hooks
npm install framer-motion
npm install tailwindcss postcss autoprefixer
npm install uuid date-fns

# Install Electron
npm install -D electron electron-builder vite-plugin-electron

# Install dev dependencies
npm install -D @types/uuid vitest @vitest/ui playwright @playwright/test
```

### 1.3 Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        }
      }
    ])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@db': path.resolve(__dirname, './src/db'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
});
```

---

## 2. Project Structure

```
muwi/
├── electron/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # Preload scripts for IPC
│   └── ipc/
│       ├── backup.ts           # Backup/export handlers
│       └── file-system.ts      # File operations
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component with routing
│   ├── components/
│   │   ├── common/
│   │   │   ├── ContextMenu/
│   │   │   │   ├── ContextMenu.tsx
│   │   │   │   ├── ContextMenuItem.tsx
│   │   │   │   └── useContextMenu.ts
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── ModalProvider.tsx
│   │   │   ├── Toolbar/
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   └── ToolbarButton.tsx
│   │   │   └── PageStack/
│   │   │       ├── PageStack.tsx
│   │   │       └── PageIndicator.tsx
│   │   ├── shelf/
│   │   │   ├── Shelf.tsx
│   │   │   ├── DiaryCard.tsx
│   │   │   └── ShelfSettings.tsx
│   │   └── diaries/
│   │       ├── scratchpad/
│   │       │   ├── Scratchpad.tsx
│   │       │   ├── ScratchpadPage.tsx
│   │       │   ├── TextBlock.tsx
│   │       │   └── CategoryPicker.tsx
│   │       ├── blackboard/
│   │       │   ├── Blackboard.tsx
│   │       │   ├── ExcalidrawWrapper.tsx
│   │       │   ├── IndexPanel.tsx
│   │       │   └── BlackboardToolbar.tsx
│   │       ├── personal-diary/
│   │       │   ├── PersonalDiary.tsx
│   │       │   ├── DiaryEntry.tsx
│   │       │   ├── DatePicker.tsx
│   │       │   └── EntryNavigation.tsx
│   │       ├── drafts/
│   │       │   ├── Drafts.tsx
│   │       │   ├── DraftEditor.tsx
│   │       │   ├── DraftList.tsx
│   │       │   └── StatusBadge.tsx
│   │       ├── long-drafts/
│   │       │   ├── LongDrafts.tsx
│   │       │   ├── SectionEditor.tsx
│   │       │   ├── TableOfContents.tsx
│   │       │   ├── FootnoteManager.tsx
│   │       │   └── FocusMode.tsx
│   │       └── academic/
│   │           ├── AcademicPaper.tsx
│   │           ├── CitationPicker.tsx
│   │           ├── BibliographyManager.tsx
│   │           ├── ReferenceLibrary.tsx
│   │           └── ExportPanel.tsx
│   ├── stores/
│   │   ├── index.ts
│   │   ├── appStore.ts         # Global app state
│   │   ├── settingsStore.ts    # User preferences
│   │   ├── scratchpadStore.ts
│   │   ├── blackboardStore.ts
│   │   ├── personalDiaryStore.ts
│   │   ├── draftsStore.ts
│   │   ├── longDraftsStore.ts
│   │   └── academicStore.ts
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── usePasteHandler.ts
│   │   ├── useContentLocking.ts
│   │   ├── useAutoSave.ts
│   │   ├── usePageNavigation.ts
│   │   └── useExport.ts
│   ├── db/
│   │   ├── database.ts         # Dexie database definition
│   │   ├── migrations.ts       # Schema migrations
│   │   └── queries/
│   │       ├── scratchpad.ts
│   │       ├── blackboard.ts
│   │       ├── diary.ts
│   │       ├── drafts.ts
│   │       ├── longDrafts.ts
│   │       └── academic.ts
│   ├── utils/
│   │   ├── imperfection.ts     # Hand-drawn effect algorithms
│   │   ├── formatting.ts       # Text formatting utilities
│   │   ├── citations.ts        # Citation formatting (citeproc)
│   │   ├── export.ts           # PDF/Word export
│   │   ├── backup.ts           # Backup/restore utilities
│   │   └── crypto.ts           # Passkey encryption
│   ├── types/
│   │   ├── index.ts
│   │   ├── scratchpad.ts
│   │   ├── blackboard.ts
│   │   ├── diary.ts
│   │   ├── drafts.ts
│   │   ├── longDrafts.ts
│   │   ├── academic.ts
│   │   └── settings.ts
│   └── styles/
│       ├── globals.css
│       ├── themes/
│       │   ├── light.css
│       │   └── dark.css
│       └── textures/
│           ├── paper.css
│           └── chalkboard.css
├── assets/
│   ├── fonts/
│   │   ├── CrimsonPro/
│   │   ├── Inter/
│   │   ├── Caveat/
│   │   └── JetBrainsMono/
│   ├── textures/
│   │   ├── paper-cream.png
│   │   ├── paper-white.png
│   │   └── chalkboard.png
│   └── icons/
├── public/
│   └── manifest.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── electron-builder.config.js
└── README.md
```

---

## 3. Database Schema (Dexie/IndexedDB)

### 3.1 Database Definition

```typescript
// src/db/database.ts
import Dexie, { Table } from 'dexie';
import {
  ScratchpadPage,
  TextBlock,
  BlackboardCanvas,
  CanvasElement,
  DiaryEntry,
  Draft,
  LongDraft,
  Section,
  AcademicPaper,
  BibliographyEntry,
  Settings,
  LockedContent
} from '@/types';

export class MUWIDatabase extends Dexie {
  // Scratchpad tables
  scratchpadPages!: Table<ScratchpadPage, string>;
  textBlocks!: Table<TextBlock, string>;

  // Blackboard tables
  blackboardCanvases!: Table<BlackboardCanvas, string>;
  canvasElements!: Table<CanvasElement, string>;

  // Personal Diary tables
  diaryEntries!: Table<DiaryEntry, string>;

  // Drafts tables
  drafts!: Table<Draft, string>;

  // Long Drafts tables
  longDrafts!: Table<LongDraft, string>;
  sections!: Table<Section, string>;

  // Academic tables
  academicPapers!: Table<AcademicPaper, string>;
  bibliographyEntries!: Table<BibliographyEntry, string>;

  // Settings & Security
  settings!: Table<Settings, string>;
  lockedContent!: Table<LockedContent, string>;

  constructor() {
    super('muwi-database');

    this.version(1).stores({
      // Scratchpad
      scratchpadPages: 'id, pageNumber, categoryName, createdAt, modifiedAt, isLocked',
      textBlocks: 'id, pageId, createdAt',

      // Blackboard
      blackboardCanvases: 'id, name, createdAt, modifiedAt',
      canvasElements: 'id, canvasId, type, headingLevel, createdAt',

      // Personal Diary
      diaryEntries: 'id, date, createdAt, modifiedAt, isLocked',

      // Drafts
      drafts: 'id, title, status, createdAt, modifiedAt, isLocked, *tags',

      // Long Drafts
      longDrafts: 'id, title, createdAt, modifiedAt',
      sections: 'id, longDraftId, parentId, order, isLocked',

      // Academic
      academicPapers: 'id, title, createdAt, modifiedAt',
      bibliographyEntries: 'id, type, year, *authors, title',

      // Settings & Security
      settings: 'id',
      lockedContent: 'id, contentType, contentId'
    });
  }
}

export const db = new MUWIDatabase();
```

### 3.2 Type Definitions

```typescript
// src/types/scratchpad.ts
export interface TextBlock {
  id: string;
  pageId: string;
  content: string;
  position: { x: number; y: number };
  width: number | 'auto';
  fontSize: number;
  fontFamily: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface ScratchpadPage {
  id: string;
  pageNumber: number;
  categoryColor: string;
  categoryName: CategoryName;
  textBlockIds: string[];
  createdAt: Date;
  modifiedAt: Date;
  isLocked: boolean;
}

export type CategoryName = 'ideas' | 'todos' | 'notes' | 'questions' | 'misc';

export interface ScratchpadSettings {
  pageSize: { width: number; height: number };
  orientation: 'portrait' | 'landscape';
  categories: Record<CategoryName, string>; // color mapping
  defaultCategory: CategoryName;
}
```

```typescript
// src/types/blackboard.ts
export interface CanvasElement {
  id: string;
  canvasId: string;
  type: 'text' | 'line' | 'circle' | 'rectangle' | 'arrow' | 'freehand';
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  points?: { x: number; y: number }[];
  content?: string;
  style: ElementStyle;
  headingLevel?: 1 | 2 | 3 | null;
  isLocked: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface ElementStyle {
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  fontFamily?: string;
  fontSize?: number;
  imperfectionSeed: number;
}

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface IndexEntry {
  id: string;
  elementId: string;
  title: string;
  level: 1 | 2 | 3;
  position: { x: number; y: number };
}

export interface BlackboardCanvas {
  id: string;
  name: string;
  elementIds: string[];
  viewportState: ViewportState;
  index: IndexEntry[];
  settings: BlackboardSettings;
  createdAt: Date;
  modifiedAt: Date;
}

export interface BlackboardSettings {
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  defaultStrokeColor: string;
  defaultStrokeWidth: number;
  fonts: string[];
}
```

```typescript
// src/types/settings.ts
export interface GlobalSettings {
  id: 'global';
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  shelfLayout: 'grid' | 'list' | 'shelf';
  autoBackupEnabled: boolean;
  autoBackupFrequency: 'hourly' | 'daily' | 'weekly';
  backupLocation: string;
  passkeyHash?: string;
  passkeySalt?: string;
  passkeyHint?: string;
  autoLockTimeout: number; // minutes, 0 = never
}

export interface DiarySettings {
  scratchpad: ScratchpadSettings;
  blackboard: BlackboardSettings;
  personalDiary: PersonalDiarySettings;
  drafts: DraftsSettings;
  longDrafts: LongDraftsSettings;
  academic: AcademicSettings;
}
```

---

## 4. State Management (Zustand)

### 4.1 App Store

```typescript
// src/stores/appStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Navigation
  currentView: 'shelf' | 'diary';
  currentDiary: DiaryType | null;
  currentDocumentId: string | null;

  // UI State
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  contextMenu: ContextMenuState | null;

  // Lock State
  isAppLocked: boolean;
  lastActivityTime: number;

  // Actions
  navigateToDiary: (diary: DiaryType, documentId?: string) => void;
  navigateToShelf: () => void;
  toggleSidebar: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setContextMenu: (state: ContextMenuState | null) => void;
  updateActivity: () => void;
}

export type DiaryType =
  | 'scratchpad'
  | 'blackboard'
  | 'personal-diary'
  | 'drafts'
  | 'long-drafts'
  | 'academic';

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
  targetId?: string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'shelf',
      currentDiary: null,
      currentDocumentId: null,
      isSidebarOpen: true,
      isSettingsOpen: false,
      contextMenu: null,
      isAppLocked: false,
      lastActivityTime: Date.now(),

      navigateToDiary: (diary, documentId) =>
        set({
          currentView: 'diary',
          currentDiary: diary,
          currentDocumentId: documentId ?? null,
          lastActivityTime: Date.now()
        }),

      navigateToShelf: () =>
        set({
          currentView: 'shelf',
          currentDiary: null,
          currentDocumentId: null
        }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),

      setContextMenu: (contextMenu) => set({ contextMenu }),

      updateActivity: () => set({ lastActivityTime: Date.now() })
    }),
    {
      name: 'muwi-app-state',
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        shelfLayout: state.shelfLayout
      })
    }
  )
);
```

### 4.2 Settings Store

```typescript
// src/stores/settingsStore.ts
import { create } from 'zustand';
import { db } from '@/db/database';
import { GlobalSettings, DiarySettings } from '@/types';

interface SettingsState {
  global: GlobalSettings;
  diaries: DiarySettings;
  isLoaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => Promise<void>;
  updateDiarySettings: <K extends keyof DiarySettings>(
    diary: K,
    updates: Partial<DiarySettings[K]>
  ) => Promise<void>;
  setPasskey: (passkey: string, hint?: string) => Promise<void>;
  verifyPasskey: (passkey: string) => Promise<boolean>;
  clearPasskey: () => Promise<void>;
}

const defaultGlobalSettings: GlobalSettings = {
  id: 'global',
  theme: 'system',
  accentColor: '#4A90A4',
  shelfLayout: 'grid',
  autoBackupEnabled: true,
  autoBackupFrequency: 'daily',
  backupLocation: '',
  autoLockTimeout: 0
};

const defaultDiarySettings: DiarySettings = {
  scratchpad: {
    pageSize: { width: 400, height: 600 },
    orientation: 'portrait',
    categories: {
      ideas: '#FFF9C4',
      todos: '#C8E6C9',
      notes: '#BBDEFB',
      questions: '#E1BEE7',
      misc: '#F5F5F5'
    },
    defaultCategory: 'notes'
  },
  blackboard: {
    backgroundColor: '#2D3436',
    showGrid: false,
    gridSize: 20,
    defaultStrokeColor: '#F5F5F5',
    defaultStrokeWidth: 2,
    fonts: ['Inter', 'Caveat', 'JetBrains Mono']
  },
  // ... other diary settings
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  global: defaultGlobalSettings,
  diaries: defaultDiarySettings,
  isLoaded: false,

  loadSettings: async () => {
    const globalRecord = await db.settings.get('global');
    const diariesRecord = await db.settings.get('diaries');

    set({
      global: globalRecord ?? defaultGlobalSettings,
      diaries: diariesRecord ?? defaultDiarySettings,
      isLoaded: true
    });
  },

  updateGlobalSettings: async (updates) => {
    const newSettings = { ...get().global, ...updates };
    await db.settings.put(newSettings);
    set({ global: newSettings });
  },

  updateDiarySettings: async (diary, updates) => {
    const newDiarySettings = {
      ...get().diaries,
      [diary]: { ...get().diaries[diary], ...updates }
    };
    await db.settings.put({ id: 'diaries', ...newDiarySettings });
    set({ diaries: newDiarySettings });
  },

  setPasskey: async (passkey, hint) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPasskey(passkey, salt);
    await get().updateGlobalSettings({
      passkeyHash: hash,
      passkeySalt: bufferToHex(salt),
      passkeyHint: hint
    });
  },

  verifyPasskey: async (passkey) => {
    const { passkeyHash, passkeySalt } = get().global;
    if (!passkeyHash || !passkeySalt) return false;
    const salt = hexToBuffer(passkeySalt);
    const hash = await hashPasskey(passkey, salt);
    return hash === passkeyHash;
  },

  clearPasskey: async () => {
    await get().updateGlobalSettings({
      passkeyHash: undefined,
      passkeySalt: undefined,
      passkeyHint: undefined
    });
  }
}));
```

### 4.3 Scratchpad Store

```typescript
// src/stores/scratchpadStore.ts
import { create } from 'zustand';
import { db } from '@/db/database';
import { ScratchpadPage, TextBlock, CategoryName } from '@/types';
import { v4 as uuid } from 'uuid';

interface ScratchpadState {
  pages: ScratchpadPage[];
  currentPageIndex: number;
  textBlocks: Map<string, TextBlock[]>; // pageId -> blocks
  isLoaded: boolean;

  // Actions
  loadPages: () => Promise<void>;
  createPage: (category?: CategoryName) => Promise<ScratchpadPage>;
  deletePage: (pageId: string) => Promise<void>;
  navigateToPage: (index: number) => void;
  findFreshPage: () => number;

  // Text block actions
  createTextBlock: (pageId: string, position: { x: number; y: number }) => Promise<TextBlock>;
  updateTextBlock: (blockId: string, updates: Partial<TextBlock>) => Promise<void>;
  deleteTextBlock: (blockId: string) => Promise<void>;

  // Category actions
  setPageCategory: (pageId: string, category: CategoryName) => Promise<void>;
}

export const useScratchpadStore = create<ScratchpadState>((set, get) => ({
  pages: [],
  currentPageIndex: 0,
  textBlocks: new Map(),
  isLoaded: false,

  loadPages: async () => {
    const pages = await db.scratchpadPages
      .orderBy('pageNumber')
      .toArray();

    const textBlocksMap = new Map<string, TextBlock[]>();
    for (const page of pages) {
      const blocks = await db.textBlocks
        .where('pageId')
        .equals(page.id)
        .toArray();
      textBlocksMap.set(page.id, blocks);
    }

    set({ pages, textBlocks: textBlocksMap, isLoaded: true });
  },

  createPage: async (category = 'notes') => {
    const { pages } = get();
    const settings = useSettingsStore.getState().diaries.scratchpad;

    const newPage: ScratchpadPage = {
      id: uuid(),
      pageNumber: pages.length + 1,
      categoryColor: settings.categories[category],
      categoryName: category,
      textBlockIds: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
      isLocked: false
    };

    await db.scratchpadPages.add(newPage);
    set({ pages: [...pages, newPage] });
    return newPage;
  },

  deletePage: async (pageId) => {
    await db.scratchpadPages.delete(pageId);
    await db.textBlocks.where('pageId').equals(pageId).delete();

    set((state) => ({
      pages: state.pages.filter((p) => p.id !== pageId),
      textBlocks: new Map(
        [...state.textBlocks.entries()].filter(([id]) => id !== pageId)
      )
    }));
  },

  navigateToPage: (index) => {
    const { pages } = get();
    if (index >= 0 && index < pages.length) {
      set({ currentPageIndex: index });
    }
  },

  findFreshPage: () => {
    const { pages, textBlocks } = get();
    const freshIndex = pages.findIndex((page) => {
      const blocks = textBlocks.get(page.id) ?? [];
      return blocks.length === 0;
    });
    return freshIndex === -1 ? pages.length : freshIndex;
  },

  createTextBlock: async (pageId, position) => {
    const settings = useSettingsStore.getState().diaries.scratchpad;

    const block: TextBlock = {
      id: uuid(),
      pageId,
      content: '',
      position,
      width: 'auto',
      fontSize: 16,
      fontFamily: 'Inter',
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    await db.textBlocks.add(block);

    set((state) => {
      const pageBlocks = state.textBlocks.get(pageId) ?? [];
      const newMap = new Map(state.textBlocks);
      newMap.set(pageId, [...pageBlocks, block]);
      return { textBlocks: newMap };
    });

    return block;
  },

  updateTextBlock: async (blockId, updates) => {
    await db.textBlocks.update(blockId, {
      ...updates,
      modifiedAt: new Date()
    });

    set((state) => {
      const newMap = new Map(state.textBlocks);
      for (const [pageId, blocks] of newMap) {
        const index = blocks.findIndex((b) => b.id === blockId);
        if (index !== -1) {
          blocks[index] = { ...blocks[index], ...updates };
          break;
        }
      }
      return { textBlocks: newMap };
    });
  },

  deleteTextBlock: async (blockId) => {
    await db.textBlocks.delete(blockId);

    set((state) => {
      const newMap = new Map(state.textBlocks);
      for (const [pageId, blocks] of newMap) {
        newMap.set(
          pageId,
          blocks.filter((b) => b.id !== blockId)
        );
      }
      return { textBlocks: newMap };
    });
  },

  setPageCategory: async (pageId, category) => {
    const settings = useSettingsStore.getState().diaries.scratchpad;
    await db.scratchpadPages.update(pageId, {
      categoryName: category,
      categoryColor: settings.categories[category],
      modifiedAt: new Date()
    });

    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              categoryName: category,
              categoryColor: settings.categories[category]
            }
          : p
      )
    }));
  }
}));
```

---

## 5. Core Component Implementations

### 5.1 Shelf (Homepage)

```typescript
// src/components/shelf/Shelf.tsx
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { DiaryCard } from './DiaryCard';
import { Settings } from 'lucide-react';

const DIARIES = [
  { id: 'scratchpad', name: 'Scratchpad', icon: '📝', color: '#FFF9C4' },
  { id: 'blackboard', name: 'Blackboard', icon: '🖤', color: '#2D3436' },
  { id: 'personal-diary', name: 'Personal Diary', icon: '📔', color: '#FFFEF9' },
  { id: 'drafts', name: 'Drafts', icon: '✏️', color: '#FFFFFF' },
  { id: 'long-drafts', name: 'Long Drafts', icon: '📚', color: '#FFFFFF' },
  { id: 'academic', name: 'Academic Papers', icon: '🎓', color: '#FFFFFF' }
] as const;

export function Shelf() {
  const { navigateToDiary, openSettings } = useAppStore();
  const { global } = useSettingsStore();

  const layoutClass = {
    grid: 'grid grid-cols-2 md:grid-cols-3 gap-6',
    list: 'flex flex-col gap-4',
    shelf: 'flex items-end gap-2 h-64'
  }[global.shelfLayout];

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <header className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-serif text-text-primary">MUWI</h1>
        <button
          onClick={openSettings}
          className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-text-secondary" />
        </button>
      </header>

      <motion.div
        className={layoutClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {DIARIES.map((diary) => (
          <DiaryCard
            key={diary.id}
            diary={diary}
            layout={global.shelfLayout}
            onClick={() => navigateToDiary(diary.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}
```

### 5.2 Scratchpad Component

```typescript
// src/components/diaries/scratchpad/Scratchpad.tsx
import { useEffect, useCallback } from 'react';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { ScratchpadPage } from './ScratchpadPage';
import { PageStack } from '@/components/common/PageStack';
import { CategoryPicker } from './CategoryPicker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function Scratchpad() {
  const {
    pages,
    currentPageIndex,
    textBlocks,
    isLoaded,
    loadPages,
    createPage,
    navigateToPage,
    findFreshPage
  } = useScratchpadStore();

  useEffect(() => {
    if (!isLoaded) loadPages();
  }, [isLoaded, loadPages]);

  const currentPage = pages[currentPageIndex];
  const currentBlocks = currentPage
    ? textBlocks.get(currentPage.id) ?? []
    : [];

  // Keyboard navigation
  useKeyboardShortcuts({
    'PageDown': () => navigateToPage(currentPageIndex + 1),
    'PageUp': () => navigateToPage(currentPageIndex - 1),
    'Ctrl+n': () => createPage(),
    'Ctrl+Shift+n': () => {
      const freshIndex = findFreshPage();
      if (freshIndex === pages.length) {
        createPage().then(() => navigateToPage(freshIndex));
      } else {
        navigateToPage(freshIndex);
      }
    }
  });

  const handlePageClick = useCallback(
    (index: number) => navigateToPage(index),
    [navigateToPage]
  );

  if (!isLoaded) {
    return <div className="flex-center h-full">Loading...</div>;
  }

  if (pages.length === 0) {
    return (
      <div className="flex-center h-full flex-col gap-4">
        <p className="text-text-secondary">No pages yet</p>
        <button
          onClick={() => createPage()}
          className="btn-primary"
        >
          Create First Page
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex items-center justify-center p-8">
        <ScratchpadPage
          page={currentPage}
          textBlocks={currentBlocks}
        />
      </div>

      <PageStack
        pages={pages}
        currentIndex={currentPageIndex}
        textBlocks={textBlocks}
        onPageClick={handlePageClick}
      />

      <div className="absolute top-4 right-16">
        <CategoryPicker
          currentCategory={currentPage.categoryName}
          pageId={currentPage.id}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-text-secondary">
        Page {currentPageIndex + 1} of {pages.length}
      </div>
    </div>
  );
}
```

### 5.3 Free-Position Text Block

```typescript
// src/components/diaries/scratchpad/TextBlock.tsx
import { useRef, useState, useEffect, useCallback } from 'react';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { TextBlock as TextBlockType } from '@/types';
import { usePasteHandler } from '@/hooks/usePasteHandler';
import { useContentLocking } from '@/hooks/useContentLocking';

interface TextBlockProps {
  block: TextBlockType;
  pageId: string;
}

export function TextBlock({ block, pageId }: TextBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { updateTextBlock, deleteTextBlock } = useScratchpadStore();
  const { isLocked, toggleLock } = useContentLocking(block.id, 'textBlock');

  // Handle paste with formatting strip
  usePasteHandler(ref, {
    fontFamily: block.fontFamily,
    fontSize: block.fontSize
  });

  const handleInput = useCallback(() => {
    if (ref.current && !isLocked) {
      updateTextBlock(block.id, { content: ref.current.innerText });
    }
  }, [block.id, isLocked, updateTextBlock]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delete empty blocks
    if (ref.current && ref.current.innerText.trim() === '') {
      deleteTextBlock(block.id);
    }
  }, [block.id, deleteTextBlock]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return;

      // Check if clicking on edge for drag
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      const isEdge =
        e.clientX < rect.left + 10 ||
        e.clientY < rect.top + 10;

      if (isEdge) {
        e.preventDefault();
        setIsDragging(true);
        setDragOffset({
          x: e.clientX - block.position.x,
          y: e.clientY - block.position.y
        });
      }
    },
    [block.position, isLocked]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateTextBlock(block.id, {
        position: {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, block.id, updateTextBlock]);

  return (
    <div
      ref={ref}
      contentEditable={!isLocked}
      suppressContentEditableWarning
      className={`
        absolute outline-none min-w-[50px] min-h-[24px] p-2
        ${isFocused ? 'ring-1 ring-accent/50' : ''}
        ${isLocked ? 'opacity-80 cursor-not-allowed' : 'cursor-text'}
        ${isDragging ? 'cursor-grabbing' : ''}
      `}
      style={{
        left: block.position.x,
        top: block.position.y,
        width: block.width === 'auto' ? 'auto' : block.width,
        fontFamily: block.fontFamily,
        fontSize: block.fontSize
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onInput={handleInput}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        // Show context menu with lock option
      }}
    >
      {block.content}
    </div>
  );
}
```

### 5.4 Blackboard with Excalidraw

```typescript
// src/components/diaries/blackboard/Blackboard.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';
import type { ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { IndexPanel } from './IndexPanel';
import { debounce } from '@/utils/debounce';

export function Blackboard() {
  const excalidrawRef = useRef<any>(null);
  const {
    canvas,
    loadCanvas,
    saveElements,
    updateViewport,
    isLoaded
  } = useBlackboardStore();
  const { diaries } = useSettingsStore();

  useEffect(() => {
    if (!isLoaded) loadCanvas();
  }, [isLoaded, loadCanvas]);

  // Debounced save to prevent excessive writes
  const debouncedSave = useCallback(
    debounce((elements: ExcalidrawElement[]) => {
      saveElements(elements);
    }, 500),
    [saveElements]
  );

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState) => {
      // Save elements
      debouncedSave([...elements]);

      // Update viewport state
      updateViewport({
        panX: appState.scrollX,
        panY: appState.scrollY,
        zoom: appState.zoom.value
      });
    },
    [debouncedSave, updateViewport]
  );

  // Extract headings for index
  const headingElements = canvas?.elements?.filter(
    (el) => el.type === 'text' && (el as any).headingLevel
  ) ?? [];

  if (!isLoaded) {
    return <div className="flex-center h-full">Loading canvas...</div>;
  }

  return (
    <div className="h-full relative">
      <Excalidraw
        ref={excalidrawRef}
        initialData={{
          elements: canvas?.elements ?? [],
          appState: {
            scrollX: canvas?.viewportState.panX ?? 0,
            scrollY: canvas?.viewportState.panY ?? 0,
            zoom: { value: canvas?.viewportState.zoom ?? 1 },
            theme: 'dark',
            viewBackgroundColor: diaries.blackboard.backgroundColor,
            gridSize: diaries.blackboard.showGrid
              ? diaries.blackboard.gridSize
              : null
          }
        }}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            export: false,
            loadScene: false,
            saveToActiveFile: false
          }
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Heading>
              Your infinite canvas
            </WelcomeScreen.Center.Heading>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </Excalidraw>

      <IndexPanel
        entries={buildIndexFromElements(headingElements)}
        onNavigate={(position) => {
          excalidrawRef.current?.scrollToContent(position);
        }}
      />
    </div>
  );
}

function buildIndexFromElements(elements: ExcalidrawElement[]): IndexEntry[] {
  return elements
    .filter((el) => el.type === 'text')
    .map((el) => ({
      id: el.id,
      elementId: el.id,
      title: (el as any).text?.slice(0, 50) ?? 'Untitled',
      level: (el as any).headingLevel ?? 1,
      position: { x: el.x, y: el.y }
    }))
    .sort((a, b) => a.position.y - b.position.y);
}
```

### 5.5 Personal Diary with TipTap

```typescript
// src/components/diaries/personal-diary/PersonalDiary.tsx
import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { usePersonalDiaryStore } from '@/stores/personalDiaryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { DatePicker } from './DatePicker';
import { EntryNavigation } from './EntryNavigation';
import { format, parseISO } from 'date-fns';

export function PersonalDiary() {
  const {
    entries,
    currentEntry,
    loadEntries,
    loadEntry,
    createEntry,
    updateEntry,
    isLoaded
  } = usePersonalDiaryStore();
  const { diaries } = useSettingsStore();
  const settings = diaries.personalDiary;

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!isLoaded) loadEntries();
  }, [isLoaded, loadEntries]);

  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    loadEntry(dateStr);
  }, [selectedDate, loadEntry]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for diary
        codeBlock: false
      }),
      Placeholder.configure({
        placeholder: 'Write about your day...'
      })
    ],
    content: currentEntry?.content ?? '',
    editable: !currentEntry?.isLocked,
    onUpdate: ({ editor }) => {
      if (currentEntry) {
        updateEntry(currentEntry.id, {
          content: editor.getJSON(),
          wordCount: editor.storage.characterCount?.words() ?? 0
        });
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px]',
        style: `font-family: ${settings.font}; line-height: 1.8;`
      }
    }
  });

  // Update editor when entry changes
  useEffect(() => {
    if (editor && currentEntry) {
      editor.commands.setContent(currentEntry.content);
      editor.setEditable(!currentEntry.isLocked);
    }
  }, [editor, currentEntry]);

  const handleDateChange = async (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = entries.find((e) => e.date === dateStr);

    if (!entry) {
      await createEntry(date);
    }
  };

  if (!isLoaded) {
    return <div className="flex-center h-full">Loading diary...</div>;
  }

  return (
    <div className="flex h-full">
      {/* Sidebar with entry list */}
      <EntryNavigation
        entries={entries}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      {/* Main writing area */}
      <div
        className="flex-1 flex flex-col"
        style={{
          backgroundColor: settings.paperColor,
          backgroundImage: settings.paperTexture
            ? `url(/textures/${settings.paperTexture}.png)`
            : 'none'
        }}
      >
        {/* Date header */}
        <div className="p-6 border-b border-border">
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format={settings.dateFormat}
          />
        </div>

        {/* Editor area */}
        <div
          className={`flex-1 p-8 overflow-auto ${
            settings.showLines ? 'lined-paper' : ''
          }`}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Word count */}
        <div className="p-4 text-sm text-text-secondary text-right">
          {currentEntry?.wordCount ?? 0} words
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Key Hooks Implementation

### 6.1 Paste Handler (Strip Formatting)

```typescript
// src/hooks/usePasteHandler.ts
import { useEffect, RefObject } from 'react';

interface PasteConfig {
  fontFamily: string;
  fontSize: number;
}

export function usePasteHandler(
  ref: RefObject<HTMLElement>,
  config: PasteConfig
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();

      // Get plain text only
      const plainText = e.clipboardData?.getData('text/plain') ?? '';

      // Preserve line breaks but strip all formatting
      const cleanText = plainText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

      // Insert as plain text
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Create text node with proper line break handling
      const lines = cleanText.split('\n');
      const fragment = document.createDocumentFragment();

      lines.forEach((line, index) => {
        fragment.appendChild(document.createTextNode(line));
        if (index < lines.length - 1) {
          fragment.appendChild(document.createElement('br'));
        }
      });

      range.insertNode(fragment);

      // Move cursor to end
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      // Dispatch input event for content updates
      element.dispatchEvent(new Event('input', { bubbles: true }));
    };

    element.addEventListener('paste', handlePaste);
    return () => element.removeEventListener('paste', handlePaste);
  }, [ref, config]);
}
```

### 6.2 Content Locking

```typescript
// src/hooks/useContentLocking.ts
import { useState, useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { db } from '@/db/database';

export function useContentLocking(
  contentId: string,
  contentType: 'textBlock' | 'page' | 'entry' | 'element'
) {
  const [isLocked, setIsLocked] = useState(false);
  const { verifyPasskey, global } = useSettingsStore();

  const checkLockStatus = useCallback(async () => {
    const record = await db.lockedContent.get(contentId);
    setIsLocked(!!record);
  }, [contentId]);

  const lock = useCallback(async () => {
    if (!global.passkeyHash) {
      // No passkey set, prompt to create one
      return { success: false, reason: 'no-passkey' };
    }

    await db.lockedContent.add({
      id: contentId,
      contentType,
      contentId,
      lockedAt: new Date()
    });

    setIsLocked(true);
    return { success: true };
  }, [contentId, contentType, global.passkeyHash]);

  const unlock = useCallback(
    async (passkey: string) => {
      const isValid = await verifyPasskey(passkey);

      if (!isValid) {
        return { success: false, reason: 'invalid-passkey' };
      }

      await db.lockedContent.delete(contentId);
      setIsLocked(false);
      return { success: true };
    },
    [contentId, verifyPasskey]
  );

  const toggleLock = useCallback(
    async (passkey?: string) => {
      if (isLocked) {
        if (!passkey) {
          return { success: false, reason: 'passkey-required' };
        }
        return unlock(passkey);
      } else {
        return lock();
      }
    },
    [isLocked, lock, unlock]
  );

  return {
    isLocked,
    lock,
    unlock,
    toggleLock,
    checkLockStatus
  };
}
```

### 6.3 Keyboard Shortcuts

```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;
type ShortcutMap = Record<string, ShortcutHandler>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Build shortcut string
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');

      // Normalize key name
      let key = e.key;
      if (key === ' ') key = 'Space';
      if (key.length === 1) key = key.toLowerCase();

      parts.push(key);
      const shortcut = parts.join('+');

      // Check for match
      const handler = shortcuts[shortcut];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcut sets
export const GLOBAL_SHORTCUTS = {
  'Ctrl+,': 'openSettings',
  'Ctrl+h': 'navigateHome'
} as const;

export const EDITOR_SHORTCUTS = {
  'Ctrl+b': 'toggleBold',
  'Ctrl+i': 'toggleItalic',
  'Ctrl+u': 'toggleUnderline',
  'Ctrl+1': 'setHeading1',
  'Ctrl+2': 'setHeading2',
  'Ctrl+3': 'setHeading3',
  'Ctrl+l': 'lockSelection',
  'Ctrl+Shift+l': 'unlockSelection'
} as const;
```

---

## 7. Utilities Implementation

### 7.1 Imperfection Algorithm (Hand-drawn Effect)

```typescript
// src/utils/imperfection.ts

// Seeded random number generator for consistent wobble
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Add wobble to a line
export function wobbleLine(
  points: { x: number; y: number }[],
  seed: number,
  intensity: number = 2
): { x: number; y: number }[] {
  const random = seededRandom(seed);

  return points.map((point, i) => {
    // Don't wobble endpoints much
    const factor = i === 0 || i === points.length - 1 ? 0.3 : 1;

    return {
      x: point.x + (random() - 0.5) * intensity * factor,
      y: point.y + (random() - 0.5) * intensity * factor
    };
  });
}

// Generate hand-drawn rectangle
export function handDrawnRect(
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number
): string {
  const random = seededRandom(seed);
  const wobble = (v: number) => v + (random() - 0.5) * 3;

  // Four corners with slight imperfection
  const corners = [
    { x: wobble(x), y: wobble(y) },
    { x: wobble(x + width), y: wobble(y) },
    { x: wobble(x + width), y: wobble(y + height) },
    { x: wobble(x), y: wobble(y + height) }
  ];

  // Build SVG path with slight curve
  let path = `M ${corners[0].x} ${corners[0].y}`;

  for (let i = 1; i <= 4; i++) {
    const from = corners[(i - 1) % 4];
    const to = corners[i % 4];
    const mid = {
      x: (from.x + to.x) / 2 + (random() - 0.5) * 2,
      y: (from.y + to.y) / 2 + (random() - 0.5) * 2
    };

    path += ` Q ${mid.x} ${mid.y} ${to.x} ${to.y}`;
  }

  return path;
}

// Generate hand-drawn circle
export function handDrawnCircle(
  cx: number,
  cy: number,
  r: number,
  seed: number
): string {
  const random = seededRandom(seed);
  const points = 12; // Number of points around circle
  const pathPoints: { x: number; y: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const wobbleR = r + (random() - 0.5) * 4;
    pathPoints.push({
      x: cx + Math.cos(angle) * wobbleR,
      y: cy + Math.sin(angle) * wobbleR
    });
  }

  // Build smooth curve through points
  let path = `M ${pathPoints[0].x} ${pathPoints[0].y}`;

  for (let i = 1; i < pathPoints.length; i++) {
    const prev = pathPoints[i - 1];
    const curr = pathPoints[i];
    const mid = {
      x: (prev.x + curr.x) / 2,
      y: (prev.y + curr.y) / 2
    };
    path += ` Q ${prev.x} ${prev.y} ${mid.x} ${mid.y}`;
  }

  path += ' Z';
  return path;
}

// Vary stroke width along path
export function varyingStrokeWidth(
  baseWidth: number,
  length: number,
  seed: number
): number[] {
  const random = seededRandom(seed);
  const points = Math.ceil(length / 10);
  const widths: number[] = [];

  for (let i = 0; i < points; i++) {
    const variation = 1 + (random() - 0.5) * 0.3;
    widths.push(baseWidth * variation);
  }

  return widths;
}
```

### 7.2 Export Utilities

```typescript
// src/utils/export.ts
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function exportToPDF(
  content: string,
  title: string,
  settings: ExportSettings
): Promise<Blob> {
  const doc = new jsPDF({
    unit: 'mm',
    format: settings.pageSize
  });

  doc.setFont(settings.fontFamily);
  doc.setFontSize(settings.fontSize);

  // Set margins
  const margin = settings.margins;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textWidth = pageWidth - margin.left - margin.right;

  // Add title
  doc.setFontSize(settings.fontSize * 1.5);
  doc.text(title, margin.left, margin.top);

  // Add content with word wrap
  doc.setFontSize(settings.fontSize);
  const lines = doc.splitTextToSize(content, textWidth);

  let y = margin.top + 20;
  for (const line of lines) {
    if (y > pageHeight - margin.bottom) {
      doc.addPage();
      y = margin.top;
    }
    doc.text(line, margin.left, y);
    y += settings.lineSpacing * settings.fontSize * 0.35;
  }

  return doc.output('blob');
}

export async function exportToWord(
  content: string,
  title: string,
  settings: ExportSettings
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: settings.fontSize * 2
              })
            ]
          }),
          ...content.split('\n').map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: settings.fontSize * 2
                  })
                ],
                spacing: {
                  line: settings.lineSpacing * 240
                }
              })
          )
        ]
      }
    ]
  });

  return Packer.toBlob(doc);
}

interface ExportSettings {
  pageSize: 'a4' | 'letter';
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

### 7.3 Backup Utilities

```typescript
// src/utils/backup.ts
import { db } from '@/db/database';
import { format } from 'date-fns';

interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    scratchpadPages: any[];
    textBlocks: any[];
    blackboardCanvases: any[];
    canvasElements: any[];
    diaryEntries: any[];
    drafts: any[];
    longDrafts: any[];
    sections: any[];
    academicPapers: any[];
    bibliographyEntries: any[];
    settings: any[];
  };
}

export async function createBackup(): Promise<BackupData> {
  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      scratchpadPages: await db.scratchpadPages.toArray(),
      textBlocks: await db.textBlocks.toArray(),
      blackboardCanvases: await db.blackboardCanvases.toArray(),
      canvasElements: await db.canvasElements.toArray(),
      diaryEntries: await db.diaryEntries.toArray(),
      drafts: await db.drafts.toArray(),
      longDrafts: await db.longDrafts.toArray(),
      sections: await db.sections.toArray(),
      academicPapers: await db.academicPapers.toArray(),
      bibliographyEntries: await db.bibliographyEntries.toArray(),
      settings: await db.settings.toArray()
    }
  };

  return backup;
}

export async function restoreBackup(backup: BackupData): Promise<void> {
  // Validate version compatibility
  if (!isCompatibleVersion(backup.version)) {
    throw new Error(`Incompatible backup version: ${backup.version}`);
  }

  // Clear existing data
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });

  // Restore data
  await db.transaction('rw', db.tables, async () => {
    await db.scratchpadPages.bulkAdd(backup.data.scratchpadPages);
    await db.textBlocks.bulkAdd(backup.data.textBlocks);
    await db.blackboardCanvases.bulkAdd(backup.data.blackboardCanvases);
    await db.canvasElements.bulkAdd(backup.data.canvasElements);
    await db.diaryEntries.bulkAdd(backup.data.diaryEntries);
    await db.drafts.bulkAdd(backup.data.drafts);
    await db.longDrafts.bulkAdd(backup.data.longDrafts);
    await db.sections.bulkAdd(backup.data.sections);
    await db.academicPapers.bulkAdd(backup.data.academicPapers);
    await db.bibliographyEntries.bulkAdd(backup.data.bibliographyEntries);
    await db.settings.bulkAdd(backup.data.settings);
  });
}

export function downloadBackup(backup: BackupData): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `muwi-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isCompatibleVersion(version: string): boolean {
  const [major] = version.split('.');
  return major === '1'; // Compatible with all 1.x versions
}
```

---

## 8. Electron Configuration

### 8.1 Main Process

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('select-backup-location', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('save-backup', async (_, backup: string, location: string) => {
  const filename = `muwi-backup-${Date.now()}.json`;
  const filepath = path.join(location, filename);
  await fs.writeFile(filepath, backup);
  return filepath;
});

ipcMain.handle('load-backup', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'MUWI Backup', extensions: ['json'] }]
  });

  if (result.filePaths.length === 0) return null;

  const content = await fs.readFile(result.filePaths[0], 'utf-8');
  return content;
});

ipcMain.handle('export-file', async (_, content: Uint8Array, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Word Document', extensions: ['docx'] },
      { name: 'LaTeX', extensions: ['tex'] }
    ]
  });

  if (result.filePath) {
    await fs.writeFile(result.filePath, Buffer.from(content));
    return result.filePath;
  }
  return null;
});
```

### 8.2 Preload Script

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectBackupLocation: () => ipcRenderer.invoke('select-backup-location'),
  saveBackup: (backup: string, location: string) =>
    ipcRenderer.invoke('save-backup', backup, location),
  loadBackup: () => ipcRenderer.invoke('load-backup'),
  exportFile: (content: Uint8Array, defaultName: string) =>
    ipcRenderer.invoke('export-file', content, defaultName),
  platform: process.platform
});

// Type declarations
declare global {
  interface Window {
    electronAPI: {
      selectBackupLocation: () => Promise<string | undefined>;
      saveBackup: (backup: string, location: string) => Promise<string>;
      loadBackup: () => Promise<string | null>;
      exportFile: (content: Uint8Array, defaultName: string) => Promise<string | null>;
      platform: NodeJS.Platform;
    };
  }
}
```

---

## 9. Build Configuration

### 9.1 Electron Builder Config

```javascript
// electron-builder.config.js
module.exports = {
  appId: 'com.muwi.app',
  productName: 'MUWI',
  directories: {
    output: 'release'
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*'
  ],
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.productivity',
    icon: 'assets/icons/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist'
  },
  win: {
    target: ['nsis', 'portable'],
    icon: 'assets/icons/icon.ico'
  },
  linux: {
    target: ['AppImage', 'deb'],
    icon: 'assets/icons',
    category: 'Office'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  }
};
```

### 9.2 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "vite & electron .",
    "electron:build": "npm run build && electron-builder",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
1. Project setup with Vite + React + TypeScript + Electron
2. Database schema with Dexie.js
3. State management setup with Zustand
4. Shelf component with diary cards
5. **Personal Diary implementation** (TipTap editor, date navigation)
6. Settings infrastructure

### Phase 2: Core Diaries (Weeks 5-10)
1. **Scratchpad implementation** (free-position text, page stack)
2. **Drafts implementation** (title + body, draft list, status)
3. Paste formatting handler (global)
4. Content locking system with passkey

### Phase 3: Advanced Canvas (Weeks 11-16)
1. **Blackboard with Excalidraw** (infinite canvas, pan/zoom)
2. Auto-generated index panel
3. Font configuration system
4. Imperfection algorithms for hand-drawn shapes

### Phase 4: Long-form Writing (Weeks 17-22)
1. **Long Drafts implementation** (sections, TOC, footnotes)
2. Focus mode / typewriter mode
3. Export to PDF and Word
4. Backup and restore system

### Phase 5: Academic Features (Weeks 23-28)
1. **Academic Papers implementation** (structure templates)
2. Citation management with citeproc-js
3. Bibliography manager and reference library
4. LaTeX export

### Phase 6: Polish (Weeks 29-32)
1. Dark mode theming
2. Texture and aesthetic options
3. Performance optimization
4. Accessibility audit
5. Cross-platform testing
6. Distribution setup (code signing, auto-update)

---

*Document Version: 1.0*
*Last Updated: January 2026*
