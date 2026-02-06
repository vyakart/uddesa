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
  isSidebarOpen: boolean;
  contextMenu: {
    isOpen: boolean;
    x: number;
    y: number;
    targetId?: string;
    targetType?: string;
  } | null;

  // Modal state
  isSettingsOpen: boolean;

  // Lock state
  isAppLocked: boolean;
  lastActivity: number;

  // Actions
  setCurrentView: (view: View) => void;
  openDiary: (type: DiaryType, itemId?: string) => void;
  closeDiary: () => void;
  setActiveItem: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openContextMenu: (x: number, y: number, targetId?: string, targetType?: string) => void;
  closeContextMenu: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  lockApp: () => void;
  unlockApp: () => void;
  updateLastActivity: () => void;
  reset: () => void;
}

const initialState = {
  currentView: 'shelf' as View,
  activeDiary: null,
  activeItemId: null,
  isLoading: false,
  error: null,
  isSidebarOpen: false,
  contextMenu: null,
  isSettingsOpen: false,
  isAppLocked: false,
  lastActivity: Date.now(),
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

      openSidebar: () => set({ isSidebarOpen: true }, false, 'openSidebar'),

      closeSidebar: () => set({ isSidebarOpen: false }, false, 'closeSidebar'),

      toggleSidebar: () =>
        set(
          (state) => ({ isSidebarOpen: !state.isSidebarOpen }),
          false,
          'toggleSidebar'
        ),

      openContextMenu: (x, y, targetId, targetType) =>
        set(
          {
            contextMenu: {
              isOpen: true,
              x,
              y,
              ...(targetId ? { targetId } : {}),
              ...(targetType ? { targetType } : {}),
            },
          },
          false,
          'openContextMenu'
        ),

      closeContextMenu: () => set({ contextMenu: null }, false, 'closeContextMenu'),

      openSettings: () => set({ isSettingsOpen: true }, false, 'openSettings'),

      closeSettings: () => set({ isSettingsOpen: false }, false, 'closeSettings'),

      lockApp: () => set({ isAppLocked: true }, false, 'lockApp'),

      unlockApp: () => set({ isAppLocked: false }, false, 'unlockApp'),

      updateLastActivity: () => set({ lastActivity: Date.now() }, false, 'updateLastActivity'),

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
export const selectIsSidebarOpen = (state: AppState) => state.isSidebarOpen;
export const selectContextMenu = (state: AppState) => state.contextMenu;
export const selectIsAppLocked = (state: AppState) => state.isAppLocked;
