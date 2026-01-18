// Personal Diary Types

export interface DiaryEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  content: string; // Rich text content (TipTap JSON or HTML)
  wordCount: number;
  mood?: string;
  isLocked: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface PersonalDiarySettings {
  font: string;
  dateFormat: string;
  showLines: boolean;
  paperTexture: string;
  paperColor: string;
}

export const defaultPersonalDiarySettings: PersonalDiarySettings = {
  font: 'Crimson Pro',
  dateFormat: 'MMMM d, yyyy',
  showLines: true,
  paperTexture: 'paper-cream',
  paperColor: '#FFFEF9',
};
