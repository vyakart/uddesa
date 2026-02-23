import type { BibliographyEntry } from '@/types/academic';
import Cite from 'citation-js';
import CSL from 'citeproc';
import {
  fetchFromDOI,
  formatBibliography,
  formatBibliographyEntry,
  formatCitation,
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
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('formats in-text citations, bibliography output, and helper sorting/key functions', () => {
    const entryA = makeEntry({ id: 'a', authors: ['Smith, John'], year: 2024 });
    const entryB = makeEntry({ id: 'b', authors: ['Adams, Amy'], year: 2022 });
    const entryC = makeEntry({ id: 'c', authors: ['Clark, Chris'], year: 2026 });

    const inText = formatInTextCitation(entryA, 'apa7', '12-13');
    expect(inText).toContain('12-13');
    expect(formatCitation(entryA, 'apa7', '12-13')).toBe(inText);

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

  it('supports style switching across bundled and legacy styles', () => {
    const entry = makeEntry({ authors: ['Ada Lovelace'], year: 2025 });

    const styles = ['apa7', 'mla9', 'chicago', 'harvard', 'ieee'] as const;
    styles.forEach((style) => {
      expect(formatInTextCitation(entry, style, '45').length).toBeGreaterThan(0);
      expect(formatBibliographyEntry(entry, style).length).toBeGreaterThan(0);
    });
  });

  it('sanitizes bundled bibliography entry output and decodes safe entities', () => {
    vi.spyOn(CSL.Engine.prototype, 'makeBibliography').mockImplementation(
      () =>
        [
          {},
          [
            '<div><script>alert(1)</script><span onclick="evil()">Safe &amp; Sound&nbsp;&lt;ok&gt;</span></div>',
          ],
        ] as never
    );

    const entry = makeEntry({ title: 'Injected <img src=x onerror=alert(1)>' });
    const formatted = formatBibliographyEntry(entry, 'apa7');

    expect(formatted).toBe('Safe & Sound <ok>');
    expect(formatted).not.toContain('<script');
    expect(formatted).not.toContain('onclick=');
    expect(formatted).not.toContain('alert(1)');
  });

  it('handles in-text page-number formats for legacy citation-js templates', () => {
    const formatSpy = vi.spyOn(Cite.prototype, 'format')
      .mockReturnValueOnce('(Smith, 2024)')
      .mockReturnValueOnce('[1]')
      .mockReturnValueOnce('Smith 2024');

    const entry = makeEntry({ authors: ['Ada Lovelace'] });
    expect(formatInTextCitation(entry, 'harvard', '45')).toBe('(Smith, 2024, p. 45)');
    expect(formatInTextCitation(entry, 'ieee', '45')).toBe('[1, p. 45]');
    expect(formatInTextCitation(entry, 'harvard', '45')).toBe('Smith 2024 (p. 45)');

    expect(formatSpy).toHaveBeenCalledTimes(3);
  });

  it('falls back when citation formatting fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(CSL.Engine.prototype, 'appendCitationCluster').mockImplementation(() => {
      throw new Error('boom');
    });
    vi.spyOn(CSL.Engine.prototype, 'makeBibliography').mockImplementation(() => {
      throw new Error('boom');
    });

    const fallbackWithUnknownAuthor = formatInTextCitation(
      makeEntry({ authors: [], year: undefined }),
      'apa7',
      '9'
    );
    expect(fallbackWithUnknownAuthor).toBe('(Unknown, p. 9)');

    const fallbackBibliography = formatBibliography([
      makeEntry({ authors: ['Ada Lovelace'], year: undefined, journal: undefined, title: 'Fallback Title' }),
    ]);
    expect(fallbackBibliography).toContain('<p>Ada Lovelace. Fallback Title.</p>');

    const fallbackEntry = formatBibliographyEntry(
      makeEntry({ authors: ['Doe, Jane', 'Smith, John'], year: undefined, title: 'Entry Fallback' })
    );
    expect(fallbackEntry).toBe('Doe, Jane, Smith, John. Entry Fallback.');

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('returns empty bibliography for empty inputs', () => {
    expect(formatBibliography([])).toBe('');
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

  it('parses BibTeX author/type/year fallbacks', () => {
    const currentYear = new Date().getFullYear();
    const bibtex = `@misc{fallback2026,
      author = {John and },
      title = {Fallback Parsing}
    }`;
    const parsed = parseBibTeX(bibtex);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      type: 'other',
      title: 'Fallback Parsing',
      year: currentYear,
      authors: ['John', 'Unknown'],
    });
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

  it('maps DOI metadata fallbacks for unknown type/title/authors/year', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          type: 'document',
          author: [{}, { given: 'OnlyGiven' }],
        }),
      })
    );

    const currentYear = new Date().getFullYear();
    const entry = await fetchFromDOI('doi:10.1000/fallback');
    expect(entry).toMatchObject({
      type: 'other',
      title: 'Untitled',
      authors: ['Unknown', 'OnlyGiven'],
      year: currentYear,
      doi: '10.1000/fallback',
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

  it('covers citation key/sort helpers with missing authors/years', () => {
    expect(generateCitationKey(makeEntry({ authors: [], year: undefined }))).toBe('Unknown');
    expect(generateCitationKey(makeEntry({ authors: ['Ada Lovelace'], year: 2026 }))).toBe('Lovelace2026');

    const byAuthor = sortBibliographyByAuthor([
      makeEntry({ id: 'missing-author', authors: [] }),
      makeEntry({ id: 'z-author', authors: ['Zimmer, Amy'] }),
    ]).map(entry => entry.id);
    expect(byAuthor).toEqual(['missing-author', 'z-author']);

    const byYear = sortBibliographyByYear([
      makeEntry({ id: 'no-year', year: undefined }),
      makeEntry({ id: 'has-year', year: 2025 }),
    ]).map(entry => entry.id);
    expect(byYear).toEqual(['has-year', 'no-year']);
  });
});
