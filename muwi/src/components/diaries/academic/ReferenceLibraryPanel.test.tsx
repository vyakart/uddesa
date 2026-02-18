import { fireEvent, render, screen, waitFor } from '@/test';
import { useAcademicStore } from '@/stores/academicStore';
import type { AcademicPaper, BibliographyEntry } from '@/types/academic';
import { ReferenceLibraryPanel } from './ReferenceLibraryPanel';

vi.mock('./BibliographyManager', () => ({
  BibliographyManager: ({
    onSelectEntry,
  }: {
    onSelectEntry?: (entry: BibliographyEntry) => void;
  }) => (
    <div data-testid="bibliography-manager-stub">
      <button
        type="button"
        onClick={() =>
          onSelectEntry?.({
            id: 'entry-1',
            type: 'article',
            authors: ['Ada Lovelace'],
            title: 'Selected Entry',
            year: 2024,
            tags: ['ai'],
            createdAt: new Date('2026-02-18T00:00:00.000Z'),
            modifiedAt: new Date('2026-02-18T00:00:00.000Z'),
          })
        }
      >
        Select Entry
      </button>
    </div>
  ),
}));

function makePaper(overrides: Partial<AcademicPaper> = {}): AcademicPaper {
  const now = new Date('2026-02-18T00:00:00.000Z');
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

function makeEntry(overrides: Partial<BibliographyEntry> = {}): BibliographyEntry {
  const now = new Date('2026-02-18T00:00:00.000Z');
  return {
    id: 'entry-1',
    type: 'article',
    authors: ['Ada Lovelace'],
    title: 'Library Entry',
    year: 2024,
    tags: ['ai'],
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('ReferenceLibraryPanel', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      value: vi.fn(),
    });
  });

  beforeEach(() => {
    useAcademicStore.setState(useAcademicStore.getInitialState(), true);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('exports global references as JSON', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });

    useAcademicStore.setState({
      bibliographyEntries: [makeEntry()],
      papers: [makePaper()],
      addBibliographyEntry: vi.fn().mockResolvedValue(makeEntry()),
      updatePaper: vi.fn().mockResolvedValue(undefined),
    });

    render(<ReferenceLibraryPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported 1 reference.')).toBeInTheDocument();
  });

  it('imports references from JSON payload', async () => {
    const addBibliographyEntry = vi.fn().mockResolvedValue(makeEntry({ id: 'imported-id' }));

    useAcademicStore.setState({
      bibliographyEntries: [],
      papers: [makePaper()],
      addBibliographyEntry,
      updatePaper: vi.fn().mockResolvedValue(undefined),
    });

    render(<ReferenceLibraryPanel />);

    const file = new File(
      [
        JSON.stringify({
          references: [
            {
              type: 'book',
              title: 'Imported Book',
              authors: ['Doe, Jane'],
              year: 2025,
              tags: ['imported'],
            },
          ],
        }),
      ],
      'references.json',
      { type: 'application/json' }
    );

    fireEvent.change(screen.getByTestId('reference-import-input'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(addBibliographyEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'book',
          title: 'Imported Book',
          tags: ['imported'],
        })
      );
    });
    expect(screen.getByText('Imported 1 reference.')).toBeInTheDocument();
  });

  it('links and unlinks selected references to papers', async () => {
    const updatePaper = vi.fn().mockResolvedValue(undefined);
    const paperOne = makePaper({ id: 'paper-1', title: 'Paper One', bibliographyEntryIds: [] });
    const paperTwo = makePaper({ id: 'paper-2', title: 'Paper Two', bibliographyEntryIds: ['entry-1'] });

    useAcademicStore.setState({
      bibliographyEntries: [makeEntry({ id: 'entry-1', title: 'Selected Entry' })],
      papers: [paperOne, paperTwo],
      currentPaperId: 'paper-1',
      addBibliographyEntry: vi.fn().mockResolvedValue(makeEntry()),
      updatePaper,
    });

    render(<ReferenceLibraryPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Select Entry' }));

    fireEvent.click(screen.getByLabelText('Paper One (Current)'));
    await waitFor(() => {
      expect(updatePaper).toHaveBeenCalledWith('paper-1', {
        bibliographyEntryIds: ['entry-1'],
      });
    });

    fireEvent.click(screen.getByLabelText('Paper Two'));
    await waitFor(() => {
      expect(updatePaper).toHaveBeenCalledWith('paper-2', {
        bibliographyEntryIds: [],
      });
    });
  });
});
