import { db } from '@/db';
import * as longDraftsQueries from '@/db/queries/longDrafts';
import { clearDatabase } from '@/test/db-utils';
import type { LongDraft, Section } from '@/types/longDrafts';
import {
  selectCurrentDocumentWordCount,
  selectCurrentLongDraft,
  selectCurrentSection,
  selectCurrentSections,
  selectIsFocusMode,
  useLongDraftsStore,
} from './longDraftsStore';

function makeLongDraft(overrides: Partial<LongDraft> = {}): LongDraft {
  const now = new Date('2026-02-11T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    title: 'Long Draft',
    sectionIds: [],
    settings: {
      fonts: ['Crimson Pro', 'Inter', 'Georgia'],
      defaultFont: 'Crimson Pro',
      showTOC: true,
      showWordCount: true,
      focusModeEnabled: false,
      typewriterMode: false,
    },
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

function makeSection(
  longDraftId: string,
  overrides: Partial<Section> = {}
): Section {
  const now = new Date('2026-02-11T12:00:00.000Z');
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

describe('longDraftsStore', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    useLongDraftsStore.setState(useLongDraftsStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads drafts, auto-selects current draft, loads sections, and exposes hierarchy getters/selectors', async () => {
    const recentDraft = makeLongDraft({
      id: 'doc-recent',
      title: 'Recent',
      modifiedAt: new Date('2026-02-11T13:00:00.000Z'),
    });
    const olderDraft = makeLongDraft({
      id: 'doc-older',
      title: 'Older',
      modifiedAt: new Date('2026-02-10T13:00:00.000Z'),
    });

    const rootA = makeSection(recentDraft.id, {
      id: 'sec-root-a',
      title: 'Root A',
      order: 0,
      wordCount: 7,
    });
    const childA = makeSection(recentDraft.id, {
      id: 'sec-child-a',
      title: 'Child A',
      parentId: rootA.id,
      order: 2,
      wordCount: 3,
    });
    const rootB = makeSection(recentDraft.id, {
      id: 'sec-root-b',
      title: 'Root B',
      order: 1,
      wordCount: 5,
    });

    await db.longDrafts.bulkPut([recentDraft, olderDraft]);
    await db.sections.bulkPut([rootA, childA, rootB]);

    await useLongDraftsStore.getState().loadLongDrafts();
    const state = useLongDraftsStore.getState();

    expect(state.longDrafts.map((draft) => draft.id)).toEqual(['doc-recent', 'doc-older']);
    expect(state.currentLongDraftId).toBe('doc-recent');
    expect(state.currentSectionId).toBe('sec-root-a');
    expect(state.getSectionsForDocument('doc-recent')).toHaveLength(3);
    expect(state.getRootSections('doc-recent').map((s) => s.id)).toEqual(['sec-root-a', 'sec-root-b']);
    expect(state.getChildSections('sec-root-a', 'doc-recent').map((s) => s.id)).toEqual([
      'sec-child-a',
    ]);
    expect(state.getTotalWordCount('doc-recent')).toBe(15);
    expect(state.getSectionHierarchy('doc-recent')).toMatchObject([
      {
        section: { id: 'sec-root-a' },
        depth: 0,
        children: [{ section: { id: 'sec-child-a' }, depth: 1 }],
      },
      {
        section: { id: 'sec-root-b' },
        depth: 0,
        children: [],
      },
    ]);

    expect(selectCurrentLongDraft(state)?.id).toBe('doc-recent');
    expect(selectCurrentSection(state)?.id).toBe('sec-root-a');
    expect(selectCurrentDocumentWordCount(state)).toBe(15);
  });

  it('supports section CRUD, word-count updates, and footnote lifecycle', async () => {
    const createdDraft = await useLongDraftsStore.getState().createLongDraft('Doc One');
    const intro = await useLongDraftsStore.getState().createSection(createdDraft.id, 'Intro');
    const body = await useLongDraftsStore.getState().createSection(createdDraft.id, 'Body');
    const subSection = await useLongDraftsStore.getState().createSection(
      createdDraft.id,
      'Sub Intro',
      intro.id
    );

    let sections = useLongDraftsStore.getState().getSectionsForDocument(createdDraft.id);
    expect(sections.find((s) => s.id === intro.id)?.order).toBe(0);
    expect(sections.find((s) => s.id === body.id)?.order).toBe(1);
    expect(sections.find((s) => s.id === subSection.id)?.order).toBe(0);

    await useLongDraftsStore.getState().updateSection(intro.id, {
      content: '<p>Hello world again</p>',
    });
    sections = useLongDraftsStore.getState().getSectionsForDocument(createdDraft.id);
    expect(sections.find((s) => s.id === intro.id)?.wordCount).toBe(3);

    await useLongDraftsStore.getState().addFootnote(intro.id, {
      content: 'First note',
      position: 5,
    });
    await useLongDraftsStore.getState().addFootnote(intro.id, {
      content: 'Second note',
      position: 10,
    });
    let introSection = useLongDraftsStore.getState().findSectionById(intro.id);
    expect(introSection?.footnotes.map((fn) => fn.marker)).toEqual([1, 2]);

    const firstFootnoteId = introSection?.footnotes[0].id;
    expect(firstFootnoteId).toBeTruthy();
    await useLongDraftsStore
      .getState()
      .updateFootnote(intro.id, firstFootnoteId!, { content: 'First note updated' });
    await useLongDraftsStore.getState().deleteFootnote(intro.id, firstFootnoteId!);

    introSection = useLongDraftsStore.getState().findSectionById(intro.id);
    expect(introSection?.footnotes).toHaveLength(1);
    expect(introSection?.footnotes[0].marker).toBe(1);
    expect(introSection?.footnotes[0].content).toBe('Second note');

    await useLongDraftsStore.getState().deleteSection(intro.id);
    sections = useLongDraftsStore.getState().getSectionsForDocument(createdDraft.id);
    expect(sections.some((s) => s.id === intro.id)).toBe(false);
    expect(sections.some((s) => s.id === subSection.id)).toBe(false);
    expect(sections.some((s) => s.id === body.id)).toBe(true);
  });

  it('supports reordering, current document/section selection, and UI toggles', async () => {
    const draftA = await useLongDraftsStore.getState().createLongDraft('Doc A');
    const draftB = await useLongDraftsStore.getState().createLongDraft('Doc B');

    const a1 = await useLongDraftsStore.getState().createSection(draftA.id, 'A1');
    const a2 = await useLongDraftsStore.getState().createSection(draftA.id, 'A2');

    await useLongDraftsStore.getState().reorderSections(draftA.id, [a2.id, a1.id]);
    const reordered = useLongDraftsStore.getState().getSectionsForDocument(draftA.id);
    expect(reordered.map((s) => s.id)).toEqual([a2.id, a1.id]);
    expect(reordered.map((s) => s.order)).toEqual([0, 1]);

    useLongDraftsStore.getState().setCurrentLongDraft(draftA.id);
    useLongDraftsStore.getState().setCurrentSection(a1.id);
    expect(useLongDraftsStore.getState().getCurrentLongDraft()?.id).toBe(draftA.id);
    expect(useLongDraftsStore.getState().getCurrentSection()?.id).toBe(a1.id);

    useLongDraftsStore.getState().setViewMode('focus');
    expect(selectIsFocusMode(useLongDraftsStore.getState())).toBe(true);
    useLongDraftsStore.getState().toggleFocusMode();
    expect(useLongDraftsStore.getState().viewMode).toBe('normal');

    useLongDraftsStore.getState().setTOCVisible(false);
    expect(useLongDraftsStore.getState().isTOCVisible).toBe(false);
    useLongDraftsStore.getState().toggleTOC();
    expect(useLongDraftsStore.getState().isTOCVisible).toBe(true);

    await useLongDraftsStore.getState().deleteLongDraft(draftA.id);
    const stateAfterDelete = useLongDraftsStore.getState();
    expect(stateAfterDelete.longDrafts.map((d) => d.id)).toEqual([draftB.id]);
    expect(stateAfterDelete.currentLongDraftId).toBe(draftB.id);
    expect(stateAfterDelete.currentSectionId).toBeNull();
    expect(stateAfterDelete.sectionsMap.has(draftA.id)).toBe(false);
  });

  it('covers selector fallbacks and no-op action guards', async () => {
    const initial = useLongDraftsStore.getState();
    expect(selectCurrentLongDraft(initial)).toBeNull();
    expect(selectCurrentSection(initial)).toBeNull();
    expect(selectCurrentSections(initial)).toEqual([]);
    expect(selectCurrentDocumentWordCount(initial)).toBe(0);

    await useLongDraftsStore.getState().deleteSection('missing-section');
    await useLongDraftsStore.getState().addFootnote('missing-section', { content: 'x', position: 1 });
    await useLongDraftsStore.getState().updateFootnote('missing-section', 'missing-footnote', { content: 'y' });
    await useLongDraftsStore.getState().deleteFootnote('missing-section', 'missing-footnote');

    expect(useLongDraftsStore.getState().error).toBeNull();
  });

  it('handles load/query failures with fallback error messages', async () => {
    vi.spyOn(longDraftsQueries, 'getAllLongDrafts').mockRejectedValueOnce('load-drafts-failure');
    await useLongDraftsStore.getState().loadLongDrafts();
    expect(useLongDraftsStore.getState().error).toBe('Failed to load long drafts');

    vi.spyOn(longDraftsQueries, 'getLongDraft').mockRejectedValueOnce('load-draft-failure');
    await useLongDraftsStore.getState().loadLongDraft('doc-fail');
    expect(useLongDraftsStore.getState().error).toBe('Failed to load long draft');

    vi.spyOn(longDraftsQueries, 'getSectionsByLongDraft').mockRejectedValueOnce('load-sections-failure');
    await useLongDraftsStore.getState().loadSections('doc-fail');
    expect(useLongDraftsStore.getState().error).toBe('Failed to load sections');
  });

  it('handles mutation failures with fallback error messages', async () => {
    vi.spyOn(longDraftsQueries, 'createLongDraft').mockRejectedValueOnce('create-draft-failure');
    await expect(useLongDraftsStore.getState().createLongDraft('Will Fail')).rejects.toBe(
      'create-draft-failure'
    );
    expect(useLongDraftsStore.getState().error).toBe('Failed to create long draft');

    vi.spyOn(longDraftsQueries, 'updateLongDraft').mockRejectedValueOnce('update-draft-failure');
    await useLongDraftsStore.getState().updateLongDraft('doc-fail', { title: 'Updated' });
    expect(useLongDraftsStore.getState().error).toBe('Failed to update long draft');

    vi.spyOn(longDraftsQueries, 'deleteLongDraft').mockRejectedValueOnce('delete-draft-failure');
    await useLongDraftsStore.getState().deleteLongDraft('doc-fail');
    expect(useLongDraftsStore.getState().error).toBe('Failed to delete long draft');

    vi.spyOn(longDraftsQueries, 'createSection').mockRejectedValueOnce('create-section-failure');
    await expect(useLongDraftsStore.getState().createSection('doc-fail')).rejects.toBe(
      'create-section-failure'
    );
    expect(useLongDraftsStore.getState().error).toBe('Failed to create section');

    vi.spyOn(longDraftsQueries, 'updateSection').mockRejectedValueOnce('update-section-failure');
    await useLongDraftsStore.getState().updateSection('section-fail', { title: 'Updated' });
    expect(useLongDraftsStore.getState().error).toBe('Failed to update section');

    const draft = await useLongDraftsStore.getState().createLongDraft('Doc For Failures');
    const section = await useLongDraftsStore.getState().createSection(draft.id, 'Section For Failures');

    vi.spyOn(longDraftsQueries, 'deleteSection').mockRejectedValueOnce('delete-section-failure');
    await useLongDraftsStore.getState().deleteSection(section.id);
    expect(useLongDraftsStore.getState().error).toBe('Failed to delete section');

    vi.spyOn(longDraftsQueries, 'reorderSections').mockRejectedValueOnce('reorder-failure');
    await useLongDraftsStore.getState().reorderSections(draft.id, [section.id]);
    expect(useLongDraftsStore.getState().error).toBe('Failed to reorder sections');
  });

  it('uses Error.message branches for load/query failures', async () => {
    vi.spyOn(longDraftsQueries, 'getAllLongDrafts').mockRejectedValueOnce(new Error('load long drafts error'));
    await useLongDraftsStore.getState().loadLongDrafts();
    expect(useLongDraftsStore.getState().error).toBe('load long drafts error');

    vi.spyOn(longDraftsQueries, 'getLongDraft').mockRejectedValueOnce(new Error('load long draft error'));
    await useLongDraftsStore.getState().loadLongDraft('doc-fail');
    expect(useLongDraftsStore.getState().error).toBe('load long draft error');

    vi.spyOn(longDraftsQueries, 'getSectionsByLongDraft').mockRejectedValueOnce(new Error('load sections error'));
    await useLongDraftsStore.getState().loadSections('doc-fail');
    expect(useLongDraftsStore.getState().error).toBe('load sections error');
  });

  it('uses Error.message branches for mutation failures and loadLongDraft merge paths', async () => {
    const created = await useLongDraftsStore.getState().createLongDraft('Merge Draft');
    useLongDraftsStore.setState(useLongDraftsStore.getInitialState(), true);

    await useLongDraftsStore.getState().loadLongDraft(created.id);
    expect(useLongDraftsStore.getState().longDrafts).toHaveLength(1);

    vi.spyOn(longDraftsQueries, 'getLongDraft').mockResolvedValueOnce({
      ...useLongDraftsStore.getState().longDrafts[0],
      title: 'Merge Draft Updated',
    });
    await useLongDraftsStore.getState().loadLongDraft(created.id);
    expect(useLongDraftsStore.getState().longDrafts[0].title).toBe('Merge Draft Updated');

    vi.spyOn(longDraftsQueries, 'createLongDraft').mockRejectedValueOnce(new Error('create long draft error'));
    await expect(useLongDraftsStore.getState().createLongDraft('Will Fail')).rejects.toThrow(
      'create long draft error'
    );
    expect(useLongDraftsStore.getState().error).toBe('create long draft error');

    vi.spyOn(longDraftsQueries, 'updateLongDraft').mockRejectedValueOnce(new Error('update long draft error'));
    await useLongDraftsStore.getState().updateLongDraft('doc-fail', { title: 'Updated' });
    expect(useLongDraftsStore.getState().error).toBe('update long draft error');

    vi.spyOn(longDraftsQueries, 'deleteLongDraft').mockRejectedValueOnce(new Error('delete long draft error'));
    await useLongDraftsStore.getState().deleteLongDraft('doc-fail');
    expect(useLongDraftsStore.getState().error).toBe('delete long draft error');

    vi.spyOn(longDraftsQueries, 'createSection').mockRejectedValueOnce(new Error('create section error'));
    await expect(useLongDraftsStore.getState().createSection('doc-fail')).rejects.toThrow(
      'create section error'
    );
    expect(useLongDraftsStore.getState().error).toBe('create section error');

    vi.spyOn(longDraftsQueries, 'updateSection').mockRejectedValueOnce(new Error('update section error'));
    await useLongDraftsStore.getState().updateSection('section-fail', { title: 'Updated' });
    expect(useLongDraftsStore.getState().error).toBe('update section error');

    vi.spyOn(longDraftsQueries, 'deleteSection').mockRejectedValueOnce(new Error('delete section error'));
    const createdDraft = await useLongDraftsStore.getState().createLongDraft('Draft For Delete Error');
    const createdSection = await useLongDraftsStore.getState().createSection(createdDraft.id, 'Section For Delete');
    await useLongDraftsStore.getState().deleteSection(createdSection.id);
    expect(useLongDraftsStore.getState().error).toBe('delete section error');

    vi.spyOn(longDraftsQueries, 'reorderSections').mockRejectedValueOnce(new Error('reorder sections error'));
    await useLongDraftsStore.getState().reorderSections(createdDraft.id, [createdSection.id]);
    expect(useLongDraftsStore.getState().error).toBe('reorder sections error');
  });

  it('covers remaining getter/selectors and branch-heavy document/section paths', async () => {
    const first = await useLongDraftsStore.getState().createLongDraft('First');
    const second = await useLongDraftsStore.getState().createLongDraft('Second');

    useLongDraftsStore.setState({
      ...useLongDraftsStore.getState(),
      longDrafts: [first, second],
      currentLongDraftId: first.id,
    });

    vi.spyOn(longDraftsQueries, 'getLongDraft').mockResolvedValueOnce({
      ...first,
      title: 'First Updated',
    });
    await useLongDraftsStore.getState().loadLongDraft(first.id);
    expect(useLongDraftsStore.getState().longDrafts.map((d) => d.title)).toEqual(['First Updated', 'Second']);

    vi.spyOn(longDraftsQueries, 'getLongDraft').mockResolvedValueOnce(undefined);
    await useLongDraftsStore.getState().loadLongDraft('missing-doc');
    expect(useLongDraftsStore.getState().error).toBe('Long draft not found');

    useLongDraftsStore.setState({
      ...useLongDraftsStore.getState(),
      longDrafts: [first],
      currentLongDraftId: first.id,
      sectionsMap: new Map(),
      currentSectionId: null,
    });
    await useLongDraftsStore.getState().deleteLongDraft(first.id);
    expect(useLongDraftsStore.getState().currentLongDraftId).toBeNull();

    const orphanDoc = await useLongDraftsStore.getState().createLongDraft('Orphan Doc');
    useLongDraftsStore.setState({
      ...useLongDraftsStore.getState(),
      longDrafts: [orphanDoc],
      currentLongDraftId: orphanDoc.id,
      sectionsMap: new Map(),
      currentSectionId: null,
    });
    const orphanA = await useLongDraftsStore.getState().createSection(orphanDoc.id, 'Orphan A');
    const orphanB = await useLongDraftsStore.getState().createSection(orphanDoc.id, 'Orphan B');
    await useLongDraftsStore.getState().reorderSections(orphanDoc.id, [orphanA.id]);
    const afterReorder = useLongDraftsStore.getState().getSectionsForDocument(orphanDoc.id);
    expect(afterReorder.some((section) => section.id === orphanB.id)).toBe(true);

    useLongDraftsStore.setState({
      ...useLongDraftsStore.getState(),
      currentLongDraftId: null,
      currentSectionId: 'missing-section',
    });
    expect(useLongDraftsStore.getState().getCurrentLongDraft()).toBeNull();
    expect(useLongDraftsStore.getState().getCurrentSection()).toBeNull();
    expect(useLongDraftsStore.getState().getSectionsForDocument('missing-doc')).toEqual([]);
    expect(useLongDraftsStore.getState().getRootSections('missing-doc')).toEqual([]);
    expect(useLongDraftsStore.getState().getChildSections('parent', 'missing-doc')).toEqual([]);
    expect(useLongDraftsStore.getState().getTotalWordCount('missing-doc')).toBe(0);
    expect(useLongDraftsStore.getState().getSectionHierarchy('missing-doc')).toEqual([]);

    const updateLongDraft = vi.fn().mockResolvedValue(undefined);
    useLongDraftsStore.setState({
      ...useLongDraftsStore.getState(),
      updateLongDraft,
      longDrafts: [],
      currentLongDraftId: null,
    });
    await useLongDraftsStore.getState().updateDocumentMetadata('metadata-doc');
    expect(updateLongDraft).toHaveBeenCalledWith(
      'metadata-doc',
      expect.objectContaining({
        metadata: expect.objectContaining({
          createdAt: expect.any(Date),
          totalWordCount: 0,
        }),
      })
    );

    const snapshot = useLongDraftsStore.getState();
    type StoreState = Parameters<typeof selectCurrentLongDraft>[0];

    expect(selectCurrentLongDraft({ ...snapshot, currentLongDraftId: 'missing' } as StoreState)).toBeNull();
    expect(
      selectCurrentSection({ ...snapshot, currentLongDraftId: 'missing', currentSectionId: 'x' } as StoreState)
    ).toBeNull();
    expect(selectCurrentSections({ ...snapshot, currentLongDraftId: null } as StoreState)).toEqual([]);
    expect(selectCurrentDocumentWordCount({ ...snapshot, currentLongDraftId: null } as StoreState)).toBe(0);
  });
});
