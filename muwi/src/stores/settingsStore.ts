import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
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
import { generateSalt, hashPasskey } from '@/utils/crypto';

type DiarySettingsKey =
  | 'scratchpad'
  | 'blackboard'
  | 'personalDiary'
  | 'drafts'
  | 'longDrafts'
  | 'academic';

type DiarySettingsUpdate =
  | Partial<ScratchpadSettings>
  | Partial<BlackboardSettings>
  | Partial<PersonalDiarySettings>
  | Partial<DraftsSettings>
  | Partial<LongDraftsSettings>
  | Partial<AcademicSettings>;

interface DiarySettingsState {
  scratchpad: ScratchpadSettings;
  blackboard: BlackboardSettings;
  personalDiary: PersonalDiarySettings;
  drafts: DraftsSettings;
  longDrafts: LongDraftsSettings;
  academic: AcademicSettings;
}

interface SettingsDataState extends DiarySettingsState {
  // Global settings
  global: GlobalSettings;
  // Loading state
  isLoaded: boolean;
}

export interface SettingsState extends SettingsDataState {
  // Actions
  loadSettings: () => Promise<void>;
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => Promise<void>;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateAccentColor: (color: string) => Promise<void>;
  updateShelfLayout: (layout: ShelfLayout) => Promise<void>;
  updateBackupSettings: (enabled: boolean, frequency: BackupFrequency, location: string) => Promise<void>;
  updateAutoLockTimeout: (minutes: number) => Promise<void>;

  // Per-diary settings actions
  updateDiarySettings: (diary: DiarySettingsKey, updates: DiarySettingsUpdate) => void;
  updateScratchpadSettings: (updates: Partial<ScratchpadSettings>) => void;
  updateBlackboardSettings: (updates: Partial<BlackboardSettings>) => void;
  updatePersonalDiarySettings: (updates: Partial<PersonalDiarySettings>) => void;
  updateDraftsSettings: (updates: Partial<DraftsSettings>) => void;
  updateLongDraftsSettings: (updates: Partial<LongDraftsSettings>) => void;
  updateAcademicSettings: (updates: Partial<AcademicSettings>) => void;

  // Passkey
  hasPasskey: () => Promise<boolean>;
  setPasskey: (passkey: string, hint?: string) => Promise<void>;
  verifyPasskey: (passkey: string) => Promise<boolean>;
  clearPasskey: () => Promise<void>;

  reset: () => void;
}

type PersistedSettingsState = Pick<
  SettingsState,
  'global' | 'scratchpad' | 'blackboard' | 'personalDiary' | 'drafts' | 'longDrafts' | 'academic'
>;

const SETTINGS_STORE_PERSIST_VERSION = 1;

function sanitizePersistedGlobal(global: GlobalSettings): GlobalSettings {
  const sanitizedGlobal = { ...global };
  delete sanitizedGlobal.passkeyHash;
  delete sanitizedGlobal.passkeySalt;
  return sanitizedGlobal;
}

function sanitizePersistedState(
  persistedState: Partial<PersistedSettingsState>
): Partial<PersistedSettingsState> {
  const nextState = { ...persistedState };
  if (nextState.global) {
    nextState.global = sanitizePersistedGlobal(nextState.global);
  }
  return nextState;
}

const initialState: SettingsDataState = {
  global: { ...defaultGlobalSettings },
  scratchpad: { ...defaultScratchpadSettings },
  blackboard: { ...defaultBlackboardSettings },
  personalDiary: { ...defaultPersonalDiarySettings },
  drafts: { ...defaultDraftsSettings },
  longDrafts: { ...defaultLongDraftsSettings },
  academic: { ...defaultAcademicSettings },
  isLoaded: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        loadSettings: async () => {
          const global = await settingsQueries.getGlobalSettings();
          set({ global, isLoaded: true }, false, 'loadSettings');
        },

        updateGlobalSettings: async (updates) => {
          await settingsQueries.updateGlobalSettings(updates);
          set(
            (state) => ({ global: { ...state.global, ...updates } }),
            false,
            'updateGlobalSettings'
          );
        },

        updateTheme: async (theme) => {
          await get().updateGlobalSettings({ theme });
        },

        updateAccentColor: async (accentColor) => {
          await get().updateGlobalSettings({ accentColor });
        },

        updateShelfLayout: async (shelfLayout) => {
          await get().updateGlobalSettings({ shelfLayout });
        },

        updateBackupSettings: async (autoBackupEnabled, autoBackupFrequency, backupLocation) => {
          await get().updateGlobalSettings({
            autoBackupEnabled,
            autoBackupFrequency,
            backupLocation,
          });
        },

        updateAutoLockTimeout: async (autoLockTimeout) => {
          await get().updateGlobalSettings({ autoLockTimeout });
        },

        updateDiarySettings: (diary, updates) => {
          switch (diary) {
            case 'scratchpad':
              set(
                (state) => ({
                  scratchpad: { ...state.scratchpad, ...(updates as Partial<ScratchpadSettings>) },
                }),
                false,
                'updateDiarySettings:scratchpad'
              );
              break;
            case 'blackboard':
              set(
                (state) => ({
                  blackboard: { ...state.blackboard, ...(updates as Partial<BlackboardSettings>) },
                }),
                false,
                'updateDiarySettings:blackboard'
              );
              break;
            case 'personalDiary':
              set(
                (state) => ({
                  personalDiary: { ...state.personalDiary, ...(updates as Partial<PersonalDiarySettings>) },
                }),
                false,
                'updateDiarySettings:personalDiary'
              );
              break;
            case 'drafts':
              set(
                (state) => ({ drafts: { ...state.drafts, ...(updates as Partial<DraftsSettings>) } }),
                false,
                'updateDiarySettings:drafts'
              );
              break;
            case 'longDrafts':
              set(
                (state) => ({
                  longDrafts: { ...state.longDrafts, ...(updates as Partial<LongDraftsSettings>) },
                }),
                false,
                'updateDiarySettings:longDrafts'
              );
              break;
            case 'academic':
              set(
                (state) => ({ academic: { ...state.academic, ...(updates as Partial<AcademicSettings>) } }),
                false,
                'updateDiarySettings:academic'
              );
              break;
            default:
              break;
          }
        },

        updateScratchpadSettings: (updates) => get().updateDiarySettings('scratchpad', updates),
        updateBlackboardSettings: (updates) => get().updateDiarySettings('blackboard', updates),
        updatePersonalDiarySettings: (updates) => get().updateDiarySettings('personalDiary', updates),
        updateDraftsSettings: (updates) => get().updateDiarySettings('drafts', updates),
        updateLongDraftsSettings: (updates) => get().updateDiarySettings('longDrafts', updates),
        updateAcademicSettings: (updates) => get().updateDiarySettings('academic', updates),

        hasPasskey: async () => {
          return settingsQueries.hasPasskey();
        },

        setPasskey: async (passkey, hint) => {
          const salt = generateSalt();
          const hash = await hashPasskey(passkey, salt);
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

        verifyPasskey: async (passkey) => {
          const settings = get().global;
          let storedSalt = settings.passkeySalt;

          if (!storedSalt) {
            const persisted = await settingsQueries.getGlobalSettings();
            storedSalt = persisted.passkeySalt;
          }

          if (!storedSalt) {
            return false;
          }

          const hash = await hashPasskey(passkey, storedSalt);
          return settingsQueries.verifyPasskey(hash);
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
    ),
    {
      name: 'settings-store-persist',
      version: SETTINGS_STORE_PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as PersistedSettingsState;
        }

        return sanitizePersistedState(persistedState as PersistedSettingsState) as PersistedSettingsState;
      },
      partialize: (state) => ({
        global: sanitizePersistedGlobal(state.global),
        scratchpad: state.scratchpad,
        blackboard: state.blackboard,
        personalDiary: state.personalDiary,
        drafts: state.drafts,
        longDrafts: state.longDrafts,
        academic: state.academic,
      }),
    }
  )
);

// Selectors
export const selectTheme = (state: SettingsState) => state.global.theme;
export const selectAccentColor = (state: SettingsState) => state.global.accentColor;
export const selectShelfLayout = (state: SettingsState) => state.global.shelfLayout;
export const selectIsSettingsLoaded = (state: SettingsState) => state.isLoaded;
