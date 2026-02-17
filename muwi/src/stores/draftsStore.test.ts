import { db } from '@/db';
import * as draftsQueries from '@/db/queries/drafts';
import { clearDatabase } from '@/test/db-utils';
import type { Draft } from '@/types';
import { useDraftsStore } from './draftsStore';

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  const now = new Date('2026-02-06T00:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    title: 'Draft',
    content: '<p>Draft content</p>',
    status: 'in-progress',
    wordCount: 2,
    tags: [],
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('draftsStore', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    useDraftsStore.setState(useDraftsStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads drafts and sets current draft from the most recently modified item', async () => {
    const draftA = makeDraft({
      title: 'Alpha',
      modifiedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    const draftB = makeDraft({
      title: 'Beta',
      modifiedAt: new Date('2026-02-03T00:00:00.000Z'),
    });
    const draftC = makeDraft({
      title: 'Gamma',
      modifiedAt: new Date('2026-02-02T00:00:00.000Z'),
    });

    await db.drafts.bulkAdd([draftA, draftB, draftC]);
    await useDraftsStore.getState().loadDrafts();

    const state = useDraftsStore.getState();
    expect(state.drafts.map((draft) => draft.id)).toEqual([draftB.id, draftC.id, draftA.id]);
    expect(state.currentDraftId).toBe(draftB.id);
    expect(state.getCurrentDraft()?.id).toBe(draftB.id);
  });

  it('supports create, update, status cycle, and delete actions', async () => {
    const state = useDraftsStore.getState();

    const first = await state.createDraft('First Draft');
    const second = await useDraftsStore.getState().createDraft('Second Draft');

    expect(useDraftsStore.getState().drafts).toHaveLength(2);
    expect(useDraftsStore.getState().currentDraftId).toBe(second.id);

    await useDraftsStore.getState().updateDraft(second.id, {
      title: 'Second Draft Updated',
      content: '<p>one two three</p>',
    });

    const updated = useDraftsStore.getState().drafts.find((draft) => draft.id === second.id);
    expect(updated?.title).toBe('Second Draft Updated');
    expect(updated?.wordCount).toBe(3);

    await useDraftsStore.getState().cycleDraftStatus(second.id);
    expect(useDraftsStore.getState().drafts.find((draft) => draft.id === second.id)?.status).toBe('review');

    await useDraftsStore.getState().deleteDraft(second.id);
    expect(useDraftsStore.getState().currentDraftId).toBe(first.id);
    expect(useDraftsStore.getState().drafts.map((draft) => draft.id)).toEqual([first.id]);

    await useDraftsStore.getState().deleteDraft(first.id);
    expect(useDraftsStore.getState().currentDraftId).toBeNull();
    expect(useDraftsStore.getState().drafts).toEqual([]);
    expect(await db.drafts.toArray()).toEqual([]);
  });

  it('sorts by title, status, and date and supports status filtering', () => {
    const draftAlpha = makeDraft({
      title: 'Alpha',
      status: 'review',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      modifiedAt: new Date('2026-02-02T00:00:00.000Z'),
    });
    const draftBeta = makeDraft({
      title: 'Beta',
      status: 'in-progress',
      createdAt: new Date('2026-02-03T00:00:00.000Z'),
      modifiedAt: new Date('2026-02-03T00:00:00.000Z'),
    });
    const draftGamma = makeDraft({
      title: 'Gamma',
      status: 'complete',
      createdAt: new Date('2026-02-02T00:00:00.000Z'),
      modifiedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    useDraftsStore.setState({
      drafts: [draftGamma, draftAlpha, draftBeta],
      sortBy: 'title',
      sortOrder: 'asc',
      filterStatus: 'all',
    });

    expect(useDraftsStore.getState().getSortedFilteredDrafts().map((draft) => draft.title)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ]);

    useDraftsStore.getState().setSortBy('status');
    useDraftsStore.getState().setSortOrder('asc');
    expect(useDraftsStore.getState().getSortedFilteredDrafts().map((draft) => draft.status)).toEqual([
      'in-progress',
      'review',
      'complete',
    ]);

    useDraftsStore.getState().setSortBy('createdAt');
    useDraftsStore.getState().setSortOrder('desc');
    expect(useDraftsStore.getState().getSortedFilteredDrafts().map((draft) => draft.title)).toEqual([
      'Beta',
      'Gamma',
      'Alpha',
    ]);

    useDraftsStore.getState().setFilterStatus('review');
    expect(useDraftsStore.getState().getSortedFilteredDrafts().map((draft) => draft.id)).toEqual([
      draftAlpha.id,
    ]);
  });

  it('handles query failures and status-cycle guard paths', async () => {
    vi.spyOn(draftsQueries, 'getAllDrafts').mockRejectedValueOnce('load-failure');
    await useDraftsStore.getState().loadDrafts();
    expect(useDraftsStore.getState().error).toBe('Failed to load drafts');

    vi.spyOn(draftsQueries, 'createDraft').mockRejectedValueOnce('create-failure');
    await expect(useDraftsStore.getState().createDraft('Will Fail')).rejects.toBe('create-failure');
    expect(useDraftsStore.getState().error).toBe('Failed to create draft');

    vi.spyOn(draftsQueries, 'updateDraft').mockRejectedValueOnce('update-failure');
    await useDraftsStore.getState().updateDraft('draft-fail', { title: 'Will fail update' });
    expect(useDraftsStore.getState().error).toBe('Failed to update draft');

    vi.spyOn(draftsQueries, 'deleteDraft').mockRejectedValueOnce('delete-failure');
    await useDraftsStore.getState().deleteDraft('draft-fail');
    expect(useDraftsStore.getState().error).toBe('Failed to delete draft');

    await useDraftsStore.getState().cycleDraftStatus('missing-draft');
    expect(useDraftsStore.getState().error).toBe('Failed to delete draft');
  });

  it('uses Error.message branches and covers default sort/current-draft fallbacks', async () => {
    vi.spyOn(draftsQueries, 'getAllDrafts').mockRejectedValueOnce(new Error('load drafts error'));
    await useDraftsStore.getState().loadDrafts();
    expect(useDraftsStore.getState().error).toBe('load drafts error');

    vi.spyOn(draftsQueries, 'createDraft').mockRejectedValueOnce(new Error('create draft error'));
    await expect(useDraftsStore.getState().createDraft('Will Fail')).rejects.toThrow('create draft error');
    expect(useDraftsStore.getState().error).toBe('create draft error');

    vi.spyOn(draftsQueries, 'updateDraft').mockRejectedValueOnce(new Error('update draft error'));
    await useDraftsStore.getState().updateDraft('draft-fail', { title: 'Will fail update' });
    expect(useDraftsStore.getState().error).toBe('update draft error');

    vi.spyOn(draftsQueries, 'deleteDraft').mockRejectedValueOnce(new Error('delete draft error'));
    await useDraftsStore.getState().deleteDraft('draft-fail');
    expect(useDraftsStore.getState().error).toBe('delete draft error');

    const draft = makeDraft({ id: 'fallback-draft', modifiedAt: new Date('2026-02-10T00:00:00.000Z') });
    useDraftsStore.setState({
      ...useDraftsStore.getState(),
      drafts: [draft],
      currentDraftId: null,
      sortBy: 'modifiedAt',
      sortOrder: 'asc',
    });

    expect(useDraftsStore.getState().getCurrentDraft()).toBeNull();
    expect(useDraftsStore.getState().getSortedFilteredDrafts().map((item) => item.id)).toEqual([draft.id]);
  });
});
