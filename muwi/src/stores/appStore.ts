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
  lastOpenedDiary: DiaryType | null;

  // Command palette state
  isCommandPaletteOpen: boolean;
  commandPaletteQuery: string;
  commandPaletteHighlightedIndex: number;
  recentCommands: string[];

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
  clearLastOpenedDiary: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  updateCommandPaletteQuery: (query: string) => void;
  setCommandPaletteHighlightedIndex: (index: number) => void;
  executeCommand: (commandId: string) => void;
  lockApp: () => void;
  unlockApp: () => void;
  updateLastActivity: () => void;
  reset: () => void;
}

let returnHighlightTimeout: ReturnType<typeof setTimeout> | null = null;

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
  lastOpenedDiary: null,
  isCommandPaletteOpen: false,
  commandPaletteQuery: '',
  commandPaletteHighlightedIndex: 0,
  recentCommands: [],
  isAppLocked: false,
  lastActivity: Date.now(),
};

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
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
            lastOpenedDiary: null,
            isCommandPaletteOpen: false,
            commandPaletteQuery: '',
            commandPaletteHighlightedIndex: 0,
          },
          false,
          'openDiary'
        ),

      closeDiary: () => {
        const diaryToHighlight = get().activeDiary;

        if (returnHighlightTimeout) {
          clearTimeout(returnHighlightTimeout);
          returnHighlightTimeout = null;
        }

        set(
          {
            currentView: 'shelf',
            activeDiary: null,
            activeItemId: null,
            isSidebarOpen: false,
            rightPanel: initialRightPanelState,
            lastOpenedDiary: diaryToHighlight,
            isCommandPaletteOpen: false,
            commandPaletteQuery: '',
            commandPaletteHighlightedIndex: 0,
          },
          false,
          'closeDiary'
        );

        if (diaryToHighlight) {
          returnHighlightTimeout = setTimeout(() => {
            set({ lastOpenedDiary: null }, false, 'clearLastOpenedDiary:auto');
            returnHighlightTimeout = null;
          }, 2000);
        }
      },

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

      clearLastOpenedDiary: () => {
        if (returnHighlightTimeout) {
          clearTimeout(returnHighlightTimeout);
          returnHighlightTimeout = null;
        }
        set({ lastOpenedDiary: null }, false, 'clearLastOpenedDiary');
      },

      openCommandPalette: () =>
        set(
          {
            isCommandPaletteOpen: true,
            commandPaletteQuery: '',
            commandPaletteHighlightedIndex: 0,
          },
          false,
          'openCommandPalette'
        ),

      closeCommandPalette: () =>
        set(
          {
            isCommandPaletteOpen: false,
            commandPaletteQuery: '',
            commandPaletteHighlightedIndex: 0,
          },
          false,
          'closeCommandPalette'
        ),

      updateCommandPaletteQuery: (query) =>
        set(
          {
            commandPaletteQuery: query,
            commandPaletteHighlightedIndex: 0,
          },
          false,
          'updateCommandPaletteQuery'
        ),

      setCommandPaletteHighlightedIndex: (index) =>
        set({ commandPaletteHighlightedIndex: index }, false, 'setCommandPaletteHighlightedIndex'),

      executeCommand: (commandId) =>
        set(
          (state) => {
            const withoutCommand = state.recentCommands.filter((id) => id !== commandId);
            return {
              recentCommands: [commandId, ...withoutCommand].slice(0, 10),
              isCommandPaletteOpen: false,
              commandPaletteQuery: '',
              commandPaletteHighlightedIndex: 0,
            };
          },
          false,
          'executeCommand'
        ),

      lockApp: () => set({ isAppLocked: true }, false, 'lockApp'),

      unlockApp: () => set({ isAppLocked: false }, false, 'unlockApp'),

      updateLastActivity: () => set({ lastActivity: Date.now() }, false, 'updateLastActivity'),

      reset: () => {
        if (returnHighlightTimeout) {
          clearTimeout(returnHighlightTimeout);
          returnHighlightTimeout = null;
        }
        set(initialState, false, 'reset');
      },
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
export const selectLastOpenedDiary = (state: AppState) => state.lastOpenedDiary;
export const selectIsCommandPaletteOpen = (state: AppState) => state.isCommandPaletteOpen;
