import { fireEvent, render, screen, waitFor } from '@/test';
import { useLongDraftsStore } from '@/stores/longDraftsStore';
import type { Section } from '@/types/longDrafts';
import { TableOfContents } from './TableOfContents';

function makeSection(overrides: Partial<Section> = {}): Section {
  const now = new Date('2026-02-12T10:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    longDraftId: 'doc-1',
    title: 'Section',
    content: '',
    order: 0,
    parentId: null,
    footnotes: [],
    status: 'draft',
    notes: '',
    wordCount: 0,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('TableOfContents', () => {
  beforeEach(() => {
    useLongDraftsStore.setState(useLongDraftsStore.getInitialState(), true);
  });

  it('renders collapsed TOC state and toggles visibility', () => {
    const toggleTOC = vi.fn();
    useLongDraftsStore.setState({
      isTOCVisible: false,
      toggleTOC,
    });

    render(<TableOfContents onCreateSection={vi.fn()} />);

    fireEvent.click(screen.getByTitle('Show table of contents'));
    expect(toggleTOC).toHaveBeenCalledTimes(1);
  });

  it('renders hierarchy, supports section actions, and context-menu operations', async () => {
    const setCurrentSection = vi.fn();
    const toggleTOC = vi.fn();
    const deleteSection = vi.fn().mockResolvedValue(undefined);
    const onCreateSection = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const root = makeSection({
      id: 'root-1',
      title: 'Introduction',
      order: 0,
      wordCount: 120,
      status: 'in-progress',
    });
    const child = makeSection({
      id: 'child-1',
      title: 'Background',
      parentId: root.id,
      order: 0,
      wordCount: 80,
      status: 'draft',
    });
    const anotherRoot = makeSection({
      id: 'root-2',
      title: 'Methods',
      order: 1,
      wordCount: 200,
      status: 'review',
      isLocked: true,
    });

    useLongDraftsStore.setState({
      currentLongDraftId: 'doc-1',
      currentSectionId: 'root-1',
      isTOCVisible: true,
      sectionsMap: new Map([['doc-1', [root, child, anotherRoot]]]),
      setCurrentSection,
      toggleTOC,
      deleteSection,
    });

    render(<TableOfContents onCreateSection={onCreateSection} />);

    expect(screen.getByText('Contents')).toBeInTheDocument();
    expect(screen.getByText('2 sections')).toBeInTheDocument();
    expect(screen.getByText('400 words')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Methods'));
    expect(setCurrentSection).toHaveBeenCalledWith('root-2');

    fireEvent.click(screen.getByRole('button', { name: 'Add Section' }));
    expect(onCreateSection).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByTitle('Hide table of contents'));
    expect(toggleTOC).toHaveBeenCalledTimes(1);

    fireEvent.contextMenu(screen.getByText('Introduction'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Subsection' }));
    expect(onCreateSection).toHaveBeenCalledWith('root-1');

    fireEvent.contextMenu(screen.getByText('Introduction'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Section' }));
    await waitFor(() => {
      expect(deleteSection).toHaveBeenCalledWith('root-1');
    });

    confirmSpy.mockRestore();
  });
});
