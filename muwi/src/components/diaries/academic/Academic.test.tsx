import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAcademicStore } from '@/stores/academicStore';
import type { AcademicPaper, AcademicSection } from '@/types/academic';
import { Academic } from './Academic';

vi.mock('@/components/common/DiaryLayout', () => ({
  DiaryLayout: ({ children, toolbar }: { children: ReactNode; toolbar?: ReactNode }) => (
    <div data-testid="academic-layout">
      <div data-testid="academic-toolbar">{toolbar}</div>
      <div data-testid="academic-content">{children}</div>
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
  ReferenceLibraryPanel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="bibliography-panel">
      Bibliography Panel
      <button type="button" onClick={onClose}>
        Close Bibliography
      </button>
    </div>
  ),
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
    expect(screen.getByText('Loading...')).toBeInTheDocument();
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

    await waitFor(() => {
      expect(screen.getByText('Academic load failed')).toBeInTheDocument();
    });

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

    expect(screen.getByText('No academic papers yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /New Academic Paper/i }));
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Template' }));
    await waitFor(() => {
      expect(createPaper).toHaveBeenCalledWith('Generated Paper', 'imrad');
    });
  });

  it('renders main editor flow and handles toolbar/shortcut interactions', async () => {
    const loadPapers = vi.fn().mockResolvedValue(undefined);
    const loadBibliographyEntries = vi.fn().mockResolvedValue(undefined);
    const createPaper = vi.fn().mockResolvedValue(makePaper({ id: 'new-paper' }));
    const setCurrentPaper = vi.fn();
    const createSection = vi.fn().mockResolvedValue(makeSection({ id: 'section-new' }));
    const updateSection = vi.fn().mockResolvedValue(undefined);
    const deleteSection = vi.fn().mockResolvedValue(undefined);
    const setCurrentSection = vi.fn();
    const toggleTOC = vi.fn();
    const toggleBibliographyPanel = vi.fn();
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
      isTOCVisible: true,
      isBibliographyPanelVisible: true,
      citationStyle: 'apa7',
      loadPapers,
      loadBibliographyEntries,
      createPaper,
      setCurrentPaper,
      createSection,
      updateSection,
      deleteSection,
      setCurrentSection,
      toggleTOC,
      toggleBibliographyPanel,
      setCitationStyle,
      getSectionHierarchy: vi.fn(() => [{ section, children: [], depth: 0 }]),
    });

    render(<Academic />);

    expect(screen.getByTestId('academic-section-editor')).toHaveTextContent('Section: Intro');
    expect(screen.getByTestId('bibliography-panel')).toBeInTheDocument();
    expect(screen.getByText(/42 words/)).toBeInTheDocument();
    expect(screen.getByText(/5 chars/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mock Title Update' }));
    expect(updateSection).toHaveBeenCalledWith(section.id, { title: 'Updated Academic Title' });

    fireEvent.click(screen.getByRole('button', { name: 'Mock Content Update' }));
    expect(updateSection).toHaveBeenCalledWith(section.id, { content: '<p>Updated content</p>' });

    fireEvent.click(screen.getByRole('button', { name: /Paper One/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Paper Two' }));
    expect(setCurrentPaper).toHaveBeenCalledWith('paper-2');

    fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
    expect(createSection).toHaveBeenCalledWith('paper-1');

    fireEvent.click(screen.getByRole('button', { name: 'APA 7th' }));
    fireEvent.click(screen.getByRole('button', { name: 'MLA 9th' }));
    expect(setCitationStyle).toHaveBeenCalledWith('mla9');

    fireEvent.click(screen.getByTitle('Toggle Table of Contents'));
    expect(toggleTOC).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTitle('Toggle Bibliography Panel'));
    expect(toggleBibliographyPanel).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(toggleBibliographyPanel).toHaveBeenCalled();
  });

  it('handles template close/null-template and empty-section/delete-cancel paths', async () => {
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
      isTOCVisible: true,
      isBibliographyPanelVisible: false,
      citationStyle: 'apa7',
      loadPapers,
      loadBibliographyEntries,
      createPaper,
      setCurrentPaper: vi.fn(),
      createSection: vi.fn().mockResolvedValue(untitledSection),
      updateSection: vi.fn().mockResolvedValue(undefined),
      deleteSection,
      setCurrentSection: vi.fn(),
      toggleTOC: vi.fn(),
      toggleBibliographyPanel: vi.fn(),
      setCitationStyle: vi.fn(),
      getSectionHierarchy: vi.fn(() => []),
    });

    render(<Academic />);
    expect(screen.getByText('No sections yet')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Paper Empty Sections/i }));
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
    fireEvent.click(screen.getByTitle('Toggle Table of Contents'));
    fireEvent.click(screen.getByTitle('Toggle Table of Contents'));

    const deleteButton = screen.getByText('Untitled').parentElement?.querySelector('button');
    expect(deleteButton).toBeTruthy();
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(deleteSection).not.toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
