// Long Drafts Types

export interface Footnote {
  id: string;
  marker: number;
  content: string;
  position: number; // Character position in section
}

export interface Section {
  id: string;
  longDraftId: string;
  title: string;
  content: string; // Rich text content
  order: number;
  parentId: string | null; // For nested sections
  footnotes: Footnote[];
  status: string;
  notes: string; // Author's private notes
  wordCount: number;
  isLocked: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface DocumentMetadata {
  createdAt: Date;
  modifiedAt: Date;
  totalWordCount: number;
  lastEditedSection?: string;
}

export interface LongDraft {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  sectionIds: string[];
  settings: LongDraftsSettings;
  metadata: DocumentMetadata;
  createdAt: Date;
  modifiedAt: Date;
}

export interface LongDraftsSettings {
  fonts: string[];
  defaultFont: string;
  showTOC: boolean;
  showWordCount: boolean;
  focusModeEnabled: boolean;
  typewriterMode: boolean;
}

export const defaultLongDraftsSettings: LongDraftsSettings = {
  fonts: ['Crimson Pro', 'Inter', 'Georgia'],
  defaultFont: 'Crimson Pro',
  showTOC: true,
  showWordCount: true,
  focusModeEnabled: false,
  typewriterMode: false,
};
