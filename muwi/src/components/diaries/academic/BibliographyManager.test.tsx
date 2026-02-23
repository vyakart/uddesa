import { fireEvent, render, screen, waitFor } from '@/test';
import { useAcademicStore } from '@/stores/academicStore';
import type { BibliographyEntry } from '@/types/academic';
import { BibliographyManager } from './BibliographyManager';
import { fetchFromDOI, formatBibliographyEntry, parseBibTeX } from '@/utils/citation';

vi.mock('@/utils/citation', () => ({
  formatBibliographyEntry: vi.fn((entry: BibliographyEntry) => `${entry.title} (${entry.year})`),
  parseBibTeX: vi.fn(),
  fetchFromDOI: vi.fn(),
}));

function makeEntry(overrides: Partial<BibliographyEntry> = {}): BibliographyEntry {
  const now = new Date('2026-02-12T12:00:00.000Z');
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
    doi: '10.1000/foundations',
    tags: ['cs'],
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('BibliographyManager', () => {
  beforeEach(() => {
    useAcademicStore.setState(useAcademicStore.getInitialState(), true);
    vi.clearAllMocks();
    vi.mocked(formatBibliographyEntry).mockImplementation(
      (entry) => `${entry.title} (${entry.year})`
    );
  });

  it('filters/selects entries and supports edit/delete actions', async () => {
    const updateBibliographyEntry = vi.fn().mockResolvedValue(undefined);
    const deleteBibliographyEntry = vi.fn().mockResolvedValue(undefined);
    const onSelectEntry = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const first = makeEntry({ id: 'entry-1', title: 'First Entry' });
    const second = makeEntry({ id: 'entry-2', title: 'Second Entry' });

    useAcademicStore.setState({
      bibliographyEntries: [first, second],
      citationStyle: 'apa7',
      addBibliographyEntry: vi.fn().mockResolvedValue(second),
      updateBibliographyEntry,
      deleteBibliographyEntry,
    });

    render(<BibliographyManager onSelectEntry={onSelectEntry} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Search references...'), {
      target: { value: 'Second' },
    });

    expect(screen.queryByText('First Entry (2024)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Second Entry (2024)'));
    expect(onSelectEntry).toHaveBeenCalledWith(second);

    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.change(screen.getByDisplayValue('Second Entry'), {
      target: { value: 'Second Entry Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateBibliographyEntry).toHaveBeenCalledWith(
        'entry-2',
        expect.objectContaining({ title: 'Second Entry Updated' })
      );
    });

    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => {
      expect(deleteBibliographyEntry).toHaveBeenCalledWith('entry-2');
    });

    confirmSpy.mockRestore();
  });

  it('supports tag organization with tag chips and tag filtering', () => {
    const first = makeEntry({ id: 'entry-1', title: 'Tagged AI Entry', tags: ['ai', 'review'] });
    const second = makeEntry({ id: 'entry-2', title: 'Tagged ML Entry', tags: ['ml'] });

    useAcademicStore.setState({
      bibliographyEntries: [first, second],
      citationStyle: 'apa7',
      addBibliographyEntry: vi.fn().mockResolvedValue(second),
      updateBibliographyEntry: vi.fn().mockResolvedValue(undefined),
      deleteBibliographyEntry: vi.fn().mockResolvedValue(undefined),
    });

    render(<BibliographyManager />);

    expect(screen.getByRole('button', { name: 'All tags' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#ai' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#ml' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '#ai' }));
    expect(screen.getByText('Tagged AI Entry (2024)')).toBeInTheDocument();
    expect(screen.queryByText('Tagged ML Entry (2024)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All tags' }));
    fireEvent.change(screen.getByPlaceholderText('Search references...'), {
      target: { value: 'review' },
    });
    expect(screen.getByText('Tagged AI Entry (2024)')).toBeInTheDocument();
    expect(screen.queryByText('Tagged ML Entry (2024)')).not.toBeInTheDocument();
  });

  it('imports a reference from DOI', async () => {
    const addBibliographyEntry = vi.fn().mockResolvedValue(undefined);
    const mockedFetchFromDOI = vi.mocked(fetchFromDOI);
    mockedFetchFromDOI.mockResolvedValue(
      makeEntry({
        id: 'doi-entry',
        title: 'DOI Imported',
      }) as unknown as Omit<BibliographyEntry, 'id' | 'createdAt' | 'modifiedAt'>
    );

    useAcademicStore.setState({
      bibliographyEntries: [],
      citationStyle: 'apa7',
      addBibliographyEntry,
      updateBibliographyEntry: vi.fn().mockResolvedValue(undefined),
      deleteBibliographyEntry: vi.fn().mockResolvedValue(undefined),
    });

    render(<BibliographyManager />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'From DOI' }));
    fireEvent.change(
      screen.getByPlaceholderText('10.1000/xyz123 or https://doi.org/10.1000/xyz123'),
      {
        target: { value: '10.1000/example' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add Reference' }));

    await waitFor(() => {
      expect(mockedFetchFromDOI).toHaveBeenCalledWith('10.1000/example');
      expect(addBibliographyEntry).toHaveBeenCalled();
    });
  });

  it('imports references from BibTeX', async () => {
    const addBibliographyEntry = vi.fn().mockResolvedValue(undefined);
    const mockedParseBibTeX = vi.mocked(parseBibTeX);
    mockedParseBibTeX.mockReturnValue([
      makeEntry({ id: 'bib-1', title: 'Bib One' }),
      makeEntry({ id: 'bib-2', title: 'Bib Two' }),
    ]);

    useAcademicStore.setState({
      bibliographyEntries: [],
      citationStyle: 'apa7',
      addBibliographyEntry,
      updateBibliographyEntry: vi.fn().mockResolvedValue(undefined),
      deleteBibliographyEntry: vi.fn().mockResolvedValue(undefined),
    });

    render(<BibliographyManager />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'BibTeX' }));
    fireEvent.change(screen.getByPlaceholderText(/@article\{key,/), {
      target: { value: '@article{test, title={Paper}}' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Reference' }));

    await waitFor(() => {
      expect(mockedParseBibTeX).toHaveBeenCalledWith('@article{test, title={Paper}}');
      expect(addBibliographyEntry).toHaveBeenCalledTimes(2);
    });
  });

  it('handles add-modal validation and error branches across manual/DOI/BibTeX modes', async () => {
    const addBibliographyEntry = vi
      .fn()
      .mockRejectedValueOnce('manual-failure')
      .mockResolvedValue(undefined)
      .mockResolvedValue(undefined);
    const mockedFetchFromDOI = vi.mocked(fetchFromDOI);
    const mockedParseBibTeX = vi.mocked(parseBibTeX);
    mockedFetchFromDOI.mockRejectedValue(new Error('DOI service unavailable'));
    mockedParseBibTeX.mockImplementation(() => {
      throw 'bibtex-failure';
    });

    const onClose = vi.fn();
    useAcademicStore.setState({
      bibliographyEntries: [],
      citationStyle: 'apa7',
      addBibliographyEntry,
      updateBibliographyEntry: vi.fn().mockResolvedValue(undefined),
      deleteBibliographyEntry: vi.fn().mockResolvedValue(undefined),
    });

    render(<BibliographyManager onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const addButton = screen.getByRole('button', { name: 'Add Reference' });
    expect(addButton).toBeDisabled();

    const titleInput = screen.getByText('Title *').parentElement?.querySelector('input');
    const authorsInput = screen
      .getByText('Authors * (comma or semicolon separated)')
      .parentElement?.querySelector('input');
    expect(titleInput).toBeTruthy();
    expect(authorsInput).toBeTruthy();
    fireEvent.change(titleInput!, { target: { value: 'Manual Title' } });
    fireEvent.change(authorsInput!, { target: { value: 'Doe, Jane' } });
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to add reference')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'From DOI' }));
    expect(addButton).toBeDisabled();
    fireEvent.change(
      screen.getByPlaceholderText('10.1000/xyz123 or https://doi.org/10.1000/xyz123'),
      {
        target: { value: '10.1000/bad' },
      }
    );
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('DOI service unavailable')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'BibTeX' }));
    expect(addButton).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/@article\{key,/), {
      target: { value: '@article{bad, title={Oops}}' },
    });
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to parse BibTeX')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Add Reference' })).not.toBeInTheDocument();

    const closeButton = screen.getByText('Reference Library').parentElement?.querySelector('button');
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton!);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders formatted bibliography text as inert content (no HTML execution path)', () => {
    const maliciousFormattedValue =
      '<img src="x" onerror="alert(1)"><script>alert(2)</script>Encoded &amp; text';
    vi.mocked(formatBibliographyEntry).mockReturnValueOnce(maliciousFormattedValue);

    const entry = makeEntry({ id: 'entry-malicious', title: 'Malicious Entry' });
    useAcademicStore.setState({
      bibliographyEntries: [entry],
      citationStyle: 'apa7',
      addBibliographyEntry: vi.fn().mockResolvedValue(entry),
      updateBibliographyEntry: vi.fn().mockResolvedValue(undefined),
      deleteBibliographyEntry: vi.fn().mockResolvedValue(undefined),
    });

    const { container } = render(<BibliographyManager />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('<img src="x" onerror="alert(1)">'))
    ).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Encoded &amp; text'))).toBeInTheDocument();
  });
});
