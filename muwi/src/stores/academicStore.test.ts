import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { BibliographyEntry } from '@/types/academic';
import {
  selectAcademicIsFocusMode,
  selectCurrentPaper,
  selectCurrentPaperWordCount,
  useAcademicStore,
} from './academicStore';
import { waitFor } from '@/test';

function makeEntryInput(overrides: Partial<Omit<BibliographyEntry, 'id' | 'createdAt' | 'modifiedAt'>> = {}) {
  return {
    type: 'article' as const,
    authors: ['Ada Lovelace', 'Alan Turing'],
    title: 'Computing Foundations',
    year: 2024,
    journal: 'Journal of Computation',
    volume: '1',
    issue: '2',
    pages: '1-10',
    doi: '10.1000/test-doi',
    tags: ['cs'],
    ...overrides,
  };
}

describe('academicStore', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    useAcademicStore.setState(useAcademicStore.getInitialState(), true);
  });

  it('creates papers, applies IMRAD template sections, and loads papers with sections/citations', async () => {
    const created = await useAcademicStore.getState().createPaper('IMRAD Paper', 'imrad');
    const stateAfterCreate = useAcademicStore.getState();

    expect(stateAfterCreate.currentPaperId).toBe(created.id);
    expect(stateAfterCreate.papers).toHaveLength(1);
    expect(stateAfterCreate.getSectionsForPaper(created.id).map((s) => s.title)).toEqual([
      'Introduction',
      'Methods',
      'Results',
      'Discussion',
      'Conclusion',
    ]);

    useAcademicStore.setState(useAcademicStore.getInitialState(), true);
    await useAcademicStore.getState().loadPapers();

    const loadedState = useAcademicStore.getState();
    expect(loadedState.papers).toHaveLength(1);
    expect(loadedState.currentPaperId).toBe(created.id);
    expect(loadedState.getSectionsForPaper(created.id)).toHaveLength(5);
    expect(loadedState.getCitationsForPaper(created.id)).toEqual([]);
  });

  it('manages section update/reorder/hierarchy/delete and keeps metadata in sync', async () => {
    const paper = await useAcademicStore.getState().createPaper('Structure Paper');
    const rootA = await useAcademicStore.getState().createSection(paper.id, 'Root A');
    const rootB = await useAcademicStore.getState().createSection(paper.id, 'Root B');
    const childA = await useAcademicStore.getState().createSection(paper.id, 'Child A', rootA.id);

    await useAcademicStore.getState().updateSection(rootA.id, {
      content: '<p>one two three</p>',
    });

    let state = useAcademicStore.getState();
    expect(state.findSectionById(rootA.id)?.wordCount).toBe(3);
    expect(state.getTotalWordCount(paper.id)).toBe(3);
    expect(selectCurrentPaperWordCount(state)).toBe(3);

    await useAcademicStore.getState().reorderSections(paper.id, [rootB.id, rootA.id]);
    state = useAcademicStore.getState();
    expect(state.getRootSections(paper.id).map((s) => s.id)).toEqual([rootB.id, rootA.id]);
    expect(state.getChildSections(rootA.id, paper.id).map((s) => s.id)).toEqual([childA.id]);
    expect(state.getSectionHierarchy(paper.id)).toMatchObject([
      { section: { id: rootB.id }, depth: 0 },
      { section: { id: rootA.id }, depth: 0, children: [{ section: { id: childA.id }, depth: 1 }] },
    ]);

    await useAcademicStore.getState().deleteSection(rootA.id);
    state = useAcademicStore.getState();
    expect(state.getSectionsForPaper(paper.id).map((s) => s.id)).toEqual([rootB.id]);
    expect(state.findSectionById(rootA.id)).toBeNull();
    expect(state.findSectionById(childA.id)).toBeNull();

    const persistedPaper = await db.academicPapers.get(paper.id);
    expect(persistedPaper?.metadata.totalWordCount).toBe(0);
  });

  it('manages bibliography + citations and links bibliography entries to papers', async () => {
    const paper = await useAcademicStore.getState().createPaper('Citation Paper');

    await expect(
      useAcademicStore.getState().addCitation(paper.id, 'missing-entry')
    ).rejects.toThrow('Bibliography entry not found');

    const entry = await useAcademicStore.getState().addBibliographyEntry(makeEntryInput());
    await useAcademicStore.getState().loadBibliographyEntries();

    let state = useAcademicStore.getState();
    expect(state.bibliographyEntries).toHaveLength(1);
    expect((await state.searchBibliographyEntries('Computing')).map((e) => e.id)).toEqual([entry.id]);

    const citation = await useAcademicStore
      .getState()
      .addCitation(paper.id, entry.id, '45-47');
    state = useAcademicStore.getState();
    expect(state.getCitationsForPaper(paper.id).map((c) => c.id)).toEqual([citation.id]);

    const linkedPaper = state.papers.find((p) => p.id === paper.id);
    expect(linkedPaper?.bibliographyEntryIds).toContain(entry.id);
    expect(state.getBibliographyForPaper(paper.id).map((e) => e.id)).toEqual([entry.id]);

    await useAcademicStore.getState().updateCitation(citation.id, { pageNumbers: '50' });
    expect(useAcademicStore.getState().getCitationsForPaper(paper.id)[0].pageNumbers).toBe('50');

    await useAcademicStore.getState().deleteCitation(citation.id);
    expect(useAcademicStore.getState().getCitationsForPaper(paper.id)).toEqual([]);

    await useAcademicStore.getState().deleteBibliographyEntry(entry.id);
    expect(useAcademicStore.getState().bibliographyEntries).toEqual([]);
  });

  it('supports UI toggles, citation style updates, loadPaper errors, and paper deletion fallback', async () => {
    const paperA = await useAcademicStore.getState().createPaper('Paper A');
    const paperB = await useAcademicStore.getState().createPaper('Paper B');

    useAcademicStore.getState().setCurrentPaper(paperA.id);
    useAcademicStore.getState().setViewMode('focus');
    expect(selectAcademicIsFocusMode(useAcademicStore.getState())).toBe(true);
    useAcademicStore.getState().toggleFocusMode();
    expect(useAcademicStore.getState().viewMode).toBe('normal');

    useAcademicStore.getState().setTOCVisible(false);
    expect(useAcademicStore.getState().isTOCVisible).toBe(false);
    useAcademicStore.getState().toggleTOC();
    expect(useAcademicStore.getState().isTOCVisible).toBe(true);

    useAcademicStore.getState().setBibliographyPanelVisible(true);
    expect(useAcademicStore.getState().isBibliographyPanelVisible).toBe(true);
    useAcademicStore.getState().toggleBibliographyPanel();
    expect(useAcademicStore.getState().isBibliographyPanelVisible).toBe(false);

    useAcademicStore.getState().setCitationStyle('mla9');
    expect(useAcademicStore.getState().citationStyle).toBe('mla9');
    await waitFor(() => {
      const updatedCurrentPaper = useAcademicStore.getState().papers.find((p) => p.id === paperA.id);
      expect(updatedCurrentPaper?.settings.citationStyle).toBe('mla9');
    });

    await useAcademicStore.getState().loadPaper('missing-paper-id');
    expect(useAcademicStore.getState().error).toBe('Paper not found');

    await useAcademicStore.getState().deletePaper(paperA.id);
    const stateAfterDelete = useAcademicStore.getState();
    expect(stateAfterDelete.papers.map((p) => p.id)).toEqual([paperB.id]);
    expect(stateAfterDelete.currentPaperId).toBe(paperB.id);
    expect(stateAfterDelete.currentSectionId).toBeNull();
    expect(selectCurrentPaper(stateAfterDelete)?.id).toBe(paperB.id);
  });
});
