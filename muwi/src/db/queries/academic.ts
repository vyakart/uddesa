import { db } from '../database';
import type { AcademicPaper, AcademicSection, BibliographyEntry, Citation, Figure } from '@/types';

// Academic Papers CRUD

export async function createPaper(paper: AcademicPaper): Promise<string> {
  return db.academicPapers.add(paper);
}

export async function getPaper(id: string): Promise<AcademicPaper | undefined> {
  return db.academicPapers.get(id);
}

export async function getAllPapers(): Promise<AcademicPaper[]> {
  return db.academicPapers.orderBy('modifiedAt').reverse().toArray();
}

export async function updatePaper(id: string, updates: Partial<AcademicPaper>): Promise<number> {
  return db.academicPapers.update(id, { ...updates, modifiedAt: new Date() });
}

export async function deletePaper(id: string): Promise<void> {
  await db.academicSections.where('paperId').equals(id).delete();
  await db.citations.where('paperId').equals(id).delete();
  await db.figures.where('paperId').equals(id).delete();
  await db.academicPapers.delete(id);
}

// Academic Sections CRUD

export async function createAcademicSection(section: AcademicSection): Promise<string> {
  const id = await db.academicSections.add(section);
  const paper = await db.academicPapers.get(section.paperId);
  if (paper) {
    await db.academicPapers.update(section.paperId, {
      sectionIds: [...paper.sectionIds, section.id],
      modifiedAt: new Date(),
    });
  }
  return id;
}

export async function getAcademicSection(id: string): Promise<AcademicSection | undefined> {
  return db.academicSections.get(id);
}

export async function getSectionsByPaper(paperId: string): Promise<AcademicSection[]> {
  return db.academicSections.where('paperId').equals(paperId).sortBy('order');
}

export async function updateAcademicSection(id: string, updates: Partial<AcademicSection>): Promise<number> {
  return db.academicSections.update(id, updates);
}

export async function deleteAcademicSection(id: string): Promise<void> {
  const section = await db.academicSections.get(id);
  if (section) {
    const paper = await db.academicPapers.get(section.paperId);
    if (paper) {
      await db.academicPapers.update(section.paperId, {
        sectionIds: paper.sectionIds.filter((sid) => sid !== id),
        modifiedAt: new Date(),
      });
    }
  }
  await db.academicSections.delete(id);
}

// Bibliography Entries CRUD

export async function createBibliographyEntry(entry: BibliographyEntry): Promise<string> {
  return db.bibliographyEntries.add(entry);
}

export async function getBibliographyEntry(id: string): Promise<BibliographyEntry | undefined> {
  return db.bibliographyEntries.get(id);
}

export async function getAllBibliographyEntries(): Promise<BibliographyEntry[]> {
  return db.bibliographyEntries.orderBy('title').toArray();
}

export async function searchBibliographyEntries(query: string): Promise<BibliographyEntry[]> {
  const lowerQuery = query.toLowerCase();
  return db.bibliographyEntries
    .filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.authors.some((author) => author.toLowerCase().includes(lowerQuery))
    )
    .toArray();
}

export async function updateBibliographyEntry(id: string, updates: Partial<BibliographyEntry>): Promise<number> {
  return db.bibliographyEntries.update(id, { ...updates, modifiedAt: new Date() });
}

export async function deleteBibliographyEntry(id: string): Promise<void> {
  // Also delete all citations referencing this entry
  await db.citations.where('bibliographyEntryId').equals(id).delete();
  await db.bibliographyEntries.delete(id);
}

// Citations CRUD

export async function createCitation(citation: Citation): Promise<string> {
  const id = await db.citations.add(citation);
  const paper = await db.academicPapers.get(citation.paperId);
  if (paper) {
    await db.academicPapers.update(citation.paperId, {
      citationIds: [...paper.citationIds, citation.id],
      modifiedAt: new Date(),
    });
  }
  return id;
}

export async function getCitation(id: string): Promise<Citation | undefined> {
  return db.citations.get(id);
}

export async function getCitationsByPaper(paperId: string): Promise<Citation[]> {
  return db.citations.where('paperId').equals(paperId).toArray();
}

export async function updateCitation(id: string, updates: Partial<Citation>): Promise<number> {
  return db.citations.update(id, updates);
}

export async function deleteCitation(id: string): Promise<void> {
  const citation = await db.citations.get(id);
  if (citation) {
    const paper = await db.academicPapers.get(citation.paperId);
    if (paper) {
      await db.academicPapers.update(citation.paperId, {
        citationIds: paper.citationIds.filter((cid) => cid !== id),
        modifiedAt: new Date(),
      });
    }
  }
  await db.citations.delete(id);
}

// Figures CRUD

export async function createFigure(figure: Figure): Promise<string> {
  const id = await db.figures.add(figure);
  const paper = await db.academicPapers.get(figure.paperId);
  if (paper) {
    await db.academicPapers.update(figure.paperId, {
      figureIds: [...paper.figureIds, figure.id],
      modifiedAt: new Date(),
    });
  }
  return id;
}

export async function getFigure(id: string): Promise<Figure | undefined> {
  return db.figures.get(id);
}

export async function getFiguresByPaper(paperId: string): Promise<Figure[]> {
  return db.figures.where('paperId').equals(paperId).sortBy('number');
}

export async function updateFigure(id: string, updates: Partial<Figure>): Promise<number> {
  return db.figures.update(id, updates);
}

export async function deleteFigure(id: string): Promise<void> {
  const figure = await db.figures.get(id);
  if (figure) {
    const paper = await db.academicPapers.get(figure.paperId);
    if (paper) {
      await db.academicPapers.update(figure.paperId, {
        figureIds: paper.figureIds.filter((fid) => fid !== id),
        modifiedAt: new Date(),
      });
    }
  }
  await db.figures.delete(id);
}
