import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface FootnoteOptions {
  HTMLAttributes: Record<string, unknown>;
  onFootnoteClick?: (id: string) => void;
}

export interface FootnoteReference {
  id: string;
  marker: number;
  content: string;
}

export function collectFootnoteReferences(doc: ProseMirrorNode): FootnoteReference[] {
  const references: FootnoteReference[] = [];
  const seen = new Set<string>();

  doc.descendants((node) => {
    if (!node.isText) {
      return true;
    }

    for (const mark of node.marks) {
      if (mark.type.name !== 'footnote') {
        continue;
      }

      const id = typeof mark.attrs.id === 'string' ? mark.attrs.id : '';
      if (!id || seen.has(id)) {
        continue;
      }

      seen.add(id);
      const markerValue = Number(mark.attrs.marker);
      references.push({
        id,
        marker: Number.isFinite(markerValue) && markerValue > 0 ? markerValue : references.length + 1,
        content: typeof mark.attrs.content === 'string' ? mark.attrs.content : '',
      });
    }

    return true;
  });

  return references.sort((a, b) => a.marker - b.marker);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      /**
       * Insert a footnote at the current position
       */
      insertFootnote: (id: string, marker?: number, content?: string) => ReturnType;
      /**
       * Remove a footnote by its ID
       */
      removeFootnote: (id: string) => ReturnType;
      /**
       * Update a footnote's marker number
       */
      updateFootnoteMarker: (id: string, marker: number) => ReturnType;
      /**
       * Update a footnote's content text
       */
      updateFootnoteContent: (id: string, content: string) => ReturnType;
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
      content: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-footnote-content') ?? '',
        renderHTML: (attributes) => ({
          'data-footnote-content': attributes.content ?? '',
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
        (id: string, marker?: number, content = '') =>
        ({ commands, state }) => {
          let nextMarker = marker;

          if (nextMarker === undefined) {
            let highestMarker = 0;
            state.doc.descendants((node) => {
              if (!node.isText) {
                return true;
              }

              node.marks.forEach((mark) => {
                if (mark.type.name === this.name) {
                  const markerValue = Number(mark.attrs.marker);
                  if (Number.isFinite(markerValue)) {
                    highestMarker = Math.max(highestMarker, markerValue);
                  }
                }
              });

              return true;
            });
            nextMarker = highestMarker + 1;
          }

          // Insert a zero-width space with the footnote mark
          // Insert a placeholder character that will hold the mark
          commands.insertContent({
            type: 'text',
            text: '\u200B', // Zero-width space as the marked content
            marks: [
              {
                type: this.name,
                attrs: { id, marker: nextMarker, content },
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

      updateFootnoteContent:
        (id: string, content: string) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let updated = false;

          doc.descendants((node, pos) => {
            if (node.isText) {
              node.marks.forEach((mark) => {
                if (mark.type.name === this.name && mark.attrs.id === id) {
                  if (dispatch) {
                    const newMark = mark.type.create({ ...mark.attrs, content });
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
            const target = event.target as HTMLElement | null;
            const clickedFootnoteEl = target?.closest?.('[data-footnote-id]');
            const clickedFootnoteId = clickedFootnoteEl?.getAttribute('data-footnote-id');
            if (clickedFootnoteId && onFootnoteClick) {
              event.preventDefault();
              onFootnoteClick(clickedFootnoteId);
              return true;
            }

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
      new Plugin({
        key: new PluginKey('footnoteList'),
        props: {
          decorations(state) {
            const footnotes = collectFootnoteReferences(state.doc);
            if (footnotes.length === 0) {
              return DecorationSet.empty;
            }

            const footnoteWidget = Decoration.widget(
              state.doc.content.size,
              () => {
                const container = document.createElement('div');
                container.className = 'footnote-list';
                container.style.marginTop = '1.5rem';
                container.style.paddingTop = '0.75rem';
                container.style.borderTop = '1px solid #E5E7EB';
                container.style.fontSize = '0.9rem';
                container.style.color = '#4B5563';

                const heading = document.createElement('div');
                heading.textContent = 'Footnotes';
                heading.style.fontWeight = '600';
                heading.style.marginBottom = '0.5rem';
                container.appendChild(heading);

                const list = document.createElement('ol');
                list.style.margin = '0';
                list.style.paddingLeft = '1.2rem';
                list.style.display = 'flex';
                list.style.flexDirection = 'column';
                list.style.gap = '0.35rem';

                for (const footnote of footnotes) {
                  const item = document.createElement('li');
                  item.setAttribute('data-footnote-id', footnote.id);
                  item.style.cursor = 'pointer';
                  item.style.lineHeight = '1.45';

                  const marker = document.createElement('span');
                  marker.style.fontWeight = '600';
                  marker.textContent = `[${footnote.marker}] `;

                  const content = document.createElement('span');
                  content.textContent = footnote.content || '(empty footnote)';

                  item.appendChild(marker);
                  item.appendChild(content);
                  list.appendChild(item);
                }

                container.appendChild(list);
                return container;
              },
              { side: 1 }
            );

            return DecorationSet.create(state.doc, [footnoteWidget]);
          },
        },
      }),
    ];
  },
});

export default Footnote;
