import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useLongDraftsStore } from '@/stores/longDraftsStore';
import type { Section } from '@/types/longDrafts';
import { SectionEditor } from './SectionEditor';

const chain = {
  focus: vi.fn().mockReturnThis(),
  toggleBold: vi.fn().mockReturnThis(),
  toggleItalic: vi.fn().mockReturnThis(),
  toggleUnderline: vi.fn().mockReturnThis(),
  toggleStrike: vi.fn().mockReturnThis(),
  toggleHeading: vi.fn().mockReturnThis(),
  toggleBulletList: vi.fn().mockReturnThis(),
  toggleOrderedList: vi.fn().mockReturnThis(),
  toggleBlockquote: vi.fn().mockReturnThis(),
  insertFootnote: vi.fn().mockReturnThis(),
  setTextSelection: vi.fn().mockReturnThis(),
  undo: vi.fn().mockReturnThis(),
  redo: vi.fn().mockReturnThis(),
  run: vi.fn(),
};

const commands = {
  removeFootnote: vi.fn(),
  updateFootnoteMarker: vi.fn(),
  updateFootnoteContent: vi.fn(),
};

const mockEditor = {
  chain: vi.fn(() => chain),
  commands,
  state: {
    selection: { from: 7 },
    doc: {
      descendants: vi.fn(),
    },
  },
  isActive: vi.fn(() => false),
  can: vi.fn(() => ({
    undo: () => true,
    redo: () => true,
  })),
};

let capturedOnUpdate:
  | ((payload: { editor: { getHTML: () => string; getText: () => string } }) => void)
  | undefined;

vi.mock('@tiptap/react', () => ({
  useEditor: (config: {
    onUpdate?: (payload: { editor: { getHTML: () => string; getText: () => string } }) => void;
  }) => {
    capturedOnUpdate = config.onUpdate;
    return mockEditor;
  },
  EditorContent: ({ style }: { style?: Record<string, string | number> }) => (
    <div data-testid="editor-content" style={style} />
  ),
}));

function makeSection(overrides: Partial<Section> = {}): Section {
  const now = new Date('2026-02-12T10:00:00.000Z');
  return {
    id: 'section-1',
    longDraftId: 'doc-1',
    title: 'Introduction',
    content: '<p>hello world</p>',
    order: 0,
    parentId: null,
    footnotes: [{ id: 'fn-1', marker: 1, content: 'Footnote', position: 3 }],
    status: 'in-progress',
    notes: 'Current notes',
    wordCount: 2,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('SectionEditor', () => {
  beforeEach(() => {
    capturedOnUpdate = undefined;
    vi.clearAllMocks();
    useLongDraftsStore.setState(useLongDraftsStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders empty state when no section is selected', () => {
    render(
      <SectionEditor
        section={null}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onNotesChange={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByText('Select a section or create a new one')).toBeInTheDocument();
  });

  it('renders normal editor UI and auto-saves title/content/notes + status changes', () => {
    vi.useFakeTimers();
    const onTitleChange = vi.fn();
    const onContentChange = vi.fn();
    const onNotesChange = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <SectionEditor
        section={makeSection()}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        onNotesChange={onNotesChange}
        onStatusChange={onStatusChange}
      />
    );

    expect(screen.getByDisplayValue('Introduction')).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.getByText('1 footnotes')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Section Title'), {
      target: { value: 'Updated Title' },
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onTitleChange).toHaveBeenCalledWith('Updated Title');

    act(() => {
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p>one two three</p>',
          getText: () => 'one two three',
        },
      });
      vi.advanceTimersByTime(500);
    });
    expect(onContentChange).toHaveBeenCalledWith('<p>one two three</p>');
    expect(screen.getByText('3 words')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /In Progress/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(onStatusChange).toHaveBeenCalledWith('review');

    fireEvent.click(screen.getByTitle('Toggle author notes'));
    fireEvent.change(screen.getByPlaceholderText('Add private notes about this section...'), {
      target: { value: 'Updated notes' },
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onNotesChange).toHaveBeenCalledWith('Updated notes');

    vi.useRealTimers();
  });

  it('supports footnote insertion and footnote panel integration', async () => {
    const updateSection = vi.fn().mockResolvedValue(undefined);
    useLongDraftsStore.setState({ updateSection });

    render(
      <SectionEditor
        section={makeSection()}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onNotesChange={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Insert Footnote'));
    await waitFor(() => {
      expect(updateSection).toHaveBeenCalledWith(
        'section-1',
        expect.objectContaining({
          footnotes: expect.arrayContaining([
            expect.objectContaining({
              marker: 2,
              position: 7,
            }),
          ]),
        })
      );
    });
    expect(chain.insertFootnote).toHaveBeenCalledTimes(1);

    if (!screen.queryByText('Footnotes (1)')) {
      fireEvent.click(screen.getByTitle('Toggle footnotes panel'));
    }
    expect(screen.getByText('Footnotes (1)')).toBeInTheDocument();
  });

  it('renders simplified focus mode and hides toolbar for locked sections', () => {
    act(() => {
      useLongDraftsStore.setState({ viewMode: 'focus' });
    });
    render(
      <SectionEditor
        section={makeSection({ title: 'Focus Section' })}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onNotesChange={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Focus Section')).toBeInTheDocument();
    expect(screen.getByText('1 footnotes')).toBeInTheDocument();

    const focusedToolbar = screen.queryByTitle('Bold (Ctrl+B)');
    expect(focusedToolbar).not.toBeInTheDocument();
  });

  it('hides formatting toolbar when section is locked in normal mode', () => {
    act(() => {
      useLongDraftsStore.setState({ viewMode: 'normal' });
    });
    render(
      <SectionEditor
        section={makeSection({ isLocked: true })}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onNotesChange={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Bold (Ctrl+B)')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Section Title')).toBeDisabled();
  });
});
