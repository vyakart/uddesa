import StarterKit from '@tiptap/starter-kit';
import type { Level as HeadingLevel } from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import type { Extension } from '@tiptap/core';

export interface SchemaOptions {
  placeholder?: string;
  headingLevels?: number[];
}

export function createSchema(options: SchemaOptions = {}): Extension[] {
  const { placeholder = 'Start writing…', headingLevels = [1, 2, 3] } = options;
  return [
    StarterKit.configure({
      heading: {
        levels: headingLevels as HeadingLevel[],
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      dropcursor: {
        class: undefined,
        width: 3,
        color: '#6366f1',
      },
      history: {
        depth: 200,
      },
    }),
    Placeholder.configure({
      placeholder,
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
      includeChildren: true,
    }),
  ];
}
