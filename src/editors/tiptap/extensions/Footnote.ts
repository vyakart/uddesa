import { Node, mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface FootnoteOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface FootnoteAttrs {
  id: string;
  number: number;
  content: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      addFootnote: (content: string) => ReturnType;
      updateFootnote: (id: string, content: string) => ReturnType;
      removeFootnote: (id: string) => ReturnType;
    };
  }
}

/**
 * Footnote extension for academic and longform writing
 * 
 * Features:
 * - Inline superscript markers
 * - Auto-numbering (sequential)
 * - Footnote content management
 * - Renders at end of document
 */
export const Footnote = Node.create<FootnoteOptions>({
  name: 'footnote',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-footnote-id'),
        renderHTML: (attributes) => ({
          'data-footnote-id': attributes.id,
        }),
      },
      number: {
        default: 1,
        parseHTML: (element) => parseInt(element.getAttribute('data-footnote-number') || '1', 10),
        renderHTML: (attributes) => ({
          'data-footnote-number': attributes.number,
        }),
      },
      content: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-footnote-content'),
        renderHTML: (attributes) => ({
          'data-footnote-content': attributes.content,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-footnote-id]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'footnote-marker',
      }),
      node.attrs.number.toString(),
    ];
  },

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      addFootnote:
        (content: string) =>
        ({ commands, state, tr }) => {
          // Generate unique ID
          const id = `footnote-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          
          // Count existing footnotes to get next number
          const footnotes: FootnoteAttrs[] = [];
          state.doc.descendants((node) => {
            if (node.type.name === 'footnote') {
              footnotes.push(node.attrs as FootnoteAttrs);
            }
          });
          
          const number = footnotes.length + 1;

          // Insert footnote marker at current position
          return commands.insertContent({
            type: this.name,
            attrs: {
              id,
              number,
              content,
            },
          });
        },

      updateFootnote:
        (id: string, content: string) =>
        ({ state, tr }) => {
          let updated = false;

          state.doc.descendants((node, pos) => {
            if (node.type.name === 'footnote' && node.attrs.id === id) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                content,
              });
              updated = true;
            }
          });

          return updated;
        },

      removeFootnote:
        (id: string) =>
        ({ state, tr }) => {
          let removed = false;

          state.doc.descendants((node, pos) => {
            if (node.type.name === 'footnote' && node.attrs.id === id) {
              tr.delete(pos, pos + node.nodeSize);
              removed = true;
            }
          });

          // Renumber remaining footnotes
          if (removed) {
            let number = 1;
            state.doc.descendants((node, pos) => {
              if (node.type.name === 'footnote') {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  number: number++,
                });
              }
            });
          }

          return removed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-f': ({ editor }: { editor: Editor }) => {
        // Trigger footnote insertion UI
        // This would be handled by the parent component
        return false; // Let parent handle
      },
    };
  },
});

/**
 * Extract all footnotes from a document
 */
export function extractFootnotes(doc: JSONContent): FootnoteAttrs[] {
  const footnotes: FootnoteAttrs[] = [];
  
  function traverse(node: JSONContent | undefined) {
    if (!node) return;
    
    if (node.type === 'footnote' && node.attrs) {
      footnotes.push(node.attrs as FootnoteAttrs);
    }
    
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  }
  
  traverse(doc);
  
  // Sort by number
  return footnotes.sort((a, b) => a.number - b.number);
}

// Add missing import
import type { JSONContent } from '@tiptap/core';
