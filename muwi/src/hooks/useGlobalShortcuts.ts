import { useKeyboardShortcuts, SHORTCUT_KEYS } from './useKeyboardShortcuts';
import { useAppStore } from '@/stores/appStore';
import { hasActiveModalDialog, isEditableTarget } from '@/utils/keyboard';

export function useGlobalShortcuts() {
  const openDiary = useAppStore((state) => state.openDiary);
  const closeDiary = useAppStore((state) => state.closeDiary);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const openCommandPalette = useAppStore((state) => state.openCommandPalette);
  const closeCommandPalette = useAppStore((state) => state.closeCommandPalette);
  const currentView = useAppStore((state) => state.currentView);
  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);
  const isCommandPaletteOpen = useAppStore((state) => state.isCommandPaletteOpen);

  const isBlockedByExternalModal = () =>
    !isSettingsOpen && !isCommandPaletteOpen && hasActiveModalDialog();

  useKeyboardShortcuts([
    // Go back to shelf
    {
      ...SHORTCUT_KEYS.HOME,
      action: () => {
        if (isBlockedByExternalModal()) {
          return;
        }
        if (currentView === 'diary') {
          closeDiary();
        }
      },
    },
    // Open settings
    {
      ...SHORTCUT_KEYS.SETTINGS,
      action: () => {
        if (isBlockedByExternalModal()) {
          return;
        }
        if (!isSettingsOpen) {
          openSettings();
        }
      },
    },
    // Open command palette
    {
      ...SHORTCUT_KEYS.COMMAND_PALETTE,
      action: () => {
        if (isBlockedByExternalModal()) {
          return;
        }
        if (!isCommandPaletteOpen) {
          openCommandPalette();
        }
      },
    },
    // Toggle sidebar in diary view when focus is outside editable surfaces.
    {
      ...SHORTCUT_KEYS.SIDEBAR,
      action: (event) => {
        if (isBlockedByExternalModal() || isSettingsOpen || isCommandPaletteOpen) {
          return;
        }

        if (currentView !== 'diary' || isEditableTarget(event.target)) {
          return;
        }

        toggleSidebar();
      },
    },
    // Switch diaries from any non-editable surface.
    {
      ...SHORTCUT_KEYS.DIARY_1,
      action: (event) => {
        if (isBlockedByExternalModal() || isSettingsOpen || isCommandPaletteOpen || isEditableTarget(event.target)) {
          return;
        }
        openDiary('scratchpad');
      },
    },
    {
      ...SHORTCUT_KEYS.DIARY_2,
      action: (event) => {
        if (isBlockedByExternalModal() || isSettingsOpen || isCommandPaletteOpen || isEditableTarget(event.target)) {
          return;
        }
        openDiary('blackboard');
      },
    },
    {
      ...SHORTCUT_KEYS.DIARY_3,
      action: (event) => {
        if (isBlockedByExternalModal() || isSettingsOpen || isCommandPaletteOpen || isEditableTarget(event.target)) {
          return;
        }
        openDiary('personal-diary');
      },
    },
    {
      ...SHORTCUT_KEYS.DIARY_4,
      action: (event) => {
        if (isBlockedByExternalModal() || isSettingsOpen || isCommandPaletteOpen || isEditableTarget(event.target)) {
          return;
        }
        openDiary('drafts');
      },
    },
    {
      ...SHORTCUT_KEYS.DIARY_5,
      action: (event) => {
        if (isBlockedByExternalModal() || isSettingsOpen || isCommandPaletteOpen || isEditableTarget(event.target)) {
          return;
        }
        openDiary('long-drafts');
      },
    },
    {
      ...SHORTCUT_KEYS.DIARY_6,
      action: (event) => {
        if (isBlockedByExternalModal() || isSettingsOpen || isCommandPaletteOpen || isEditableTarget(event.target)) {
          return;
        }
        openDiary('academic');
      },
    },
    // Close modals/go back with Escape
    {
      ...SHORTCUT_KEYS.ESCAPE,
      action: () => {
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else if (isSettingsOpen) {
          closeSettings();
        } else if (isBlockedByExternalModal()) {
          return;
        } else if (currentView === 'diary') {
          closeDiary();
        }
      },
      preventDefault: false,
    },
  ]);
}
