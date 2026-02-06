import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import { useSettingsStore } from './settingsStore';
import { useScratchpadStore } from './scratchpadStore';

describe('scratchpadStore', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
    useScratchpadStore.setState(useScratchpadStore.getInitialState(), true);
  });

  it('creates initial page on load using scratchpad settings', async () => {
    useSettingsStore.setState((state) => ({
      scratchpad: {
        ...state.scratchpad,
        defaultCategory: 'ideas',
        categories: {
          ...state.scratchpad.categories,
          ideas: '#010203',
        },
      },
    }));

    await useScratchpadStore.getState().loadPages();
    const state = useScratchpadStore.getState();

    expect(state.pages).toHaveLength(1);
    expect(state.currentPageIndex).toBe(0);
    expect(state.pages[0].categoryName).toBe('ideas');
    expect(state.pages[0].categoryColor).toBe('#010203');
    expect(state.textBlocks.get(state.pages[0].id)).toEqual([]);
  });

  it('supports create, navigate, delete, and findFreshPage actions', async () => {
    const store = useScratchpadStore.getState();
    await store.loadPages();

    const firstPage = useScratchpadStore.getState().pages[0];
    const secondPage = await useScratchpadStore.getState().createPage('ideas');
    await useScratchpadStore.getState().createPage('todos');

    expect(useScratchpadStore.getState().pages).toHaveLength(3);
    expect(useScratchpadStore.getState().currentPageIndex).toBe(2);

    useScratchpadStore.getState().navigateToPage(0);
    expect(useScratchpadStore.getState().currentPageIndex).toBe(0);

    await useScratchpadStore.getState().createTextBlock(firstPage.id, { x: 10, y: 20 });
    const freshIndex = await useScratchpadStore.getState().findFreshPage();
    expect(freshIndex).toBe(1);
    expect(useScratchpadStore.getState().pages[freshIndex].id).toBe(secondPage.id);

    await useScratchpadStore.getState().deletePage(secondPage.id);
    expect(useScratchpadStore.getState().pages).toHaveLength(2);
    expect(useScratchpadStore.getState().pages.some((page) => page.id === secondPage.id)).toBe(false);
  });

  it('supports text block CRUD and keeps page textBlockIds in sync', async () => {
    await useScratchpadStore.getState().loadPages();
    const page = useScratchpadStore.getState().pages[0];

    const block = await useScratchpadStore.getState().createTextBlock(page.id, { x: 30, y: 40 });

    expect(useScratchpadStore.getState().textBlocks.get(page.id)).toHaveLength(1);
    expect(useScratchpadStore.getState().pages[0].textBlockIds).toContain(block.id);

    await useScratchpadStore.getState().updateTextBlock(block.id, { content: 'Updated content' });
    const updated = useScratchpadStore.getState().textBlocks.get(page.id)?.[0];
    expect(updated?.content).toBe('Updated content');
    expect((await db.textBlocks.get(block.id))?.content).toBe('Updated content');

    await useScratchpadStore.getState().deleteTextBlock(block.id);
    expect(useScratchpadStore.getState().textBlocks.get(page.id)).toEqual([]);
    expect(useScratchpadStore.getState().pages[0].textBlockIds).toEqual([]);
    expect(await db.textBlocks.get(block.id)).toBeUndefined();
  });
});
