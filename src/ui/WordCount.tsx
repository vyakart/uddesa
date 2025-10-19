import { useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';

export interface WordCountProps {
  editor: Editor | null;
  className?: string;
}

interface WordCountStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  paragraphs: number;
  readingTime: number;
}

const EMPTY_STATS: WordCountStats = {
  words: 0,
  characters: 0,
  charactersNoSpaces: 0,
  paragraphs: 0,
  readingTime: 0,
};

/**
 * Extract text content from Tiptap JSON structure
 */
function extractText(node: JSONContent | undefined): string {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return node.text ?? '';
  }

  if (node.type === 'hardBreak') {
    return '\n';
  }

  if (!node.content || !Array.isArray(node.content)) {
    return '';
  }

  return node.content.map((child) => extractText(child)).join('');
}

/**
 * Count paragraphs in the document
 */
function countParagraphs(doc: JSONContent): number {
  if (!doc.content || !Array.isArray(doc.content)) {
    return 0;
  }

  return doc.content.filter((node) => {
    // Count paragraph nodes that have content
    if (node.type === 'paragraph') {
      const text = extractText(node).trim();
      return text.length > 0;
    }
    return false;
  }).length;
}

/**
 * Calculate word count statistics from editor content
 */
function calculateStats(doc: JSONContent | null): WordCountStats {
  if (!doc) {
    return EMPTY_STATS;
  }

  const text = extractText(doc);

  // Count words (split by whitespace, filter empty strings)
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Count characters
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;

  // Count paragraphs
  const paragraphs = countParagraphs(doc);

  // Calculate reading time (assuming 250 words per minute)
  const readingTime = Math.ceil(words / 250);

  return {
    words,
    characters,
    charactersNoSpaces,
    paragraphs,
    readingTime,
  };
}

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * WordCount component displays real-time writing statistics
 */
export function WordCount({ editor, className = '' }: WordCountProps) {
  const docNode = editor?.state.doc ?? null;

  const stats = useMemo(() => {
    if (!docNode) {
      return EMPTY_STATS;
    }
    const doc = docNode.toJSON() as JSONContent;
    return calculateStats(doc);
  }, [docNode]);

  const rootClassName = ['word-count', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} role="status" aria-live="polite">
      <span className="word-count__item" aria-label={`${stats.words} words`}>
        {formatNumber(stats.words)} {stats.words === 1 ? 'word' : 'words'}
      </span>
      <span className="word-count__separator" aria-hidden="true">
        •
      </span>
      <span className="word-count__item" aria-label={`${stats.characters} characters`}>
        {formatNumber(stats.characters)} {stats.characters === 1 ? 'char' : 'chars'}
      </span>
      {stats.words > 0 && (
        <>
          <span className="word-count__separator" aria-hidden="true">
            •
          </span>
          <span className="word-count__item" aria-label={`About ${stats.readingTime} minute read`}>
            ~{stats.readingTime} min read
          </span>
        </>
      )}
    </div>
  );
}
