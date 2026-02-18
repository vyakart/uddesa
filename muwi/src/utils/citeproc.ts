import CSL from 'citeproc';
import type { BibliographyEntry } from '@/types/academic';
import apaStyle from '@/assets/csl/apa.csl?raw';
import mlaStyle from '@/assets/csl/mla.csl?raw';
import chicagoStyle from '@/assets/csl/chicago-author-date.csl?raw';
import enUsLocale from '@/assets/csl/locales-en-US.xml?raw';

export type CiteprocStyle = 'apa' | 'mla' | 'chicago';

const STYLE_XML_MAP: Record<CiteprocStyle, string> = {
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

function buildEngine(items: CSLItem[], style: CiteprocStyle): InstanceType<typeof CSL.Engine> {
  const itemsById = Object.fromEntries(items.map((item) => [item.id, item]));
  const sys = {
    retrieveLocale: () => enUsLocale,
    retrieveItem: (id: string) => itemsById[id],
  };

  return new CSL.Engine(sys, STYLE_XML_MAP[style], 'en-US');
}

export function formatCitationWithCiteproc(
  entry: BibliographyEntry,
  style: CiteprocStyle = 'apa'
): string {
  const item = entryToCSLItem(entry);
  const engine = buildEngine([item], style);
  engine.updateItems([item.id]);
  const result = engine.appendCitationCluster({
    citationItems: [{ id: item.id }],
    properties: { noteIndex: 0 },
  });
  return result?.[0]?.[1] ?? '';
}

export function formatBibliographyWithCiteproc(
  entries: BibliographyEntry[],
  style: CiteprocStyle = 'apa'
): string {
  if (entries.length === 0) {
    return '';
  }

  const items = entries.map(entryToCSLItem);
  const engine = buildEngine(items, style);
  engine.updateItems(items.map((item) => item.id));
  const [, bibliographyEntries] = engine.makeBibliography();
  return bibliographyEntries.join('\n');
}
