import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface FootnoteOptions {
  HTMLAttributes: Record<string, unknown>;
  onFootnoteClick?: (id: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      /**
       * Insert a footnote at the current position
       */
      insertFootnote: (id: string, marker: number) => ReturnType;
      /**
       * Remove a footnote by its ID
       */
      removeFootnote: (id: string) => ReturnType;
      /**
       * Update a footnote's marker number
       */
      updateFootnoteMarker: (id: string, marker: number) => ReturnType;
    };
  }
}

export const Footnote = Mark.create<FootnoteOptions>({
  name: 'footnote',

  addOptions() {
    return {
      HTMLAttributes: {},
      onFootnoteClick: undefined,
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-footnote-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-footnote-id': attributes.id,
          };
        },
      },
      marker: {
        default: 1,
        parseHTML: (element) => {
          const marker = element.getAttribute('data-footnote-marker');
          return marker ? parseInt(marker, 10) : 1;
        },
        renderHTML: (attributes) => {
          return {
            'data-footnote-marker': attributes.marker,
          };
        },
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

  renderHTML({ HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'footnote-marker',
        style: `
          cursor: pointer;
          color: #4A90A4;
          font-weight: 600;
          font-size: 0.75em;
          vertical-align: super;
          padding: 0 2px;
          border-radius: 2px;
          transition: background-color 150ms ease;
        `,
      }),
      `[${HTMLAttributes['data-footnote-marker'] || '?'}]`,
    ];
  },

  addCommands() {
    return {
      insertFootnote:
        (id: string, marker: number) =>
        ({ commands, state }) => {
          // Insert a zero-width space with the footnote mark
          const { from, to } = state.selection;

          // First insert a placeholder character that will hold the mark
          commands.insertContent({
            type: 'text',
            text: '\u200B', // Zero-width space as the marked content
            marks: [
              {
                type: this.name,
                attrs: { id, marker },
              },
            ],
          });

          return true;
        },

      removeFootnote:
        (id: string) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let removed = false;

          doc.descendants((node, pos) => {
            if (node.isText) {
              const footnoteMarks = node.marks.filter(
                (mark) => mark.type.name === this.name && mark.attrs.id === id
              );
              if (footnoteMarks.length > 0) {
                // Remove the mark and possibly the zero-width space
                if (dispatch) {
                  const from = pos;
                  const to = pos + node.nodeSize;
                  tr.delete(from, to);
                }
                removed = true;
              }
            }
          });

          return removed;
        },

      updateFootnoteMarker:
        (id: string, marker: number) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let updated = false;

          doc.descendants((node, pos) => {
            if (node.isText) {
              node.marks.forEach((mark) => {
                if (mark.type.name === this.name && mark.attrs.id === id) {
                  if (dispatch) {
                    const newMark = mark.type.create({ ...mark.attrs, marker });
                    tr.removeMark(pos, pos + node.nodeSize, mark);
                    tr.addMark(pos, pos + node.nodeSize, newMark);
                  }
                  updated = true;
                }
              });
            }
          });

          return updated;
        },
    };
  },

  addProseMirrorPlugins() {
    const { onFootnoteClick } = this.options;

    return [
      new Plugin({
        key: new PluginKey('footnoteClick'),
        props: {
          handleClick(view, pos, event) {
            const { state } = view;
            const { doc } = state;

            // Get the resolved position
            const $pos = doc.resolve(pos);
            const node = $pos.nodeAfter || $pos.nodeBefore;

            if (node && node.isText) {
              const footnoteMark = node.marks.find(
                (mark) => mark.type.name === 'footnote'
              );

              if (footnoteMark && onFootnoteClick) {
                event.preventDefault();
                onFootnoteClick(footnoteMark.attrs.id);
                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});

export default Footnote;
