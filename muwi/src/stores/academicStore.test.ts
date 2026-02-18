import { db } from '@/db';
import * as academicQueries from '@/db/queries/academic';
import { clearDatabase } from '@/test/db-utils';
import type { BibliographyEntry } from '@/types/academic';
import {
  selectAcademicCurrentSection,
  selectAcademicCurrentSections,
  selectAcademicIsFocusMode,
  selectCurrentPaperBibliography,
  selectCurrentPaperCitations,
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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('creates custom-template papers with abstract, keywords, authors, and custom sections', async () => {
    const created = await useAcademicStore.getState().createPaper('Custom Paper', 'custom', {
      abstract: 'Structured paper abstract',
      keywords: ['analysis', ' writing ', ''],
      authors: [
        { firstName: 'Ada', lastName: 'Lovelace', affiliation: 'Engine Lab' },
        { firstName: ' ', lastName: ' ', affiliation: 'ignored' },
      ],
      customSections: ['Background', ' Method ', '', 'Conclusion'],
    });

    const state = useAcademicStore.getState();
    const createdPaper = state.papers.find((paper) => paper.id === created.id);

    expect(createdPaper?.abstract).toBe('Structured paper abstract');
    expect(createdPaper?.keywords).toEqual(['analysis', 'writing']);
    expect(createdPaper?.authors).toEqual([
      { firstName: 'Ada', lastName: 'Lovelace', affiliation: 'Engine Lab' },
    ]);
    expect(state.getSectionsForPaper(created.id).map((section) => section.title)).toEqual([
      'Background',
      'Method',
      'Conclusion',
    ]);
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

  it('covers selector fallbacks and citation-style update guards', () => {
    const updatePaper = vi.fn().mockResolvedValue(undefined);
    useAcademicStore.setState({
      ...useAcademicStore.getInitialState(),
      updatePaper,
      currentPaperId: null,
    });

    useAcademicStore.getState().setCitationStyle('ieee');
    expect(useAcademicStore.getState().citationStyle).toBe('ieee');
    expect(updatePaper).not.toHaveBeenCalled();

    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      currentPaperId: 'missing-paper',
      papers: [],
    });
    useAcademicStore.getState().setCitationStyle('apa7');
    expect(updatePaper).not.toHaveBeenCalled();

    const state = useAcademicStore.getState();
    expect(selectAcademicCurrentSections(state)).toEqual([]);
    expect(selectAcademicCurrentSection(state)).toBeNull();
    expect(selectCurrentPaperCitations(state)).toEqual([]);
    expect(selectCurrentPaperBibliography(state)).toEqual([]);
  });

  it('handles load/query failures with fallback error messages', async () => {
    vi.spyOn(academicQueries, 'getAllPapers').mockRejectedValueOnce('load-papers-failure');
    await useAcademicStore.getState().loadPapers();
    expect(useAcademicStore.getState().error).toBe('Failed to load papers');

    vi.spyOn(academicQueries, 'getPaper').mockRejectedValueOnce('load-paper-failure');
    await useAcademicStore.getState().loadPaper('paper-fail');
    expect(useAcademicStore.getState().error).toBe('Failed to load paper');

    vi.spyOn(academicQueries, 'getSectionsByPaper').mockRejectedValueOnce('load-sections-failure');
    await useAcademicStore.getState().loadSections('paper-fail');
    expect(useAcademicStore.getState().error).toBe('Failed to load sections');

    vi.spyOn(academicQueries, 'getAllBibliographyEntries').mockRejectedValueOnce('load-bibliography-failure');
    await useAcademicStore.getState().loadBibliographyEntries();
    expect(useAcademicStore.getState().error).toBe('Failed to load bibliography entries');

    vi.spyOn(academicQueries, 'searchBibliographyEntries').mockRejectedValueOnce('search-failure');
    await expect(useAcademicStore.getState().searchBibliographyEntries('abc')).resolves.toEqual([]);
    expect(useAcademicStore.getState().error).toBe('Failed to search bibliography entries');

    vi.spyOn(academicQueries, 'getCitationsByPaper').mockRejectedValueOnce('load-citations-failure');
    await useAcademicStore.getState().loadCitations('paper-fail');
    expect(useAcademicStore.getState().error).toBe('Failed to load citations');
  });

  it('handles mutation failures with fallback error messages', async () => {
    vi.spyOn(academicQueries, 'createPaper').mockRejectedValueOnce('create-paper-failure');
    await expect(useAcademicStore.getState().createPaper('Will Fail')).rejects.toBe('create-paper-failure');
    expect(useAcademicStore.getState().error).toBe('Failed to create paper');

    vi.spyOn(academicQueries, 'updatePaper').mockRejectedValueOnce('update-paper-failure');
    await useAcademicStore.getState().updatePaper('paper-fail', { title: 'new title' });
    expect(useAcademicStore.getState().error).toBe('Failed to update paper');

    vi.spyOn(academicQueries, 'deletePaper').mockRejectedValueOnce('delete-paper-failure');
    await useAcademicStore.getState().deletePaper('paper-fail');
    expect(useAcademicStore.getState().error).toBe('Failed to delete paper');

    vi.spyOn(academicQueries, 'createAcademicSection').mockRejectedValueOnce('create-section-failure');
    await expect(useAcademicStore.getState().createSection('paper-fail')).rejects.toBe('create-section-failure');
    expect(useAcademicStore.getState().error).toBe('Failed to create section');

    vi.spyOn(academicQueries, 'updateAcademicSection').mockRejectedValueOnce('update-section-failure');
    await useAcademicStore.getState().updateSection('section-fail', { title: 'Updated' });
    expect(useAcademicStore.getState().error).toBe('Failed to update section');

    vi.spyOn(academicQueries, 'updateAcademicSection').mockRejectedValueOnce('reorder-failure');
    await useAcademicStore.getState().reorderSections('paper-fail', ['s1']);
    expect(useAcademicStore.getState().error).toBe('Failed to reorder sections');

    vi.spyOn(academicQueries, 'createBibliographyEntry').mockRejectedValueOnce('create-bib-failure');
    await expect(
      useAcademicStore.getState().addBibliographyEntry(makeEntryInput({ title: 'Will Fail Bib' }))
    ).rejects.toBe('create-bib-failure');
    expect(useAcademicStore.getState().error).toBe('Failed to add bibliography entry');

    vi.spyOn(academicQueries, 'updateBibliographyEntry').mockRejectedValueOnce('update-bib-failure');
    await useAcademicStore.getState().updateBibliographyEntry('entry-fail', { title: 'new title' });
    expect(useAcademicStore.getState().error).toBe('Failed to update bibliography entry');

    vi.spyOn(academicQueries, 'deleteBibliographyEntry').mockRejectedValueOnce('delete-bib-failure');
    await useAcademicStore.getState().deleteBibliographyEntry('entry-fail');
    expect(useAcademicStore.getState().error).toBe('Failed to delete bibliography entry');

    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      bibliographyEntries: [{ ...makeEntryInput(), id: 'entry-1', createdAt: new Date(), modifiedAt: new Date() }],
      papers: [],
    });
    vi.spyOn(academicQueries, 'createCitation').mockRejectedValueOnce('create-citation-failure');
    await expect(useAcademicStore.getState().addCitation('paper-fail', 'entry-1')).rejects.toBe(
      'create-citation-failure'
    );
    expect(useAcademicStore.getState().error).toBe('Failed to add citation');

    vi.spyOn(academicQueries, 'updateCitation').mockRejectedValueOnce('update-citation-failure');
    await useAcademicStore.getState().updateCitation('citation-fail', { pageNumbers: '10' });
    expect(useAcademicStore.getState().error).toBe('Failed to update citation');

    vi.spyOn(academicQueries, 'deleteCitation').mockRejectedValueOnce('delete-citation-failure');
    await useAcademicStore.getState().deleteCitation('citation-fail');
    expect(useAcademicStore.getState().error).toBe('Failed to delete citation');
  });

  it('uses Error.message branches for load/query failures', async () => {
    vi.spyOn(academicQueries, 'getAllPapers').mockRejectedValueOnce(new Error('load papers error'));
    await useAcademicStore.getState().loadPapers();
    expect(useAcademicStore.getState().error).toBe('load papers error');

    vi.spyOn(academicQueries, 'getPaper').mockRejectedValueOnce(new Error('load paper error'));
    await useAcademicStore.getState().loadPaper('paper-fail');
    expect(useAcademicStore.getState().error).toBe('load paper error');

    vi.spyOn(academicQueries, 'getSectionsByPaper').mockRejectedValueOnce(new Error('load sections error'));
    await useAcademicStore.getState().loadSections('paper-fail');
    expect(useAcademicStore.getState().error).toBe('load sections error');

    vi.spyOn(academicQueries, 'getAllBibliographyEntries').mockRejectedValueOnce(
      new Error('load bibliography error')
    );
    await useAcademicStore.getState().loadBibliographyEntries();
    expect(useAcademicStore.getState().error).toBe('load bibliography error');

    vi.spyOn(academicQueries, 'searchBibliographyEntries').mockRejectedValueOnce(new Error('search error'));
    await expect(useAcademicStore.getState().searchBibliographyEntries('term')).resolves.toEqual([]);
    expect(useAcademicStore.getState().error).toBe('search error');

    vi.spyOn(academicQueries, 'getCitationsByPaper').mockRejectedValueOnce(new Error('load citations error'));
    await useAcademicStore.getState().loadCitations('paper-fail');
    expect(useAcademicStore.getState().error).toBe('load citations error');
  });

  it('uses Error.message branches for mutation failures and loadPaper merge paths', async () => {
    const created = await useAcademicStore.getState().createPaper('Merge Paper');
    useAcademicStore.setState(useAcademicStore.getInitialState(), true);

    await useAcademicStore.getState().loadPaper(created.id);
    expect(useAcademicStore.getState().papers).toHaveLength(1);

    vi.spyOn(academicQueries, 'getPaper').mockResolvedValueOnce({
      ...(useAcademicStore.getState().papers[0]),
      title: 'Merge Paper Updated',
    });
    await useAcademicStore.getState().loadPaper(created.id);
    expect(useAcademicStore.getState().papers[0].title).toBe('Merge Paper Updated');

    vi.spyOn(academicQueries, 'createPaper').mockRejectedValueOnce(new Error('create paper error'));
    await expect(useAcademicStore.getState().createPaper('Will Fail')).rejects.toThrow('create paper error');
    expect(useAcademicStore.getState().error).toBe('create paper error');

    vi.spyOn(academicQueries, 'updatePaper').mockRejectedValueOnce(new Error('update paper error'));
    await useAcademicStore.getState().updatePaper('paper-fail', { title: 'new title' });
    expect(useAcademicStore.getState().error).toBe('update paper error');

    vi.spyOn(academicQueries, 'deletePaper').mockRejectedValueOnce(new Error('delete paper error'));
    await useAcademicStore.getState().deletePaper('paper-fail');
    expect(useAcademicStore.getState().error).toBe('delete paper error');

    vi.spyOn(academicQueries, 'createAcademicSection').mockRejectedValueOnce(new Error('create section error'));
    await expect(useAcademicStore.getState().createSection('paper-fail')).rejects.toThrow('create section error');
    expect(useAcademicStore.getState().error).toBe('create section error');

    vi.spyOn(academicQueries, 'updateAcademicSection').mockRejectedValueOnce(new Error('update section error'));
    await useAcademicStore.getState().updateSection('section-fail', { title: 'Updated' });
    expect(useAcademicStore.getState().error).toBe('update section error');

    await useAcademicStore.getState().deleteSection('missing-section');

    vi.spyOn(academicQueries, 'updateAcademicSection').mockRejectedValueOnce(new Error('reorder error'));
    await useAcademicStore.getState().reorderSections('paper-fail', ['s1']);
    expect(useAcademicStore.getState().error).toBe('reorder error');

    vi.spyOn(academicQueries, 'createBibliographyEntry').mockRejectedValueOnce(
      new Error('create bibliography error')
    );
    await expect(
      useAcademicStore.getState().addBibliographyEntry(makeEntryInput({ title: 'Will Fail Bib' }))
    ).rejects.toThrow('create bibliography error');
    expect(useAcademicStore.getState().error).toBe('create bibliography error');

    vi.spyOn(academicQueries, 'updateBibliographyEntry').mockRejectedValueOnce(
      new Error('update bibliography error')
    );
    await useAcademicStore.getState().updateBibliographyEntry('entry-fail', { title: 'new title' });
    expect(useAcademicStore.getState().error).toBe('update bibliography error');

    vi.spyOn(academicQueries, 'deleteBibliographyEntry').mockRejectedValueOnce(
      new Error('delete bibliography error')
    );
    await useAcademicStore.getState().deleteBibliographyEntry('entry-fail');
    expect(useAcademicStore.getState().error).toBe('delete bibliography error');

    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      bibliographyEntries: [{ ...makeEntryInput(), id: 'entry-1', createdAt: new Date(), modifiedAt: new Date() }],
      papers: [{ ...created, bibliographyEntryIds: [] }],
    });

    vi.spyOn(academicQueries, 'createCitation').mockRejectedValueOnce(new Error('create citation error'));
    await expect(useAcademicStore.getState().addCitation(created.id, 'entry-1')).rejects.toThrow(
      'create citation error'
    );
    expect(useAcademicStore.getState().error).toBe('create citation error');

    vi.spyOn(academicQueries, 'updateCitation').mockRejectedValueOnce(new Error('update citation error'));
    await useAcademicStore.getState().updateCitation('citation-fail', { pageNumbers: '10' });
    expect(useAcademicStore.getState().error).toBe('update citation error');

    vi.spyOn(academicQueries, 'deleteCitation').mockRejectedValueOnce(new Error('delete citation error'));
    await useAcademicStore.getState().deleteCitation('citation-fail');
    expect(useAcademicStore.getState().error).toBe('delete citation error');
  });

  it('covers remaining branch-heavy paper/section getter and mutation paths', async () => {
    const paperOne = await useAcademicStore.getState().createPaper('Paper One');
    const paperTwo = await useAcademicStore.getState().createPaper('Paper Two');

    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      papers: [paperOne, paperTwo],
      currentPaperId: paperOne.id,
    });

    vi.spyOn(academicQueries, 'getPaper').mockResolvedValueOnce({
      ...paperOne,
      title: 'Paper One Updated',
    });
    await useAcademicStore.getState().loadPaper(paperOne.id);
    expect(useAcademicStore.getState().papers.map((p) => p.title)).toEqual(['Paper One Updated', 'Paper Two']);

    const onlyPaper = await useAcademicStore.getState().createPaper('Only Paper');
    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      papers: [onlyPaper],
      currentPaperId: onlyPaper.id,
      currentSectionId: null,
      sectionsMap: new Map(),
      citationsMap: new Map(),
    });
    await useAcademicStore.getState().deletePaper(onlyPaper.id);
    expect(useAcademicStore.getState().currentPaperId).toBeNull();

    const sectionPaper = await useAcademicStore.getState().createPaper('Sections Paper');
    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      papers: [sectionPaper],
      currentPaperId: sectionPaper.id,
      sectionsMap: new Map(),
      citationsMap: new Map(),
    });
    const section = await useAcademicStore.getState().createSection(sectionPaper.id, 'Branch Section');
    expect(useAcademicStore.getState().sectionsMap.get(sectionPaper.id)).toBeTruthy();

    vi.spyOn(academicQueries, 'deleteAcademicSection').mockRejectedValueOnce('delete-section-fallback');
    await useAcademicStore.getState().deleteSection(section.id);
    expect(useAcademicStore.getState().error).toBe('Failed to delete section');

    vi.spyOn(academicQueries, 'deleteAcademicSection').mockRejectedValueOnce(
      new Error('delete section message')
    );
    await useAcademicStore.getState().deleteSection(section.id);
    expect(useAcademicStore.getState().error).toBe('delete section message');

    const entryOne = await useAcademicStore
      .getState()
      .addBibliographyEntry(makeEntryInput({ title: 'Entry One' }));
    await useAcademicStore
      .getState()
      .addBibliographyEntry(makeEntryInput({ title: 'Entry Two', doi: '10.2000/second' }));
    await useAcademicStore.getState().updateBibliographyEntry(entryOne.id, { title: 'Entry One Updated' });

    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      papers: [{ ...sectionPaper, bibliographyEntryIds: [entryOne.id] }],
      currentPaperId: sectionPaper.id,
      citationsMap: new Map(),
      bibliographyEntries: [entryOne],
    });
    await useAcademicStore.getState().addCitation(sectionPaper.id, entryOne.id);

    useAcademicStore.getState().setViewMode('normal');
    useAcademicStore.getState().toggleFocusMode();
    useAcademicStore.getState().toggleFocusMode();
    expect(useAcademicStore.getState().viewMode).toBe('normal');

    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      currentPaperId: null,
      currentSectionId: 'missing-section',
    });
    expect(useAcademicStore.getState().getCurrentPaper()).toBeNull();
    expect(useAcademicStore.getState().getCurrentSection()).toBeNull();
    expect(useAcademicStore.getState().getSectionsForPaper('missing')).toEqual([]);
    expect(useAcademicStore.getState().getRootSections('missing')).toEqual([]);
    expect(useAcademicStore.getState().getChildSections('parent', 'missing')).toEqual([]);
    expect(useAcademicStore.getState().getTotalWordCount('missing')).toBe(0);
    expect(useAcademicStore.getState().getSectionHierarchy('missing')).toEqual([]);
    expect(useAcademicStore.getState().getCitationsForPaper('missing')).toEqual([]);
    expect(useAcademicStore.getState().getBibliographyForPaper('missing')).toEqual([]);

    const updatePaper = vi.fn().mockResolvedValue(undefined);
    useAcademicStore.setState({
      ...useAcademicStore.getState(),
      updatePaper,
      papers: [],
      currentPaperId: null,
      currentSectionId: null,
    });
    await useAcademicStore.getState().updatePaperMetadata('metadata-branch-paper');
    expect(updatePaper).toHaveBeenCalledWith(
      'metadata-branch-paper',
      expect.objectContaining({
        metadata: expect.objectContaining({
          createdAt: expect.any(Date),
          totalWordCount: 0,
        }),
      })
    );
  });
});
