import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  GlobalSettings,
  ThemeMode,
  ShelfLayout,
  BackupFrequency,
  ScratchpadSettings,
  BlackboardSettings,
  PersonalDiarySettings,
  DraftsSettings,
  LongDraftsSettings,
  AcademicSettings,
} from '@/types';
import {
  defaultGlobalSettings,
  defaultScratchpadSettings,
  defaultBlackboardSettings,
  defaultPersonalDiarySettings,
  defaultDraftsSettings,
  defaultLongDraftsSettings,
  defaultAcademicSettings,
} from '@/types';
import * as settingsQueries from '@/db/queries/settings';

export interface SettingsState {
  // Global settings
  global: GlobalSettings;

  // Per-diary settings
  scratchpad: ScratchpadSettings;
  blackboard: BlackboardSettings;
  personalDiary: PersonalDiarySettings;
  drafts: DraftsSettings;
  longDrafts: LongDraftsSettings;
  academic: AcademicSettings;

  // Loading state
  isLoaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateAccentColor: (color: string) => Promise<void>;
  updateShelfLayout: (layout: ShelfLayout) => Promise<void>;
  updateBackupSettings: (enabled: boolean, frequency: BackupFrequency, location: string) => Promise<void>;
  updateAutoLockTimeout: (minutes: number) => Promise<void>;

  // Per-diary settings actions
  updateScratchpadSettings: (updates: Partial<ScratchpadSettings>) => void;
  updateBlackboardSettings: (updates: Partial<BlackboardSettings>) => void;
  updatePersonalDiarySettings: (updates: Partial<PersonalDiarySettings>) => void;
  updateDraftsSettings: (updates: Partial<DraftsSettings>) => void;
  updateLongDraftsSettings: (updates: Partial<LongDraftsSettings>) => void;
  updateAcademicSettings: (updates: Partial<AcademicSettings>) => void;

  // Passkey
  hasPasskey: () => Promise<boolean>;
  setPasskey: (hash: string, salt: string, hint?: string) => Promise<void>;
  clearPasskey: () => Promise<void>;

  reset: () => void;
}

const initialState = {
  global: defaultGlobalSettings,
  scratchpad: defaultScratchpadSettings,
  blackboard: defaultBlackboardSettings,
  personalDiary: defaultPersonalDiarySettings,
  drafts: defaultDraftsSettings,
  longDrafts: defaultLongDraftsSettings,
  academic: defaultAcademicSettings,
  isLoaded: false,
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadSettings: async () => {
        const global = await settingsQueries.getGlobalSettings();
        set({ global, isLoaded: true }, false, 'loadSettings');
      },

      updateTheme: async (theme) => {
        await settingsQueries.updateGlobalSettings({ theme });
        set(
          (state) => ({ global: { ...state.global, theme } }),
          false,
          'updateTheme'
        );
      },

      updateAccentColor: async (accentColor) => {
        await settingsQueries.updateGlobalSettings({ accentColor });
        set(
          (state) => ({ global: { ...state.global, accentColor } }),
          false,
          'updateAccentColor'
        );
      },

      updateShelfLayout: async (shelfLayout) => {
        await settingsQueries.updateGlobalSettings({ shelfLayout });
        set(
          (state) => ({ global: { ...state.global, shelfLayout } }),
          false,
          'updateShelfLayout'
        );
      },

      updateBackupSettings: async (autoBackupEnabled, autoBackupFrequency, backupLocation) => {
        await settingsQueries.updateGlobalSettings({
          autoBackupEnabled,
          autoBackupFrequency,
          backupLocation,
        });
        set(
          (state) => ({
            global: {
              ...state.global,
              autoBackupEnabled,
              autoBackupFrequency,
              backupLocation,
            },
          }),
          false,
          'updateBackupSettings'
        );
      },

      updateAutoLockTimeout: async (autoLockTimeout) => {
        await settingsQueries.updateGlobalSettings({ autoLockTimeout });
        set(
          (state) => ({ global: { ...state.global, autoLockTimeout } }),
          false,
          'updateAutoLockTimeout'
        );
      },

      updateScratchpadSettings: (updates) =>
        set(
          (state) => ({ scratchpad: { ...state.scratchpad, ...updates } }),
          false,
          'updateScratchpadSettings'
        ),

      updateBlackboardSettings: (updates) =>
        set(
          (state) => ({ blackboard: { ...state.blackboard, ...updates } }),
          false,
          'updateBlackboardSettings'
        ),

      updatePersonalDiarySettings: (updates) =>
        set(
          (state) => ({ personalDiary: { ...state.personalDiary, ...updates } }),
          false,
          'updatePersonalDiarySettings'
        ),

      updateDraftsSettings: (updates) =>
        set(
          (state) => ({ drafts: { ...state.drafts, ...updates } }),
          false,
          'updateDraftsSettings'
        ),

      updateLongDraftsSettings: (updates) =>
        set(
          (state) => ({ longDrafts: { ...state.longDrafts, ...updates } }),
          false,
          'updateLongDraftsSettings'
        ),

      updateAcademicSettings: (updates) =>
        set(
          (state) => ({ academic: { ...state.academic, ...updates } }),
          false,
          'updateAcademicSettings'
        ),

      hasPasskey: async () => {
        return settingsQueries.hasPasskey();
      },

      setPasskey: async (hash, salt, hint) => {
        await settingsQueries.setPasskey(hash, salt, hint);
        const settings = get().global;
        set(
          {
            global: {
              ...settings,
              passkeyHash: hash,
              passkeySalt: salt,
              passkeyHint: hint,
            },
          },
          false,
          'setPasskey'
        );
      },

      clearPasskey: async () => {
        await settingsQueries.clearPasskey();
        const settings = get().global;
        set(
          {
            global: {
              ...settings,
              passkeyHash: undefined,
              passkeySalt: undefined,
              passkeyHint: undefined,
            },
          },
          false,
          'clearPasskey'
        );
      },

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'settings-store' }
  )
);

// Selectors
export const selectTheme = (state: SettingsState) => state.global.theme;
export const selectAccentColor = (state: SettingsState) => state.global.accentColor;
export const selectShelfLayout = (state: SettingsState) => state.global.shelfLayout;
export const selectIsSettingsLoaded = (state: SettingsState) => state.isLoaded;
