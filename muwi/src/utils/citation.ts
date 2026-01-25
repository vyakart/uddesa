import Cite from 'citation-js';
import type { BibliographyEntry, CitationStyle } from '@/types/academic';

// Map our citation styles to CSL style names
const STYLE_MAP: Record<CitationStyle, string> = {
  apa7: 'apa',
  mla9: 'mla',
  chicago: 'chicago-author-date',
  harvard: 'harvard1',
  ieee: 'ieee',
};

// Convert BibliographyEntry to CSL-JSON format for citation-js
function entryToCSL(entry: BibliographyEntry): object {
  const csl: Record<string, unknown> = {
    id: entry.id,
    type: mapEntryTypeToCSL(entry.type),
    title: entry.title,
    issued: entry.year ? { 'date-parts': [[entry.year]] } : undefined,
    author: entry.authors.map(parseAuthorString),
    DOI: entry.doi,
    URL: entry.url,
  };

  // Add optional fields based on entry type
  if (entry.journal) {
    csl['container-title'] = entry.journal;
  }
  if (entry.volume) {
    csl.volume = entry.volume;
  }
  if (entry.issue) {
    csl.issue = entry.issue;
  }
  if (entry.pages) {
    csl.page = entry.pages;
  }
  if (entry.publisher) {
    csl.publisher = entry.publisher;
  }

  return csl;
}

// Map our entry types to CSL types
function mapEntryTypeToCSL(type: BibliographyEntry['type']): string {
  const typeMap: Record<string, string> = {
    article: 'article-journal',
    book: 'book',
    chapter: 'chapter',
    conference: 'paper-conference',
    website: 'webpage',
    thesis: 'thesis',
    other: 'document',
  };
  return typeMap[type] || 'document';
}

// Parse author string "Last, First" or "First Last" into CSL author object
function parseAuthorString(authorStr: string): { family: string; given: string } {
  const parts = authorStr.split(',').map(s => s.trim());
  if (parts.length === 2) {
    // "Last, First" format
    return { family: parts[0], given: parts[1] };
  }
  // "First Last" format
  const nameParts = authorStr.trim().split(/\s+/);
  if (nameParts.length >= 2) {
    const family = nameParts[nameParts.length - 1];
    const given = nameParts.slice(0, -1).join(' ');
    return { family, given };
  }
  // Single name
  return { family: authorStr.trim(), given: '' };
}

/**
 * Format a single citation for in-text use
 * @param entry - The bibliography entry to cite
 * @param style - Citation style to use
 * @param pageNumbers - Optional page numbers for the citation
 * @returns Formatted in-text citation string (e.g., "(Smith, 2020, p. 45)")
 */
export function formatInTextCitation(
  entry: BibliographyEntry,
  style: CitationStyle = 'apa7',
  pageNumbers?: string
): string {
  try {
    const cite = new Cite(entryToCSL(entry));
    const cslStyle = STYLE_MAP[style];

    // Get the in-text citation format
    let citation = cite.format('citation', {
      format: 'text',
      template: cslStyle,
      lang: 'en-US',
    });

    // Add page numbers if provided
    if (pageNumbers) {
      // Remove closing parenthesis/bracket, add page, then close
      if (citation.endsWith(')')) {
        citation = citation.slice(0, -1) + `, p. ${pageNumbers})`;
      } else if (citation.endsWith(']')) {
        citation = citation.slice(0, -1) + `, p. ${pageNumbers}]`;
      } else {
        citation += ` (p. ${pageNumbers})`;
      }
    }

    return citation;
  } catch (error) {
    console.error('Error formatting citation:', error);
    // Fallback to basic format
    const author = entry.authors[0]?.split(',')[0] || 'Unknown';
    const yearStr = entry.year ? `, ${entry.year}` : '';
    const pageStr = pageNumbers ? `, p. ${pageNumbers}` : '';
    return `(${author}${yearStr}${pageStr})`;
  }
}

/**
 * Format multiple bibliography entries into a full bibliography
 * @param entries - Array of bibliography entries
 * @param style - Citation style to use
 * @returns Formatted bibliography as HTML string
 */
export function formatBibliography(
  entries: BibliographyEntry[],
  style: CitationStyle = 'apa7'
): string {
  if (entries.length === 0) return '';

  try {
    const cslEntries = entries.map(entryToCSL);
    const cite = new Cite(cslEntries);
    const cslStyle = STYLE_MAP[style];

    return cite.format('bibliography', {
      format: 'html',
      template: cslStyle,
      lang: 'en-US',
    });
  } catch (error) {
    console.error('Error formatting bibliography:', error);
    // Fallback to basic format
    return entries
      .map(entry => {
        const authors = entry.authors.join(', ');
        const year = entry.year ? ` (${entry.year})` : '';
        const title = entry.title;
        const journal = entry.journal ? ` <em>${entry.journal}</em>` : '';
        return `<p>${authors}${year}. ${title}.${journal}</p>`;
      })
      .join('\n');
  }
}

/**
 * Format a single entry for the bibliography
 * @param entry - The bibliography entry
 * @param style - Citation style to use
 * @returns Formatted bibliography entry as text
 */
export function formatBibliographyEntry(
  entry: BibliographyEntry,
  style: CitationStyle = 'apa7'
): string {
  try {
    const cite = new Cite(entryToCSL(entry));
    const cslStyle = STYLE_MAP[style];

    return cite.format('bibliography', {
      format: 'text',
      template: cslStyle,
      lang: 'en-US',
    });
  } catch (error) {
    console.error('Error formatting bibliography entry:', error);
    const authors = entry.authors.join(', ');
    const year = entry.year ? ` (${entry.year})` : '';
    return `${authors}${year}. ${entry.title}.`;
  }
}

/**
 * Parse BibTeX format into BibliographyEntry objects
 * @param bibtex - BibTeX string to parse
 * @returns Array of parsed bibliography entries
 */
export function parseBibTeX(bibtex: string): Partial<BibliographyEntry>[] {
  try {
    const cite = new Cite(bibtex);
    const data = cite.data as Array<Record<string, unknown>>;

    return data.map((item) => {
      const authors = ((item.author as Array<{ family?: string; given?: string }>) || [])
        .map(a => {
          if (a.family && a.given) {
            return `${a.family}, ${a.given}`;
          }
          return a.family || a.given || 'Unknown';
        });

      const issued = item.issued as { 'date-parts'?: number[][] } | undefined;
      const year = issued?.['date-parts']?.[0]?.[0];

      return {
        id: crypto.randomUUID(),
        type: mapCSLTypeToEntry((item.type as string) || 'document'),
        title: (item.title as string) || 'Untitled',
        authors,
        year: year || new Date().getFullYear(),
        journal: item['container-title'] as string | undefined,
        volume: item.volume as string | undefined,
        issue: item.issue as string | undefined,
        pages: item.page as string | undefined,
        publisher: item.publisher as string | undefined,
        doi: item.DOI as string | undefined,
        url: item.URL as string | undefined,
        bibtex: bibtex,
        tags: [],
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
    });
  } catch (error) {
    console.error('Error parsing BibTeX:', error);
    throw new Error('Failed to parse BibTeX. Please check the format.');
  }
}

// Map CSL types back to our entry types
function mapCSLTypeToEntry(cslType: string): BibliographyEntry['type'] {
  const typeMap: Record<string, BibliographyEntry['type']> = {
    'article-journal': 'article',
    'article': 'article',
    'book': 'book',
    'chapter': 'chapter',
    'paper-conference': 'conference',
    'webpage': 'website',
    'thesis': 'thesis',
  };
  return typeMap[cslType] || 'other';
}

/**
 * Fetch citation data from a DOI
 * @param doi - The DOI to look up (e.g., "10.1000/xyz123")
 * @returns Parsed bibliography entry data
 */
export async function fetchFromDOI(doi: string): Promise<Partial<BibliographyEntry>> {
  // Clean up DOI - remove URL prefix if present
  const cleanDOI = doi
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:/i, '')
    .trim();

  if (!cleanDOI) {
    throw new Error('Invalid DOI format');
  }

  try {
    // Fetch from DOI.org with content negotiation for CSL-JSON
    const response = await fetch(`https://doi.org/${cleanDOI}`, {
      headers: {
        Accept: 'application/vnd.citationstyles.csl+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('DOI not found');
      }
      throw new Error(`Failed to fetch DOI: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, unknown>;

    // Parse the CSL-JSON response
    const authors = ((data.author as Array<{ family?: string; given?: string }>) || [])
      .map(a => {
        if (a.family && a.given) {
          return `${a.family}, ${a.given}`;
        }
        return a.family || a.given || 'Unknown';
      });

    const issued = data.issued as { 'date-parts'?: number[][] } | undefined;
    const year = issued?.['date-parts']?.[0]?.[0];

    return {
      id: crypto.randomUUID(),
      type: mapCSLTypeToEntry((data.type as string) || 'article'),
      title: (data.title as string) || 'Untitled',
      authors,
      year: year || new Date().getFullYear(),
      journal: data['container-title'] as string | undefined,
      volume: data.volume as string | undefined,
      issue: data.issue as string | undefined,
      pages: data.page as string | undefined,
      publisher: data.publisher as string | undefined,
      doi: cleanDOI,
      url: data.URL as string | undefined,
      tags: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch DOI data');
  }
}

/**
 * Generate a citation key from entry (e.g., "Smith2020")
 * @param entry - The bibliography entry
 * @returns Citation key string
 */
export function generateCitationKey(entry: BibliographyEntry): string {
  const firstAuthor = entry.authors[0] || 'Unknown';
  const lastName = firstAuthor.split(',')[0].split(' ').pop() || 'Unknown';
  const year = entry.year || '';
  return `${lastName}${year}`;
}

/**
 * Sort bibliography entries alphabetically by author
 * @param entries - Array of bibliography entries
 * @returns Sorted array
 */
export function sortBibliographyByAuthor(entries: BibliographyEntry[]): BibliographyEntry[] {
  return [...entries].sort((a, b) => {
    const authorA = (a.authors[0] || '').toLowerCase();
    const authorB = (b.authors[0] || '').toLowerCase();
    return authorA.localeCompare(authorB);
  });
}

/**
 * Sort bibliography entries by year (newest first)
 * @param entries - Array of bibliography entries
 * @returns Sorted array
 */
export function sortBibliographyByYear(entries: BibliographyEntry[]): BibliographyEntry[] {
  return [...entries].sort((a, b) => (b.year || 0) - (a.year || 0));
}
