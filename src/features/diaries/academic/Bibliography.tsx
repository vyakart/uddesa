import { useMemo } from 'react';
import { formatCitation, sortCitations, type Citation, type CitationStyle } from './citations';

export interface BibliographyProps {
  citations: Citation[];
  style: CitationStyle;
  onCitationClick?: (citationId: string) => void;
}

/**
 * Bibliography component
 * 
 * Auto-generates formatted bibliography from cited sources
 * Sorted alphabetically by author
 */
export function Bibliography({ citations, style, onCitationClick }: BibliographyProps) {
  const sortedCitations = useMemo(() => sortCitations(citations), [citations]);

  if (sortedCitations.length === 0) {
    return (
      <section className="bibliography">
        <h3 className="bibliography__title">References</h3>
        <p className="bibliography__empty">
          No citations yet. Add citations to your document to see them here.
        </p>
      </section>
    );
  }

  return (
    <section className="bibliography" aria-label="Bibliography">
      <h3 className="bibliography__title">References</h3>
      <ol className="bibliography__list">
        {sortedCitations.map((citation) => (
          <li
            key={citation.id}
            className="bibliography__item"
            onClick={() => onCitationClick?.(citation.id)}
          >
            <span className="bibliography__text">{formatCitation(citation, style)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}