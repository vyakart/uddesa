import { act, fireEvent, render, screen } from '@/test';
import { useAcademicStore } from '@/stores/academicStore';
import type { AcademicSection } from '@/types/academic';
import { AcademicSectionEditor } from './AcademicSectionEditor';

const chain = {
  focus: vi.fn().mockReturnThis(),
  insertContent: vi.fn().mockReturnThis(),
  toggleBold: vi.fn().mockReturnThis(),
  toggleItalic: vi.fn().mockReturnThis(),
  toggleUnderline: vi.fn().mockReturnThis(),
  toggleHeading: vi.fn().mockReturnThis(),
  toggleBulletList: vi.fn().mockReturnThis(),
  toggleOrderedList: vi.fn().mockReturnThis(),
  toggleBlockquote: vi.fn().mockReturnThis(),
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
  view: {
    state: {
      selection: { from: 1 },
    },
    coordsAtPos: vi.fn(() => ({ left: 100, bottom: 200 })),
  },
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
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock('./CitationPicker', () => ({
  CitationPicker: ({
    onInsert,
    onClose,
  }: {
    onInsert: (citation: string) => void;
    onClose: () => void;
  }) => (
    <div data-testid="citation-picker">
      <button type="button" onClick={() => onInsert('(Doe, 2024)')}>
        Insert Mock Citation
      </button>
      <button type="button" onClick={onClose}>
        Close Citation Picker
      </button>
    </div>
  ),
}));

function makeSection(overrides: Partial<AcademicSection> = {}): AcademicSection {
  return {
    id: 'section-1',
    paperId: 'paper-1',
    title: 'Academic Intro',
    content: '<p>initial content</p>',
    order: 0,
    parentId: null,
    wordCount: 2,
    ...overrides,
  };
}

describe('AcademicSectionEditor', () => {
  beforeEach(() => {
    capturedOnUpdate = undefined;
    vi.clearAllMocks();
    useAcademicStore.setState(useAcademicStore.getInitialState(), true);
  });

  it('renders empty state when no section is selected', () => {
    render(
      <AcademicSectionEditor
        section={null}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
      />
    );

    expect(screen.getByText('Select a section or create a new one')).toBeInTheDocument();
  });

  it('renders normal mode, auto-saves title/content, and inserts citations', () => {
    vi.useFakeTimers();
    const onTitleChange = vi.fn();
    const onContentChange = vi.fn();

    render(
      <AcademicSectionEditor
        section={makeSection()}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Section Title'), {
      target: { value: 'Updated Academic Intro' },
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onTitleChange).toHaveBeenCalledWith('Updated Academic Intro');

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

    fireEvent.click(screen.getByTitle('Insert Citation (Ctrl+Shift+C)'));
    expect(screen.getByTestId('citation-picker')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Insert Mock Citation' }));
    expect(chain.insertContent).toHaveBeenCalledWith('(Doe, 2024)');
    expect(screen.queryByTestId('citation-picker')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'C', ctrlKey: true, shiftKey: true });
    expect(screen.getByTestId('citation-picker')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders simplified focus mode', () => {
    useAcademicStore.setState({ viewMode: 'focus' });

    render(
      <AcademicSectionEditor
        section={makeSection({ title: 'Focus Academic Section' })}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Focus Academic Section')).toBeInTheDocument();
    expect(screen.getByText('2 words')).toBeInTheDocument();
  });
});
