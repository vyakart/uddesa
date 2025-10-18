/**
 * Global keyboard shortcuts system for Uddesa
 * 
 * Handles platform-specific shortcuts (Cmd on Mac, Ctrl on Windows/Linux)
 * and provides context-aware shortcut handling
 */

export type ShortcutHandler = (event: KeyboardEvent) => boolean | void;

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  handler: ShortcutHandler;
  context?: 'global' | 'editor' | 'shell';
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

/**
 * Normalize key to lowercase
 */
function normalizeKey(key: string): string {
  return key.toLowerCase();
}

/**
 * Check if shortcut matches the keyboard event
 */
function matchesShortcut(shortcut: Shortcut, event: KeyboardEvent): boolean {
  const keyMatches = normalizeKey(event.key) === normalizeKey(shortcut.key);
  const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
  const altMatches = shortcut.alt ? event.altKey : !event.altKey;
  const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

  return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl && !isMac) {
    parts.push('Ctrl');
  }
  if (shortcut.meta || (shortcut.ctrl && isMac)) {
    parts.push(isMac ? '⌘' : 'Cmd');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

/**
 * Keyboard shortcuts manager
 */
class ShortcutsManager {
  private shortcuts: Shortcut[] = [];
  private isListening = false;

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: Shortcut): () => void {
    this.shortcuts.push(shortcut);

    // Start listening if not already
    if (!this.isListening) {
      this.startListening();
    }

    // Return unregister function
    return () => {
      const index = this.shortcuts.indexOf(shortcut);
      if (index > -1) {
        this.shortcuts.splice(index, 1);
      }
    };
  }

  /**
   * Unregister all shortcuts
   */
  clear(): void {
    this.shortcuts = [];
  }

  /**
   * Get all registered shortcuts for a context
   */
  getShortcuts(context?: string): Shortcut[] {
    if (!context) {
      return [...this.shortcuts];
    }
    return this.shortcuts.filter((s) => !s.context || s.context === context || s.context === 'global');
  }

  /**
   * Handle keyboard event
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Don't handle shortcuts when typing in input elements
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    for (const shortcut of this.shortcuts) {
      // Skip editor shortcuts if not in editor
      if (shortcut.context === 'editor' && !isInput) {
        continue;
      }

      // Skip non-editor shortcuts if in input
      if (shortcut.context !== 'editor' && shortcut.context !== 'global' && isInput) {
        continue;
      }

      if (matchesShortcut(shortcut, event)) {
        const result = shortcut.handler(event);
        
        // If handler returns true, prevent default and stop propagation
        if (result !== false) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        break;
      }
    }
  };

  /**
   * Start listening for keyboard events
   */
  private startListening(): void {
    if (this.isListening) {
      return;
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.handleKeyDown);
      this.isListening = true;
    }
  }

  /**
   * Stop listening for keyboard events
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.isListening = false;
    }
  }
}

// Global instance
export const shortcuts = new ShortcutsManager();

/**
 * Default application shortcuts
 */
export const DEFAULT_SHORTCUTS = {
  // File operations
  newDiary: {
    key: 'n',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Create new diary',
    context: 'global' as const,
  },
  save: {
    key: 's',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Manual save',
    context: 'global' as const,
  },
  export: {
    key: 'e',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Export current diary',
    context: 'global' as const,
  },

  // UI navigation
  showShortcuts: {
    key: 'k',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Show keyboard shortcuts',
    context: 'global' as const,
  },
  search: {
    key: '/',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Focus search',
    context: 'global' as const,
  },

  // Security
  lock: {
    key: 'l',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Lock/unlock diary',
    context: 'global' as const,
  },

  // Text formatting (editor only)
  bold: {
    key: 'b',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Bold text',
    context: 'editor' as const,
  },
  italic: {
    key: 'i',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Italic text',
    context: 'editor' as const,
  },
  underline: {
    key: 'u',
    [isMac ? 'meta' : 'ctrl']: true,
    description: 'Underline text',
    context: 'editor' as const,
  },
};