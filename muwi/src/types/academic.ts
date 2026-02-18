// Academic Papers Types

export type BibliographyEntryType =
  | 'article'
  | 'book'
  | 'chapter'
  | 'conference'
  | 'website'
  | 'thesis'
  | 'other';

export type CitationStyle = 'apa7' | 'mla9' | 'chicago' | 'harvard' | 'ieee';

export interface Author {
  firstName: string;
  lastName: string;
  affiliation?: string;
}

export interface PaperCreationOptions {
  abstract?: string;
  keywords?: string[];
  authors?: Author[];
  customSections?: string[];
}

export interface BibliographyEntry {
  id: string;
  type: BibliographyEntryType;
  authors: string[];
  title: string;
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  accessedDate?: Date;
  bibtex?: string;
  tags: string[];
  createdAt: Date;
  modifiedAt: Date;
}

export interface Citation {
  id: string;
  paperId: string;
  bibliographyEntryId: string;
  inTextFormat: string;
  pageNumbers?: string;
  positionInDocument: number;
}

export interface Figure {
  id: string;
  paperId: string;
  number: number;
  caption: string;
  imageUrl?: string;
  position: number;
}

export interface Table {
  id: string;
  paperId: string;
  number: number;
  caption: string;
  content: string; // HTML or markdown table
  position: number;
}

export interface AcademicSection {
  id: string;
  paperId: string;
  title: string;
  content: string;
  order: number;
  parentId: string | null;
  wordCount: number;
}

export interface PaperMetadata {
  createdAt: Date;
  modifiedAt: Date;
  totalWordCount: number;
  targetWordCount?: number;
}

export interface MarginSettings {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AcademicSettings {
  citationStyle: CitationStyle;
  pageSize: 'a4' | 'letter';
  margins: MarginSettings;
  lineSpacing: number;
  fontFamily: string;
  fontSize: number;
}

export interface AcademicPaper {
  id: string;
  title: string;
  authors: Author[];
  abstract: string;
  keywords: string[];
  sectionIds: string[];
  citationIds: string[];
  bibliographyEntryIds: string[];
  figureIds: string[];
  tableIds: string[];
  settings: AcademicSettings;
  metadata: PaperMetadata;
  createdAt: Date;
  modifiedAt: Date;
}

export const defaultAcademicSettings: AcademicSettings = {
  citationStyle: 'apa7',
  pageSize: 'a4',
  margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 }, // 1 inch in mm
  lineSpacing: 2,
  fontFamily: 'Times New Roman',
  fontSize: 12,
};
