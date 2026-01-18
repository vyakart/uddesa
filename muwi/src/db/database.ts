import Dexie, { type Table } from 'dexie';
import type {
  ScratchpadPage,
  TextBlock,
  BlackboardCanvas,
  CanvasElement,
  DiaryEntry,
  Draft,
  LongDraft,
  Section,
  AcademicPaper,
  AcademicSection,
  BibliographyEntry,
  Citation,
  Figure,
  GlobalSettings,
  LockedContent,
} from '@/types';

// Extended Table type with proper ID types
export class MUWIDatabase extends Dexie {
  // Scratchpad tables
  scratchpadPages!: Table<ScratchpadPage, string>;
  textBlocks!: Table<TextBlock, string>;

  // Blackboard tables
  blackboardCanvases!: Table<BlackboardCanvas, string>;
  canvasElements!: Table<CanvasElement, string>;

  // Personal Diary tables
  diaryEntries!: Table<DiaryEntry, string>;

  // Drafts tables
  drafts!: Table<Draft, string>;

  // Long Drafts tables
  longDrafts!: Table<LongDraft, string>;
  sections!: Table<Section, string>;

  // Academic tables
  academicPapers!: Table<AcademicPaper, string>;
  academicSections!: Table<AcademicSection, string>;
  bibliographyEntries!: Table<BibliographyEntry, string>;
  citations!: Table<Citation, string>;
  figures!: Table<Figure, string>;

  // Settings & Security
  settings!: Table<GlobalSettings, string>;
  lockedContent!: Table<LockedContent, string>;

  constructor() {
    super('muwi-database');

    this.version(1).stores({
      // Scratchpad
      scratchpadPages: 'id, pageNumber, categoryName, createdAt, modifiedAt, isLocked',
      textBlocks: 'id, pageId, createdAt',

      // Blackboard
      blackboardCanvases: 'id, name, createdAt, modifiedAt',
      canvasElements: 'id, canvasId, type, headingLevel, createdAt',

      // Personal Diary
      diaryEntries: 'id, date, createdAt, modifiedAt, isLocked',

      // Drafts
      drafts: 'id, title, status, createdAt, modifiedAt, isLocked, *tags',

      // Long Drafts
      longDrafts: 'id, title, createdAt, modifiedAt',
      sections: 'id, longDraftId, parentId, order, isLocked',

      // Academic
      academicPapers: 'id, title, createdAt, modifiedAt',
      academicSections: 'id, paperId, order, parentId',
      bibliographyEntries: 'id, type, year, *authors, title',
      citations: 'id, paperId, bibliographyEntryId',
      figures: 'id, paperId, number',

      // Settings & Security
      settings: 'id',
      lockedContent: 'id, contentType, contentId',
    });
  }
}

// Database singleton instance
export const db = new MUWIDatabase();

// Helper to reset database (useful for testing)
export async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
}
