import { act, fireEvent, render, screen, waitFor, within } from '@/test';
import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { DiaryEntry as DiaryEntryType, PersonalDiarySettings } from '@/types';
import { DiaryEntry } from './DiaryEntry';

const mockEditor = {
  getHTML: vi.fn(() => '<p>existing content</p>'),
  getText: vi.fn(() => 'existing content'),
  commands: {
    setContent: vi.fn(),
  },
  setEditable: vi.fn(),
  chain: vi.fn(() => ({
    focus: vi.fn().mockReturnThis(),
    undo: vi.fn().mockReturnThis(),
    redo: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleUnderline: vi.fn().mockReturnThis(),
    toggleStrike: vi.fn().mockReturnThis(),
    toggleHeading: vi.fn().mockReturnThis(),
    toggleBulletList: vi.fn().mockReturnThis(),
    toggleOrderedList: vi.fn().mockReturnThis(),
    toggleBlockquote: vi.fn().mockReturnThis(),
    run: vi.fn(),
  })),
  isActive: vi.fn(() => false),
};

let mockUseEditorValue: typeof mockEditor | null = mockEditor;
let capturedOnUpdate:
  | ((payload: { editor: { getHTML: () => string; getText: () => string } }) => void)
  | undefined;

vi.mock('@tiptap/react', () => ({
  useEditor: (config: {
    onUpdate?: (payload: {
      editor: {
        getHTML: () => string;
        getText: () => string;
      };
    }) => void;
  }) => {
    capturedOnUpdate = config.onUpdate;
    return mockUseEditorValue;
  },
  EditorContent: ({ style }: { style?: Record<string, string | number> }) => (
    <div data-testid="editor-content" style={style} />
  ),
}));

function makeEntry(): DiaryEntryType {
  const now = new Date('2026-02-06T09:00:00.000Z');
  return {
    id: 'entry-1',
    date: '2026-02-06',
    content: '<p>existing content</p>',
    wordCount: 2,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
  };
}

const settings: PersonalDiarySettings = {
  font: 'Crimson Pro',
  dateFormat: 'yyyy-MM-dd',
  showLines: true,
  paperTexture: 'paper-cream',
  paperColor: '#fffef9',
};

describe('DiaryEntry', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
    useAppStore.setState(useAppStore.getInitialState(), true);
    mockUseEditorValue = mockEditor;
    capturedOnUpdate = undefined;
    vi.clearAllMocks();
  });

  it('renders empty state when no entry is selected', () => {
    render(
      <DiaryEntry
        entry={null}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        onLockChange={vi.fn()}
        settings={settings}
      />
    );

    expect(screen.getByText('Select or create an entry to start writing')).toBeInTheDocument();
  });

  it('supports Date entry values and alternate texture/color branches', () => {
    const dateEntry = {
      ...makeEntry(),
      date: new Date('2026-02-06T00:00:00.000Z') as unknown as string,
    };

    render(
      <DiaryEntry
        entry={dateEntry}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        onLockChange={vi.fn()}
        settings={{
          ...settings,
          paperColor: '#fffdf8',
          paperTexture: 'paper-white',
          showLines: false,
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Select date' })).toHaveTextContent('2026-02-06');
    const paperStyle = screen.getByTestId('diary-entry-paper').getAttribute('style') ?? '';
    expect(paperStyle).toContain('var(--color-bg-canvas-warm)');
    expect(paperStyle).not.toContain('repeating-linear-gradient');
  });

  it('renders without toolbar when editor is unavailable', () => {
    mockUseEditorValue = null;
    render(
      <DiaryEntry
        entry={makeEntry()}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        onLockChange={vi.fn()}
        settings={{
          ...settings,
          paperTexture: '',
          showLines: false,
          paperColor: '#abc',
        }}
      />
    );

    expect(screen.queryByRole('toolbar', { name: 'Personal diary toolbar' })).not.toBeInTheDocument();
  });

  it('applies date format, font, and lined-paper settings', () => {
    render(
      <DiaryEntry
        entry={makeEntry()}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        onLockChange={vi.fn()}
        settings={settings}
      />
    );

    expect(screen.getByRole('button', { name: 'Select date' })).toHaveTextContent('2026-02-06');
    expect(screen.getByTestId('diary-entry-content')).toHaveStyle({ fontFamily: 'Crimson Pro' });
    expect(screen.getByTestId('diary-entry-paper').getAttribute('style')).toContain(
      'repeating-linear-gradient'
    );
    expect(screen.getByRole('toolbar', { name: 'Personal diary toolbar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold (Ctrl+B)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic (Ctrl+I)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Underline (Ctrl+U)' })).toBeInTheDocument();
    expect(screen.getByText('Font: Crimson Pro')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Strikethrough' })).not.toBeInTheDocument();
  });

  it('auto-saves content changes with debounce and updates word count', () => {
    vi.useFakeTimers();
    const onContentChange = vi.fn();

    render(
      <DiaryEntry
        entry={makeEntry()}
        onContentChange={onContentChange}
        onDateChange={vi.fn()}
        onLockChange={vi.fn()}
        settings={settings}
      />
    );

    act(() => {
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p>first draft</p>',
          getText: () => 'first draft',
        },
      });
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p>new text</p>',
          getText: () => 'new text',
        },
      });
      vi.advanceTimersByTime(500);
    });

    expect(onContentChange).toHaveBeenCalledTimes(1);
    expect(onContentChange).toHaveBeenCalledWith('<p>new text</p>');
    expect(screen.getByText('2 words')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('prevents editor updates while entry is locked', () => {
    const onContentChange = vi.fn();

    render(
      <DiaryEntry
        entry={{ ...makeEntry(), isLocked: true }}
        onContentChange={onContentChange}
        onDateChange={vi.fn()}
        onLockChange={vi.fn()}
        settings={settings}
      />
    );

    act(() => {
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p>locked update</p>',
          getText: () => 'locked update',
        },
      });
    });

    expect(onContentChange).not.toHaveBeenCalled();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlock' })).toBeInTheDocument();
    expect(screen.queryByRole('toolbar', { name: 'Personal diary toolbar' })).not.toBeInTheDocument();
  });

  it('prompts passkey setup when locking without a passkey and confirmation accepted', async () => {
    const closeDiarySpy = vi.fn();
    const openSettingsSpy = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    useAppStore.setState((state) => ({
      ...state,
      closeDiary: closeDiarySpy,
      openSettings: openSettingsSpy,
    }));

    render(
      <DiaryEntry
        entry={makeEntry()}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        onLockChange={vi.fn()}
        settings={settings}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lock' }));
    });

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(closeDiarySpy).toHaveBeenCalledTimes(1);
      expect(openSettingsSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('does nothing after passkey setup prompt if user cancels', async () => {
    const closeDiarySpy = vi.fn();
    const openSettingsSpy = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    useAppStore.setState((state) => ({
      ...state,
      closeDiary: closeDiarySpy,
      openSettings: openSettingsSpy,
    }));

    render(
      <DiaryEntry
        entry={makeEntry()}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        onLockChange={vi.fn()}
        settings={settings}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lock' }));
    });

    expect(closeDiarySpy).not.toHaveBeenCalled();
    expect(openSettingsSpy).not.toHaveBeenCalled();
  });

  it('locks and unlocks entry when passkey is configured', async () => {
    await useSettingsStore.getState().setPasskey('entry-passkey');

    const onLockChange = vi.fn();
    const { rerender } = render(
      <DiaryEntry
        entry={makeEntry()}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        onLockChange={onLockChange}
        settings={settings}
      />
    );

    await act(async () => {
      screen.getByRole('button', { name: 'Lock' }).click();
    });

    await waitFor(() => {
      expect(onLockChange).toHaveBeenCalledWith(true);
    });

    const unlockEntry = { ...makeEntry(), isLocked: true };

    rerender(
      <DiaryEntry
        entry={unlockEntry}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        onLockChange={onLockChange}
        settings={settings}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    });
    expect(screen.getByText('Unlock entry')).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Passkey'), {
        target: { value: 'entry-passkey' },
      });
      const dialog = screen.getByRole('dialog', { name: 'Unlock entry' });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Unlock' }));
    });

    await waitFor(() => {
      expect(onLockChange).toHaveBeenCalledWith(false);
    });
  });
});
