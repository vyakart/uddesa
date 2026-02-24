import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { AcademicPaper, AcademicSection, BibliographyEntry, Citation, Figure } from '@/types';
import { defaultAcademicSettings } from '@/types';
import {
  createAcademicSection,
  createBibliographyEntry,
  createCitation,
  createFigure,
  deleteAcademicSection,
  deleteCitation,
  deleteFigure,
  reorderAcademicSections,
  searchBibliographyEntries,
} from './academic';

function makePaper(overrides: Partial<AcademicPaper> = {}): AcademicPaper {
  const now = new Date('2026-02-12T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    title: 'Academic Paper',
    authors: [],
    abstract: '',
    keywords: [],
    sectionIds: [],
    citationIds: [],
    bibliographyEntryIds: [],
    figureIds: [],
    tableIds: [],
    settings: {
      ...defaultAcademicSettings,
      margins: { ...defaultAcademicSettings.margins },
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

function makeSection(paperId: string, overrides: Partial<AcademicSection> = {}): AcademicSection {
  return {
    id: crypto.randomUUID(),
    paperId,
    title: 'Section',
    content: '',
    order: 0,
    parentId: null,
    wordCount: 0,
    ...overrides,
  };
}

function makeBibliographyEntry(overrides: Partial<BibliographyEntry> = {}): BibliographyEntry {
  const now = new Date('2026-02-12T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    type: 'article',
    authors: ['Ada Lovelace'],
    title: 'Computing',
    year: 2026,
    tags: ['test'],
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeCitation(
  paperId: string,
  bibliographyEntryId: string,
  overrides: Partial<Citation> = {}
): Citation {
  return {
    id: crypto.randomUUID(),
    paperId,
    bibliographyEntryId,
    inTextFormat: '(Lovelace, 2026)',
    positionInDocument: 1,
    ...overrides,
  };
}

function makeFigure(paperId: string, overrides: Partial<Figure> = {}): Figure {
  return {
    id: crypto.randomUUID(),
    paperId,
    number: 1,
    caption: 'Figure caption',
    position: 1,
    ...overrides,
  };
}

describe('academic queries', () => {
  beforeEach(async () => {
    await clearDatabase(db);
  });

  it('handles section create/delete paths for existing, missing, and orphaned papers', async () => {
    const paper = makePaper({ id: 'paper-1' });
    await db.academicPapers.put(paper);

    const attachedSection = makeSection(paper.id, { id: 'section-1' });
    await createAcademicSection(attachedSection);
    expect((await db.academicPapers.get(paper.id))?.sectionIds).toEqual([attachedSection.id]);

    const orphanSection = makeSection('missing-paper', { id: 'section-orphan' });
    await createAcademicSection(orphanSection);
    expect(await db.academicSections.get(orphanSection.id)).toMatchObject({ id: orphanSection.id });
    expect(await db.academicPapers.get('missing-paper')).toBeUndefined();

    await deleteAcademicSection(attachedSection.id);
    expect(await db.academicSections.get(attachedSection.id)).toBeUndefined();
    expect((await db.academicPapers.get(paper.id))?.sectionIds).toEqual([]);

    await deleteAcademicSection(orphanSection.id);
    expect(await db.academicSections.get(orphanSection.id)).toBeUndefined();

    await expect(deleteAcademicSection('missing-section')).resolves.toBeUndefined();
  });

  it('searches bibliography by author and handles citation parent-paper branches', async () => {
    const paper = makePaper({ id: 'paper-citations' });
    await db.academicPapers.put(paper);

    const titleMatch = makeBibliographyEntry({
      id: 'entry-title',
      title: 'Neural Atlas',
      authors: ['Different Author'],
    });
    const authorMatch = makeBibliographyEntry({
      id: 'entry-author',
      title: 'Unrelated title',
      authors: ['Ada Lovelace'],
    });
    await createBibliographyEntry(titleMatch);
    await createBibliographyEntry(authorMatch);

    expect((await searchBibliographyEntries('lovelace')).map((entry) => entry.id)).toEqual(['entry-author']);

    const citationWithPaper = makeCitation(paper.id, titleMatch.id, { id: 'citation-1' });
    await createCitation(citationWithPaper);
    expect((await db.academicPapers.get(paper.id))?.citationIds).toEqual([citationWithPaper.id]);

    const orphanCitation = makeCitation('missing-paper', authorMatch.id, { id: 'citation-orphan' });
    await createCitation(orphanCitation);
    expect(await db.citations.get(orphanCitation.id)).toBeDefined();
    expect(await db.academicPapers.get('missing-paper')).toBeUndefined();

    await deleteCitation(citationWithPaper.id);
    expect(await db.citations.get(citationWithPaper.id)).toBeUndefined();
    expect((await db.academicPapers.get(paper.id))?.citationIds).toEqual([]);

    await deleteCitation(orphanCitation.id);
    expect(await db.citations.get(orphanCitation.id)).toBeUndefined();

    await expect(deleteCitation('missing-citation')).resolves.toBeUndefined();
  });

  it('handles figure parent-paper branches for create and delete', async () => {
    const paper = makePaper({ id: 'paper-figures' });
    await db.academicPapers.put(paper);

    const figureWithPaper = makeFigure(paper.id, { id: 'figure-1' });
    await createFigure(figureWithPaper);
    expect((await db.academicPapers.get(paper.id))?.figureIds).toEqual([figureWithPaper.id]);

    const orphanFigure = makeFigure('missing-paper', { id: 'figure-orphan', number: 2 });
    await createFigure(orphanFigure);
    expect(await db.figures.get(orphanFigure.id)).toBeDefined();

    await deleteFigure(figureWithPaper.id);
    expect(await db.figures.get(figureWithPaper.id)).toBeUndefined();
    expect((await db.academicPapers.get(paper.id))?.figureIds).toEqual([]);

    await deleteFigure(orphanFigure.id);
    expect(await db.figures.get(orphanFigure.id)).toBeUndefined();

    await expect(deleteFigure('missing-figure')).resolves.toBeUndefined();
  });

  it('reorders academic sections transactionally and updates paper sectionIds ordering', async () => {
    const paper = makePaper({ id: 'paper-reorder' });
    await db.academicPapers.put(paper);

    const first = makeSection(paper.id, { id: 'section-a', order: 0 });
    const second = makeSection(paper.id, { id: 'section-b', order: 1 });
    const third = makeSection(paper.id, { id: 'section-c', order: 2 });

    await db.academicSections.bulkPut([first, second, third]);
    await db.academicPapers.update(paper.id, { sectionIds: [first.id, second.id, third.id] });

    await reorderAcademicSections(paper.id, [third.id, first.id, second.id]);

    const reorderedSections = await db.academicSections
      .where('paperId')
      .equals(paper.id)
      .sortBy('order');
    expect(reorderedSections.map((section) => section.id)).toEqual([third.id, first.id, second.id]);
    expect(reorderedSections.map((section) => section.order)).toEqual([0, 1, 2]);

    const updatedPaper = await db.academicPapers.get(paper.id);
    expect(updatedPaper?.sectionIds).toEqual([third.id, first.id, second.id]);
    expect(updatedPaper?.modifiedAt).toBeInstanceOf(Date);
  });
});
