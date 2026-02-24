import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAcademicStore } from '@/stores/academicStore';
import { useAppStore } from '@/stores/appStore';
import type { AcademicPaper, AcademicSection } from '@/types/academic';
import { Academic } from './Academic';

vi.mock('@/components/common/DiaryLayout', () => ({
  DiaryLayout: ({
    toolbar,
    sidebar,
    sidebarHeader,
    sidebarFooter,
    canvas,
    rightPanel,
    status,
  }: {
    toolbar?: ReactNode;
    sidebar?: ReactNode;
    sidebarHeader?: ReactNode;
    sidebarFooter?: ReactNode;
    canvas?: ReactNode;
    rightPanel?: ReactNode;
    status?: ReactNode | { left?: ReactNode; right?: ReactNode };
  }) => (
    <div data-testid="academic-layout">
      <div data-testid="academic-toolbar">{toolbar}</div>
      <div data-testid="academic-sidebar-header">{sidebarHeader}</div>
      <div data-testid="academic-sidebar">{sidebar}</div>
      <div data-testid="academic-sidebar-footer">{sidebarFooter}</div>
      <div data-testid="academic-canvas">{canvas}</div>
      <div data-testid="academic-right-panel">{rightPanel}</div>
      <div data-testid="academic-status">{typeof status === 'object' ? `${String(status?.left)}|${String(status?.right)}` : status}</div>
    </div>
  ),
}));

vi.mock('./AcademicSectionEditor', () => ({
  AcademicSectionEditor: ({
    section,
    onTitleChange,
    onContentChange,
  }: {
    section: { title?: string } | null;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
  }) => (
    <div data-testid="academic-section-editor">
      Section: {section?.title ?? 'None'}
      <button type="button" onClick={() => onTitleChange('Updated Academic Title')}>
        Mock Title Update
      </button>
      <button type="button" onClick={() => onContentChange('<p>Updated content</p>')}>
        Mock Content Update
      </button>
    </div>
  ),
}));

vi.mock('./ReferenceLibraryPanel', () => ({
  ReferenceLibraryPanel: () => <div data-testid="reference-library-panel">Reference Library Panel</div>,
}));

vi.mock('./BibliographyManager', () => ({
  BibliographyManager: () => <div data-testid="bibliography-panel">Bibliography Panel</div>,
}));

vi.mock('./TemplateSelector', () => ({
  TemplateSelector: ({
    onSelect,
    onClose,
  }: {
    onSelect: (title: string, template: string | null, options?: unknown) => void;
    onClose: () => void;
  }) => (
    <div data-testid="template-selector">
      Template Selector
      <button type="button" onClick={() => onSelect('Generated Paper', 'imrad')}>
        Confirm Template
      </button>
      <button type="button" onClick={() => onSelect('Generated Without Template', null)}>
        Confirm Without Template
      </button>
      <button type="button" onClick={onClose}>
        Close Template
      </button>
    </div>
  ),
}));

function makePaper(overrides: Partial<AcademicPaper> = {}): AcademicPaper {
  const now = new Date('2026-02-12T10:00:00.000Z');
  return {
    id: 'paper-1',
    title: 'Paper One',
    authors: [],
    abstract: '',
    keywords: [],
    sectionIds: [],
    citationIds: [],
    bibliographyEntryIds: [],
    figureIds: [],
    tableIds: [],
    settings: {
      citationStyle: 'apa7',
      pageSize: 'a4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      lineSpacing: 2,
      fontFamily: 'Times New Roman',
      fontSize: 12,
    },
    metadata: {
      createdAt: now,
      modifiedAt: now,
      totalWordCount: 0,
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeSection(overrides: Partial<AcademicSection> = {}): AcademicSection {
  return {
    id: 'section-1',
    paperId: 'paper-1',
    title: 'Introduction',
    content: '<p>intro</p>',
    order: 0,
    parentId: null,
    wordCount: 20,
    ...overrides,
  };
}

describe('Academic', () => {
  beforeEach(() => {
    useAcademicStore.setState(useAcademicStore.getInitialState(), true);
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  it('renders loading state', () => {
    const loadPapers = vi.fn().mockResolvedValue(undefined);
    const loadBibliographyEntries = vi.fn().mockResolvedValue(undefined);

    useAcademicStore.setState({
      isLoading: true,
      error: null,
      loadPapers,
      loadBibliographyEntries,
    });

    render(<Academic />);
    expect(screen.getByText('Loading papers...')).toBeInTheDocument();
  });

  it('renders error state and supports retry', async () => {
    const loadPapers = vi.fn().mockResolvedValue(undefined);
    const loadBibliographyEntries = vi.fn().mockResolvedValue(undefined);

    useAcademicStore.setState({
      isLoading: false,
      error: 'Academic load failed',
      loadPapers,
      loadBibliographyEntries,
    });

    render(<Academic />);

    expect(screen.getByText('Academic load failed')).toBeInTheDocument();
    const callsBeforeRetry = loadPapers.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(loadPapers.mock.calls.length).toBe(callsBeforeRetry + 1);
  });

  it('renders empty state and creates paper via template selector', async () => {
    const loadPapers = vi.fn().mockResolvedValue(undefined);
    const loadBibliographyEntries = vi.fn().mockResolvedValue(undefined);
    const createPaper = vi.fn().mockResolvedValue(makePaper({ id: 'generated-paper' }));

    useAcademicStore.setState({
      papers: [],
      currentPaperId: null,
      isLoading: false,
      error: null,
      loadPapers,
      loadBibliographyEntries,
      createPaper,
    });

    render(<Academic />);

    expect(screen.getByText('No papers yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create Paper' }));
    expect(await screen.findByTestId('template-selector')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Template' }));
    await waitFor(() => {
      expect(createPaper).toHaveBeenCalledWith('Generated Paper', 'imrad');
    });
  });

  it('renders main editor flow and handles toolbar/sidebar/panel interactions', async () => {
    const loadPapers = vi.fn().mockResolvedValue(undefined);
    const loadBibliographyEntries = vi.fn().mockResolvedValue(undefined);
    const createPaper = vi.fn().mockResolvedValue(makePaper({ id: 'new-paper' }));
    const setCurrentPaper = vi.fn();
    const createSection = vi.fn().mockResolvedValue(makeSection({ id: 'section-new' }));
    const updateSection = vi.fn().mockResolvedValue(undefined);
    const deleteSection = vi.fn().mockResolvedValue(undefined);
    const setCurrentSection = vi.fn();
    const setCitationStyle = vi.fn();

    const paperOne = makePaper({ id: 'paper-1', title: 'Paper One' });
    const paperTwo = makePaper({ id: 'paper-2', title: 'Paper Two' });
    const section = makeSection({ id: 'section-1', paperId: paperOne.id, title: 'Intro', wordCount: 42 });

    useAcademicStore.setState({
      papers: [paperOne, paperTwo],
      currentPaperId: paperOne.id,
      currentSectionId: section.id,
      sectionsMap: new Map([[paperOne.id, [section]], [paperTwo.id, []]]),
      isLoading: false,
      error: null,
      citationStyle: 'apa7',
      loadPapers,
      loadBibliographyEntries,
      createPaper,
      setCurrentPaper,
      createSection,
      updateSection,
      deleteSection,
      setCurrentSection,
      setCitationStyle,
      getSectionHierarchy: vi.fn(() => [{ section, children: [], depth: 0 }]),
    });

    useAppStore.setState({
      ...useAppStore.getState(),
      rightPanel: {
        isOpen: true,
        panelType: 'bibliography',
        context: { source: 'academic' },
      },
    });

    render(<Academic />);

    expect(screen.getByTestId('academic-section-editor')).toHaveTextContent('Section: Intro');
    expect(await screen.findByTestId('bibliography-panel')).toBeInTheDocument();
    expect(screen.getByTestId('academic-status')).toHaveTextContent('42 words · 5 chars');

    fireEvent.click(screen.getByRole('button', { name: 'Mock Title Update' }));
    expect(updateSection).toHaveBeenCalledWith(section.id, { title: 'Updated Academic Title' });

    fireEvent.click(screen.getByRole('button', { name: 'Mock Content Update' }));
    expect(updateSection).toHaveBeenCalledWith(section.id, { content: '<p>Updated content</p>' });

    fireEvent.change(screen.getByLabelText('Select paper'), {
      target: { value: 'paper-2' },
    });
    expect(setCurrentPaper).toHaveBeenCalledWith('paper-2');

    fireEvent.click(screen.getByRole('button', { name: 'New Section' }));
    expect(createSection).toHaveBeenCalledWith('paper-1');

    fireEvent.change(screen.getByLabelText('Citation style'), { target: { value: 'mla9' } });
    expect(setCitationStyle).toHaveBeenCalledWith('mla9');

    fireEvent.click(screen.getByRole('button', { name: 'Bibliography' }));
    expect(useAppStore.getState().rightPanel.isOpen).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Reference Library' }));
    expect(useAppStore.getState().rightPanel.panelType).toBe('reference-library');

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    expect(await screen.findByTestId('template-selector')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(useAppStore.getState().rightPanel.panelType).toBe('bibliography');
  });

  it('does not recompute section hierarchy on unrelated app-store re-renders', async () => {
    const loadPapers = vi.fn().mockResolvedValue(undefined);
    const loadBibliographyEntries = vi.fn().mockResolvedValue(undefined);
    const paper = makePaper({ id: 'paper-render' });
    const section = makeSection({ id: 'section-render', paperId: paper.id, title: 'Intro', wordCount: 10 });
    const getSectionHierarchy = vi.fn(() => [{ section, children: [], depth: 0 }]);

    useAcademicStore.setState({
      papers: [paper],
      currentPaperId: paper.id,
      currentSectionId: section.id,
      sectionsMap: new Map([[paper.id, [section]]]),
      isLoading: false,
      error: null,
      loadPapers,
      loadBibliographyEntries,
      getSectionHierarchy,
    });

    render(<Academic />);

    expect(getSectionHierarchy).toHaveBeenCalledTimes(1);

    act(() => {
      useAppStore.setState({
        ...useAppStore.getState(),
        rightPanel: {
          isOpen: true,
          panelType: 'reference-library',
          context: { source: 'academic' },
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('reference-library-panel')).toBeInTheDocument();
    });
    expect(getSectionHierarchy).toHaveBeenCalledTimes(1);
  });

  it('handles template close/null-template and delete-cancel path', async () => {
    const loadPapers = vi.fn().mockResolvedValue(undefined);
    const loadBibliographyEntries = vi.fn().mockResolvedValue(undefined);
    const createPaper = vi.fn().mockResolvedValue(makePaper({ id: 'new-paper' }));
    const deleteSection = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const paperOne = makePaper({ id: 'paper-empty', title: 'Paper Empty Sections' });
    const untitledSection = makeSection({ id: 'section-empty-title', paperId: paperOne.id, title: '', wordCount: 0 });

    useAcademicStore.setState({
      papers: [paperOne],
      currentPaperId: paperOne.id,
      currentSectionId: null,
      sectionsMap: new Map([[paperOne.id, [untitledSection]]]),
      isLoading: false,
      error: null,
      citationStyle: 'apa7',
      loadPapers,
      loadBibliographyEntries,
      createPaper,
      setCurrentPaper: vi.fn(),
      createSection: vi.fn().mockResolvedValue(untitledSection),
      updateSection: vi.fn().mockResolvedValue(undefined),
      deleteSection,
      setCurrentSection: vi.fn(),
      setCitationStyle: vi.fn(),
      getSectionHierarchy: vi.fn(() => []),
    });

    render(<Academic />);
    expect(screen.getByText('No sections yet')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ New Paper' }));
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close Template' }));
    expect(screen.queryByTestId('template-selector')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Without Template' }));
    await waitFor(() => {
      expect(createPaper).toHaveBeenCalledWith('Generated Without Template', undefined);
    });

    act(() => {
      useAcademicStore.setState({
        ...useAcademicStore.getState(),
        getSectionHierarchy: vi.fn(() => [{ section: untitledSection, children: [], depth: 0 }]),
      });
    });

    fireEvent.click(screen.getByTitle('Delete section'));
    await waitFor(() => {
      expect(deleteSection).not.toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
