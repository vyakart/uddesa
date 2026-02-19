import { useKeyboardShortcuts, SHORTCUT_KEYS } from './useKeyboardShortcuts';
import { useAppStore } from '@/stores/appStore';

export function useGlobalShortcuts() {
  const closeDiary = useAppStore((state) => state.closeDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const openCommandPalette = useAppStore((state) => state.openCommandPalette);
  const closeCommandPalette = useAppStore((state) => state.closeCommandPalette);
  const currentView = useAppStore((state) => state.currentView);
  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);
  const isCommandPaletteOpen = useAppStore((state) => state.isCommandPaletteOpen);

  useKeyboardShortcuts([
    // Go back to shelf
    {
      ...SHORTCUT_KEYS.HOME,
      action: () => {
        if (currentView === 'diary') {
          closeDiary();
        }
      },
    },
    // Open settings
    {
      ...SHORTCUT_KEYS.SETTINGS,
      action: () => {
        if (!isSettingsOpen) {
          openSettings();
        }
      },
    },
    // Open command palette
    {
      ...SHORTCUT_KEYS.COMMAND_PALETTE,
      action: () => {
        if (!isCommandPaletteOpen) {
          openCommandPalette();
        }
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
        } else if (currentView === 'diary') {
          closeDiary();
        }
      },
      preventDefault: false,
    },
  ]);
}
