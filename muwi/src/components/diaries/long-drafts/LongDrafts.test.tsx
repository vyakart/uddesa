import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useLongDraftsStore } from '@/stores/longDraftsStore';
import type { LongDraft, Section } from '@/types/longDrafts';
import { LongDrafts } from './LongDrafts';

vi.mock('@/components/common/DiaryLayout', () => ({
  DiaryLayout: ({ children, toolbar }: { children: ReactNode; toolbar?: ReactNode }) => (
    <div data-testid="long-drafts-layout">
      <div data-testid="long-drafts-toolbar">{toolbar}</div>
      <div data-testid="long-drafts-content">{children}</div>
    </div>
  ),
}));

vi.mock('./TableOfContents', () => ({
  TableOfContents: ({ onCreateSection }: { onCreateSection: (parentId?: string | null) => void }) => (
    <button
      type="button"
      data-testid="toc-panel"
      onClick={() => onCreateSection(null)}
    >
      TOC
    </button>
  ),
}));

vi.mock('./SectionEditor', () => ({
  SectionEditor: ({
    section,
    onTitleChange,
    onContentChange,
    onNotesChange,
    onStatusChange,
  }: {
    section: { title?: string } | null;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
    onNotesChange: (notes: string) => void;
    onStatusChange: (status: string) => void;
  }) => (
    <div>
      <div data-testid="section-editor">Section: {section?.title ?? 'None'}</div>
      <button type="button" onClick={() => onTitleChange('Updated Section Title')}>
        Mock Title Update
      </button>
      <button type="button" onClick={() => onContentChange('<p>Updated section content</p>')}>
        Mock Content Update
      </button>
      <button type="button" onClick={() => onNotesChange('Updated notes')}>
        Mock Notes Update
      </button>
      <button type="button" onClick={() => onStatusChange('review')}>
        Mock Status Update
      </button>
    </div>
  ),
}));

vi.mock('./FocusMode', () => ({
  FocusMode: ({ children }: { children: ReactNode }) => (
    <div data-testid="focus-mode-wrapper">{children}</div>
  ),
  FocusModeToggle: () => <button type="button">Focus Toggle</button>,
}));

function makeLongDraft(overrides: Partial<LongDraft> = {}): LongDraft {
  const now = new Date('2026-02-12T10:00:00.000Z');
  return {
    id: 'doc-1',
    title: 'Document One',
    sectionIds: [],
    settings: {
      fonts: ['Crimson Pro', 'Inter', 'Georgia'],
      defaultFont: 'Crimson Pro',
      showTOC: true,
      showWordCount: true,
      focusModeEnabled: false,
      typewriterMode: false,
    },
    metadata: {
      createdAt: now,
      modifiedAt: now,
      totalWordCount: 250,
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeSection(overrides: Partial<Section> = {}): Section {
  const now = new Date('2026-02-12T10:00:00.000Z');
  return {
    id: 'section-1',
    longDraftId: 'doc-1',
    title: 'Intro',
    content: '<p>Intro</p>',
    order: 0,
    parentId: null,
    footnotes: [],
    status: 'draft',
    notes: '',
    wordCount: 1,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('LongDrafts', () => {
  beforeEach(() => {
    useLongDraftsStore.setState(useLongDraftsStore.getInitialState(), true);
  });

  it('renders loading state', () => {
    const loadLongDrafts = vi.fn().mockResolvedValue(undefined);
    useLongDraftsStore.setState({
      isLoading: true,
      error: null,
      loadLongDrafts,
    });

    render(<LongDrafts />);
    expect(screen.getByText('Loading documents...')).toBeInTheDocument();
  });

  it('renders error state and retries loading', async () => {
    const loadLongDrafts = vi.fn().mockResolvedValue(undefined);
    useLongDraftsStore.setState({
      isLoading: false,
      error: 'Network issue',
      loadLongDrafts,
    });

    render(<LongDrafts />);

    await waitFor(() => {
      expect(screen.getByText('Error loading documents')).toBeInTheDocument();
    });

    const callsBeforeRetry = loadLongDrafts.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(loadLongDrafts.mock.calls.length).toBe(callsBeforeRetry + 1);
  });

  it('renders empty state and creates first document', async () => {
    const loadLongDrafts = vi.fn().mockResolvedValue(undefined);
    const createLongDraft = vi.fn().mockResolvedValue(makeLongDraft({ id: 'new-doc' }));
    useLongDraftsStore.setState({
      longDrafts: [],
      currentLongDraftId: null,
      isLoading: false,
      error: null,
      loadLongDrafts,
      createLongDraft,
    });

    render(<LongDrafts />);

    expect(screen.getByText('No documents yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Create New Document/i }));
    await waitFor(() => {
      expect(createLongDraft).toHaveBeenCalledTimes(1);
    });
  });

  it('renders main layout, handles shortcuts, and supports document switching/deletion', async () => {
    const loadLongDrafts = vi.fn().mockResolvedValue(undefined);
    const createLongDraft = vi.fn().mockResolvedValue(makeLongDraft({ id: 'new-doc' }));
    const createSection = vi.fn().mockResolvedValue(makeSection({ id: 'new-section' }));
    const updateSection = vi.fn().mockResolvedValue(undefined);
    const setCurrentLongDraft = vi.fn();
    const deleteLongDraft = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const docOne = makeLongDraft({ id: 'doc-1', title: 'Document One', metadata: { createdAt: new Date('2026-02-12T10:00:00.000Z'), modifiedAt: new Date('2026-02-12T10:00:00.000Z'), totalWordCount: 100 } });
    const docTwo = makeLongDraft({ id: 'doc-2', title: 'Document Two', metadata: { createdAt: new Date('2026-02-12T11:00:00.000Z'), modifiedAt: new Date('2026-02-12T11:00:00.000Z'), totalWordCount: 200 } });
    const section = makeSection({ id: 'section-1', longDraftId: docOne.id, title: 'Intro', wordCount: 42 });

    useLongDraftsStore.setState({
      longDrafts: [docOne, docTwo],
      currentLongDraftId: docOne.id,
      currentSectionId: section.id,
      sectionsMap: new Map([[docOne.id, [section]], [docTwo.id, []]]),
      isLoading: false,
      error: null,
      viewMode: 'normal',
      loadLongDrafts,
      createLongDraft,
      createSection,
      updateSection,
      setCurrentLongDraft,
      deleteLongDraft,
    });

    render(<LongDrafts />);

    expect(screen.getByTestId('toc-panel')).toBeInTheDocument();
    expect(screen.getByTestId('section-editor')).toHaveTextContent('Section: Intro');

    fireEvent.click(screen.getByRole('button', { name: 'Mock Title Update' }));
    expect(updateSection).toHaveBeenCalledWith(section.id, { title: 'Updated Section Title' });

    fireEvent.click(screen.getByRole('button', { name: 'Mock Content Update' }));
    expect(updateSection).toHaveBeenCalledWith(section.id, { content: '<p>Updated section content</p>' });

    fireEvent.click(screen.getByRole('button', { name: 'Mock Notes Update' }));
    expect(updateSection).toHaveBeenCalledWith(section.id, { notes: 'Updated notes' });

    fireEvent.click(screen.getByRole('button', { name: 'Mock Status Update' }));
    expect(updateSection).toHaveBeenCalledWith(section.id, { status: 'review' });

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    expect(createSection).toHaveBeenCalledWith(docOne.id);

    fireEvent.keyDown(window, { key: 'N', ctrlKey: true, shiftKey: true });
    expect(createLongDraft).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Document One/i }));
    expect(screen.getByText('Documents')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Document Two'));
    expect(setCurrentLongDraft).toHaveBeenCalledWith('doc-2');

    fireEvent.click(screen.getByRole('button', { name: /Document One/i }));
    fireEvent.click(screen.getAllByTitle('Delete document')[1]);
    await waitFor(() => {
      expect(deleteLongDraft).toHaveBeenCalledWith('doc-2');
    });

    confirmSpy.mockRestore();
  });

  it('guards section creation and updates when current ids are missing', async () => {
    const createSection = vi.fn().mockResolvedValue(makeSection({ id: 'new-section' }));
    const updateSection = vi.fn().mockResolvedValue(undefined);

    useLongDraftsStore.setState({
      longDrafts: [],
      currentLongDraftId: null,
      currentSectionId: null,
      isLoading: false,
      error: null,
      loadLongDrafts: vi.fn().mockResolvedValue(undefined),
      createLongDraft: vi.fn().mockResolvedValue(makeLongDraft({ id: 'new-doc' })),
      createSection,
      updateSection,
    });

    const { rerender } = render(<LongDrafts />);
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    expect(createSection).not.toHaveBeenCalled();

    const docNoMetadata = {
      ...makeLongDraft({ id: 'doc-no-meta', title: 'No Metadata' }),
      metadata: undefined,
    } as unknown as LongDraft;

    act(() => {
      useLongDraftsStore.setState({
        longDrafts: [docNoMetadata],
        currentLongDraftId: docNoMetadata.id,
        currentSectionId: null,
        sectionsMap: new Map([[docNoMetadata.id, []]]),
        isLoading: false,
        error: null,
        viewMode: 'normal',
      });
    });
    rerender(<LongDrafts />);

    expect(screen.getByText('0 words')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mock Title Update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock Content Update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock Notes Update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock Status Update' }));
    expect(updateSection).not.toHaveBeenCalled();
  });

  it('hides table of contents while in focus mode', () => {
    const doc = makeLongDraft({ id: 'doc-focus', title: 'Focus Doc' });
    const section = makeSection({ id: 'section-focus', longDraftId: doc.id, title: 'Focus Intro' });

    useLongDraftsStore.setState({
      longDrafts: [doc],
      currentLongDraftId: doc.id,
      currentSectionId: section.id,
      sectionsMap: new Map([[doc.id, [section]]]),
      isLoading: false,
      error: null,
      viewMode: 'focus',
      loadLongDrafts: vi.fn().mockResolvedValue(undefined),
      createLongDraft: vi.fn().mockResolvedValue(doc),
      createSection: vi.fn().mockResolvedValue(section),
      updateSection: vi.fn().mockResolvedValue(undefined),
    });

    render(<LongDrafts />);
    expect(screen.queryByTestId('toc-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('focus-mode-wrapper')).toBeInTheDocument();
  });
});
