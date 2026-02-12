import type { BibliographyEntry } from '@/types/academic';
import {
  fetchFromDOI,
  formatBibliography,
  formatBibliographyEntry,
  formatInTextCitation,
  generateCitationKey,
  parseBibTeX,
  sortBibliographyByAuthor,
  sortBibliographyByYear,
} from './citation';

function makeEntry(overrides: Partial<BibliographyEntry> = {}): BibliographyEntry {
  const now = new Date('2026-02-12T12:00:00.000Z');
  return {
    id: 'entry-1',
    type: 'article',
    authors: ['Smith, John', 'Doe, Jane'],
    title: 'A Study on Testing',
    year: 2024,
    journal: 'Testing Journal',
    volume: '10',
    issue: '2',
    pages: '1-10',
    doi: '10.1000/testing',
    tags: [],
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('citation utils', () => {
  it('formats in-text citations, bibliography output, and helper sorting/key functions', () => {
    const entryA = makeEntry({ id: 'a', authors: ['Smith, John'], year: 2024 });
    const entryB = makeEntry({ id: 'b', authors: ['Adams, Amy'], year: 2022 });
    const entryC = makeEntry({ id: 'c', authors: ['Clark, Chris'], year: 2026 });

    const inText = formatInTextCitation(entryA, 'apa7', '12-13');
    expect(inText).toContain('p. 12-13');

    const bibliographyHtml = formatBibliography([entryA], 'apa7');
    expect(bibliographyHtml.length).toBeGreaterThan(0);

    const bibliographyEntry = formatBibliographyEntry(entryA, 'mla9');
    expect(bibliographyEntry.length).toBeGreaterThan(0);

    expect(generateCitationKey(entryA)).toBe('Smith2024');
    expect(sortBibliographyByAuthor([entryA, entryB]).map((entry) => entry.id)).toEqual(['b', 'a']);
    expect(sortBibliographyByYear([entryA, entryB, entryC]).map((entry) => entry.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('parses valid BibTeX and rejects invalid BibTeX', () => {
    const bibtex = `@article{smith2024,
      author = {Smith, John and Doe, Jane},
      title = {A Study on Testing},
      year = {2024},
      journal = {Testing Journal},
      volume = {10},
      number = {2},
      pages = {1-10}
    }`;

    const parsed = parseBibTeX(bibtex);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      type: 'article',
      title: 'A Study on Testing',
      year: 2024,
      journal: 'Testing Journal',
      volume: '10',
      issue: '2',
      pages: '1-10',
      bibtex,
    });
    expect(parsed[0].authors).toEqual(['Smith, John', 'Doe, Jane']);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => parseBibTeX('not valid bibtex')).toThrow(
      'Failed to parse BibTeX. Please check the format.'
    );
    consoleSpy.mockRestore();
  });

  it('fetches and maps DOI metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        type: 'article-journal',
        title: 'DOI Imported Paper',
        author: [{ family: 'Lovelace', given: 'Ada' }],
        issued: { 'date-parts': [[2025]] },
        'container-title': 'Journal of DOI',
        volume: '5',
        issue: '1',
        page: '10-20',
        publisher: 'DOI Pub',
        URL: 'https://example.com/paper',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const entry = await fetchFromDOI('https://doi.org/10.1000/xyz123');

    expect(fetchMock).toHaveBeenCalledWith('https://doi.org/10.1000/xyz123', {
      headers: {
        Accept: 'application/vnd.citationstyles.csl+json',
      },
    });
    expect(entry).toMatchObject({
      type: 'article',
      title: 'DOI Imported Paper',
      authors: ['Lovelace, Ada'],
      year: 2025,
      journal: 'Journal of DOI',
      volume: '5',
      issue: '1',
      pages: '10-20',
      publisher: 'DOI Pub',
      doi: '10.1000/xyz123',
      url: 'https://example.com/paper',
    });
  });

  it('handles DOI validation and network error cases', async () => {
    await expect(fetchFromDOI('  ')).rejects.toThrow('Invalid DOI format');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    );
    await expect(fetchFromDOI('10.1000/not-found')).rejects.toThrow('DOI not found');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      })
    );
    await expect(fetchFromDOI('10.1000/server-error')).rejects.toThrow(
      'Failed to fetch DOI: Server Error'
    );

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('boom'));
    await expect(fetchFromDOI('10.1000/rejected')).rejects.toThrow('Failed to fetch DOI data');
  });
});
