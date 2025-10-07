import type { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import TurndownService from 'turndown';
import { createSchema, type SchemaOptions } from './schema';

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

turndown.addRule('strikethrough', {
  filter: (node: HTMLElement) => ['DEL', 'S', 'STRIKE'].includes(node.tagName),
  replacement: (content: string) => `~~${content}~~`,
});

turndown.addRule('hardBreak', {
  filter: (node: Node) => node.nodeName === 'BR',
  replacement: () => '  \n',
});

function normaliseDoc(doc: JSONContent | null | undefined): JSONContent {
  if (!doc || doc.type !== 'doc') {
    return EMPTY_DOC;
  }
  if (!doc.content || doc.content.length === 0) {
    return EMPTY_DOC;
  }
  return doc;
}

export function serializeToHtml(doc: JSONContent | null | undefined, options?: SchemaOptions): string {
  const schema = options ? createSchema(options) : createSchema();
  return generateHTML(normaliseDoc(doc), schema);
}

export function serializeToMarkdown(doc: JSONContent | null | undefined, options?: SchemaOptions): string {
  const html = serializeToHtml(doc, options);
  return turndown.turndown(html).trim();
}
