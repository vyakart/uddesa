import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ScratchpadPage, TextBlock, CategoryName } from '@/types/scratchpad';
import { defaultScratchpadSettings } from '@/types/scratchpad';
import { db } from '@/db/database';
import { useSettingsStore } from '@/stores/settingsStore';

interface ScratchpadState {
  pages: ScratchpadPage[];
  currentPageIndex: number;
  textBlocks: Map<string, TextBlock[]>; // pageId → blocks
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPages: () => Promise<void>;
  createPage: (categoryName?: CategoryName) => Promise<ScratchpadPage>;
  deletePage: (id: string) => Promise<void>;
  navigateToPage: (index: number) => void;
  findFreshPage: () => Promise<number>;
  updatePageCategory: (id: string, categoryName: CategoryName) => Promise<void>;

  // Text block actions
  loadTextBlocksForPage: (pageId: string) => Promise<void>;
  createTextBlock: (pageId: string, position: { x: number; y: number }) => Promise<TextBlock>;
  updateTextBlock: (id: string, updates: Partial<TextBlock>) => Promise<void>;
  deleteTextBlock: (id: string) => Promise<void>;

  // Getters
  getCurrentPage: () => ScratchpadPage | null;
  getCurrentPageBlocks: () => TextBlock[];
}

export const useScratchpadStore = create<ScratchpadState>()(
  devtools(
    (set, get) => ({
      pages: [],
      currentPageIndex: 0,
      textBlocks: new Map(),
      isLoading: false,
      error: null,

      loadPages: async () => {
        set({ isLoading: true, error: null });
        try {
          const pages = await db.scratchpadPages
            .orderBy('pageNumber')
            .toArray();

          if (pages.length === 0) {
            const scratchpadSettings = useSettingsStore.getState().scratchpad;
            const defaultCategory = scratchpadSettings.defaultCategory;

            // Create initial page if none exist
            const now = new Date();
            const initialPage: ScratchpadPage = {
              id: crypto.randomUUID(),
              pageNumber: 1,
              categoryColor: scratchpadSettings.categories[defaultCategory],
              categoryName: defaultCategory,
              textBlockIds: [],
              createdAt: now,
              modifiedAt: now,
              isLocked: false,
            };
            await db.scratchpadPages.add(initialPage);
            set({ pages: [initialPage], currentPageIndex: 0, isLoading: false });
          } else {
            set({ pages, currentPageIndex: 0, isLoading: false });
          }

          // Load text blocks for current page
          const currentPage = get().pages[0];
          if (currentPage) {
            await get().loadTextBlocksForPage(currentPage.id);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load pages',
            isLoading: false,
          });
        }
      },

      createPage: async (categoryName = defaultScratchpadSettings.defaultCategory) => {
        const { pages } = get();
        const scratchpadSettings = useSettingsStore.getState().scratchpad;
        const resolvedCategory = categoryName ?? scratchpadSettings.defaultCategory;
        const now = new Date();
        const newPageNumber = pages.length > 0
          ? Math.max(...pages.map(p => p.pageNumber)) + 1
          : 1;

        const newPage: ScratchpadPage = {
          id: crypto.randomUUID(),
          pageNumber: newPageNumber,
          categoryColor: scratchpadSettings.categories[resolvedCategory],
          categoryName: resolvedCategory,
          textBlockIds: [],
          createdAt: now,
          modifiedAt: now,
          isLocked: false,
        };

        await db.scratchpadPages.add(newPage);

        const updatedPages = [...pages, newPage].sort((a, b) => a.pageNumber - b.pageNumber);
        const newIndex = updatedPages.findIndex(p => p.id === newPage.id);

        set({
          pages: updatedPages,
          currentPageIndex: newIndex,
        });

        // Initialize empty blocks for new page
        set(state => {
          const newTextBlocks = new Map(state.textBlocks);
          newTextBlocks.set(newPage.id, []);
          return { textBlocks: newTextBlocks };
        });

        return newPage;
      },

      deletePage: async (id: string) => {
        const { pages, currentPageIndex } = get();

        // Don't delete if it's the last page
        if (pages.length <= 1) {
          return;
        }

        // Delete all text blocks on this page
        await db.textBlocks.where('pageId').equals(id).delete();
        await db.scratchpadPages.delete(id);

        const updatedPages = pages.filter(p => p.id !== id);
        const newIndex = Math.min(currentPageIndex, updatedPages.length - 1);

        set(state => {
          const newTextBlocks = new Map(state.textBlocks);
          newTextBlocks.delete(id);
          return {
            pages: updatedPages,
            currentPageIndex: newIndex,
            textBlocks: newTextBlocks,
          };
        });

        // Load blocks for new current page
        const newCurrentPage = updatedPages[newIndex];
        if (newCurrentPage) {
          await get().loadTextBlocksForPage(newCurrentPage.id);
        }
      },

      navigateToPage: (index: number) => {
        const { pages } = get();
        if (index >= 0 && index < pages.length) {
          set({ currentPageIndex: index });
          const page = pages[index];
          if (page) {
            get().loadTextBlocksForPage(page.id);
          }
        }
      },

      findFreshPage: async () => {
        const { pages } = get();

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const blockCount = await db.textBlocks.where('pageId').equals(page.id).count();
          if (blockCount === 0) {
            set({ currentPageIndex: i });
            return i;
          }
        }

        // No fresh page found, create new one
        await get().createPage();
        return get().pages.length - 1;
      },

      updatePageCategory: async (id: string, categoryName: CategoryName) => {
        const categoryColor = useSettingsStore.getState().scratchpad.categories[categoryName];
        await db.scratchpadPages.update(id, {
          categoryName,
          categoryColor,
          modifiedAt: new Date(),
        });

        set(state => ({
          pages: state.pages.map(page =>
            page.id === id
              ? { ...page, categoryName, categoryColor, modifiedAt: new Date() }
              : page
          ),
        }));
      },

      loadTextBlocksForPage: async (pageId: string) => {
        try {
          const blocks = await db.textBlocks.where('pageId').equals(pageId).toArray();
          set(state => {
            const newTextBlocks = new Map(state.textBlocks);
            newTextBlocks.set(pageId, blocks);
            return { textBlocks: newTextBlocks };
          });
        } catch (error) {
          console.error('Failed to load text blocks:', error);
        }
      },

      createTextBlock: async (pageId: string, position: { x: number; y: number }) => {
        const now = new Date();
        const newBlock: TextBlock = {
          id: crypto.randomUUID(),
          pageId,
          content: '',
          position,
          width: 'auto',
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          createdAt: now,
          modifiedAt: now,
        };

        await db.textBlocks.add(newBlock);

        // Update page's textBlockIds
        const page = await db.scratchpadPages.get(pageId);
        if (page) {
          await db.scratchpadPages.update(pageId, {
            textBlockIds: [...page.textBlockIds, newBlock.id],
            modifiedAt: now,
          });
        }

        set(state => {
          const newTextBlocks = new Map(state.textBlocks);
          const pageBlocks = newTextBlocks.get(pageId) || [];
          newTextBlocks.set(pageId, [...pageBlocks, newBlock]);

          return {
            textBlocks: newTextBlocks,
            pages: state.pages.map(p =>
              p.id === pageId
                ? { ...p, textBlockIds: [...p.textBlockIds, newBlock.id], modifiedAt: now }
                : p
            ),
          };
        });

        return newBlock;
      },

      updateTextBlock: async (id: string, updates: Partial<TextBlock>) => {
        const now = new Date();
        await db.textBlocks.update(id, { ...updates, modifiedAt: now });

        // Also update page modifiedAt
        const block = await db.textBlocks.get(id);
        if (block) {
          await db.scratchpadPages.update(block.pageId, { modifiedAt: now });
        }

        set(state => {
          const newTextBlocks = new Map(state.textBlocks);

          for (const [pageId, blocks] of newTextBlocks) {
            const updatedBlocks = blocks.map(b =>
              b.id === id ? { ...b, ...updates, modifiedAt: now } : b
            );
            if (updatedBlocks.some((b, i) => b !== blocks[i])) {
              newTextBlocks.set(pageId, updatedBlocks);
            }
          }

          return { textBlocks: newTextBlocks };
        });
      },

      deleteTextBlock: async (id: string) => {
        const block = await db.textBlocks.get(id);
        if (!block) return;

        const pageId = block.pageId;
        await db.textBlocks.delete(id);

        // Update page's textBlockIds
        const page = await db.scratchpadPages.get(pageId);
        if (page) {
          await db.scratchpadPages.update(pageId, {
            textBlockIds: page.textBlockIds.filter(bid => bid !== id),
            modifiedAt: new Date(),
          });
        }

        set(state => {
          const newTextBlocks = new Map(state.textBlocks);
          const pageBlocks = newTextBlocks.get(pageId) || [];
          newTextBlocks.set(pageId, pageBlocks.filter(b => b.id !== id));

          return {
            textBlocks: newTextBlocks,
            pages: state.pages.map(p =>
              p.id === pageId
                ? { ...p, textBlockIds: p.textBlockIds.filter(bid => bid !== id), modifiedAt: new Date() }
                : p
            ),
          };
        });
      },

      getCurrentPage: () => {
        const { pages, currentPageIndex } = get();
        return pages[currentPageIndex] || null;
      },

      getCurrentPageBlocks: () => {
        const { pages, currentPageIndex, textBlocks } = get();
        const currentPage = pages[currentPageIndex];
        if (!currentPage) return [];
        return textBlocks.get(currentPage.id) || [];
      },
    }),
    { name: 'scratchpad-store' }
  )
);

// Selectors
export const selectScratchpadPages = (state: ScratchpadState) => state.pages;
export const selectScratchpadCurrentPageIndex = (state: ScratchpadState) => state.currentPageIndex;
export const selectScratchpadIsLoading = (state: ScratchpadState) => state.isLoading;
export const selectScratchpadError = (state: ScratchpadState) => state.error;
