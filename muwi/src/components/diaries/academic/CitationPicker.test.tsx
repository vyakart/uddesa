import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAcademicStore } from '@/stores/academicStore';
import type { BibliographyEntry } from '@/types/academic';
import { CitationPicker } from './CitationPicker';

vi.mock('@/utils/citation', () => ({
  formatInTextCitation: (
    entry: { title: string },
    style: string,
    pageNumbers?: string
  ) => `[${entry.title}|${style}${pageNumbers ? `|${pageNumbers}` : ''}]`,
}));

function makeEntry(overrides: Partial<BibliographyEntry> = {}): BibliographyEntry {
  const now = new Date('2026-02-12T11:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    type: 'article',
    authors: ['Ada Lovelace', 'Alan Turing'],
    title: 'Foundations of Computing',
    year: 2024,
    journal: 'Journal of CS',
    volume: '1',
    issue: '2',
    pages: '1-10',
    tags: ['cs'],
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('CitationPicker', () => {
  beforeAll(() => {
    // JSDOM doesn't implement this in our environment
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  beforeEach(() => {
    useAcademicStore.setState(useAcademicStore.getInitialState(), true);
  });

  it('loads references, filters/searches, and inserts citation for selected entry', async () => {
    const loadBibliographyEntries = vi.fn().mockResolvedValue(undefined);
    const addCitation = vi.fn().mockResolvedValue(undefined);
    const onInsert = vi.fn();
    const onClose = vi.fn();

    const first = makeEntry({ id: 'entry-1', title: 'Foundations of Computing' });
    const second = makeEntry({ id: 'entry-2', title: 'Advanced Algorithms' });

    useAcademicStore.setState({
      bibliographyEntries: [first, second],
      citationStyle: 'apa7',
      currentPaperId: 'paper-1',
      loadBibliographyEntries,
      addCitation,
    });

    render(<CitationPicker onInsert={onInsert} onClose={onClose} />);

    expect(loadBibliographyEntries).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('Search references...'), {
      target: { value: 'Advanced' },
    });
    fireEvent.click(screen.getByText('Advanced Algorithms'));

    fireEvent.change(screen.getByPlaceholderText('e.g., 45-47'), {
      target: { value: '45-47' },
    });
    expect(screen.getByText('[Advanced Algorithms|apa7|45-47]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Insert Citation' }));

    await waitFor(() => {
      expect(addCitation).toHaveBeenCalledWith('paper-1', 'entry-2', '45-47');
    });
    expect(onInsert).toHaveBeenCalledWith('[Advanced Algorithms|apa7|45-47]', second);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation and escape behavior', () => {
    const onClose = vi.fn();
    const first = makeEntry({ id: 'entry-1', title: 'First Entry' });
    const second = makeEntry({ id: 'entry-2', title: 'Second Entry' });

    useAcademicStore.setState({
      bibliographyEntries: [first, second],
      citationStyle: 'mla9',
      currentPaperId: 'paper-1',
      loadBibliographyEntries: vi.fn().mockResolvedValue(undefined),
      addCitation: vi.fn().mockResolvedValue(undefined),
    });

    render(<CitationPicker onInsert={vi.fn()} onClose={onClose} />);
    const searchInput = screen.getByPlaceholderText('Search references...');

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(screen.getByText('Back to search')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Back to search' }), { key: 'Escape' });
    expect(screen.getByPlaceholderText('Search references...')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByPlaceholderText('Search references...'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows empty messages and blocks insert when no current paper exists', async () => {
    const addCitation = vi.fn().mockResolvedValue(undefined);
    const onInsert = vi.fn();
    const onClose = vi.fn();

    useAcademicStore.setState({
      bibliographyEntries: [],
      citationStyle: 'apa7',
      currentPaperId: null,
      loadBibliographyEntries: vi.fn().mockResolvedValue(undefined),
      addCitation,
    });

    render(<CitationPicker onInsert={onInsert} onClose={onClose} />);
    expect(screen.getByText('No references in library')).toBeInTheDocument();

    act(() => {
      useAcademicStore.setState({
        ...useAcademicStore.getState(),
        bibliographyEntries: [makeEntry({ id: 'entry-one', title: 'Visible Entry' })],
      });
    });

    fireEvent.change(screen.getByPlaceholderText('Search references...'), {
      target: { value: 'missing-query' },
    });
    expect(screen.getByText('No matching references')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search references...'), {
      target: { value: '' },
    });
    fireEvent.keyDown(screen.getByPlaceholderText('Search references...'), { key: 'ArrowUp' });
    fireEvent.keyDown(screen.getByPlaceholderText('Search references...'), { key: 'Enter' });
    expect(screen.getByText('Back to search')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Insert Citation' }));
    await waitFor(() => {
      expect(addCitation).not.toHaveBeenCalled();
    });
    expect(onInsert).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
