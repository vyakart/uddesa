import { act, fireEvent, render, screen } from '@/test';
import type { Draft } from '@/types/drafts';
import { DraftEditor } from './DraftEditor';

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
  setHorizontalRule: vi.fn().mockReturnThis(),
  undo: vi.fn().mockReturnThis(),
  redo: vi.fn().mockReturnThis(),
  run: vi.fn(),
};

const mockEditor = {
  chain: vi.fn(() => chain),
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

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  const now = new Date('2026-02-06T10:00:00.000Z');
  return {
    id: 'draft-1',
    title: 'Draft Title',
    content: '<p>existing content</p>',
    status: 'in-progress',
    wordCount: 2,
    tags: [],
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('DraftEditor', () => {
  beforeEach(() => {
    capturedOnUpdate = undefined;
    vi.clearAllMocks();
    mockEditor.isActive.mockImplementation(() => false);
    mockEditor.can.mockImplementation(() => ({
      undo: () => true,
      redo: () => true,
    }));
  });

  it('renders empty state when no draft is selected', () => {
    render(
      <DraftEditor
        draft={null}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onStatusCycle={vi.fn()}
      />
    );

    expect(screen.getByText('Select a draft or create a new one')).toBeInTheDocument();
  });

  it('renders title input, TipTap editor, formatting toolbar, and soft page breaks', () => {
    render(
      <DraftEditor
        draft={makeDraft()}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onStatusCycle={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Draft Title')).toHaveStyle({ fontSize: '28px' });
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Draft formatting toolbar' })).toBeInTheDocument();
    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTestId('draft-editor-paper').getAttribute('style')).toContain(
      'repeating-linear-gradient'
    );
  });

  it('auto-saves title/content changes and updates word count with debounce replacement', () => {
    vi.useFakeTimers();
    const onTitleChange = vi.fn();
    const onContentChange = vi.fn();

    render(
      <DraftEditor
        draft={makeDraft()}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        onStatusCycle={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Untitled Draft'), {
      target: { value: 'Updated Draft Title' },
    });
    fireEvent.change(screen.getByPlaceholderText('Untitled Draft'), {
      target: { value: 'Latest Draft Title' },
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onTitleChange).toHaveBeenCalledTimes(1);
    expect(onTitleChange).toHaveBeenCalledWith('Latest Draft Title');

    act(() => {
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p>one two</p>',
          getText: () => 'one two',
        },
      });
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p>one two three</p>',
          getText: () => 'one two three',
        },
      });
      vi.advanceTimersByTime(500);
    });

    expect(onContentChange).toHaveBeenCalledTimes(1);
    expect(onContentChange).toHaveBeenCalledWith('<p>one two three</p>');
    expect(screen.getByText('3 words')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('cycles status when status badge is clicked', () => {
    const onStatusCycle = vi.fn();
    render(
      <DraftEditor
        draft={makeDraft()}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onStatusCycle={onStatusCycle}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'In Progress' }));
    expect(onStatusCycle).toHaveBeenCalledTimes(1);
  });

  it('executes formatting toolbar actions through the shared grouped toolbar model', () => {
    mockEditor.isActive.mockImplementation((name: string, attrs?: { level?: number }) => {
      if (name === 'bold') return true;
      if (name === 'heading' && attrs?.level === 1) return true;
      return false;
    });

    render(
      <DraftEditor
        draft={makeDraft()}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onStatusCycle={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Bold (Ctrl+B)'));
    fireEvent.click(screen.getByTitle('Italic (Ctrl+I)'));
    fireEvent.click(screen.getByTitle('Underline (Ctrl+U)'));
    fireEvent.click(screen.getByTitle('Strikethrough'));
    fireEvent.click(screen.getByTitle('Heading 1 (Ctrl+1)'));
    fireEvent.click(screen.getByTitle('Heading 2 (Ctrl+2)'));
    fireEvent.click(screen.getByTitle('Heading 3 (Ctrl+3)'));
    fireEvent.click(screen.getByTitle('Bullet List'));
    fireEvent.click(screen.getByTitle('Numbered List'));
    fireEvent.click(screen.getByTitle('Block Quote'));
    fireEvent.click(screen.getByTitle('Horizontal Rule'));
    fireEvent.click(screen.getByTitle('Undo (Ctrl+Z)'));
    fireEvent.click(screen.getByTitle('Redo (Ctrl+Shift+Z)'));

    expect(chain.toggleBold).toHaveBeenCalled();
    expect(chain.toggleItalic).toHaveBeenCalled();
    expect(chain.toggleUnderline).toHaveBeenCalled();
    expect(chain.toggleStrike).toHaveBeenCalled();
    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 1 });
    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 2 });
    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 3 });
    expect(chain.toggleBulletList).toHaveBeenCalled();
    expect(chain.toggleOrderedList).toHaveBeenCalled();
    expect(chain.toggleBlockquote).toHaveBeenCalled();
    expect(chain.setHorizontalRule).toHaveBeenCalled();
    expect(chain.undo).toHaveBeenCalled();
    expect(chain.redo).toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalled();

    const bold = screen.getByTitle('Bold (Ctrl+B)');
    expect(bold).toHaveAttribute('data-active', 'true');
    const italic = screen.getByTitle('Italic (Ctrl+I)');
    expect(italic).toHaveAttribute('data-active', 'false');
    expect(screen.getAllByRole('separator').length).toBeGreaterThan(0);
  });

  it('renders locked mode with disabled editing/status controls and hidden toolbar', () => {
    const onStatusCycle = vi.fn();
    mockEditor.can.mockImplementation(() => ({
      undo: () => false,
      redo: () => false,
    }));

    render(
      <DraftEditor
        draft={makeDraft({ isLocked: true })}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onStatusCycle={onStatusCycle}
      />
    );

    expect(screen.getByDisplayValue('Draft Title')).toBeDisabled();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.queryByTitle('Bold (Ctrl+B)')).not.toBeInTheDocument();

    const status = screen.getByRole('button', { name: 'In Progress' });
    expect(status).toBeDisabled();
    fireEvent.click(status);
    expect(onStatusCycle).not.toHaveBeenCalled();
  });
});
