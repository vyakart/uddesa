import { Node, mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface TitleNodeOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    titleNode: {
      setTitle: () => ReturnType;
    };
  }
}

/**
 * TitleNode extension for Tiptap
 * 
 * Creates a single-line title block that:
 * - Cannot contain line breaks
 * - Shows "Untitled" placeholder when empty
 * - Moves focus to body paragraph on Enter key
 * - Always appears at the top of the document
 */
export const TitleNode = Node.create<TitleNodeOptions>({
  name: 'title',

  priority: 1000,

  group: 'block',

  content: 'inline*',

  defining: true,

  isolating: true,

  parseHTML() {
    return [
      {
        tag: 'h1[data-type="title"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'h1',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'title',
        class: 'title-node',
      }),
      0,
    ];
  },

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      setTitle:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Check if we're in the title node
        if ($from.parent.type.name === this.name) {
          // Find the next node after title (or create one if it doesn't exist)
          const titleNodePos = $from.before();
          const afterTitlePos = titleNodePos + $from.parent.nodeSize;

          // Check if there's content after the title
          const nextNode = state.doc.nodeAt(afterTitlePos);

          if (nextNode) {
            // Move cursor to the start of next node
            editor.commands.focus(afterTitlePos + 1);
          } else {
            // Insert a new paragraph after the title and move to it
            const tr = state.tr.insert(afterTitlePos, state.schema.nodes.paragraph.create());
            editor.view.dispatch(tr);
            editor.commands.focus(afterTitlePos + 1);
          }

          return true;
        }

        return false;
      },

      // Prevent Shift+Enter (hard break) in title
      'Shift-Enter': ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type.name === this.name) {
          return true; // Consume the event, do nothing
        }

        return false;
      },

      // Prevent Mod+Enter in title
      'Mod-Enter': ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type.name === this.name) {
          return true; // Consume the event, do nothing
        }

        return false;
      },
    };
  },
});
