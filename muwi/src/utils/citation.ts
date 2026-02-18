import Cite from 'citation-js';
import CSL from 'citeproc';
import type { BibliographyEntry, CitationStyle } from '@/types/academic';
import apaStyle from '@/assets/csl/apa.csl?raw';
import mlaStyle from '@/assets/csl/mla.csl?raw';
import chicagoStyle from '@/assets/csl/chicago-author-date.csl?raw';
import enUsLocale from '@/assets/csl/locales-en-US.xml?raw';

type BundledCiteprocStyle = 'apa' | 'mla' | 'chicago';

const LEGACY_STYLE_MAP: Record<CitationStyle, string> = {
  apa7: 'apa',
  mla9: 'mla',
  chicago: 'chicago-author-date',
  harvard: 'harvard1',
  ieee: 'ieee',
};

const BUNDLED_STYLE_MAP: Partial<Record<CitationStyle, BundledCiteprocStyle>> = {
  apa7: 'apa',
  mla9: 'mla',
  chicago: 'chicago',
};

const STYLE_XML_MAP: Record<BundledCiteprocStyle, string> = {
  apa: apaStyle,
  mla: mlaStyle,
  chicago: chicagoStyle,
};

type CSLItem = {
  id: string;
  type: string;
  title?: string;
  issued?: { 'date-parts': number[][] };
  author?: Array<{ family?: string; given?: string }>;
  DOI?: string;
  URL?: string;
  volume?: string;
  issue?: string;
  page?: string;
  publisher?: string;
  'container-title'?: string;
};

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
  const parts = authorStr.split(',').map((value) => value.trim());
  if (parts.length === 2) {
    return { family: parts[0], given: parts[1] };
  }

  const nameParts = authorStr.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length >= 2) {
    return {
      family: nameParts[nameParts.length - 1],
      given: nameParts.slice(0, -1).join(' '),
    };
  }

  return { family: authorStr.trim() || 'Unknown', given: '' };
}

function entryToCSLItem(entry: BibliographyEntry): CSLItem {
  return {
    id: entry.id,
    type: mapEntryTypeToCSL(entry.type),
    title: entry.title,
    issued: entry.year ? { 'date-parts': [[entry.year]] } : undefined,
    author: entry.authors.map(parseAuthorString),
    DOI: entry.doi,
    URL: entry.url,
    volume: entry.volume,
    issue: entry.issue,
    page: entry.pages,
    publisher: entry.publisher,
    'container-title': entry.journal,
  };
}

function buildCiteprocEngine(
  items: CSLItem[],
  style: BundledCiteprocStyle
): InstanceType<typeof CSL.Engine> {
  const itemsById = Object.fromEntries(items.map((item) => [item.id, item]));
  const sys = {
    retrieveLocale: () => enUsLocale,
    retrieveItem: (id: string) => itemsById[id],
  };

  return new CSL.Engine(sys, STYLE_XML_MAP[style], 'en-US');
}

function htmlToText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function appendPageNumbers(citation: string, pageNumbers?: string): string {
  if (!pageNumbers) {
    return citation;
  }
  if (citation.includes(pageNumbers)) {
    return citation;
  }

  if (citation.endsWith(')')) {
    return citation.slice(0, -1) + `, p. ${pageNumbers})`;
  }
  if (citation.endsWith(']')) {
    return citation.slice(0, -1) + `, p. ${pageNumbers}]`;
  }
  return citation + ` (p. ${pageNumbers})`;
}

function formatCitationWithBundledCiteproc(
  entry: BibliographyEntry,
  style: BundledCiteprocStyle,
  pageNumbers?: string
): string {
  const item = entryToCSLItem(entry);
  const engine = buildCiteprocEngine([item], style);
  engine.updateItems([item.id]);
  const result = engine.appendCitationCluster({
    citationItems: [
      pageNumbers
        ? { id: item.id, locator: pageNumbers, label: 'page' }
        : { id: item.id },
    ],
    properties: { noteIndex: 0 },
  });
  return appendPageNumbers(result?.[0]?.[1] ?? '', pageNumbers);
}

function formatBibliographyWithBundledCiteproc(
  entries: BibliographyEntry[],
  style: BundledCiteprocStyle
): string {
  const items = entries.map(entryToCSLItem);
  const engine = buildCiteprocEngine(items, style);
  engine.updateItems(items.map((item) => item.id));
  const [, bibliographyEntries] = engine.makeBibliography();
  return bibliographyEntries.join('\n');
}

function formatBibliographyEntryWithBundledCiteproc(
  entry: BibliographyEntry,
  style: BundledCiteprocStyle
): string {
  const html = formatBibliographyWithBundledCiteproc([entry], style);
  return htmlToText(html);
}

function formatCitationWithLegacyTemplate(
  entry: BibliographyEntry,
  style: CitationStyle,
  pageNumbers?: string
): string {
  const cite = new Cite(entryToCSLItem(entry));
  const cslStyle = LEGACY_STYLE_MAP[style];
  const citation = cite.format('citation', {
    format: 'text',
    template: cslStyle,
    lang: 'en-US',
  });

  return appendPageNumbers(citation, pageNumbers);
}

function formatBibliographyWithLegacyTemplate(
  entries: BibliographyEntry[],
  style: CitationStyle
): string {
  const cite = new Cite(entries.map(entryToCSLItem));
  const cslStyle = LEGACY_STYLE_MAP[style];
  return cite.format('bibliography', {
    format: 'html',
    template: cslStyle,
    lang: 'en-US',
  });
}

function formatBibliographyEntryWithLegacyTemplate(
  entry: BibliographyEntry,
  style: CitationStyle
): string {
  const cite = new Cite(entryToCSLItem(entry));
  const cslStyle = LEGACY_STYLE_MAP[style];
  return cite.format('bibliography', {
    format: 'text',
    template: cslStyle,
    lang: 'en-US',
  });
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
    const bundledStyle = BUNDLED_STYLE_MAP[style];
    if (bundledStyle) {
      const citation = formatCitationWithBundledCiteproc(entry, bundledStyle, pageNumbers);
      if (citation) {
        return citation;
      }
    }

    return formatCitationWithLegacyTemplate(entry, style, pageNumbers);
  } catch (error) {
    console.error('Error formatting citation:', error);
    const author = entry.authors[0]?.split(',')[0] || 'Unknown';
    const yearStr = entry.year ? `, ${entry.year}` : '';
    const pageStr = pageNumbers ? `, p. ${pageNumbers}` : '';
    return `(${author}${yearStr}${pageStr})`;
  }
}

/**
 * Format a single citation for in-text use
 * @param entry - The bibliography entry to cite
 * @param style - Citation style to use
 * @param pageNumbers - Optional page numbers for the citation
 * @returns Formatted in-text citation string
 */
export function formatCitation(
  entry: BibliographyEntry,
  style: CitationStyle = 'apa7',
  pageNumbers?: string
): string {
  return formatInTextCitation(entry, style, pageNumbers);
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
    const bundledStyle = BUNDLED_STYLE_MAP[style];
    if (bundledStyle) {
      const bibliography = formatBibliographyWithBundledCiteproc(entries, bundledStyle);
      if (bibliography) {
        return bibliography;
      }
    }

    return formatBibliographyWithLegacyTemplate(entries, style);
  } catch (error) {
    console.error('Error formatting bibliography:', error);
    return entries
      .map((entry) => {
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
    const bundledStyle = BUNDLED_STYLE_MAP[style];
    if (bundledStyle) {
      const bibliographyEntry = formatBibliographyEntryWithBundledCiteproc(entry, bundledStyle);
      if (bibliographyEntry) {
        return bibliographyEntry;
      }
    }

    return formatBibliographyEntryWithLegacyTemplate(entry, style);
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
      const authors = ((item.author as Array<{ family?: string; given?: string }>) || []).map((a) => {
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
  const cleanDOI = doi
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:/i, '')
    .trim();

  if (!cleanDOI) {
    throw new Error('Invalid DOI format');
  }

  try {
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

    const authors = ((data.author as Array<{ family?: string; given?: string }>) || []).map((a) => {
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
