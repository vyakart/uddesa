import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

export interface MathOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      setInlineMath: (latex: string) => ReturnType;
      setBlockMath: (latex: string) => ReturnType;
    };
  }
}

/**
 * Inline Math extension for LaTeX equations
 * Renders using KaTeX for inline math like $x = 2$
 */
export const MathInline = Node.create<MathOptions>({
  name: 'mathInline',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex'),
        renderHTML: (attributes) => ({
          'data-latex': attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex as string;
    let html = '';

    try {
      html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      html = `<span class="math-error">${latex}</span>`;
    }

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'math-inline',
      }),
      {
        type: 'html',
        value: html,
      },
    ];
  },

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      setInlineMath:
        (latex: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
          });
        },
    };
  },
});

/**
 * Block Math extension for display equations
 * Renders using KaTeX for block math like $$\int_0^1 x^2 dx$$
 */
export const MathBlock = Node.create<MathOptions>({
  name: 'mathBlock',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex'),
        renderHTML: (attributes) => ({
          'data-latex': attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-latex]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex as string;
    let html = '';

    try {
      html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      html = `<div class="math-error">${latex}</div>`;
    }

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'math-block',
      }),
      {
        type: 'html',
        value: html,
      },
    ];
  },

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      setBlockMath:
        (latex: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
          });
        },
    };
  },
});
