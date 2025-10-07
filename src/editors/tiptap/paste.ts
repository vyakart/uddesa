import type { Editor } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';

function cleanHtml(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');

  if (!parsed.body) {
    return html;
  }

  const removableTags = ['style', 'script', 'meta', 'link'];
  removableTags.forEach((tag) => {
    parsed.querySelectorAll(tag).forEach((element: Element) => element.remove());
  });

  const allowedAttributes = new Set(['href', 'src', 'alt', 'title']);

  const walk = (node: Element) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (!allowedAttributes.has(name)) {
        node.removeAttribute(attr.name);
      } else if (name === 'href' && node.getAttribute(attr.name)?.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    });

    if (node.tagName === 'SPAN' && node.attributes.length === 0) {
      const parent = node.parentElement;
      if (parent) {
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
        return;
      }
    }

    if (node.tagName === 'DIV') {
      const paragraph = document.createElement('p');
      while (node.firstChild) {
        paragraph.appendChild(node.firstChild);
      }
      node.replaceWith(paragraph);
      walk(paragraph);
      return;
    }

    node.childNodes.forEach((child) => {
      if (child instanceof Element) {
        walk(child);
      }
    });
  };

  parsed.body.querySelectorAll('*').forEach((element: Element) => {
    walk(element);
  });

  return parsed.body.innerHTML;
}

export function configurePaste(editor: Editor): void {
  if (!editor || editor.isDestroyed) {
    return;
  }

  const pastePlugin = new Plugin({
    props: {
      transformPastedHTML(html: string) {
        return cleanHtml(html);
      },
    },
  });

  editor.registerPlugin(pastePlugin);
}
