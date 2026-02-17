import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';

interface UseEditorShortcutsOptions {
  enabled?: boolean;
  includeUnderline?: boolean;
  includeHeadings?: boolean;
}

function isEditableTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    target.closest('.ProseMirror') instanceof HTMLElement
  );
}

function isEventInsideEditor(editor: Editor, target: EventTarget | null): boolean {
  const editorNode = editor.view?.dom;
  if (!(editorNode instanceof Node)) {
    return false;
  }

  return target instanceof Node ? editorNode.contains(target) : false;
}

export function useEditorShortcuts(
  editor: Editor | null,
  options: UseEditorShortcutsOptions = {}
) {
  const {
    enabled = true,
    includeUnderline = true,
    includeHeadings = true,
  } = options;

  useEffect(() => {
    if (!enabled || !editor) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod || event.altKey) {
        return;
      }

      const insideEditor = isEventInsideEditor(editor, event.target);
      const focusedEditable = isEditableTarget(event.target);
      if (!insideEditor && !editor.isFocused && !focusedEditable) {
        return;
      }

      const key = event.key.toLowerCase();

      if (!event.shiftKey && key === 'b') {
        event.preventDefault();
        editor.chain().focus().toggleBold().run();
        return;
      }

      if (!event.shiftKey && key === 'i') {
        event.preventDefault();
        editor.chain().focus().toggleItalic().run();
        return;
      }

      if (!event.shiftKey && key === 'u' && includeUnderline) {
        event.preventDefault();
        const chain = editor.chain().focus() as {
          toggleUnderline?: () => { run: () => boolean };
        };
        chain.toggleUnderline?.().run();
        return;
      }

      if (!event.shiftKey && includeHeadings && (key === '1' || key === '2' || key === '3')) {
        event.preventDefault();
        editor.chain().focus().toggleHeading({ level: Number(key) as 1 | 2 | 3 }).run();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, enabled, includeUnderline, includeHeadings]);
}

