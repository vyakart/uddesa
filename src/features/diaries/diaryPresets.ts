import type { DiaryKind, DiarySettings } from '../../services/db';

export interface DiaryPreset {
  kind: DiaryKind;
  title: string;
  description: string;
  defaults: DiarySettings;
}

export const DIARY_PRESETS: DiaryPreset[] = [
  {
    kind: 'scratchpad',
    title: 'Scratchpad',
    description: 'Colorful cards for quick sketches and thoughts.',
    defaults: {
      background: '#f6f2db',
      pageSize: 'a5',
    },
  },
  {
    kind: 'blackboard',
    title: 'Blackboard',
    description: 'Infinite hand-drawn canvas for spatial planning.',
    defaults: {
      background: '#111111',
      pageSize: 'infinite',
    },
  },
  {
    kind: 'journal',
    title: 'Personal Diary',
    description: 'Daily entries with date headers and calm typography.',
    defaults: {
      fontFamily: 'Georgia, serif',
      pageSize: 'a4',
    },
  },
  {
    kind: 'drafts',
    title: 'Drafts',
    description: 'Compact drafting space with title and body.',
    defaults: {
      fontFamily: 'Inter, sans-serif',
      pageSize: 'letter',
    },
  },
  {
    kind: 'longform',
    title: 'Long Drafts',
    description: 'Structured writing with outlines and footnotes.',
    defaults: {
      fontFamily: 'Iowan Old Style, serif',
      pageSize: 'a4',
    },
  },
  {
    kind: 'academic',
    title: 'Academic Papers',
    description: 'Citations, math, and export-ready formatting.',
    defaults: {
      fontFamily: 'Charter, serif',
      pageSize: 'letter',
    },
  },
];
