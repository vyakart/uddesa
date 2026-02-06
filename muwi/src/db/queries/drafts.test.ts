import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { Draft } from '@/types';
import {
  createDraft,
  deleteDraft,
  getAllDrafts,
  getAllTags,
  getDraft,
  getDraftStats,
  getDraftsByStatus,
  getDraftsByTag,
  searchDrafts,
  updateDraft,
} from './drafts';

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  const now = new Date('2026-02-06T00:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    title: 'Draft Title',
    content: 'Draft body content',
    status: 'in-progress',
    wordCount: 3,
    tags: ['ideas'],
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('drafts queries', () => {
  beforeEach(async () => {
    await clearDatabase(db);
  });

  it('supports draft CRUD and filtering/search', async () => {
    const draftA = makeDraft({
      title: 'Alpha post',
      content: 'Topic about writing',
      tags: ['ideas', 'writing'],
      status: 'in-progress',
      modifiedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    const draftB = makeDraft({
      title: 'Beta review',
      content: 'Editorial notes',
      tags: ['review'],
      status: 'review',
      modifiedAt: new Date('2026-02-03T00:00:00.000Z'),
    });
    const draftC = makeDraft({
      title: 'Gamma final',
      content: 'Complete document',
      tags: ['release', 'writing'],
      status: 'complete',
      modifiedAt: new Date('2026-02-02T00:00:00.000Z'),
    });

    await createDraft(draftA);
    await createDraft(draftB);
    await createDraft(draftC);

    expect(await getDraft(draftA.id)).toBeDefined();
    expect((await getAllDrafts()).map((draft) => draft.id)).toEqual([draftB.id, draftC.id, draftA.id]);
    expect((await getDraftsByStatus('review')).map((draft) => draft.id)).toEqual([draftB.id]);
    expect((await getDraftsByTag('writing')).map((draft) => draft.id).sort()).toEqual([draftA.id, draftC.id].sort());
    expect((await searchDrafts('editorial')).map((draft) => draft.id)).toEqual([draftB.id]);
    expect((await searchDrafts('alpha')).map((draft) => draft.id)).toEqual([draftA.id]);
    expect((await searchDrafts('release')).map((draft) => draft.id)).toEqual([draftC.id]);

    await updateDraft(draftA.id, { title: 'Alpha updated', status: 'review' });
    expect((await getDraft(draftA.id))?.title).toBe('Alpha updated');
    expect((await getDraft(draftA.id))?.status).toBe('review');

    await deleteDraft(draftC.id);
    expect(await getDraft(draftC.id)).toBeUndefined();
  });

  it('returns tag and status stats', async () => {
    await createDraft(makeDraft({ status: 'in-progress', tags: ['a', 'shared'] }));
    await createDraft(makeDraft({ status: 'review', tags: ['b', 'shared'] }));
    await createDraft(makeDraft({ status: 'complete', tags: ['c'] }));

    expect(await getAllTags()).toEqual(['a', 'b', 'c', 'shared']);

    const stats = await getDraftStats();
    expect(stats.total).toBe(3);
    expect(stats.byStatus).toEqual({
      'in-progress': 1,
      review: 1,
      complete: 1,
    });
  });
});
