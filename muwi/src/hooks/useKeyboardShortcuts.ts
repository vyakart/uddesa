import { useEffect, useCallback } from 'react';

type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';

interface ShortcutConfig {
  key: string;
  modifiers?: ModifierKey[];
  action: () => void;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  target?: 'window' | 'document';
}

function matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
  const { key, modifiers = [] } = config;

  // Check if key matches (case insensitive)
  if (event.key.toLowerCase() !== key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const hasCtrl = modifiers.includes('ctrl');
  const hasAlt = modifiers.includes('alt');
  const hasShift = modifiers.includes('shift');
  const hasMeta = modifiers.includes('meta');

  // On macOS, use metaKey for Cmd, on other platforms use ctrlKey
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;

  if (hasCtrl && !ctrlOrMeta) return false;
  if (hasMeta && !event.metaKey) return false;
  if (hasAlt && !event.altKey) return false;
  if (hasShift && !event.shiftKey) return false;

  // Make sure no extra modifiers are pressed
  const expectedModifierCount =
    (hasCtrl || hasMeta ? 1 : 0) + (hasAlt ? 1 : 0) + (hasShift ? 1 : 0);
  const actualModifierCount =
    (event.ctrlKey || event.metaKey ? 1 : 0) +
    (event.altKey ? 1 : 0) +
    (event.shiftKey ? 1 : 0);

  if (actualModifierCount !== expectedModifierCount) {
    return false;
  }

  return true;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, target = 'window' } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const targetElement = event.target as HTMLElement;
      const isInputField =
        targetElement.tagName === 'INPUT' ||
        targetElement.tagName === 'TEXTAREA' ||
        targetElement.isContentEditable;

      for (const config of shortcuts) {
        if (matchesShortcut(event, config)) {
          // Allow shortcuts to work in input fields only if they have modifiers
          if (isInputField && (!config.modifiers || config.modifiers.length === 0)) {
            continue;
          }

          if (config.preventDefault !== false) {
            event.preventDefault();
          }
          config.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    const targetElement = target === 'window' ? window : document;
    targetElement.addEventListener('keydown', handleKeyDown as EventListener);
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, target]);
}

// Pre-defined shortcut configurations for common actions
export const SHORTCUT_KEYS = {
  SAVE: { key: 's', modifiers: ['ctrl'] as ModifierKey[] },
  NEW: { key: 'n', modifiers: ['ctrl'] as ModifierKey[] },
  LOCK: { key: 'l', modifiers: ['ctrl'] as ModifierKey[] },
  UNLOCK: { key: 'l', modifiers: ['ctrl', 'shift'] as ModifierKey[] },
  BOLD: { key: 'b', modifiers: ['ctrl'] as ModifierKey[] },
  ITALIC: { key: 'i', modifiers: ['ctrl'] as ModifierKey[] },
  UNDERLINE: { key: 'u', modifiers: ['ctrl'] as ModifierKey[] },
  HEADING_1: { key: '1', modifiers: ['ctrl'] as ModifierKey[] },
  HEADING_2: { key: '2', modifiers: ['ctrl'] as ModifierKey[] },
  HEADING_3: { key: '3', modifiers: ['ctrl'] as ModifierKey[] },
  FIND: { key: 'f', modifiers: ['ctrl'] as ModifierKey[] },
  ZOOM_IN: { key: '=', modifiers: ['ctrl'] as ModifierKey[] },
  ZOOM_OUT: { key: '-', modifiers: ['ctrl'] as ModifierKey[] },
  ZOOM_RESET: { key: '0', modifiers: ['ctrl'] as ModifierKey[] },
  HOME: { key: 'h', modifiers: ['ctrl'] as ModifierKey[] },
  SETTINGS: { key: ',', modifiers: ['ctrl'] as ModifierKey[] },
  FOOTNOTE: { key: 'f', modifiers: ['ctrl', 'shift'] as ModifierKey[] },
  CITATION: { key: 'c', modifiers: ['ctrl', 'shift'] as ModifierKey[] },
  ESCAPE: { key: 'Escape', modifiers: [] as ModifierKey[] },
};
