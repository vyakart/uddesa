import { useEffect, useMemo, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent, Editor } from '@tiptap/core';
import { createSchema, type SchemaOptions } from './schema';
import { configurePaste } from './paste';

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function normaliseContent(value: JSONContent | null | undefined): JSONContent {
  if (!value || value.type !== 'doc') {
    return EMPTY_DOC;
  }
  if (!Array.isArray(value.content) || value.content.length === 0) {
    return EMPTY_DOC;
  }
  return value;
}

export interface RichTextProps {
  value: JSONContent | null | undefined;
  onChange: (value: JSONContent) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  autofocus?: boolean;
  schemaOptions?: SchemaOptions;
  onEditorReady?: (editor: Editor) => void;
}

export function RichText({
  value,
  onChange,
  placeholder,
  className,
  readOnly = false,
  autofocus = false,
  schemaOptions,
  onEditorReady,
}: RichTextProps) {
  const options = useMemo<SchemaOptions>(() => ({ ...(schemaOptions ?? {}), placeholder }), [
    placeholder,
    schemaOptions,
  ]);

  const extensions = useMemo(() => createSchema(options), [options]);
  const lastJsonRef = useRef<string>(JSON.stringify(normaliseContent(value)));
  const pasteConfiguredRef = useRef(false);

  const editor = useEditor({
    extensions,
    content: normaliseContent(value),
    editable: !readOnly,
    autofocus: autofocus ? 'end' : undefined,
    onUpdate: ({ editor: current }) => {
      const json = current.getJSON();
      const serialised = JSON.stringify(json);
      lastJsonRef.current = serialised;
      onChange(json);
    },
    editorProps: {
      attributes: {
        class: 'rich-text__content',
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (!pasteConfiguredRef.current) {
      configurePaste(editor);
      pasteConfiguredRef.current = true;
      if (onEditorReady) {
        onEditorReady(editor);
      }
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const next = normaliseContent(value);
    const serialised = JSON.stringify(next);

    if (serialised !== lastJsonRef.current) {
      editor.commands.setContent(next, false, {
        preserveWhitespace: 'full',
      });
      lastJsonRef.current = serialised;
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setOptions({
      autofocus: autofocus ? 'end' : undefined,
    });
  }, [editor, autofocus]);

  const rootClassName = ['rich-text', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <EditorContent editor={editor} />
    </div>
  );
}
