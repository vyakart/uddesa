import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { useLongDraftsStore } from '@/stores/longDraftsStore';
import type { LongDraft, Section } from '@/types/longDrafts';
import { LongDrafts } from './LongDrafts';

vi.mock('@/components/common/DiaryLayout', () => ({
  DiaryLayout: ({
    toolbar,
    sidebar,
    canvas,
    status,
    rightPanel,
  }: {
    toolbar?: ReactNode;
    sidebar?: ReactNode;
    canvas?: ReactNode;
    status?: ReactNode | { left?: ReactNode; right?: ReactNode };
    rightPanel?: ReactNode;
  }) => {
    const statusSlots =
      typeof status === 'object' && status !== null && !Array.isArray(status)
        ? status
        : { left: status };

    return (
      <div data-testid="long-drafts-layout">
        <div data-testid="long-drafts-toolbar">{toolbar}</div>
        {sidebar ? <div data-testid="long-drafts-sidebar">{sidebar}</div> : null}
        <div data-testid="long-drafts-canvas">{canvas}</div>
        <div data-testid="long-drafts-status-left">{statusSlots.left}</div>
        <div data-testid="long-drafts-status-right">{statusSlots.right}</div>
        {rightPanel ? <div data-testid="long-drafts-right-panel">{rightPanel}</div> : null}
      </div>
    );
  },
}));

vi.mock('./TableOfContents', () => ({
  TableOfContents: ({
    onCreateSection,
    variant = 'sidebar',
  }: {
    onCreateSection: (parentId?: string | null) => void;
    variant?: 'sidebar' | 'panel';
  }) => (
    <button
      type="button"
      data-testid={`toc-panel-${variant}`}
      onClick={() => onCreateSection(null)}
    >
      TOC {variant}
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
    useAppStore.setState(useAppStore.getInitialState(), true);
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
    expect(screen.getByTestId('long-drafts-status-left')).toHaveTextContent('Loading Long Drafts...');
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

    expect(screen.getByText('Start your first long draft')).toBeInTheDocument();
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
    const updateLongDraft = vi.fn().mockResolvedValue(undefined);
    const toggleFocusMode = vi.fn();
    const setCurrentLongDraft = vi.fn();
    const deleteLongDraft = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const docOne = makeLongDraft({
      id: 'doc-1',
      title: 'Document One',
      subtitle: 'A Memoir',
      author: 'Alex Writer',
      metadata: {
        createdAt: new Date('2026-02-12T10:00:00.000Z'),
        modifiedAt: new Date('2026-02-12T10:00:00.000Z'),
        totalWordCount: 100,
      },
    });
    const docTwo = makeLongDraft({
      id: 'doc-2',
      title: 'Document Two',
      metadata: {
        createdAt: new Date('2026-02-12T11:00:00.000Z'),
        modifiedAt: new Date('2026-02-12T11:00:00.000Z'),
        totalWordCount: 200,
      },
    });
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
      updateLongDraft,
      toggleFocusMode,
      setCurrentLongDraft,
      deleteLongDraft,
    });

    render(<LongDrafts />);

    expect(screen.getByTestId('toc-panel-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('section-editor')).toHaveTextContent('Section: Intro');
    expect(screen.getByRole('button', { name: 'Focus Mode' })).toBeInTheDocument();
    expect(screen.getByTestId('long-drafts-document-metadata')).toHaveTextContent('Updated Feb 12, 2026');
    expect(screen.getByTestId('long-drafts-document-metadata')).toHaveTextContent('Created Feb 12, 2026');
    expect(screen.getByTestId('long-drafts-document-metadata')).toHaveTextContent('Author Alex Writer');
    expect(screen.getByTestId('long-drafts-document-metadata')).toHaveTextContent('A Memoir');
    expect(screen.getByTestId('long-drafts-status-left')).toHaveTextContent('Section: Intro');
    expect(screen.getByTestId('long-drafts-status-right')).toHaveTextContent('42/42 words');

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

    fireEvent.click(screen.getByRole('button', { name: 'TOC Panel' }));
    expect(screen.getByTestId('long-drafts-right-panel')).toBeInTheDocument();
    expect(screen.getByTestId('toc-panel-panel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByText('Adjust metadata and workspace defaults for this document.')).toBeInTheDocument();
    fireEvent.blur(screen.getByLabelText('Title'), { target: { value: 'Updated Doc' } });
    await waitFor(() => {
      expect(updateLongDraft).toHaveBeenCalledWith('doc-1', { title: 'Updated Doc' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Focus Mode' }));
    expect(toggleFocusMode).toHaveBeenCalledTimes(1);

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

    expect(screen.getByTestId('long-drafts-status-right')).toHaveTextContent('0/0 words');

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
    expect(screen.queryByTestId('toc-panel-sidebar')).not.toBeInTheDocument();
    expect(screen.getByTestId('focus-mode-wrapper')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exit Focus' })).toBeInTheDocument();
  });
});
