import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { format } from 'date-fns';
import { Toolbar, type ToolbarItem } from '@/components/common';
import type { Draft } from '@/types/drafts';
import { useEditorShortcuts } from '@/hooks';
import { StatusBadge } from './StatusBadge';

interface DraftEditorProps {
  draft: Draft | null;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onStatusCycle: () => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, ' ');
}

function getEditorBackground(): string {
  return [
    // Soft page breaks every ~1 page to preserve writing flow without hard pagination.
    'repeating-linear-gradient(to bottom, transparent 0 1054px, color-mix(in srgb, var(--color-text-tertiary) 30%, transparent) 1054px 1056px)',
    'var(--color-bg-paper)',
  ].join(', ');
}

function buildToolbarItems(editor: Editor): ToolbarItem[] {
  return [
    {
      id: 'bold',
      label: 'Bold',
      onClick: () => editor.chain().focus().toggleBold().run(),
      icon: <strong>B</strong>,
      tooltip: 'Bold (Ctrl+B)',
      toggle: true,
      isActive: editor.isActive('bold'),
    },
    {
      id: 'italic',
      label: 'Italic',
      onClick: () => editor.chain().focus().toggleItalic().run(),
      icon: <em>I</em>,
      tooltip: 'Italic (Ctrl+I)',
      toggle: true,
      isActive: editor.isActive('italic'),
    },
    {
      id: 'underline',
      label: 'Underline',
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      icon: <span style={{ textDecoration: 'underline' }}>U</span>,
      tooltip: 'Underline (Ctrl+U)',
      toggle: true,
      isActive: editor.isActive('underline'),
    },
    {
      id: 'strikethrough',
      label: 'Strikethrough',
      onClick: () => editor.chain().focus().toggleStrike().run(),
      icon: <s>S</s>,
      tooltip: 'Strikethrough',
      toggle: true,
      isActive: editor.isActive('strike'),
    },
    { id: 'sep-1', type: 'separator' },
    {
      id: 'heading-1',
      label: 'Heading 1',
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: <span>H1</span>,
      tooltip: 'Heading 1 (Ctrl+1)',
      toggle: true,
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      id: 'heading-2',
      label: 'Heading 2',
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: <span>H2</span>,
      tooltip: 'Heading 2 (Ctrl+2)',
      toggle: true,
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      id: 'heading-3',
      label: 'Heading 3',
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      icon: <span>H3</span>,
      tooltip: 'Heading 3 (Ctrl+3)',
      toggle: true,
      isActive: editor.isActive('heading', { level: 3 }),
    },
    { id: 'sep-2', type: 'separator' },
    {
      id: 'bullet-list',
      label: 'Bullet List',
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="4" cy="6" r="2" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="4" cy="18" r="2" />
          <rect x="8" y="5" width="14" height="2" />
          <rect x="8" y="11" width="14" height="2" />
          <rect x="8" y="17" width="14" height="2" />
        </svg>
      ),
      tooltip: 'Bullet List',
      toggle: true,
      isActive: editor.isActive('bulletList'),
    },
    {
      id: 'ordered-list',
      label: 'Numbered List',
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <text x="2" y="8" fontSize="8" fontFamily="sans-serif">1.</text>
          <text x="2" y="14" fontSize="8" fontFamily="sans-serif">2.</text>
          <text x="2" y="20" fontSize="8" fontFamily="sans-serif">3.</text>
          <rect x="10" y="5" width="12" height="2" />
          <rect x="10" y="11" width="12" height="2" />
          <rect x="10" y="17" width="12" height="2" />
        </svg>
      ),
      tooltip: 'Numbered List',
      toggle: true,
      isActive: editor.isActive('orderedList'),
    },
    {
      id: 'blockquote',
      label: 'Block Quote',
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
        </svg>
      ),
      tooltip: 'Block Quote',
      toggle: true,
      isActive: editor.isActive('blockquote'),
    },
    { id: 'sep-3', type: 'separator' },
    {
      id: 'horizontal-rule',
      label: 'Horizontal Rule',
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      tooltip: 'Horizontal Rule',
    },
    {
      id: 'undo',
      label: 'Undo',
      onClick: () => editor.chain().focus().undo().run(),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v6h6" />
          <path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
        </svg>
      ),
      tooltip: 'Undo (Ctrl+Z)',
      disabled: !editor.can().undo(),
    },
    {
      id: 'redo',
      label: 'Redo',
      onClick: () => editor.chain().focus().redo().run(),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 7v6h-6" />
          <path d="M21 13a9 9 0 1 1-3-7.7L21 7" />
        </svg>
      ),
      tooltip: 'Redo (Ctrl+Shift+Z)',
      disabled: !editor.can().redo(),
    },
  ];
}

export function DraftEditor({
  draft,
  onTitleChange,
  onContentChange,
  onStatusCycle,
}: DraftEditorProps) {
  const [title, setTitle] = useState(() => draft?.title || '');
  const [wordCount, setWordCount] = useState(() => countWords(stripHtml(draft?.content || '')));
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your draft...',
      }),
      Underline,
    ],
    content: draft?.content || '',
    editorProps: {
      attributes: {
        style: `
          min-height: 400px;
          outline: none;
          font-family: 'Crimson Pro', 'Georgia', serif;
          font-size: 1.125rem;
          line-height: 1.75;
          color: var(--color-text-primary);
        `,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();

      setWordCount(countWords(text));

      // Debounce save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onContentChange(html);
      }, 500);
    },
  });

  useEditorShortcuts(editor, { includeUnderline: true, includeHeadings: true });

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (titleSaveTimeoutRef.current) {
        clearTimeout(titleSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
    }
    titleSaveTimeoutRef.current = setTimeout(() => {
      onTitleChange(newTitle);
    }, 500);
  }, [onTitleChange]);

  if (!draft) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-tertiary)',
          backgroundColor: 'var(--color-bg-secondary)',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ marginBottom: '16px', opacity: 0.5 }}
        >
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <p style={{ fontSize: '16px', margin: 0 }}>Select a draft or create a new one</p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {/* Header with title, status, and meta info */}
      <div
        style={{
          padding: '20px 32px 16px',
          borderBottom: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Draft"
          disabled={draft.isLocked}
          style={{
            width: '100%',
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: "'Crimson Pro', 'Georgia', serif",
            color: 'var(--color-text-primary)',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            padding: 0,
            marginBottom: '12px',
          }}
        />

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <StatusBadge
            status={draft.status}
            onClick={draft.isLocked ? undefined : onStatusCycle}
            disabled={draft.isLocked}
          />

          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {wordCount} words
          </span>

          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
            }}
          >
            Last edited {format(new Date(draft.modifiedAt), 'MMM d, yyyy')} at {format(new Date(draft.modifiedAt), 'h:mm a')}
          </span>

          {draft.isLocked && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: 'var(--color-text-tertiary)',
                marginLeft: 'auto',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: getEditorBackground(),
        }}
        data-testid="draft-editor-paper"
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '32px 48px',
          }}
        >
          <EditorContent
            editor={editor}
            style={{
              minHeight: '100%',
            }}
          />
        </div>
      </div>

      {/* Formatting toolbar */}
      {editor && !draft.isLocked && (
        <div className="muwi-draft-editor__toolbar">
          <Toolbar
            items={buildToolbarItems(editor)}
            ariaLabel="Draft formatting toolbar"
          />
        </div>
      )}
    </div>
  );
}
