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

export type RightPanelType =
  | 'index'
  | 'outline'
  | 'bibliography'
  | 'reference-library'
  | 'export'
  | 'backup'
  | 'document-settings'
  | 'custom';

export interface RightPanelState {
  isOpen: boolean;
  panelType: RightPanelType | null;
  context: Record<string, unknown> | null;
}

export interface AppState {
  // Navigation
  currentView: View;
  activeDiary: DiaryType | null;
  activeItemId: string | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  isSidebarOpen: boolean;
  rightPanel: RightPanelState;
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
  openRightPanel: (panelType: RightPanelType, context?: Record<string, unknown> | null) => void;
  closeRightPanel: () => void;
  toggleRightPanel: (panelType: RightPanelType, context?: Record<string, unknown> | null) => void;
  setRightPanelContext: (context: Record<string, unknown> | null) => void;
  openContextMenu: (x: number, y: number, targetId?: string, targetType?: string) => void;
  closeContextMenu: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  lockApp: () => void;
  unlockApp: () => void;
  updateLastActivity: () => void;
  reset: () => void;
}

const initialRightPanelState: RightPanelState = {
  isOpen: false,
  panelType: null,
  context: null,
};

const initialState = {
  currentView: 'shelf' as View,
  activeDiary: null,
  activeItemId: null,
  isLoading: false,
  error: null,
  isSidebarOpen: false,
  rightPanel: initialRightPanelState,
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
            isSidebarOpen: true,
            rightPanel: initialRightPanelState,
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
            isSidebarOpen: false,
            rightPanel: initialRightPanelState,
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

      openRightPanel: (panelType, context = null) =>
        set(
          {
            rightPanel: {
              isOpen: true,
              panelType,
              context,
            },
          },
          false,
          'openRightPanel'
        ),

      closeRightPanel: () =>
        set(
          {
            rightPanel: {
              isOpen: false,
              panelType: null,
              context: null,
            },
          },
          false,
          'closeRightPanel'
        ),

      toggleRightPanel: (panelType, context = null) =>
        set(
          (state) => ({
            rightPanel: state.rightPanel.isOpen
              ? {
                  isOpen: false,
                  panelType: null,
                  context: null,
                }
              : {
                  isOpen: true,
                  panelType,
                  context,
                },
          }),
          false,
          'toggleRightPanel'
        ),

      setRightPanelContext: (context) =>
        set(
          (state) => ({
            rightPanel: {
              ...state.rightPanel,
              context,
            },
          }),
          false,
          'setRightPanelContext'
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
export const selectRightPanel = (state: AppState) => state.rightPanel;
export const selectContextMenu = (state: AppState) => state.contextMenu;
export const selectIsAppLocked = (state: AppState) => state.isAppLocked;
