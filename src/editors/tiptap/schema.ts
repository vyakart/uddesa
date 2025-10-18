import StarterKit from '@tiptap/starter-kit';
import type { Level as HeadingLevel } from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import type { Extension } from '@tiptap/core';
import { TitleNode } from './extensions/TitleNode';

export interface SchemaOptions {
  placeholder?: string;
  headingLevels?: number[];
  includeTitle?: boolean;
}

export function createSchema(options: SchemaOptions = {}): Extension[] {
  const { placeholder = 'Start writing…', headingLevels = [1, 2, 3], includeTitle = false } = options;
  
  const baseExtensions = [
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
  
  // Add TitleNode if requested (Tiptap allows mixing Node and Extension types)
  if (includeTitle) {
    return [TitleNode as any, ...baseExtensions];
  }
  
  return baseExtensions;
}
