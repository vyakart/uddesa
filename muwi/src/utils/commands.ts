import type { DiaryType, View } from '@/stores/appStore';
import type { ThemeMode } from '@/types';

export type CommandGroup = 'Navigation' | 'Actions' | 'Settings';
export type CommandScope = 'global' | 'diary' | DiaryType;

export interface CommandContext {
  currentView: View;
  activeDiary: DiaryType | null;
  isSidebarOpen: boolean;
  themeMode: ThemeMode;
  openDiary: (type: DiaryType) => void;
  goToShelf: () => void;
  openSettings: () => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  openExportPanel: () => void;
  createNewScratchpadPage: () => Promise<void>;
  createNewDiaryEntry: () => Promise<void>;
  createNewDraft: () => Promise<void>;
  createNewLongDraft: () => Promise<void>;
  createNewAcademicPaper: () => Promise<void>;
  createNewBlackboardCanvas: () => Promise<void>;
}

export interface CommandDefinition {
  id: string;
  label: string;
  group: CommandGroup;
  shortcut?: string;
  aliases?: string[];
  scopes: CommandScope[];
  execute: (context: CommandContext) => void | Promise<void>;
}

export function createCommandRegistry(): CommandDefinition[] {
  return [
    {
      id: 'nav:scratchpad',
      label: 'Switch to Scratchpad',
      group: 'Navigation',
      shortcut: '⌘1',
      aliases: ['scratchpad', 'home scratchpad'],
      scopes: ['global'],
      execute: (context) => context.openDiary('scratchpad'),
    },
    {
      id: 'nav:blackboard',
      label: 'Switch to Blackboard',
      group: 'Navigation',
      shortcut: '⌘2',
      aliases: ['blackboard', 'canvas'],
      scopes: ['global'],
      execute: (context) => context.openDiary('blackboard'),
    },
    {
      id: 'nav:personal-diary',
      label: 'Switch to Personal Diary',
      group: 'Navigation',
      shortcut: '⌘3',
      aliases: ['journal', 'personal diary'],
      scopes: ['global'],
      execute: (context) => context.openDiary('personal-diary'),
    },
    {
      id: 'nav:drafts',
      label: 'Switch to Drafts',
      group: 'Navigation',
      shortcut: '⌘4',
      aliases: ['drafts', 'writing drafts'],
      scopes: ['global'],
      execute: (context) => context.openDiary('drafts'),
    },
    {
      id: 'nav:long-drafts',
      label: 'Switch to Long Drafts',
      group: 'Navigation',
      shortcut: '⌘5',
      aliases: ['long drafts', 'manuscript'],
      scopes: ['global'],
      execute: (context) => context.openDiary('long-drafts'),
    },
    {
      id: 'nav:academic',
      label: 'Switch to Academic Papers',
      group: 'Navigation',
      shortcut: '⌘6',
      aliases: ['academic', 'papers'],
      scopes: ['global'],
      execute: (context) => context.openDiary('academic'),
    },
    {
      id: 'nav:shelf',
      label: 'Go to Shelf',
      group: 'Navigation',
      shortcut: '⌘H',
      aliases: ['home', 'shelf'],
      scopes: ['global'],
      execute: (context) => context.goToShelf(),
    },
    {
      id: 'action:new-scratchpad-page',
      label: 'New Scratchpad Page',
      group: 'Actions',
      shortcut: '⌘N',
      aliases: ['new page', 'scratchpad'],
      scopes: ['scratchpad'],
      execute: (context) => context.createNewScratchpadPage(),
    },
    {
      id: 'action:new-diary-entry',
      label: 'New Diary Entry',
      group: 'Actions',
      shortcut: '⌘N',
      aliases: ['new entry', 'journal'],
      scopes: ['personal-diary'],
      execute: (context) => context.createNewDiaryEntry(),
    },
    {
      id: 'action:new-draft',
      label: 'New Draft',
      group: 'Actions',
      shortcut: '⌘N',
      aliases: ['new draft'],
      scopes: ['drafts'],
      execute: (context) => context.createNewDraft(),
    },
    {
      id: 'action:new-long-draft',
      label: 'New Long Draft',
      group: 'Actions',
      shortcut: '⌘N',
      aliases: ['new long draft', 'new document'],
      scopes: ['long-drafts'],
      execute: (context) => context.createNewLongDraft(),
    },
    {
      id: 'action:new-academic-paper',
      label: 'New Academic Paper',
      group: 'Actions',
      shortcut: '⌘N',
      aliases: ['new paper'],
      scopes: ['academic'],
      execute: (context) => context.createNewAcademicPaper(),
    },
    {
      id: 'action:new-blackboard-canvas',
      label: 'New Blackboard Canvas',
      group: 'Actions',
      shortcut: '⌘N',
      aliases: ['new canvas'],
      scopes: ['blackboard'],
      execute: (context) => context.createNewBlackboardCanvas(),
    },
    {
      id: 'action:toggle-sidebar',
      label: 'Toggle Sidebar',
      group: 'Actions',
      shortcut: '⌘B',
      aliases: ['sidebar'],
      scopes: ['diary'],
      execute: (context) => context.toggleSidebar(),
    },
    {
      id: 'action:export-current',
      label: 'Export Current...',
      group: 'Actions',
      shortcut: '⌘⇧E',
      aliases: ['export'],
      scopes: ['diary'],
      execute: (context) => context.openExportPanel(),
    },
    {
      id: 'settings:open',
      label: 'Open Settings',
      group: 'Settings',
      shortcut: '⌘,',
      aliases: ['settings', 'preferences'],
      scopes: ['global'],
      execute: (context) => context.openSettings(),
    },
    {
      id: 'settings:toggle-theme',
      label: 'Toggle Dark Mode',
      group: 'Settings',
      shortcut: '⌘⇧D',
      aliases: ['theme', 'dark mode', 'light mode'],
      scopes: ['global'],
      execute: (context) => context.toggleTheme(),
    },
  ];
}

export function isCommandInScope(command: CommandDefinition, currentView: View, activeDiary: DiaryType | null): boolean {
  if (command.scopes.includes('global')) {
    return true;
  }

  if (command.scopes.includes('diary')) {
    return currentView === 'diary' && activeDiary !== null;
  }

  if (!activeDiary || currentView !== 'diary') {
    return false;
  }

  return command.scopes.includes(activeDiary);
}

export function getCommandContextPriority(
  command: CommandDefinition,
  currentView: View,
  activeDiary: DiaryType | null
): number {
  if (currentView !== 'diary' || !activeDiary) {
    return 0;
  }

  if (command.scopes.includes(activeDiary)) {
    return 2;
  }

  if (command.scopes.includes('diary')) {
    return 1;
  }

  return 0;
}

export function getCommandSearchText(command: CommandDefinition): string {
  return [command.label, ...(command.aliases ?? []), command.shortcut ?? ''].join(' ').toLowerCase();
}

function sequentialScore(query: string, target: string): number {
  let score = 0;
  let targetIndex = 0;

  for (let i = 0; i < query.length; i += 1) {
    const char = query[i];
    const foundIndex = target.indexOf(char, targetIndex);

    if (foundIndex < 0) {
      return -1;
    }

    score += foundIndex === targetIndex ? 3 : 1;
    targetIndex = foundIndex + 1;
  }

  return score;
}

export function getFuzzyScore(query: string, command: CommandDefinition): number {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 1;
  }

  const haystack = getCommandSearchText(command);
  if (haystack.startsWith(normalizedQuery)) {
    return 400 - normalizedQuery.length;
  }

  const includesIndex = haystack.indexOf(normalizedQuery);
  if (includesIndex >= 0) {
    return 300 - includesIndex;
  }

  return sequentialScore(normalizedQuery, haystack);
}
