import { db } from '../database';
import type { BlackboardCanvas, CanvasElement, IndexEntry } from '@/types';

// Blackboard Canvas CRUD

export async function createCanvas(canvas: BlackboardCanvas): Promise<string> {
  return db.blackboardCanvases.add(canvas);
}

export async function getCanvas(id: string): Promise<BlackboardCanvas | undefined> {
  return db.blackboardCanvases.get(id);
}

export async function getAllCanvases(): Promise<BlackboardCanvas[]> {
  return db.blackboardCanvases.orderBy('createdAt').reverse().toArray();
}

export async function updateCanvas(id: string, updates: Partial<BlackboardCanvas>): Promise<number> {
  return db.blackboardCanvases.update(id, { ...updates, modifiedAt: new Date() });
}

export async function deleteCanvas(id: string): Promise<void> {
  // Delete all elements on this canvas
  await db.canvasElements.where('canvasId').equals(id).delete();
  await db.blackboardCanvases.delete(id);
}

// Canvas Elements CRUD

export async function createElement(element: CanvasElement): Promise<string> {
  const id = await db.canvasElements.add(element);
  // Update canvas elementIds
  const canvas = await db.blackboardCanvases.get(element.canvasId);
  if (canvas) {
    await db.blackboardCanvases.update(element.canvasId, {
      elementIds: [...canvas.elementIds, element.id],
      modifiedAt: new Date(),
    });
  }
  return id;
}

export async function getElement(id: string): Promise<CanvasElement | undefined> {
  return db.canvasElements.get(id);
}

export async function getElementsByCanvas(canvasId: string): Promise<CanvasElement[]> {
  return db.canvasElements.where('canvasId').equals(canvasId).toArray();
}

export async function getHeadingElements(canvasId: string): Promise<CanvasElement[]> {
  return db.canvasElements
    .where('canvasId')
    .equals(canvasId)
    .filter((el) => el.headingLevel !== null && el.headingLevel !== undefined)
    .toArray();
}

export async function updateElement(id: string, updates: Partial<CanvasElement>): Promise<number> {
  const result = await db.canvasElements.update(id, { ...updates, modifiedAt: new Date() });
  // Update canvas modifiedAt
  const element = await db.canvasElements.get(id);
  if (element) {
    await db.blackboardCanvases.update(element.canvasId, { modifiedAt: new Date() });
  }
  return result;
}

export async function deleteElement(id: string): Promise<void> {
  const element = await db.canvasElements.get(id);
  if (element) {
    const canvas = await db.blackboardCanvases.get(element.canvasId);
    if (canvas) {
      await db.blackboardCanvases.update(element.canvasId, {
        elementIds: canvas.elementIds.filter((eid) => eid !== id),
        modifiedAt: new Date(),
      });
    }
  }
  await db.canvasElements.delete(id);
}

// Index helpers

export async function rebuildIndex(canvasId: string): Promise<IndexEntry[]> {
  const headings = await getHeadingElements(canvasId);
  const index: IndexEntry[] = headings
    .filter((el) => el.content && el.headingLevel)
    .map((el) => ({
      id: `index-${el.id}`,
      elementId: el.id,
      title: el.content || '',
      level: el.headingLevel as 1 | 2 | 3,
      position: el.position,
    }));

  await db.blackboardCanvases.update(canvasId, { index });
  return index;
}
