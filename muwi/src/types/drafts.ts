// Drafts Types

export type DraftStatus = 'in-progress' | 'review' | 'complete';

export interface Draft {
  id: string;
  title: string;
  content: string; // Rich text content (TipTap JSON or HTML)
  status: DraftStatus;
  wordCount: number;
  tags: string[];
  isLocked: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface DraftsSettings {
  fonts: string[];
  defaultFont: string;
  showWordCount: boolean;
  autosaveInterval: number; // in milliseconds
}

export const defaultDraftsSettings: DraftsSettings = {
  fonts: ['Crimson Pro', 'Inter', 'Georgia'],
  defaultFont: 'Crimson Pro',
  showWordCount: true,
  autosaveInterval: 5000,
};
