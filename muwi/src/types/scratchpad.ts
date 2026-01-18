// Scratchpad Types

export type CategoryName = 'ideas' | 'todos' | 'notes' | 'questions' | 'misc';

export interface TextBlock {
  id: string;
  pageId: string;
  content: string;
  position: { x: number; y: number };
  width: number | 'auto';
  fontSize: number;
  fontFamily: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface ScratchpadPage {
  id: string;
  pageNumber: number;
  categoryColor: string;
  categoryName: CategoryName;
  textBlockIds: string[];
  createdAt: Date;
  modifiedAt: Date;
  isLocked: boolean;
}

export interface ScratchpadSettings {
  pageSize: { width: number; height: number };
  orientation: 'portrait' | 'landscape';
  categories: Record<CategoryName, string>;
  defaultCategory: CategoryName;
}

export const defaultScratchpadSettings: ScratchpadSettings = {
  pageSize: { width: 400, height: 600 },
  orientation: 'portrait',
  categories: {
    ideas: '#FFF9C4',
    todos: '#C8E6C9',
    notes: '#BBDEFB',
    questions: '#E1BEE7',
    misc: '#F5F5F5',
  },
  defaultCategory: 'notes',
};
