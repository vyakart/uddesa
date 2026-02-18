import type { BibliographyEntry } from '@/types/academic';
import {
  formatBibliographyWithCiteproc,
  formatCitationWithCiteproc,
} from './citeproc';

function makeEntry(overrides: Partial<BibliographyEntry> = {}): BibliographyEntry {
  const now = new Date('2026-02-18T12:00:00.000Z');
  return {
    id: 'entry-1',
    type: 'article',
    authors: ['Smith, Jane'],
    title: 'The Testing Baseline',
    year: 2025,
    journal: 'Journal of Software Tests',
    volume: '12',
    issue: '3',
    pages: '14-20',
    tags: [],
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('citeproc utility baseline', () => {
  it('formats in-text citations for bundled styles', () => {
    const entry = makeEntry();

    const apaCitation = formatCitationWithCiteproc(entry, 'apa');
    const mlaCitation = formatCitationWithCiteproc(entry, 'mla');
    const chicagoCitation = formatCitationWithCiteproc(entry, 'chicago');

    expect(apaCitation).toContain('Smith');
    expect(apaCitation).toContain('2025');

    expect(mlaCitation).toContain('Smith');
    expect(mlaCitation).toContain('2025');

    expect(chicagoCitation).toContain('Smith');
    expect(chicagoCitation).toContain('2025');
  });

  it('formats bibliography output for bundled styles', () => {
    const entry = makeEntry();

    const apaBibliography = formatBibliographyWithCiteproc([entry], 'apa');
    const mlaBibliography = formatBibliographyWithCiteproc([entry], 'mla');
    const chicagoBibliography = formatBibliographyWithCiteproc([entry], 'chicago');

    expect(apaBibliography).toContain('Smith');
    expect(apaBibliography).toContain('The Testing Baseline');

    expect(mlaBibliography).toContain('Smith');
    expect(mlaBibliography).toContain('vol.');

    expect(chicagoBibliography).toContain('Smith');
    expect(chicagoBibliography).toContain('2025');
  });

  it('returns empty bibliography for empty entries', () => {
    expect(formatBibliographyWithCiteproc([], 'apa')).toBe('');
  });
});
