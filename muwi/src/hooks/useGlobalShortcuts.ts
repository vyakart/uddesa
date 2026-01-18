import { useKeyboardShortcuts, SHORTCUT_KEYS } from './useKeyboardShortcuts';
import { useAppStore } from '@/stores/appStore';

export function useGlobalShortcuts() {
  const closeDiary = useAppStore((state) => state.closeDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const currentView = useAppStore((state) => state.currentView);
  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);

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
    // Close modals/go back with Escape
    {
      ...SHORTCUT_KEYS.ESCAPE,
      action: () => {
        if (isSettingsOpen) {
          closeSettings();
        } else if (currentView === 'diary') {
          closeDiary();
        }
      },
      preventDefault: false,
    },
  ]);
}
