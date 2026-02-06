import { act, render, screen } from '@/test';
import type { DiaryEntry as DiaryEntryType, PersonalDiarySettings } from '@/types';
import { DiaryEntry } from './DiaryEntry';

const mockEditor = {
  getHTML: vi.fn(() => '<p>existing content</p>'),
  getText: vi.fn(() => 'existing content'),
  commands: {
    setContent: vi.fn(),
  },
  chain: vi.fn(() => ({
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleStrike: vi.fn().mockReturnThis(),
    toggleHeading: vi.fn().mockReturnThis(),
    toggleBulletList: vi.fn().mockReturnThis(),
    toggleOrderedList: vi.fn().mockReturnThis(),
    toggleBlockquote: vi.fn().mockReturnThis(),
    run: vi.fn(),
  })),
  isActive: vi.fn(() => false),
};

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
    return mockEditor;
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
  beforeEach(() => {
    capturedOnUpdate = undefined;
    vi.clearAllMocks();
  });

  it('renders empty state when no entry is selected', () => {
    render(
      <DiaryEntry
        entry={null}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        settings={settings}
      />
    );

    expect(screen.getByText('Select or create an entry to start writing')).toBeInTheDocument();
  });

  it('applies date format, font, and lined-paper settings', () => {
    render(
      <DiaryEntry
        entry={makeEntry()}
        onContentChange={vi.fn()}
        onDateChange={vi.fn()}
        settings={settings}
      />
    );

    expect(screen.getByRole('button', { name: 'Select date' })).toHaveTextContent('2026-02-06');
    expect(screen.getByTestId('diary-entry-content')).toHaveStyle({ fontFamily: 'Crimson Pro' });
    expect(screen.getByTestId('diary-entry-paper').getAttribute('style')).toContain(
      'repeating-linear-gradient'
    );
  });

  it('auto-saves content changes with debounce and updates word count', () => {
    vi.useFakeTimers();
    const onContentChange = vi.fn();

    render(
      <DiaryEntry
        entry={makeEntry()}
        onContentChange={onContentChange}
        onDateChange={vi.fn()}
        settings={settings}
      />
    );

    act(() => {
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p>new text</p>',
          getText: () => 'new text',
        },
      });
      vi.advanceTimersByTime(500);
    });

    expect(onContentChange).toHaveBeenCalledWith('<p>new text</p>');
    expect(screen.getByText('2 words')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
