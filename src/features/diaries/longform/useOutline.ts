import { useMemo } from 'react';
import type { JSONContent } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface OutlineHeading {
  id: string;
  level: 1 | 2 | 3;
  text: string;
  position: number;
  children: OutlineHeading[];
}

/**
 * Extract text content from a heading node
 */
function extractHeadingText(node: JSONContent): string {
  if (!node.content || !Array.isArray(node.content)) {
    return '';
  }

  return node.content
    .map((child) => {
      if (child.type === 'text') {
        return child.text || '';
      }
      return extractHeadingText(child);
    })
    .join('');
}

/**
 * Generate unique ID for heading
 */
function generateHeadingId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  return `heading-${slug}-${index}`;
}

/**
 * Extract all headings from Tiptap document
 */
function extractHeadings(doc: JSONContent): OutlineHeading[] {
  if (!doc.content || !Array.isArray(doc.content)) {
    return [];
  }

  const headings: OutlineHeading[] = [];
  let position = 0;
  let headingIndex = 0;

  for (const node of doc.content) {
    if (node.type === 'heading' && node.attrs?.level && node.attrs.level <= 3) {
      const text = extractHeadingText(node).trim();
      if (text.length > 0) {
        headings.push({
          id: generateHeadingId(text, headingIndex++),
          level: node.attrs.level as 1 | 2 | 3,
          text,
          position,
          children: [],
        });
      }
    }
    position++;
  }

  return headings;
}

/**
 * Build hierarchical tree from flat heading list
 */
function buildHeadingTree(headings: OutlineHeading[]): OutlineHeading[] {
  if (headings.length === 0) {
    return [];
  }

  const root: OutlineHeading[] = [];
  const stack: OutlineHeading[] = [];

  for (const heading of headings) {
    // Remove items from stack that are same or lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level heading
      root.push(heading);
    } else {
      // Child heading
      stack[stack.length - 1].children.push(heading);
    }

    stack.push(heading);
  }

  return root;
}

/**
 * Custom hook for extracting and managing document outline
 * 
 * @param editor - Tiptap editor instance
 * @returns Hierarchical outline structure
 */
export function useOutline(editor: Editor | null): {
  outline: OutlineHeading[];
  flatHeadings: OutlineHeading[];
  count: number;
} {
  const result = useMemo(() => {
    if (!editor) {
      return {
        outline: [],
        flatHeadings: [],
        count: 0,
      };
    }

    const doc = editor.getJSON();
    const flatHeadings = extractHeadings(doc);
    const outline = buildHeadingTree(flatHeadings);

    return {
      outline,
      flatHeadings,
      count: flatHeadings.length,
    };
  }, [editor?.state.doc.content]);

  return result;
}