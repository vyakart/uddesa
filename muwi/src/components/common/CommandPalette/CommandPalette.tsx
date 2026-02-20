import { useMemo, useRef, useEffect, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { usePersonalDiaryStore } from '@/stores/personalDiaryStore';
import { useDraftsStore } from '@/stores/draftsStore';
import { useLongDraftsStore } from '@/stores/longDraftsStore';
import { useAcademicStore } from '@/stores/academicStore';
import { useBlackboardStore } from '@/stores/blackboardStore';
import {
  createCommandRegistry,
  getCommandContextPriority,
  getFuzzyScore,
  isCommandInScope,
  type CommandDefinition,
} from '@/utils/commands';

const GROUP_ORDER: Array<'Navigation' | 'Actions' | 'Settings'> = ['Navigation', 'Actions', 'Settings'];
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function groupRank(group: CommandDefinition['group']): number {
  const index = GROUP_ORDER.indexOf(group);
  return index < 0 ? GROUP_ORDER.length : index;
}

export function CommandPalette() {
  const isOpen = useAppStore((state) => state.isCommandPaletteOpen);
  const query = useAppStore((state) => state.commandPaletteQuery);
  const highlightedIndex = useAppStore((state) => state.commandPaletteHighlightedIndex);
  const recentCommands = useAppStore((state) => state.recentCommands);
  const currentView = useAppStore((state) => state.currentView);
  const activeDiary = useAppStore((state) => state.activeDiary);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);

  const openDiary = useAppStore((state) => state.openDiary);
  const closeDiary = useAppStore((state) => state.closeDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const openRightPanel = useAppStore((state) => state.openRightPanel);
  const closePalette = useAppStore((state) => state.closeCommandPalette);
  const updateQuery = useAppStore((state) => state.updateCommandPaletteQuery);
  const setHighlightedIndex = useAppStore((state) => state.setCommandPaletteHighlightedIndex);
  const executeCommand = useAppStore((state) => state.executeCommand);

  const themeMode = useSettingsStore((state) => state.global.theme);
  const updateTheme = useSettingsStore((state) => state.updateTheme);

  const createScratchpadPage = useScratchpadStore((state) => state.createPage);
  const createDiaryEntry = usePersonalDiaryStore((state) => state.createEntry);
  const createDraft = useDraftsStore((state) => state.createDraft);
  const createLongDraft = useLongDraftsStore((state) => state.createLongDraft);
  const createAcademicPaper = useAcademicStore((state) => state.createPaper);
  const createBlackboardCanvas = useBlackboardStore((state) => state.createCanvas);

  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const registry = useMemo(() => createCommandRegistry(), []);

  const commandContext = useMemo(
    () => ({
      currentView,
      activeDiary,
      isSidebarOpen,
      themeMode,
      openDiary,
      goToShelf: closeDiary,
      openSettings,
      toggleSidebar,
      toggleTheme: () => {
        const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
        void updateTheme(nextTheme);
      },
      openExportPanel: () => {
        if (currentView === 'diary') {
          openRightPanel('export');
        }
      },
      createNewScratchpadPage: async () => {
        openDiary('scratchpad');
        await createScratchpadPage();
      },
      createNewDiaryEntry: async () => {
        openDiary('personal-diary');
        await createDiaryEntry(new Date());
      },
      createNewDraft: async () => {
        openDiary('drafts');
        await createDraft();
      },
      createNewLongDraft: async () => {
        openDiary('long-drafts');
        await createLongDraft();
      },
      createNewAcademicPaper: async () => {
        openDiary('academic');
        await createAcademicPaper();
      },
      createNewBlackboardCanvas: async () => {
        openDiary('blackboard');
        await createBlackboardCanvas('Untitled');
      },
    }),
    [
      activeDiary,
      closeDiary,
      createAcademicPaper,
      createBlackboardCanvas,
      createDiaryEntry,
      createDraft,
      createLongDraft,
      createScratchpadPage,
      currentView,
      isSidebarOpen,
      openDiary,
      openRightPanel,
      openSettings,
      themeMode,
      toggleSidebar,
      updateTheme,
    ]
  );

  const results = useMemo(() => {
    const scopedCommands = registry.filter((command) => isCommandInScope(command, currentView, activeDiary));

    if (query.trim().length === 0) {
      const recent = recentCommands
        .map((id) => scopedCommands.find((command) => command.id === id))
        .filter((command): command is CommandDefinition => Boolean(command))
        .slice(0, 3);

      if (recent.length > 0) {
        return recent;
      }

      return [...scopedCommands]
        .sort((left, right) => {
          const leftPriority = getCommandContextPriority(left, currentView, activeDiary);
          const rightPriority = getCommandContextPriority(right, currentView, activeDiary);
          if (rightPriority !== leftPriority) {
            return rightPriority - leftPriority;
          }

          const groupDiff = groupRank(left.group) - groupRank(right.group);
          if (groupDiff !== 0) {
            return groupDiff;
          }

          return left.label.localeCompare(right.label);
        })
        .slice(0, 12);
    }

    return scopedCommands
      .map((command) => ({
        command,
        score: getFuzzyScore(query, command),
        priority: getCommandContextPriority(command, currentView, activeDiary),
      }))
      .filter((result) => result.score >= 0)
      .sort((left, right) => {
        if (right.priority !== left.priority) {
          return right.priority - left.priority;
        }

        if (right.score !== left.score) {
          return right.score - left.score;
        }

        const groupDiff = groupRank(left.command.group) - groupRank(right.command.group);
        if (groupDiff !== 0) {
          return groupDiff;
        }

        return left.command.label.localeCompare(right.command.label);
      })
      .map((entry) => entry.command);
  }, [activeDiary, currentView, query, recentCommands, registry]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const paletteNode = paletteRef.current;
      if (!paletteNode) {
        return;
      }

      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLElement) || !paletteNode.contains(activeElement)) {
        return;
      }

      const focusables = paletteNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) {
        event.preventDefault();
        paletteNode.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);

      const focusTarget = returnFocusRef.current;
      if (focusTarget && document.contains(focusTarget)) {
        focusTarget.focus();
      }
      returnFocusRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (results.length === 0) {
      if (highlightedIndex !== -1) {
        setHighlightedIndex(-1);
      }
      return;
    }

    if (highlightedIndex < 0 || highlightedIndex >= results.length) {
      setHighlightedIndex(0);
    }
  }, [highlightedIndex, isOpen, results, setHighlightedIndex]);

  const runCommand = useCallback(
    async (command: CommandDefinition) => {
      await command.execute(commandContext);
      executeCommand(command.id);
    },
    [commandContext, executeCommand]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (results.length === 0) {
          return;
        }
        const next = highlightedIndex < results.length - 1 ? highlightedIndex + 1 : 0;
        setHighlightedIndex(next);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (results.length === 0) {
          return;
        }
        const next = highlightedIndex > 0 ? highlightedIndex - 1 : results.length - 1;
        setHighlightedIndex(next);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const selected = results[highlightedIndex];
        if (!selected) {
          return;
        }
        void runCommand(selected);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closePalette();
      }
    },
    [closePalette, highlightedIndex, results, runCommand, setHighlightedIndex]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="muwi-command-palette-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePalette();
        }
      }}
    >
      <div
        ref={paletteRef}
        className="muwi-command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        tabIndex={-1}
      >
        <div className="muwi-command-palette__input-row">
          <Search size={16} aria-hidden="true" className="muwi-command-palette__search-icon" />
          <input
            ref={inputRef}
            role="combobox"
            aria-label="Command search"
            aria-haspopup="listbox"
            aria-expanded="true"
            aria-controls="command-palette-listbox"
            aria-activedescendant={
              highlightedIndex >= 0 && highlightedIndex < results.length
                ? `command-palette-option-${results[highlightedIndex].id}`
                : undefined
            }
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="muwi-command-palette__input"
          />
        </div>

        <div className="muwi-command-palette__results" role="listbox" id="command-palette-listbox">
          {results.length === 0 ? (
            <p className="muwi-command-palette__empty">No commands found.</p>
          ) : (
            results.map((command, index) => {
              const previous = index > 0 ? results[index - 1] : null;
              const showGroup = !previous || previous.group !== command.group;

              return (
                <div key={command.id}>
                  {showGroup ? <div className="muwi-command-palette__group">{command.group}</div> : null}
                  <button
                    id={`command-palette-option-${command.id}`}
                    type="button"
                    role="option"
                    aria-selected={highlightedIndex === index}
                    className="muwi-command-palette__option"
                    data-active={highlightedIndex === index ? 'true' : 'false'}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => {
                      void runCommand(command);
                    }}
                  >
                    <span className="muwi-command-palette__option-label">{command.label}</span>
                    {command.shortcut ? (
                      <span className="muwi-command-palette__option-shortcut">{command.shortcut}</span>
                    ) : null}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
