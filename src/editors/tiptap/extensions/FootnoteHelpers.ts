import type { JSONContent } from '@tiptap/core';

export interface FootnoteAttrs {
  id: string;
  number: number;
  content: string;
}

/**
 * Extract all footnote nodes from a Tiptap document JSON.
 */
export function extractFootnotes(doc: JSONContent | null | undefined): FootnoteAttrs[] {
  if (!doc) {
    return [];
  }

  const footnotes: FootnoteAttrs[] = [];

  function traverse(node: JSONContent | undefined) {
    if (!node) return;

    if (node.type === 'footnote' && node.attrs) {
      footnotes.push(node.attrs as FootnoteAttrs);
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  }

  traverse(doc);

  return footnotes.sort((a, b) => a.number - b.number);
}
