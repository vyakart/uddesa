import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { LongDraft, Section } from '@/types/longDrafts';
import {
  selectCurrentDocumentWordCount,
  selectCurrentLongDraft,
  selectCurrentSection,
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
});
