import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { LongDraft, Section } from '@/types';
import { defaultLongDraftsSettings } from '@/types';
import { createSection, deleteSection, updateSection } from './longDrafts';

function makeLongDraft(overrides: Partial<LongDraft> = {}): LongDraft {
  const now = new Date('2026-02-12T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    title: 'Long Draft',
    sectionIds: [],
    settings: { ...defaultLongDraftsSettings },
    metadata: {
      createdAt: now,
      modifiedAt: now,
      totalWordCount: 0,
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeSection(longDraftId: string, overrides: Partial<Section> = {}): Section {
  const now = new Date('2026-02-12T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    longDraftId,
    title: 'Section',
    content: '',
    order: 0,
    parentId: null,
    footnotes: [],
    status: 'draft',
    notes: '',
    wordCount: 0,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('longDrafts queries', () => {
  beforeEach(async () => {
    await clearDatabase(db);
  });

  it('creates sections and only updates parent long draft when it exists', async () => {
    const draft = makeLongDraft({ id: 'draft-1' });
    await db.longDrafts.put(draft);

    const section = makeSection(draft.id, { id: 'section-1' });
    await createSection(section);
    expect((await db.longDrafts.get(draft.id))?.sectionIds).toEqual([section.id]);

    const orphanSection = makeSection('missing-draft', { id: 'section-orphan' });
    await createSection(orphanSection);
    expect(await db.sections.get(orphanSection.id)).toBeDefined();
    expect(await db.longDrafts.get('missing-draft')).toBeUndefined();
  });

  it('updates sections and skips long draft touch when section is missing', async () => {
    const draft = makeLongDraft({ id: 'draft-2' });
    const section = makeSection(draft.id, { id: 'section-2' });
    await db.longDrafts.put(draft);
    await db.sections.put(section);

    const touchSpy = vi.spyOn(db.longDrafts, 'update');

    const updated = await updateSection(section.id, { title: 'Updated Title' });
    expect(updated).toBe(1);
    expect((await db.sections.get(section.id))?.title).toBe('Updated Title');
    expect(touchSpy).toHaveBeenCalledTimes(1);

    const missing = await updateSection('missing-section', { title: 'No-op' });
    expect(missing).toBe(0);
    expect(touchSpy).toHaveBeenCalledTimes(1);
  });

  it('deletes recursively and handles orphan/missing branches safely', async () => {
    const orphanParent = makeSection('ghost-draft', { id: 'orphan-parent' });
    const orphanChild = makeSection('ghost-draft', {
      id: 'orphan-child',
      parentId: orphanParent.id,
    });
    await db.sections.bulkPut([orphanParent, orphanChild]);

    const touchSpy = vi.spyOn(db.longDrafts, 'update');

    await deleteSection(orphanParent.id);
    expect(await db.sections.get(orphanParent.id)).toBeUndefined();
    expect(await db.sections.get(orphanChild.id)).toBeUndefined();
    expect(touchSpy).not.toHaveBeenCalled();

    await expect(deleteSection('missing-section')).resolves.toBeUndefined();
  });
});
