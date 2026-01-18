import { db } from '../database';
import type { ScratchpadPage, TextBlock } from '@/types';

// Scratchpad Pages CRUD

export async function createPage(page: ScratchpadPage): Promise<string> {
  return db.scratchpadPages.add(page);
}

export async function getPage(id: string): Promise<ScratchpadPage | undefined> {
  return db.scratchpadPages.get(id);
}

export async function getAllPages(): Promise<ScratchpadPage[]> {
  return db.scratchpadPages.orderBy('pageNumber').toArray();
}

export async function getPagesByCategory(categoryName: string): Promise<ScratchpadPage[]> {
  return db.scratchpadPages.where('categoryName').equals(categoryName).toArray();
}

export async function updatePage(id: string, updates: Partial<ScratchpadPage>): Promise<number> {
  return db.scratchpadPages.update(id, { ...updates, modifiedAt: new Date() });
}

export async function deletePage(id: string): Promise<void> {
  // Also delete all text blocks on this page
  await db.textBlocks.where('pageId').equals(id).delete();
  await db.scratchpadPages.delete(id);
}

export async function getFirstEmptyPage(): Promise<ScratchpadPage | undefined> {
  const pages = await db.scratchpadPages.orderBy('pageNumber').toArray();
  for (const page of pages) {
    const blocks = await db.textBlocks.where('pageId').equals(page.id).count();
    if (blocks === 0) {
      return page;
    }
  }
  return undefined;
}

// Text Blocks CRUD

export async function createTextBlock(block: TextBlock): Promise<string> {
  const id = await db.textBlocks.add(block);
  // Update the page's textBlockIds
  const page = await db.scratchpadPages.get(block.pageId);
  if (page) {
    await db.scratchpadPages.update(block.pageId, {
      textBlockIds: [...page.textBlockIds, block.id],
      modifiedAt: new Date(),
    });
  }
  return id;
}

export async function getTextBlock(id: string): Promise<TextBlock | undefined> {
  return db.textBlocks.get(id);
}

export async function getTextBlocksByPage(pageId: string): Promise<TextBlock[]> {
  return db.textBlocks.where('pageId').equals(pageId).toArray();
}

export async function updateTextBlock(id: string, updates: Partial<TextBlock>): Promise<number> {
  const result = await db.textBlocks.update(id, { ...updates, modifiedAt: new Date() });
  // Update the page's modifiedAt
  const block = await db.textBlocks.get(id);
  if (block) {
    await db.scratchpadPages.update(block.pageId, { modifiedAt: new Date() });
  }
  return result;
}

export async function deleteTextBlock(id: string): Promise<void> {
  const block = await db.textBlocks.get(id);
  if (block) {
    // Remove from page's textBlockIds
    const page = await db.scratchpadPages.get(block.pageId);
    if (page) {
      await db.scratchpadPages.update(block.pageId, {
        textBlockIds: page.textBlockIds.filter((bid) => bid !== id),
        modifiedAt: new Date(),
      });
    }
  }
  await db.textBlocks.delete(id);
}
