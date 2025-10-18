/**
 * Citation management utilities for academic writing
 * 
 * Supports multiple citation styles (APA, MLA, Chicago)
 */

export type CitationStyle = 'apa' | 'mla' | 'chicago';

export interface Citation {
  id: string;
  type: 'book' | 'article' | 'website' | 'other';
  authors: string[];
  title: string;
  year: number;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  doi?: string;
  accessed?: string;
}

/**
 * Format author names for citation
 */
function formatAuthors(authors: string[], style: CitationStyle): string {
  if (authors.length === 0) {
    return '';
  }

  if (style === 'apa') {
    if (authors.length === 1) {
      return authors[0];
    }
    if (authors.length === 2) {
      return `${authors[0]} & ${authors[1]}`;
    }
    return `${authors[0]} et al.`;
  }

  if (style === 'mla') {
    if (authors.length === 1) {
      return authors[0];
    }
    if (authors.length === 2) {
      return `${authors[0]} and ${authors[1]}`;
    }
    return `${authors[0]}, et al.`;
  }

  // Chicago
  if (authors.length === 1) {
    return authors[0];
  }
  if (authors.length === 2) {
    return `${authors[0]} and ${authors[1]}`;
  }
  return `${authors[0]} et al.`;
}

/**
 * Format a citation in the specified style
 */
export function formatCitation(citation: Citation, style: CitationStyle): string {
  const { authors, title, year, publisher, journal, volume, issue, pages, url, doi } = citation;
  const authorStr = formatAuthors(authors, style);

  if (style === 'apa') {
    // APA 7th edition format
    let result = `${authorStr} (${year}). ${title}.`;
    
    if (citation.type === 'article' && journal) {
      result += ` ${journal}`;
      if (volume) result += `, ${volume}`;
      if (issue) result += `(${issue})`;
      if (pages) result += `, ${pages}`;
    } else if (publisher) {
      result += ` ${publisher}`;
    }
    
    if (doi) {
      result += ` https://doi.org/${doi}`;
    } else if (url) {
      result += ` ${url}`;
    }
    
    return result;
  }

  if (style === 'mla') {
    // MLA 9th edition format
    let result = `${authorStr}. "${title}."`;
    
    if (citation.type === 'article' && journal) {
      result += ` ${journal}`;
      if (volume) result += `, vol. ${volume}`;
      if (issue) result += `, no. ${issue}`;
      if (year) result += `, ${year}`;
      if (pages) result += `, pp. ${pages}`;
    } else if (publisher) {
      result += ` ${publisher}, ${year}`;
    }
    
    if (url) {
      result += `. ${url}`;
    }
    
    return result + '.';
  }

  // Chicago style
  let result = `${authorStr}. ${title}.`;
  
  if (citation.type === 'article' && journal) {
    result += ` ${journal} ${volume}`;
    if (issue) result += `, no. ${issue}`;
    result += ` (${year})`;
    if (pages) result += `: ${pages}`;
  } else if (publisher) {
    result += ` ${publisher}, ${year}`;
  }
  
  if (doi) {
    result += `. https://doi.org/${doi}`;
  } else if (url) {
    result += `. ${url}`;
  }
  
  return result + '.';
}

/**
 * Generate inline citation marker
 */
export function formatInlineCitation(citation: Citation, style: CitationStyle): string {
  if (style === 'apa') {
    const author = citation.authors[0]?.split(' ').pop() || 'Unknown';
    return `(${author}, ${citation.year})`;
  }

  if (style === 'mla') {
    const author = citation.authors[0]?.split(' ').pop() || 'Unknown';
    return `(${author})`;
  }

  // Chicago - footnote style (handled elsewhere)
  return `[${citation.id}]`;
}

/**
 * Sort citations alphabetically by author
 */
export function sortCitations(citations: Citation[]): Citation[] {
  return [...citations].sort((a, b) => {
    const authorA = a.authors[0] || '';
    const authorB = b.authors[0] || '';
    return authorA.localeCompare(authorB);
  });
}