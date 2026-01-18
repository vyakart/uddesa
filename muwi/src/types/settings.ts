// Settings Types

import type { ScratchpadSettings } from './scratchpad';
import type { BlackboardSettings } from './blackboard';
import type { PersonalDiarySettings } from './diary';
import type { DraftsSettings } from './drafts';
import type { LongDraftsSettings } from './longDrafts';
import type { AcademicSettings } from './academic';

import { defaultScratchpadSettings } from './scratchpad';
import { defaultBlackboardSettings } from './blackboard';
import { defaultPersonalDiarySettings } from './diary';
import { defaultDraftsSettings } from './drafts';
import { defaultLongDraftsSettings } from './longDrafts';
import { defaultAcademicSettings } from './academic';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ShelfLayout = 'grid' | 'list' | 'shelf';
export type BackupFrequency = 'hourly' | 'daily' | 'weekly';

export interface GlobalSettings {
  id: 'global';
  theme: ThemeMode;
  accentColor: string;
  shelfLayout: ShelfLayout;
  autoBackupEnabled: boolean;
  autoBackupFrequency: BackupFrequency;
  backupLocation: string;
  passkeyHash?: string;
  passkeySalt?: string;
  passkeyHint?: string;
  autoLockTimeout: number; // minutes, 0 = never
}

export interface DiarySettings {
  scratchpad: ScratchpadSettings;
  blackboard: BlackboardSettings;
  personalDiary: PersonalDiarySettings;
  drafts: DraftsSettings;
  longDrafts: LongDraftsSettings;
  academic: AcademicSettings;
}

export interface LockedContent {
  id: string;
  contentType: 'textBlock' | 'page' | 'entry' | 'element' | 'draft' | 'section';
  contentId: string;
  lockedAt: Date;
}

export const defaultGlobalSettings: GlobalSettings = {
  id: 'global',
  theme: 'system',
  accentColor: '#4A90A4',
  shelfLayout: 'grid',
  autoBackupEnabled: true,
  autoBackupFrequency: 'daily',
  backupLocation: '',
  autoLockTimeout: 0,
};

// Re-export diary settings defaults
export {
  defaultScratchpadSettings,
  defaultBlackboardSettings,
  defaultPersonalDiarySettings,
  defaultDraftsSettings,
  defaultLongDraftsSettings,
  defaultAcademicSettings,
};
