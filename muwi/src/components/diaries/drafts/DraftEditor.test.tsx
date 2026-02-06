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
    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTestId('draft-editor-paper').getAttribute('style')).toContain(
      'repeating-linear-gradient'
    );
  });

  it('auto-saves title/content changes and updates word count', () => {
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

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onTitleChange).toHaveBeenCalledWith('Updated Draft Title');

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
});
