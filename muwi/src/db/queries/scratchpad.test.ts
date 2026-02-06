import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { ScratchpadPage, TextBlock } from '@/types';
import {
  createPage,
  createTextBlock,
  deletePage,
  deleteTextBlock,
  getAllPages,
  getFirstEmptyPage,
  getPage,
  getPagesByCategory,
  getTextBlock,
  getTextBlocksByPage,
  updatePage,
  updateTextBlock,
} from './scratchpad';

function makePage(overrides: Partial<ScratchpadPage> = {}): ScratchpadPage {
  const now = new Date('2026-02-06T00:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    pageNumber: 1,
    categoryColor: '#FFF9C4',
    categoryName: 'ideas',
    textBlockIds: [],
    createdAt: now,
    modifiedAt: now,
    isLocked: false,
    ...overrides,
  };
}

function makeBlock(pageId: string, overrides: Partial<TextBlock> = {}): TextBlock {
  const now = new Date('2026-02-06T00:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    pageId,
    content: 'hello',
    position: { x: 10, y: 20 },
    width: 'auto',
    fontSize: 16,
    fontFamily: 'Inter',
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('scratchpad queries', () => {
  beforeEach(async () => {
    await clearDatabase(db);
  });

  it('supports page and text block CRUD', async () => {
    const page = makePage({ pageNumber: 2 });
    await createPage(page);

    const loadedPage = await getPage(page.id);
    expect(loadedPage?.id).toBe(page.id);

    const block = makeBlock(page.id);
    await createTextBlock(block);

    const loadedBlock = await getTextBlock(block.id);
    expect(loadedBlock?.content).toBe('hello');

    await updateTextBlock(block.id, { content: 'updated' });
    expect((await getTextBlock(block.id))?.content).toBe('updated');

    await updatePage(page.id, { categoryName: 'notes', categoryColor: '#BBDEFB' });
    expect((await getPage(page.id))?.categoryName).toBe('notes');

    await deleteTextBlock(block.id);
    expect(await getTextBlock(block.id)).toBeUndefined();

    await deletePage(page.id);
    expect(await getPage(page.id)).toBeUndefined();
  });

  it('returns pages by category and first empty page', async () => {
    const pageWithContent = makePage({ pageNumber: 1, categoryName: 'ideas' });
    const emptyPage = makePage({ pageNumber: 2, categoryName: 'notes', categoryColor: '#BBDEFB' });
    await createPage(pageWithContent);
    await createPage(emptyPage);
    await createTextBlock(makeBlock(pageWithContent.id));

    const allPages = await getAllPages();
    expect(allPages.map((page) => page.pageNumber)).toEqual([1, 2]);

    const ideaPages = await getPagesByCategory('ideas');
    expect(ideaPages).toHaveLength(1);
    expect(ideaPages[0].id).toBe(pageWithContent.id);

    const firstEmpty = await getFirstEmptyPage();
    expect(firstEmpty?.id).toBe(emptyPage.id);
  });

  it('cascades text block deletion when deleting a page', async () => {
    const page = makePage();
    const blockA = makeBlock(page.id, { content: 'A' });
    const blockB = makeBlock(page.id, { content: 'B' });

    await createPage(page);
    await createTextBlock(blockA);
    await createTextBlock(blockB);
    expect(await getTextBlocksByPage(page.id)).toHaveLength(2);

    await deletePage(page.id);
    expect(await getTextBlocksByPage(page.id)).toHaveLength(0);
  });
});
