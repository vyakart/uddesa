import { db } from '../database';
import type { Draft, DraftStatus } from '@/types';

// Drafts CRUD

export async function createDraft(draft: Draft): Promise<string> {
  return db.drafts.add(draft);
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  return db.drafts.get(id);
}

export async function getAllDrafts(): Promise<Draft[]> {
  return db.drafts.orderBy('modifiedAt').reverse().toArray();
}

export async function getDraftsByStatus(status: DraftStatus): Promise<Draft[]> {
  return db.drafts.where('status').equals(status).toArray();
}

export async function getDraftsByTag(tag: string): Promise<Draft[]> {
  return db.drafts.where('tags').equals(tag).toArray();
}

export async function searchDrafts(query: string): Promise<Draft[]> {
  const lowerQuery = query.toLowerCase();
  return db.drafts
    .filter(
      (draft) =>
        draft.title.toLowerCase().includes(lowerQuery) ||
        draft.content.toLowerCase().includes(lowerQuery) ||
        draft.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    )
    .toArray();
}

export async function updateDraft(id: string, updates: Partial<Draft>): Promise<number> {
  return db.drafts.update(id, { ...updates, modifiedAt: new Date() });
}

export async function deleteDraft(id: string): Promise<void> {
  await db.drafts.delete(id);
}

export async function getAllTags(): Promise<string[]> {
  const drafts = await db.drafts.toArray();
  const tagSet = new Set<string>();
  drafts.forEach((draft) => draft.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

export async function getDraftStats(): Promise<{ total: number; byStatus: Record<DraftStatus, number> }> {
  const drafts = await db.drafts.toArray();
  const byStatus: Record<DraftStatus, number> = {
    'in-progress': 0,
    review: 0,
    complete: 0,
  };
  drafts.forEach((draft) => {
    byStatus[draft.status]++;
  });
  return { total: drafts.length, byStatus };
}
