export type DiaryType = 'scratchpad' | 'blackboard' | 'personal' | 'drafts' | 'long-drafts' | 'academic';

export interface Diary {
  id: string;
  type: DiaryType;
  name: string;
  color: string;
  description: string;
}

export const DIARIES: Diary[] = [
  { id: '0', type: 'scratchpad', name: 'Scratchpad', color: 'var(--color-diary-0)', description: 'Quick ideas, thoughts, to-dos' },
  { id: '1', type: 'blackboard', name: 'Blackboard', color: 'var(--color-diary-1)', description: 'Complex idea breakdowns' },
  { id: '2', type: 'personal', name: 'Personal Diary', color: 'var(--color-diary-2)', description: 'Journaling' },
  { id: '3', type: 'drafts', name: 'Drafts', color: 'var(--color-diary-3)', description: 'Drafting thoughtful pieces' },
  { id: '4', type: 'long-drafts', name: 'Long Drafts', color: 'var(--color-diary-4)', description: 'Longform pieces with structure' },
  { id: '5', type: 'academic', name: 'Academic Papers', color: 'var(--color-diary-5)', description: 'Academic writing' },
];
