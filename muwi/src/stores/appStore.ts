import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type DiaryType =
  | 'scratchpad'
  | 'blackboard'
  | 'personal-diary'
  | 'drafts'
  | 'long-drafts'
  | 'academic';

export type View = 'shelf' | 'diary' | 'settings';

export interface AppState {
  // Navigation
  currentView: View;
  activeDiary: DiaryType | null;
  activeItemId: string | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Modal state
  isSettingsOpen: boolean;

  // Actions
  setCurrentView: (view: View) => void;
  openDiary: (type: DiaryType, itemId?: string) => void;
  closeDiary: () => void;
  setActiveItem: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openSettings: () => void;
  closeSettings: () => void;
  reset: () => void;
}

const initialState = {
  currentView: 'shelf' as View,
  activeDiary: null,
  activeItemId: null,
  isLoading: false,
  error: null,
  isSettingsOpen: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCurrentView: (view) => set({ currentView: view }, false, 'setCurrentView'),

      openDiary: (type, itemId) =>
        set(
          {
            currentView: 'diary',
            activeDiary: type,
            activeItemId: itemId || null,
          },
          false,
          'openDiary'
        ),

      closeDiary: () =>
        set(
          {
            currentView: 'shelf',
            activeDiary: null,
            activeItemId: null,
          },
          false,
          'closeDiary'
        ),

      setActiveItem: (id) => set({ activeItemId: id }, false, 'setActiveItem'),

      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      openSettings: () => set({ isSettingsOpen: true }, false, 'openSettings'),

      closeSettings: () => set({ isSettingsOpen: false }, false, 'closeSettings'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'app-store' }
  )
);

// Selectors for common patterns
export const selectCurrentView = (state: AppState) => state.currentView;
export const selectActiveDiary = (state: AppState) => state.activeDiary;
export const selectActiveItemId = (state: AppState) => state.activeItemId;
export const selectAppIsLoading = (state: AppState) => state.isLoading;
export const selectAppError = (state: AppState) => state.error;
