import { db } from '../database';
import type { LongDraft, Section } from '@/types';

// Long Drafts CRUD

export async function createLongDraft(longDraft: LongDraft): Promise<string> {
  return db.longDrafts.add(longDraft);
}

export async function getLongDraft(id: string): Promise<LongDraft | undefined> {
  return db.longDrafts.get(id);
}

export async function getAllLongDrafts(): Promise<LongDraft[]> {
  return db.longDrafts.orderBy('modifiedAt').reverse().toArray();
}

export async function updateLongDraft(id: string, updates: Partial<LongDraft>): Promise<number> {
  return db.longDrafts.update(id, { ...updates, modifiedAt: new Date() });
}

export async function deleteLongDraft(id: string): Promise<void> {
  // Delete all sections belonging to this draft
  await db.sections.where('longDraftId').equals(id).delete();
  await db.longDrafts.delete(id);
}

// Sections CRUD

export async function createSection(section: Section): Promise<string> {
  const id = await db.sections.add(section);
  // Update longDraft's sectionIds
  const longDraft = await db.longDrafts.get(section.longDraftId);
  if (longDraft) {
    await db.longDrafts.update(section.longDraftId, {
      sectionIds: [...longDraft.sectionIds, section.id],
      modifiedAt: new Date(),
    });
  }
  return id;
}

export async function getSection(id: string): Promise<Section | undefined> {
  return db.sections.get(id);
}

export async function getSectionsByLongDraft(longDraftId: string): Promise<Section[]> {
  return db.sections.where('longDraftId').equals(longDraftId).sortBy('order');
}

export async function getRootSections(longDraftId: string): Promise<Section[]> {
  return db.sections
    .where('longDraftId')
    .equals(longDraftId)
    .filter((s) => s.parentId === null)
    .sortBy('order');
}

export async function getChildSections(parentId: string): Promise<Section[]> {
  return db.sections.where('parentId').equals(parentId).sortBy('order');
}

export async function updateSection(id: string, updates: Partial<Section>): Promise<number> {
  const result = await db.sections.update(id, { ...updates, modifiedAt: new Date() });
  // Update longDraft modifiedAt
  const section = await db.sections.get(id);
  if (section) {
    await db.longDrafts.update(section.longDraftId, { modifiedAt: new Date() });
  }
  return result;
}

export async function deleteSection(id: string): Promise<void> {
  const section = await db.sections.get(id);
  if (section) {
    // Delete child sections recursively
    const children = await getChildSections(id);
    for (const child of children) {
      await deleteSection(child.id);
    }
    // Remove from longDraft's sectionIds
    const longDraft = await db.longDrafts.get(section.longDraftId);
    if (longDraft) {
      await db.longDrafts.update(section.longDraftId, {
        sectionIds: longDraft.sectionIds.filter((sid) => sid !== id),
        modifiedAt: new Date(),
      });
    }
  }
  await db.sections.delete(id);
}

export async function reorderSections(longDraftId: string, sectionIds: string[]): Promise<void> {
  await db.transaction('rw', db.sections, async () => {
    for (let i = 0; i < sectionIds.length; i++) {
      await db.sections.update(sectionIds[i], { order: i });
    }
  });
  await db.longDrafts.update(longDraftId, {
    sectionIds,
    modifiedAt: new Date(),
  });
}

export async function getTotalWordCount(longDraftId: string): Promise<number> {
  const sections = await getSectionsByLongDraft(longDraftId);
  return sections.reduce((total, section) => total + section.wordCount, 0);
}
