import type { BibliographyEntry, CitationStyle } from '@/types/academic';
import {
  formatBibliography,
  formatCitation,
} from './citation';

export type CiteprocStyle = 'apa' | 'mla' | 'chicago';

const CITEPROC_TO_CITATION_STYLE: Record<CiteprocStyle, CitationStyle> = {
  apa: 'apa7',
  mla: 'mla9',
  chicago: 'chicago',
};

export function formatCitationWithCiteproc(
  entry: BibliographyEntry,
  style: CiteprocStyle = 'apa'
): string {
  return formatCitation(entry, CITEPROC_TO_CITATION_STYLE[style]);
}

export function formatBibliographyWithCiteproc(
  entries: BibliographyEntry[],
  style: CiteprocStyle = 'apa'
): string {
  return formatBibliography(entries, CITEPROC_TO_CITATION_STYLE[style]);
}
