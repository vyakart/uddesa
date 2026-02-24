# MUWI Testing Documentation (Historical Strategy Reference)

## Status (Day 6 Docs Audit Update - 2026-02-24)

This document is retained as a historical testing strategy/reference and is **not** the current source of truth for executable commands or config snippets.

Use these files for current behavior/configuration:

- `muwi/README.md` (current developer workflow commands)
- `muwi/package.json` (actual scripts)
- `muwi/vitest.config.ts` (current Vitest config)
- `muwi/playwright.config.ts` (current browser E2E config)
- `muwi/playwright.electron.config.ts` (current Electron E2E config)
- `muwi/src/test/setup.ts` (current test environment setup)

Notes:

- Some examples below intentionally reflect an earlier planning/design phase.
- Treat code blocks in this file as conceptual patterns unless verified against the files above.

## Comprehensive Testing Strategy (Historical)

---

## 1. Testing Framework Setup

### 1.1 Test Stack

| Tool | Purpose | Configuration |
|------|---------|---------------|
| Vitest | Unit & Integration tests | Fast, Vite-native, Jest-compatible |
| React Testing Library | Component testing | User-centric, accessibility-focused |
| Playwright | E2E testing | Cross-browser, Electron support |
| MSW | API mocking | Service worker based, realistic |
| Faker.js | Test data generation | Consistent seed-based data |

### 1.2 Installation

```bash
# Unit & Integration testing
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom happy-dom

# E2E testing
npm install -D @playwright/test
npx playwright install

# Test utilities
npm install -D msw @faker-js/faker
npm install -D fake-indexeddb
```

### 1.3 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'electron/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
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

### 1.4 Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock Electron API when not in Electron
if (!window.electronAPI) {
  window.electronAPI = {
    selectBackupLocation: vi.fn().mockResolvedValue('/mock/path'),
    saveBackup: vi.fn().mockResolvedValue('/mock/backup.json'),
    loadBackup: vi.fn().mockResolvedValue(null),
    exportFile: vi.fn().mockResolvedValue('/mock/export.pdf'),
    platform: 'darwin'
  };
}
```

### 1.5 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'electron',
      use: {
        // Electron-specific configuration
      }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
```

---

## 2. Test Utilities & Helpers

### 2.1 Render Helper with Providers

```typescript
// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalProvider } from '@/components/common/Modal';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      {children}
    </ModalProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options })
  };
}

export * from '@testing-library/react';
export { customRender as render };
```

### 2.2 Database Test Utilities

```typescript
// src/test/db-utils.ts
import { db } from '@/db/database';
import { faker } from '@faker-js/faker';
import {
  ScratchpadPage,
  TextBlock,
  DiaryEntry,
  Draft,
  CategoryName
} from '@/types';

// Set consistent seed for reproducible tests
faker.seed(12345);

export async function clearDatabase() {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

export async function seedScratchpadPages(count: number = 5): Promise<ScratchpadPage[]> {
  const pages: ScratchpadPage[] = [];
  const categories: CategoryName[] = ['ideas', 'todos', 'notes', 'questions', 'misc'];
  const colors = {
    ideas: '#FFF9C4',
    todos: '#C8E6C9',
    notes: '#BBDEFB',
    questions: '#E1BEE7',
    misc: '#F5F5F5'
  };

  for (let i = 0; i < count; i++) {
    const category = faker.helpers.arrayElement(categories);
    const page: ScratchpadPage = {
      id: faker.string.uuid(),
      pageNumber: i + 1,
      categoryName: category,
      categoryColor: colors[category],
      textBlockIds: [],
      createdAt: faker.date.past(),
      modifiedAt: faker.date.recent(),
      isLocked: faker.datatype.boolean({ probability: 0.1 })
    };
    pages.push(page);
  }

  await db.scratchpadPages.bulkAdd(pages);
  return pages;
}

export async function seedTextBlocks(
  pageId: string,
  count: number = 3
): Promise<TextBlock[]> {
  const blocks: TextBlock[] = [];

  for (let i = 0; i < count; i++) {
    const block: TextBlock = {
      id: faker.string.uuid(),
      pageId,
      content: faker.lorem.sentences({ min: 1, max: 3 }),
      position: {
        x: faker.number.int({ min: 20, max: 350 }),
        y: faker.number.int({ min: 20, max: 550 })
      },
      width: faker.helpers.arrayElement(['auto', 150, 200, 250]),
      fontSize: faker.helpers.arrayElement([14, 16, 18, 20]),
      fontFamily: faker.helpers.arrayElement(['Inter', 'Caveat', 'Crimson Pro']),
      createdAt: faker.date.past(),
      modifiedAt: faker.date.recent()
    };
    blocks.push(block);
  }

  await db.textBlocks.bulkAdd(blocks);
  return blocks;
}

export async function seedDiaryEntries(count: number = 10): Promise<DiaryEntry[]> {
  const entries: DiaryEntry[] = [];

  for (let i = 0; i < count; i++) {
    const entry: DiaryEntry = {
      id: faker.string.uuid(),
      date: faker.date.recent({ days: count - i }),
      content: faker.lorem.paragraphs({ min: 2, max: 5 }),
      wordCount: faker.number.int({ min: 50, max: 500 }),
      mood: faker.helpers.arrayElement(['happy', 'sad', 'neutral', 'excited', undefined]),
      isLocked: faker.datatype.boolean({ probability: 0.1 }),
      createdAt: faker.date.past(),
      modifiedAt: faker.date.recent()
    };
    entries.push(entry);
  }

  await db.diaryEntries.bulkAdd(entries);
  return entries;
}

export async function seedDrafts(count: number = 5): Promise<Draft[]> {
  const drafts: Draft[] = [];

  for (let i = 0; i < count; i++) {
    const draft: Draft = {
      id: faker.string.uuid(),
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      content: faker.lorem.paragraphs({ min: 3, max: 10 }),
      status: faker.helpers.arrayElement(['in-progress', 'review', 'complete']),
      wordCount: faker.number.int({ min: 100, max: 2000 }),
      tags: faker.helpers.arrayElements(
        ['essay', 'blog', 'letter', 'story', 'research'],
        { min: 0, max: 3 }
      ),
      isLocked: faker.datatype.boolean({ probability: 0.1 }),
      createdAt: faker.date.past(),
      modifiedAt: faker.date.recent()
    };
    drafts.push(draft);
  }

  await db.drafts.bulkAdd(drafts);
  return drafts;
}

export function createMockTextBlock(overrides?: Partial<TextBlock>): TextBlock {
  return {
    id: faker.string.uuid(),
    pageId: faker.string.uuid(),
    content: faker.lorem.sentence(),
    position: { x: 100, y: 100 },
    width: 'auto',
    fontSize: 16,
    fontFamily: 'Inter',
    createdAt: new Date(),
    modifiedAt: new Date(),
    ...overrides
  };
}

export function createMockPage(overrides?: Partial<ScratchpadPage>): ScratchpadPage {
  return {
    id: faker.string.uuid(),
    pageNumber: 1,
    categoryName: 'notes',
    categoryColor: '#BBDEFB',
    textBlockIds: [],
    createdAt: new Date(),
    modifiedAt: new Date(),
    isLocked: false,
    ...overrides
  };
}
```

### 2.3 Store Test Utilities

```typescript
// src/test/store-utils.ts
import { act } from '@testing-library/react';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';

export function resetAllStores() {
  act(() => {
    useScratchpadStore.setState({
      pages: [],
      currentPageIndex: 0,
      textBlocks: new Map(),
      isLoaded: false
    });

    useSettingsStore.setState({
      global: {
        id: 'global',
        theme: 'system',
        accentColor: '#4A90A4',
        shelfLayout: 'grid',
        autoBackupEnabled: true,
        autoBackupFrequency: 'daily',
        backupLocation: '',
        autoLockTimeout: 0
      },
      isLoaded: false
    });

    useAppStore.setState({
      currentView: 'shelf',
      currentDiary: null,
      currentDocumentId: null,
      isSidebarOpen: true,
      isSettingsOpen: false,
      contextMenu: null,
      isAppLocked: false,
      lastActivityTime: Date.now()
    });
  });
}
```

---

## 3. Unit Tests

### 3.1 Utility Function Tests

```typescript
// src/utils/__tests__/imperfection.test.ts
import { describe, it, expect } from 'vitest';
import {
  wobbleLine,
  handDrawnRect,
  handDrawnCircle,
  varyingStrokeWidth
} from '../imperfection';

describe('imperfection utilities', () => {
  describe('wobbleLine', () => {
    it('returns same number of points as input', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 100 }
      ];
      const result = wobbleLine(points, 12345, 2);

      expect(result).toHaveLength(points.length);
    });

    it('produces consistent output with same seed', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ];
      const result1 = wobbleLine(points, 42, 2);
      const result2 = wobbleLine(points, 42, 2);

      expect(result1).toEqual(result2);
    });

    it('produces different output with different seeds', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ];
      const result1 = wobbleLine(points, 42, 2);
      const result2 = wobbleLine(points, 43, 2);

      expect(result1).not.toEqual(result2);
    });

    it('applies less wobble to endpoints', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 100 }
      ];
      const result = wobbleLine(points, 12345, 10);

      // Endpoints should be closer to original than midpoint
      const startDiff = Math.abs(result[0].x - 0) + Math.abs(result[0].y - 0);
      const midDiff = Math.abs(result[1].x - 50) + Math.abs(result[1].y - 50);
      const endDiff = Math.abs(result[2].x - 100) + Math.abs(result[2].y - 100);

      expect(startDiff).toBeLessThan(midDiff);
      expect(endDiff).toBeLessThan(midDiff);
    });

    it('respects intensity parameter', () => {
      const points = [{ x: 50, y: 50 }];
      const lowIntensity = wobbleLine(points, 42, 1);
      const highIntensity = wobbleLine(points, 42, 10);

      const lowDiff = Math.abs(lowIntensity[0].x - 50);
      const highDiff = Math.abs(highIntensity[0].x - 50);

      expect(lowDiff).toBeLessThan(highDiff);
    });
  });

  describe('handDrawnRect', () => {
    it('returns valid SVG path', () => {
      const path = handDrawnRect(10, 10, 100, 50, 12345);

      expect(path).toMatch(/^M \d/);
      expect(path).toContain('Q');
    });

    it('creates closed path', () => {
      const path = handDrawnRect(0, 0, 100, 100, 42);

      // Path should return to start area
      expect(path).toMatch(/M .* Q .* Q .* Q .* Q/);
    });

    it('produces consistent output with same seed', () => {
      const path1 = handDrawnRect(0, 0, 100, 100, 42);
      const path2 = handDrawnRect(0, 0, 100, 100, 42);

      expect(path1).toEqual(path2);
    });
  });

  describe('handDrawnCircle', () => {
    it('returns valid SVG path', () => {
      const path = handDrawnCircle(50, 50, 25, 12345);

      expect(path).toMatch(/^M \d/);
      expect(path).toContain('Q');
      expect(path).toMatch(/Z$/);
    });

    it('creates closed path', () => {
      const path = handDrawnCircle(50, 50, 25, 42);

      expect(path).toMatch(/Z$/);
    });
  });

  describe('varyingStrokeWidth', () => {
    it('returns array of widths', () => {
      const widths = varyingStrokeWidth(2, 100, 42);

      expect(Array.isArray(widths)).toBe(true);
      expect(widths.length).toBeGreaterThan(0);
    });

    it('widths vary around base width', () => {
      const baseWidth = 4;
      const widths = varyingStrokeWidth(baseWidth, 100, 42);

      const avg = widths.reduce((a, b) => a + b, 0) / widths.length;

      expect(avg).toBeCloseTo(baseWidth, 0);
    });

    it('all widths are positive', () => {
      const widths = varyingStrokeWidth(2, 100, 42);

      widths.forEach((w) => {
        expect(w).toBeGreaterThan(0);
      });
    });
  });
});
```

```typescript
// src/utils/__tests__/formatting.test.ts
import { describe, it, expect } from 'vitest';
import { stripFormatting, preserveLineBreaks, countWords } from '../formatting';

describe('formatting utilities', () => {
  describe('stripFormatting', () => {
    it('removes HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      expect(stripFormatting(input)).toBe('Hello world');
    });

    it('preserves plain text', () => {
      const input = 'Hello world';
      expect(stripFormatting(input)).toBe('Hello world');
    });

    it('handles nested tags', () => {
      const input = '<div><p><span>Nested</span> text</p></div>';
      expect(stripFormatting(input)).toBe('Nested text');
    });

    it('removes style attributes', () => {
      const input = '<span style="color: red">Styled</span>';
      expect(stripFormatting(input)).toBe('Styled');
    });
  });

  describe('preserveLineBreaks', () => {
    it('converts br tags to newlines', () => {
      const input = 'Line 1<br>Line 2<br/>Line 3';
      expect(preserveLineBreaks(input)).toBe('Line 1\nLine 2\nLine 3');
    });

    it('converts p tags to double newlines', () => {
      const input = '<p>Para 1</p><p>Para 2</p>';
      expect(preserveLineBreaks(input)).toBe('Para 1\n\nPara 2');
    });

    it('handles mixed content', () => {
      const input = '<p>Para 1<br>with break</p><p>Para 2</p>';
      const result = preserveLineBreaks(input);

      expect(result).toContain('Para 1');
      expect(result).toContain('with break');
      expect(result).toContain('Para 2');
    });
  });

  describe('countWords', () => {
    it('counts words in plain text', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('One two three four five')).toBe(5);
    });

    it('handles multiple spaces', () => {
      expect(countWords('Hello    world')).toBe(2);
    });

    it('handles newlines', () => {
      expect(countWords('Hello\nworld')).toBe(2);
    });

    it('returns 0 for empty string', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });

    it('handles punctuation', () => {
      expect(countWords("Hello, world! How's it going?")).toBe(5);
    });
  });
});
```

### 3.2 Database Query Tests

```typescript
// src/db/queries/__tests__/scratchpad.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db/database';
import {
  getPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getTextBlocksForPage
} from '../scratchpad';
import { clearDatabase, seedScratchpadPages, seedTextBlocks } from '@/test/db-utils';

describe('scratchpad queries', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('getPages', () => {
    it('returns empty array when no pages exist', async () => {
      const pages = await getPages();
      expect(pages).toEqual([]);
    });

    it('returns all pages ordered by pageNumber', async () => {
      await seedScratchpadPages(5);
      const pages = await getPages();

      expect(pages).toHaveLength(5);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[4].pageNumber).toBe(5);
    });
  });

  describe('getPageById', () => {
    it('returns undefined for non-existent page', async () => {
      const page = await getPageById('non-existent');
      expect(page).toBeUndefined();
    });

    it('returns correct page', async () => {
      const [seededPage] = await seedScratchpadPages(1);
      const page = await getPageById(seededPage.id);

      expect(page).toBeDefined();
      expect(page!.id).toBe(seededPage.id);
    });
  });

  describe('createPage', () => {
    it('creates page with correct data', async () => {
      const page = await createPage({
        categoryName: 'ideas',
        categoryColor: '#FFF9C4'
      });

      expect(page.id).toBeDefined();
      expect(page.categoryName).toBe('ideas');
      expect(page.pageNumber).toBe(1);
    });

    it('increments page number', async () => {
      await createPage({ categoryName: 'notes', categoryColor: '#BBDEFB' });
      const page2 = await createPage({ categoryName: 'todos', categoryColor: '#C8E6C9' });

      expect(page2.pageNumber).toBe(2);
    });
  });

  describe('updatePage', () => {
    it('updates page properties', async () => {
      const [page] = await seedScratchpadPages(1);

      await updatePage(page.id, { categoryName: 'todos' });
      const updated = await getPageById(page.id);

      expect(updated!.categoryName).toBe('todos');
    });

    it('updates modifiedAt timestamp', async () => {
      const [page] = await seedScratchpadPages(1);
      const originalModified = page.modifiedAt;

      await new Promise((r) => setTimeout(r, 10)); // Ensure time passes
      await updatePage(page.id, { categoryName: 'todos' });
      const updated = await getPageById(page.id);

      expect(updated!.modifiedAt.getTime()).toBeGreaterThan(originalModified.getTime());
    });
  });

  describe('deletePage', () => {
    it('removes page from database', async () => {
      const [page] = await seedScratchpadPages(1);

      await deletePage(page.id);
      const result = await getPageById(page.id);

      expect(result).toBeUndefined();
    });

    it('also deletes associated text blocks', async () => {
      const [page] = await seedScratchpadPages(1);
      await seedTextBlocks(page.id, 3);

      await deletePage(page.id);
      const blocks = await getTextBlocksForPage(page.id);

      expect(blocks).toHaveLength(0);
    });
  });

  describe('getTextBlocksForPage', () => {
    it('returns empty array when no blocks exist', async () => {
      const [page] = await seedScratchpadPages(1);
      const blocks = await getTextBlocksForPage(page.id);

      expect(blocks).toEqual([]);
    });

    it('returns all blocks for page', async () => {
      const [page] = await seedScratchpadPages(1);
      await seedTextBlocks(page.id, 5);

      const blocks = await getTextBlocksForPage(page.id);
      expect(blocks).toHaveLength(5);
    });

    it('only returns blocks for specified page', async () => {
      const pages = await seedScratchpadPages(2);
      await seedTextBlocks(pages[0].id, 3);
      await seedTextBlocks(pages[1].id, 5);

      const blocks = await getTextBlocksForPage(pages[0].id);
      expect(blocks).toHaveLength(3);
    });
  });
});
```

### 3.3 Store Tests

```typescript
// src/stores/__tests__/scratchpadStore.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useScratchpadStore } from '../scratchpadStore';
import { clearDatabase, seedScratchpadPages } from '@/test/db-utils';
import { resetAllStores } from '@/test/store-utils';

describe('scratchpadStore', () => {
  beforeEach(async () => {
    await clearDatabase();
    resetAllStores();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('loadPages', () => {
    it('loads pages from database', async () => {
      await seedScratchpadPages(3);
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      expect(result.current.pages).toHaveLength(3);
      expect(result.current.isLoaded).toBe(true);
    });

    it('sets empty array when no pages exist', async () => {
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      expect(result.current.pages).toEqual([]);
      expect(result.current.isLoaded).toBe(true);
    });
  });

  describe('createPage', () => {
    it('creates new page with default category', async () => {
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      let newPage;
      await act(async () => {
        newPage = await result.current.createPage();
      });

      expect(result.current.pages).toHaveLength(1);
      expect(newPage.categoryName).toBe('notes');
    });

    it('creates page with specified category', async () => {
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      let newPage;
      await act(async () => {
        newPage = await result.current.createPage('ideas');
      });

      expect(newPage.categoryName).toBe('ideas');
      expect(newPage.categoryColor).toBe('#FFF9C4');
    });

    it('increments page number correctly', async () => {
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
        await result.current.createPage();
        await result.current.createPage();
      });

      expect(result.current.pages[0].pageNumber).toBe(1);
      expect(result.current.pages[1].pageNumber).toBe(2);
    });
  });

  describe('navigateToPage', () => {
    it('updates current page index', async () => {
      await seedScratchpadPages(5);
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      act(() => {
        result.current.navigateToPage(3);
      });

      expect(result.current.currentPageIndex).toBe(3);
    });

    it('ignores invalid negative index', async () => {
      await seedScratchpadPages(5);
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      act(() => {
        result.current.navigateToPage(-1);
      });

      expect(result.current.currentPageIndex).toBe(0);
    });

    it('ignores index beyond page count', async () => {
      await seedScratchpadPages(5);
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      act(() => {
        result.current.navigateToPage(10);
      });

      expect(result.current.currentPageIndex).toBe(0);
    });
  });

  describe('findFreshPage', () => {
    it('returns first empty page index', async () => {
      const pages = await seedScratchpadPages(5);
      // Seed text blocks only for first 2 pages
      const { seedTextBlocks } = await import('@/test/db-utils');
      await seedTextBlocks(pages[0].id, 2);
      await seedTextBlocks(pages[1].id, 1);

      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      const freshIndex = result.current.findFreshPage();
      expect(freshIndex).toBe(2); // Third page (index 2) should be empty
    });

    it('returns page count when all pages have content', async () => {
      const pages = await seedScratchpadPages(3);
      const { seedTextBlocks } = await import('@/test/db-utils');
      for (const page of pages) {
        await seedTextBlocks(page.id, 1);
      }

      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      const freshIndex = result.current.findFreshPage();
      expect(freshIndex).toBe(3); // All pages have content, return next index
    });
  });

  describe('createTextBlock', () => {
    it('creates text block at specified position', async () => {
      const [page] = await seedScratchpadPages(1);
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      let block;
      await act(async () => {
        block = await result.current.createTextBlock(page.id, { x: 100, y: 200 });
      });

      expect(block.position).toEqual({ x: 100, y: 200 });
      expect(block.content).toBe('');
      expect(result.current.textBlocks.get(page.id)).toHaveLength(1);
    });
  });

  describe('updateTextBlock', () => {
    it('updates text block content', async () => {
      const [page] = await seedScratchpadPages(1);
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      let block;
      await act(async () => {
        block = await result.current.createTextBlock(page.id, { x: 0, y: 0 });
      });

      await act(async () => {
        await result.current.updateTextBlock(block.id, { content: 'Updated content' });
      });

      const blocks = result.current.textBlocks.get(page.id);
      expect(blocks![0].content).toBe('Updated content');
    });
  });

  describe('deleteTextBlock', () => {
    it('removes text block', async () => {
      const [page] = await seedScratchpadPages(1);
      const { result } = renderHook(() => useScratchpadStore());

      await act(async () => {
        await result.current.loadPages();
      });

      let block;
      await act(async () => {
        block = await result.current.createTextBlock(page.id, { x: 0, y: 0 });
      });

      await act(async () => {
        await result.current.deleteTextBlock(block.id);
      });

      const blocks = result.current.textBlocks.get(page.id);
      expect(blocks).toHaveLength(0);
    });
  });
});
```

### 3.4 Hook Tests

```typescript
// src/hooks/__tests__/usePasteHandler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePasteHandler } from '../usePasteHandler';
import { useRef } from 'react';

describe('usePasteHandler', () => {
  let mockElement: HTMLDivElement;
  let pasteEvent: ClipboardEvent;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.contentEditable = 'true';
    document.body.appendChild(mockElement);

    // Create mock clipboard data
    const clipboardData = {
      getData: vi.fn((type: string) => {
        if (type === 'text/plain') {
          return 'Plain text content';
        }
        if (type === 'text/html') {
          return '<p style="color: red"><strong>Formatted</strong> content</p>';
        }
        return '';
      })
    };

    pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: clipboardData as unknown as DataTransfer
    });
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  it('strips HTML formatting from pasted content', () => {
    const ref = { current: mockElement };
    renderHook(() =>
      usePasteHandler(ref, { fontFamily: 'Inter', fontSize: 16 })
    );

    // Focus and set selection
    mockElement.focus();
    const range = document.createRange();
    range.selectNodeContents(mockElement);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Dispatch paste event
    mockElement.dispatchEvent(pasteEvent);

    // Should contain plain text, not HTML
    expect(mockElement.innerHTML).not.toContain('<strong>');
    expect(mockElement.innerHTML).not.toContain('style=');
  });

  it('preserves line breaks', () => {
    const clipboardData = {
      getData: vi.fn().mockReturnValue('Line 1\nLine 2\nLine 3')
    };

    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: clipboardData as unknown as DataTransfer
    });

    const ref = { current: mockElement };
    renderHook(() =>
      usePasteHandler(ref, { fontFamily: 'Inter', fontSize: 16 })
    );

    mockElement.focus();
    const range = document.createRange();
    range.selectNodeContents(mockElement);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    mockElement.dispatchEvent(event);

    // Should have br elements for line breaks
    expect(mockElement.querySelectorAll('br').length).toBe(2);
  });

  it('prevents default paste behavior', () => {
    const ref = { current: mockElement };
    renderHook(() =>
      usePasteHandler(ref, { fontFamily: 'Inter', fontSize: 16 })
    );

    const preventDefault = vi.fn();
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: () => 'test' }
    });

    mockElement.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });
});
```

```typescript
// src/hooks/__tests__/useKeyboardShortcuts.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  it('calls handler for matching shortcut', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'Ctrl+s': handler }));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handles Cmd key on Mac as Ctrl', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'Ctrl+s': handler }));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true, // Cmd key
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handles Shift modifier', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'Ctrl+Shift+l': handler }));

    const event = new KeyboardEvent('keydown', {
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call handler for partial match', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'Ctrl+Shift+s': handler }));

    // Only Ctrl+s, not Ctrl+Shift+s
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      shiftKey: false,
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('prevents default for matched shortcuts', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'Ctrl+s': handler }));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('handles special keys like PageDown', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ PageDown: handler }));

    const event = new KeyboardEvent('keydown', {
      key: 'PageDown',
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({ 'Ctrl+s': handler })
    );

    unmount();

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});
```

---

## 4. Component Tests

### 4.1 Shelf Component Tests

```typescript
// src/components/shelf/__tests__/Shelf.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@/test/utils';
import { Shelf } from '../Shelf';
import { useAppStore } from '@/stores/appStore';
import { resetAllStores } from '@/test/store-utils';

describe('Shelf', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders all diary cards', () => {
    render(<Shelf />);

    expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    expect(screen.getByText('Blackboard')).toBeInTheDocument();
    expect(screen.getByText('Personal Diary')).toBeInTheDocument();
    expect(screen.getByText('Drafts')).toBeInTheDocument();
    expect(screen.getByText('Long Drafts')).toBeInTheDocument();
    expect(screen.getByText('Academic Papers')).toBeInTheDocument();
  });

  it('renders settings button', () => {
    render(<Shelf />);

    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('navigates to diary on card click', async () => {
    const { user } = render(<Shelf />);

    const scratchpadCard = screen.getByText('Scratchpad').closest('button');
    await user.click(scratchpadCard!);

    const state = useAppStore.getState();
    expect(state.currentDiary).toBe('scratchpad');
    expect(state.currentView).toBe('diary');
  });

  it('opens settings on settings button click', async () => {
    const { user } = render(<Shelf />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    const state = useAppStore.getState();
    expect(state.isSettingsOpen).toBe(true);
  });

  it('applies grid layout class when layout is grid', () => {
    useSettingsStore.setState({
      global: { ...defaultGlobalSettings, shelfLayout: 'grid' }
    });

    const { container } = render(<Shelf />);

    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('applies list layout class when layout is list', () => {
    useSettingsStore.setState({
      global: { ...defaultGlobalSettings, shelfLayout: 'list' }
    });

    const { container } = render(<Shelf />);

    expect(container.querySelector('.flex-col')).toBeInTheDocument();
  });
});
```

### 4.2 Scratchpad Component Tests

```typescript
// src/components/diaries/scratchpad/__tests__/Scratchpad.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { Scratchpad } from '../Scratchpad';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { clearDatabase, seedScratchpadPages, seedTextBlocks } from '@/test/db-utils';
import { resetAllStores } from '@/test/store-utils';

describe('Scratchpad', () => {
  beforeEach(async () => {
    await clearDatabase();
    resetAllStores();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('shows loading state initially', () => {
    render(<Scratchpad />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no pages exist', async () => {
    render(<Scratchpad />);

    await waitFor(() => {
      expect(screen.getByText(/no pages yet/i)).toBeInTheDocument();
    });
  });

  it('shows create first page button in empty state', async () => {
    render(<Scratchpad />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create first page/i })).toBeInTheDocument();
    });
  });

  it('creates page when create button is clicked', async () => {
    const { user } = render(<Scratchpad />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create first page/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create first page/i }));

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    });
  });

  it('displays page count', async () => {
    await seedScratchpadPages(5);

    render(<Scratchpad />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
    });
  });

  it('renders page stack indicator', async () => {
    await seedScratchpadPages(3);

    render(<Scratchpad />);

    await waitFor(() => {
      // Page stack should show indicators for each page
      const pageStack = screen.getByTestId('page-stack');
      expect(pageStack).toBeInTheDocument();
    });
  });

  it('navigates pages with keyboard', async () => {
    await seedScratchpadPages(5);

    const { user } = render(<Scratchpad />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
    });

    await user.keyboard('{PageDown}');

    await waitFor(() => {
      expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument();
    });
  });

  it('displays category picker', async () => {
    await seedScratchpadPages(1);

    render(<Scratchpad />);

    await waitFor(() => {
      expect(screen.getByTestId('category-picker')).toBeInTheDocument();
    });
  });
});
```

### 4.3 TextBlock Component Tests

```typescript
// src/components/diaries/scratchpad/__tests__/TextBlock.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { TextBlock } from '../TextBlock';
import { createMockTextBlock } from '@/test/db-utils';

describe('TextBlock', () => {
  const mockBlock = createMockTextBlock({
    content: 'Test content',
    position: { x: 100, y: 200 }
  });

  it('renders at correct position', () => {
    render(<TextBlock block={mockBlock} pageId="page-1" />);

    const element = screen.getByText('Test content');
    expect(element).toHaveStyle({
      left: '100px',
      top: '200px'
    });
  });

  it('displays content', () => {
    render(<TextBlock block={mockBlock} pageId="page-1" />);

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('is editable when not locked', () => {
    render(<TextBlock block={mockBlock} pageId="page-1" />);

    const element = screen.getByText('Test content');
    expect(element).toHaveAttribute('contenteditable', 'true');
  });

  it('is not editable when locked', () => {
    const lockedBlock = createMockTextBlock({ isLocked: true });
    render(<TextBlock block={lockedBlock} pageId="page-1" />);

    const element = screen.getByRole('textbox');
    expect(element).toHaveAttribute('contenteditable', 'false');
  });

  it('shows focus ring on focus', async () => {
    const { user } = render(<TextBlock block={mockBlock} pageId="page-1" />);

    const element = screen.getByText('Test content');
    await user.click(element);

    expect(element).toHaveClass('ring-1');
  });

  it('updates content on input', async () => {
    const updateMock = vi.fn();
    vi.mock('@/stores/scratchpadStore', () => ({
      useScratchpadStore: () => ({
        updateTextBlock: updateMock,
        deleteTextBlock: vi.fn()
      })
    }));

    const { user } = render(<TextBlock block={mockBlock} pageId="page-1" />);

    const element = screen.getByText('Test content');
    await user.click(element);
    await user.type(element, ' more text');

    expect(updateMock).toHaveBeenCalled();
  });

  it('applies font styles from block', () => {
    const styledBlock = createMockTextBlock({
      fontFamily: 'Caveat',
      fontSize: 20
    });

    render(<TextBlock block={styledBlock} pageId="page-1" />);

    const element = screen.getByRole('textbox');
    expect(element).toHaveStyle({
      fontFamily: 'Caveat',
      fontSize: '20px'
    });
  });
});
```

### 4.4 PageStack Component Tests

```typescript
// src/components/common/PageStack/__tests__/PageStack.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { PageStack } from '../PageStack';
import { createMockPage, createMockTextBlock } from '@/test/db-utils';

describe('PageStack', () => {
  const mockPages = [
    createMockPage({ id: '1', pageNumber: 1 }),
    createMockPage({ id: '2', pageNumber: 2 }),
    createMockPage({ id: '3', pageNumber: 3 })
  ];

  const mockTextBlocks = new Map([
    ['1', [createMockTextBlock()]],
    ['2', []],
    ['3', [createMockTextBlock(), createMockTextBlock()]]
  ]);

  it('renders indicator for each page', () => {
    render(
      <PageStack
        pages={mockPages}
        currentIndex={0}
        textBlocks={mockTextBlocks}
        onPageClick={vi.fn()}
      />
    );

    const indicators = screen.getAllByTestId('page-indicator');
    expect(indicators).toHaveLength(3);
  });

  it('highlights current page', () => {
    render(
      <PageStack
        pages={mockPages}
        currentIndex={1}
        textBlocks={mockTextBlocks}
        onPageClick={vi.fn()}
      />
    );

    const indicators = screen.getAllByTestId('page-indicator');
    expect(indicators[1]).toHaveClass('current');
  });

  it('shows darker indicator for pages with content', () => {
    render(
      <PageStack
        pages={mockPages}
        currentIndex={0}
        textBlocks={mockTextBlocks}
        onPageClick={vi.fn()}
      />
    );

    const indicators = screen.getAllByTestId('page-indicator');

    // Page 1 has content
    expect(indicators[0]).toHaveClass('has-content');

    // Page 2 is empty
    expect(indicators[1]).not.toHaveClass('has-content');

    // Page 3 has content
    expect(indicators[2]).toHaveClass('has-content');
  });

  it('calls onPageClick with correct index', async () => {
    const onPageClick = vi.fn();
    const { user } = render(
      <PageStack
        pages={mockPages}
        currentIndex={0}
        textBlocks={mockTextBlocks}
        onPageClick={onPageClick}
      />
    );

    const indicators = screen.getAllByTestId('page-indicator');
    await user.click(indicators[2]);

    expect(onPageClick).toHaveBeenCalledWith(2);
  });
});
```

---

## 5. Integration Tests

### 5.1 Diary Flow Integration Tests

```typescript
// src/test/integration/diary-flow.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { App } from '@/App';
import { clearDatabase } from '@/test/db-utils';
import { resetAllStores } from '@/test/store-utils';

describe('Diary Flow Integration', () => {
  beforeEach(async () => {
    await clearDatabase();
    resetAllStores();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('Scratchpad flow', () => {
    it('navigates from shelf to scratchpad and back', async () => {
      const { user } = render(<App />);

      // Should start on shelf
      expect(screen.getByText('MUWI')).toBeInTheDocument();

      // Click scratchpad
      await user.click(screen.getByText('Scratchpad'));

      // Should show scratchpad
      await waitFor(() => {
        expect(screen.getByText(/no pages yet/i)).toBeInTheDocument();
      });

      // Navigate back
      await user.click(screen.getByRole('button', { name: /shelf/i }));

      // Should be back on shelf
      expect(screen.getByText('MUWI')).toBeInTheDocument();
    });

    it('creates and edits a page', async () => {
      const { user } = render(<App />);

      // Navigate to scratchpad
      await user.click(screen.getByText('Scratchpad'));

      // Create first page
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first page/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /create first page/i }));

      // Should show page 1
      await waitFor(() => {
        expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
      });

      // Click on canvas to create text block
      const canvas = screen.getByTestId('scratchpad-canvas');
      await user.click(canvas);

      // Type in the text block
      await user.keyboard('My first note');

      // Content should be saved (check database)
      await waitFor(() => {
        expect(screen.getByText('My first note')).toBeInTheDocument();
      });
    });

    it('navigates between pages', async () => {
      const { user } = render(<App />);

      // Navigate to scratchpad
      await user.click(screen.getByText('Scratchpad'));

      // Create multiple pages
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first page/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create first page/i }));
      await user.keyboard('{Control>}n{/Control}'); // Create second page
      await user.keyboard('{Control>}n{/Control}'); // Create third page

      // Should show page 3
      await waitFor(() => {
        expect(screen.getByText(/page 3 of 3/i)).toBeInTheDocument();
      });

      // Navigate to page 1 using page stack
      const pageStack = screen.getByTestId('page-stack');
      const indicators = pageStack.querySelectorAll('[data-testid="page-indicator"]');
      await user.click(indicators[0]);

      // Should show page 1
      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      });
    });
  });

  describe('Personal Diary flow', () => {
    it('creates entry for today', async () => {
      const { user } = render(<App />);

      // Navigate to personal diary
      await user.click(screen.getByText('Personal Diary'));

      await waitFor(() => {
        // Should show today's date
        const today = new Date();
        expect(screen.getByText(today.getDate().toString())).toBeInTheDocument();
      });

      // Type in the editor
      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Today was a good day.');

      // Content should be visible
      expect(screen.getByText(/Today was a good day/)).toBeInTheDocument();
    });
  });
});
```

### 5.2 Content Locking Integration Tests

```typescript
// src/test/integration/content-locking.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { App } from '@/App';
import { clearDatabase, seedScratchpadPages, seedTextBlocks } from '@/test/db-utils';
import { resetAllStores } from '@/test/store-utils';
import { useSettingsStore } from '@/stores/settingsStore';

describe('Content Locking Integration', () => {
  beforeEach(async () => {
    await clearDatabase();
    resetAllStores();

    // Set up passkey
    await useSettingsStore.getState().setPasskey('testpass123', 'test hint');
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('locks and unlocks content with passkey', async () => {
    const pages = await seedScratchpadPages(1);
    await seedTextBlocks(pages[0].id, 1);

    const { user } = render(<App />);

    // Navigate to scratchpad
    await user.click(screen.getByText('Scratchpad'));

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    });

    // Right-click on text block to open context menu
    const textBlock = screen.getByRole('textbox');
    await user.pointer({ keys: '[MouseRight]', target: textBlock });

    // Click lock option
    await user.click(screen.getByText('Lock'));

    // Text should now be locked
    await waitFor(() => {
      expect(textBlock).toHaveAttribute('contenteditable', 'false');
    });

    // Try to unlock
    await user.pointer({ keys: '[MouseRight]', target: textBlock });
    await user.click(screen.getByText('Unlock'));

    // Should show passkey prompt
    expect(screen.getByPlaceholderText(/passkey/i)).toBeInTheDocument();

    // Enter passkey
    await user.type(screen.getByPlaceholderText(/passkey/i), 'testpass123');
    await user.click(screen.getByRole('button', { name: /unlock/i }));

    // Text should be unlocked
    await waitFor(() => {
      expect(textBlock).toHaveAttribute('contenteditable', 'true');
    });
  });

  it('shows passkey hint when available', async () => {
    const pages = await seedScratchpadPages(1);
    await seedTextBlocks(pages[0].id, 1);

    // Lock the content first
    // ... (lock content)

    const { user } = render(<App />);

    // Navigate and try to unlock
    await user.click(screen.getByText('Scratchpad'));

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    });

    // Trigger unlock flow
    const textBlock = screen.getByRole('textbox');
    await user.pointer({ keys: '[MouseRight]', target: textBlock });
    await user.click(screen.getByText('Unlock'));

    // Click show hint
    await user.click(screen.getByText(/show hint/i));

    // Should show hint
    expect(screen.getByText('test hint')).toBeInTheDocument();
  });
});
```

### 5.3 Settings Integration Tests

```typescript
// src/test/integration/settings.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { App } from '@/App';
import { clearDatabase } from '@/test/db-utils';
import { resetAllStores } from '@/test/store-utils';
import { useSettingsStore } from '@/stores/settingsStore';

describe('Settings Integration', () => {
  beforeEach(async () => {
    await clearDatabase();
    resetAllStores();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('opens and closes settings modal', async () => {
    const { user } = render(<App />);

    // Open settings
    await user.click(screen.getByRole('button', { name: /settings/i }));

    // Modal should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Close settings
    await user.click(screen.getByRole('button', { name: /close/i }));

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('changes theme setting', async () => {
    const { user } = render(<App />);

    // Open settings
    await user.click(screen.getByRole('button', { name: /settings/i }));

    // Find theme select
    const themeSelect = screen.getByLabelText(/theme/i);
    await user.selectOptions(themeSelect, 'dark');

    // Setting should be updated
    await waitFor(() => {
      const state = useSettingsStore.getState();
      expect(state.global.theme).toBe('dark');
    });
  });

  it('changes shelf layout', async () => {
    const { user } = render(<App />);

    // Open settings
    await user.click(screen.getByRole('button', { name: /settings/i }));

    // Change layout
    await user.click(screen.getByLabelText(/list/i));

    // Close settings
    await user.click(screen.getByRole('button', { name: /close/i }));

    // Shelf should show list layout
    await waitFor(() => {
      const container = screen.getByTestId('shelf-container');
      expect(container).toHaveClass('flex-col');
    });
  });

  it('persists settings across sessions', async () => {
    const { user, unmount } = render(<App />);

    // Open settings and change theme
    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.selectOptions(screen.getByLabelText(/theme/i), 'dark');
    await user.click(screen.getByRole('button', { name: /close/i }));

    // Unmount and remount
    unmount();
    render(<App />);

    // Settings should be persisted
    await waitFor(() => {
      const state = useSettingsStore.getState();
      expect(state.global.theme).toBe('dark');
    });
  });
});
```

---

## 6. End-to-End Tests (Playwright)

### 6.1 Homepage E2E Tests

```typescript
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays all diary cards', async ({ page }) => {
    await expect(page.getByText('Scratchpad')).toBeVisible();
    await expect(page.getByText('Blackboard')).toBeVisible();
    await expect(page.getByText('Personal Diary')).toBeVisible();
    await expect(page.getByText('Drafts')).toBeVisible();
    await expect(page.getByText('Long Drafts')).toBeVisible();
    await expect(page.getByText('Academic Papers')).toBeVisible();
  });

  test('navigates to scratchpad on click', async ({ page }) => {
    await page.getByText('Scratchpad').click();
    await expect(page).toHaveURL(/.*scratchpad/);
  });

  test('opens settings modal', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('closes settings with escape key', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
```

### 6.2 Scratchpad E2E Tests

```typescript
// e2e/scratchpad.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Scratchpad', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('muwi-database');
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    });

    await page.goto('/');
    await page.getByText('Scratchpad').click();
  });

  test('shows empty state for new user', async ({ page }) => {
    await expect(page.getByText(/no pages yet/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create first page/i })).toBeVisible();
  });

  test('creates first page', async ({ page }) => {
    await page.getByRole('button', { name: /create first page/i }).click();
    await expect(page.getByText(/page 1 of 1/i)).toBeVisible();
  });

  test('creates text block on canvas click', async ({ page }) => {
    await page.getByRole('button', { name: /create first page/i }).click();

    // Click on canvas
    const canvas = page.getByTestId('scratchpad-canvas');
    await canvas.click({ position: { x: 150, y: 200 } });

    // Type in the new text block
    await page.keyboard.type('Hello, World!');

    // Verify text is visible
    await expect(page.getByText('Hello, World!')).toBeVisible();
  });

  test('navigates pages with keyboard', async ({ page }) => {
    // Create multiple pages
    await page.getByRole('button', { name: /create first page/i }).click();
    await page.keyboard.press('Control+n');
    await page.keyboard.press('Control+n');

    await expect(page.getByText(/page 3 of 3/i)).toBeVisible();

    // Navigate back
    await page.keyboard.press('PageUp');
    await expect(page.getByText(/page 2 of 3/i)).toBeVisible();

    await page.keyboard.press('PageUp');
    await expect(page.getByText(/page 1 of 3/i)).toBeVisible();
  });

  test('changes page category', async ({ page }) => {
    await page.getByRole('button', { name: /create first page/i }).click();

    // Open category picker
    await page.getByTestId('category-picker').click();

    // Select "Ideas" category
    await page.getByText('Ideas').click();

    // Page background should change color
    const pageElement = page.getByTestId('scratchpad-page');
    await expect(pageElement).toHaveCSS('background-color', 'rgb(255, 249, 196)');
  });

  test('page stack shows content indicators', async ({ page }) => {
    await page.getByRole('button', { name: /create first page/i }).click();

    // Add content to first page
    const canvas = page.getByTestId('scratchpad-canvas');
    await canvas.click({ position: { x: 150, y: 200 } });
    await page.keyboard.type('Content on page 1');

    // Create empty second page
    await page.keyboard.press('Control+n');

    // Check page stack indicators
    const pageStack = page.getByTestId('page-stack');
    const indicators = pageStack.locator('[data-testid="page-indicator"]');

    // First page should show as having content
    await expect(indicators.first()).toHaveClass(/has-content/);

    // Second page should not have content class
    await expect(indicators.last()).not.toHaveClass(/has-content/);
  });
});
```

### 6.3 Personal Diary E2E Tests

```typescript
// e2e/personal-diary.spec.ts
import { test, expect } from '@playwright/test';
import { format } from 'date-fns';

test.describe('Personal Diary', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('muwi-database');
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    });

    await page.goto('/');
    await page.getByText('Personal Diary').click();
  });

  test('shows today date by default', async ({ page }) => {
    const today = format(new Date(), 'MMMM d, yyyy');
    await expect(page.getByText(today)).toBeVisible();
  });

  test('writes and saves diary entry', async ({ page }) => {
    const editor = page.getByRole('textbox');
    await editor.click();
    await page.keyboard.type('Today was a great day. I learned a lot about testing.');

    // Verify content is visible
    await expect(page.getByText(/Today was a great day/)).toBeVisible();

    // Word count should update
    await expect(page.getByText(/10 words/i)).toBeVisible();
  });

  test('navigates to different dates', async ({ page }) => {
    // Write entry for today
    const editor = page.getByRole('textbox');
    await editor.click();
    await page.keyboard.type('Entry for today');

    // Navigate to previous day
    await page.getByRole('button', { name: /previous/i }).click();

    // Editor should be empty (new entry)
    await expect(editor).toBeEmpty();

    // Write entry for previous day
    await page.keyboard.type('Entry for yesterday');
    await expect(page.getByText('Entry for yesterday')).toBeVisible();

    // Navigate back to today
    await page.getByRole('button', { name: /next/i }).click();

    // Should show today's entry
    await expect(page.getByText('Entry for today')).toBeVisible();
  });

  test('uses calendar to jump to date', async ({ page }) => {
    // Open calendar
    await page.getByTestId('date-picker').click();

    // Select a specific date (first day of month)
    await page.getByRole('gridcell', { name: '1' }).first().click();

    // Date display should update
    await expect(page.getByText(/, 1,/)).toBeVisible();
  });

  test('supports basic text formatting', async ({ page }) => {
    const editor = page.getByRole('textbox');
    await editor.click();

    // Type and format text
    await page.keyboard.type('Bold text');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+b');

    // Text should be bold
    await expect(page.locator('strong')).toContainText('Bold text');
  });
});
```

### 6.4 Cross-Platform E2E Tests

```typescript
// e2e/cross-platform.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-Platform Compatibility', () => {
  test('renders correctly on different viewport sizes', async ({ page }) => {
    await page.goto('/');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Scratchpad')).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Scratchpad')).toBeVisible();

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText('Scratchpad')).toBeVisible();
  });

  test('keyboard shortcuts work correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Scratchpad').click();
    await page.getByRole('button', { name: /create first page/i }).click();

    // Test Ctrl+N (new page)
    await page.keyboard.press('Control+n');
    await expect(page.getByText(/page 2 of 2/i)).toBeVisible();

    // Test Ctrl+H (go home)
    await page.keyboard.press('Control+h');
    await expect(page.getByText('MUWI')).toBeVisible();

    // Test Ctrl+, (settings)
    await page.keyboard.press('Control+,');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('handles offline mode gracefully', async ({ page, context }) => {
    await page.goto('/');

    // Go offline
    await context.setOffline(true);

    // Navigation should still work (local data)
    await page.getByText('Scratchpad').click();
    await expect(page.getByText(/scratchpad/i)).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });
});
```

---

## 7. Performance Tests

### 7.1 Performance Metrics

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000); // 3 seconds max
  });

  test('scratchpad with many pages performs well', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Scratchpad').click();

    // Create 100 pages
    await page.getByRole('button', { name: /create first page/i }).click();

    for (let i = 0; i < 99; i++) {
      await page.keyboard.press('Control+n');
    }

    // Navigation should still be fast
    const startTime = Date.now();
    await page.keyboard.press('PageUp');
    await expect(page.getByText(/page 99 of 100/i)).toBeVisible();
    const navigationTime = Date.now() - startTime;

    expect(navigationTime).toBeLessThan(100); // 100ms max
  });

  test('large text content renders smoothly', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Personal Diary').click();

    const editor = page.getByRole('textbox');
    await editor.click();

    // Type large amount of text
    const largeText = 'Lorem ipsum dolor sit amet. '.repeat(500);
    await page.keyboard.type(largeText, { delay: 0 });

    // Scrolling should be smooth
    const startTime = Date.now();
    await page.keyboard.press('Control+End');
    const scrollTime = Date.now() - startTime;

    expect(scrollTime).toBeLessThan(500);
  });
});
```

### 7.2 Memory Tests

```typescript
// e2e/memory.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Memory Usage', () => {
  test('no memory leaks on navigation', async ({ page }) => {
    await page.goto('/');

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Navigate back and forth many times
    for (let i = 0; i < 20; i++) {
      await page.getByText('Scratchpad').click();
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: /shelf/i }).click();
      await page.waitForLoadState('networkidle');
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Memory shouldn't grow significantly (allow 50% growth)
    const memoryGrowth = (finalMemory - initialMemory) / initialMemory;
    expect(memoryGrowth).toBeLessThan(0.5);
  });
});
```

---

## 8. Accessibility Tests

### 8.1 Automated Accessibility Tests

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('scratchpad has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Scratchpad').click();
    await page.getByRole('button', { name: /create first page/i }).click();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('settings modal has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /settings/i }).click();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through all interactive elements
    const focusableElements = await page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();

    for (const element of focusableElements) {
      await element.focus();
      await expect(element).toBeFocused();
    }
  });

  test('focus trap works in modal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /settings/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Tab through modal - focus should stay within
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isInModal = await modal.locator(':focus').count();
      expect(isInModal).toBe(1);
    }
  });

  test('color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

---

## 9. Test Data Management

### 9.1 Fixtures

```typescript
// e2e/fixtures/test-data.ts
export const testDiaryEntry = {
  date: new Date(),
  content: 'This is a test diary entry with some meaningful content.',
  wordCount: 10
};

export const testDraft = {
  title: 'My Test Draft',
  content: 'This is the content of my test draft.',
  status: 'in-progress' as const
};

export const testPages = [
  { category: 'ideas', content: 'A brilliant idea' },
  { category: 'todos', content: 'Buy groceries' },
  { category: 'notes', content: 'Meeting notes' }
];
```

### 9.2 Database Seeding for E2E

```typescript
// e2e/fixtures/seed-database.ts
import { Page } from '@playwright/test';

export async function seedDatabase(page: Page) {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.open('muwi-database', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['scratchpadPages', 'textBlocks'], 'readwrite');

        const pagesStore = transaction.objectStore('scratchpadPages');
        const blocksStore = transaction.objectStore('textBlocks');

        // Seed pages
        const pages = [
          {
            id: 'page-1',
            pageNumber: 1,
            categoryName: 'notes',
            categoryColor: '#BBDEFB',
            textBlockIds: ['block-1'],
            createdAt: new Date(),
            modifiedAt: new Date(),
            isLocked: false
          }
        ];

        const blocks = [
          {
            id: 'block-1',
            pageId: 'page-1',
            content: 'Seeded content',
            position: { x: 100, y: 100 },
            width: 'auto',
            fontSize: 16,
            fontFamily: 'Inter',
            createdAt: new Date(),
            modifiedAt: new Date()
          }
        ];

        pages.forEach((p) => pagesStore.add(p));
        blocks.forEach((b) => blocksStore.add(b));

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    });
  });
}

export async function clearDatabase(page: Page) {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('muwi-database');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  });
}
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  electron-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Electron app
        run: npm run electron:build

      - name: Run Electron tests
        run: npm run test:electron
```

### 10.2 Package.json Test Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:electron": "playwright test --project=electron",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

## 11. Test Checklist by Feature

### Scratchpad
- [ ] Create new page
- [ ] Navigate between pages
- [ ] Create text block on click
- [ ] Edit text block content
- [ ] Move text block position
- [ ] Delete text block
- [ ] Change page category
- [ ] Lock/unlock content
- [ ] Page stack indicator display
- [ ] Find fresh page function
- [ ] Keyboard navigation

### Blackboard
- [ ] Infinite canvas pan
- [ ] Infinite canvas zoom
- [ ] Create text elements
- [ ] Draw freehand lines
- [ ] Draw shapes (rect, circle, arrow)
- [ ] Hand-drawn imperfection effect
- [ ] Auto-generated index
- [ ] Index navigation
- [ ] Minimap display
- [ ] Font selection

### Personal Diary
- [ ] Create entry for today
- [ ] Date navigation
- [ ] Calendar picker
- [ ] Rich text editing
- [ ] Word count
- [ ] Entry list display
- [ ] Mood tagging
- [ ] Entry locking

### Drafts
- [ ] Create new draft
- [ ] Title editing
- [ ] Status management
- [ ] Tag management
- [ ] Draft list sorting
- [ ] Basic formatting
- [ ] Word count

### Long Drafts
- [ ] Section management
- [ ] TOC generation
- [ ] Footnote insertion
- [ ] Section reordering
- [ ] Focus mode
- [ ] Typewriter mode
- [ ] Export to PDF/Word

### Academic Papers
- [ ] Template selection
- [ ] Citation insertion
- [ ] Bibliography management
- [ ] Reference library
- [ ] Citation style switching
- [ ] Export to LaTeX

### Global Features
- [ ] Paste formatting strip
- [ ] Content locking with passkey
- [ ] Settings persistence
- [ ] Theme switching
- [ ] Keyboard shortcuts
- [ ] Backup/restore

---

*Document Version: 1.0*
*Last Updated: January 2026*
