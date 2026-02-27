import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { format } from 'date-fns';
import { Footnote } from '@/extensions';
import { Toolbar, type ToolbarItem } from '@/components/common/Toolbar';
import type { Section, Footnote as SectionFootnote } from '@/types/longDrafts';
import { useEditorShortcuts } from '@/hooks';
import {
  useLongDraftsStore,
  selectViewMode,
} from '@/stores/longDraftsStore';
import { FootnoteManager } from './FootnoteManager';

interface SectionEditorProps {
  section: Section | null;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onNotesChange: (notes: string) => void;
  onStatusChange: (status: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'var(--color-text-tertiary)' },
  { value: 'in-progress', label: 'In Progress', color: 'var(--color-status-in-progress)' },
  { value: 'review', label: 'Review', color: 'var(--color-status-review)' },
  { value: 'complete', label: 'Complete', color: 'var(--color-status-complete)' },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, ' ');
}

function buildSectionToolbarItems(editor: Editor, onInsertFootnote: () => void): ToolbarItem[] {
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
      id: 'insert-footnote',
      label: 'Insert Footnote',
      onClick: onInsertFootnote,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      ),
      tooltip: 'Insert Footnote',
    },
    { id: 'sep-4', type: 'separator' },
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

export function SectionEditor({
  section,
  onTitleChange,
  onContentChange,
  onNotesChange,
  onStatusChange,
}: SectionEditorProps) {
  const viewMode = useLongDraftsStore(selectViewMode);
  const isFocusMode = viewMode === 'focus';

  const [title, setTitle] = useState(() => section?.title || '');
  const [notes, setNotes] = useState(() => section?.notes || '');
  const [wordCount, setWordCount] = useState(() => countWords(stripHtml(section?.content || '')));
  const [showNotes, setShowNotes] = useState(false);
  const [showFootnotes, setShowFootnotes] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [highlightedFootnoteId, setHighlightedFootnoteId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typewriterFrameRef = useRef<number | null>(null);
  const focusScrollContainerRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const updateSection = useLongDraftsStore((state) => state.updateSection);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing this section...',
      }),
      Underline,
      Footnote.configure({
        onFootnoteClick: (footnoteId: string) => {
          setHighlightedFootnoteId(footnoteId);
          setShowFootnotes(true);
        },
      }),
    ],
    content: section?.content || '',
    editorProps: {
      attributes: {
        style: `
          min-height: 400px;
          outline: none;
          font-family: 'Crimson Pro', 'Georgia', serif;
          font-size: 1.125rem;
          line-height: 1.85;
          color: var(--color-text-on-canvas);
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

  const scheduleTypewriterCenter = useCallback(() => {
    if (!isFocusMode || !editor) {
      return;
    }

    if (typewriterFrameRef.current !== null) {
      cancelAnimationFrame(typewriterFrameRef.current);
    }

    typewriterFrameRef.current = requestAnimationFrame(() => {
      const scrollContainer = focusScrollContainerRef.current;
      if (!scrollContainer) {
        return;
      }

      let caretCoordinates: { top: number; bottom: number };
      try {
        caretCoordinates = editor.view.coordsAtPos(editor.state.selection.from);
      } catch {
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const caretMidpoint = (caretCoordinates.top + caretCoordinates.bottom) / 2;
      const containerMidpoint = containerRect.top + (containerRect.height / 2);
      const scrollDelta = caretMidpoint - containerMidpoint;

      if (Math.abs(scrollDelta) < 1) {
        return;
      }

      scrollContainer.scrollTop += scrollDelta;
    });
  }, [editor, isFocusMode]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
      if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
      if (typewriterFrameRef.current !== null) cancelAnimationFrame(typewriterFrameRef.current);
    };
  }, []);

  // Typewriter mode: keep current line centered while writing in focus mode
  useEffect(() => {
    if (!editor || !isFocusMode) {
      return;
    }

    const centerLine = () => scheduleTypewriterCenter();

    editor.on('selectionUpdate', centerLine);
    editor.on('update', centerLine);
    editor.on('focus', centerLine);
    window.addEventListener('resize', centerLine);

    centerLine();

    return () => {
      editor.off('selectionUpdate', centerLine);
      editor.off('update', centerLine);
      editor.off('focus', centerLine);
      window.removeEventListener('resize', centerLine);
      if (typewriterFrameRef.current !== null) {
        cancelAnimationFrame(typewriterFrameRef.current);
        typewriterFrameRef.current = null;
      }
    };
  }, [editor, isFocusMode, scheduleTypewriterCenter]);

  // Close status menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);

      if (titleSaveTimeoutRef.current) {
        clearTimeout(titleSaveTimeoutRef.current);
      }
      titleSaveTimeoutRef.current = setTimeout(() => {
        onTitleChange(newTitle);
      }, 500);
    },
    [onTitleChange]
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newNotes = e.target.value;
      setNotes(newNotes);

      if (notesSaveTimeoutRef.current) {
        clearTimeout(notesSaveTimeoutRef.current);
      }
      notesSaveTimeoutRef.current = setTimeout(() => {
        onNotesChange(newNotes);
      }, 500);
    },
    [onNotesChange]
  );

  const handleStatusSelect = useCallback(
    (status: string) => {
      onStatusChange(status);
      setShowStatusMenu(false);
    },
    [onStatusChange]
  );

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === section?.status) || STATUS_OPTIONS[0];
  const handleInsertFootnote = useCallback(async () => {
    if (!section || !editor || section.isLocked) {
      return;
    }

    const marker = (section.footnotes?.length ?? 0) + 1;
    const newFootnote: SectionFootnote = {
      id: crypto.randomUUID(),
      marker,
      content: '',
      position: editor.state.selection.from,
    };

    await updateSection(section.id, {
      footnotes: [...(section.footnotes ?? []), newFootnote],
    });

    editor.chain().focus().insertFootnote(newFootnote.id, marker, '').run();
    setHighlightedFootnoteId(newFootnote.id);
    setShowFootnotes(true);
  }, [editor, section, updateSection]);

  const handleUpdateFootnote = useCallback(async (footnoteId: string, content: string) => {
    if (!section) {
      return;
    }

    const updatedFootnotes = (section.footnotes ?? []).map((footnote) =>
      footnote.id === footnoteId ? { ...footnote, content } : footnote
    );
    await updateSection(section.id, { footnotes: updatedFootnotes });
    editor?.commands.updateFootnoteContent(footnoteId, content);
  }, [editor, section, updateSection]);

  const handleDeleteFootnote = useCallback(async (footnoteId: string) => {
    if (!section) {
      return;
    }

    const remainingFootnotes = (section.footnotes ?? [])
      .filter((footnote) => footnote.id !== footnoteId)
      .map((footnote, index) => ({ ...footnote, marker: index + 1 }));

    await updateSection(section.id, { footnotes: remainingFootnotes });

    if (editor) {
      editor.commands.removeFootnote(footnoteId);
      remainingFootnotes.forEach((footnote) => {
        editor.commands.updateFootnoteMarker(footnote.id, footnote.marker);
      });
    }
    if (highlightedFootnoteId === footnoteId) {
      setHighlightedFootnoteId(null);
    }
  }, [editor, highlightedFootnoteId, section, updateSection]);

  const handleNavigateToFootnote = useCallback((footnoteId: string) => {
    if (!editor) {
      return;
    }

    let targetPosition: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) {
        return true;
      }

      const hasFootnoteMark = node.marks.some((mark) =>
        mark.type.name === 'footnote' && mark.attrs.id === footnoteId
      );

      if (hasFootnoteMark) {
        targetPosition = pos;
        return false;
      }

      return true;
    });

    if (targetPosition !== null) {
      editor.chain().focus().setTextSelection(targetPosition).run();
      setHighlightedFootnoteId(footnoteId);
    }
  }, [editor]);

  if (!section) {
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
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <p style={{ fontSize: '16px', margin: 0 }}>Select a section or create a new one</p>
      </div>
    );
  }

  // Focus mode: simplified editor view
  if (isFocusMode) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--color-bg-canvas-warm)',
        }}
      >
        <div
          ref={focusScrollContainerRef}
          data-testid="focus-scroll-container"
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '80px 48px',
            }}
          >
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Section Title"
              disabled={section.isLocked}
              style={{
                width: '100%',
                fontSize: '32px',
                fontWeight: 600,
                fontFamily: "'Crimson Pro', 'Georgia', serif",
                color: 'var(--color-text-primary)',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: 0,
                marginBottom: '32px',
                textAlign: 'center',
              }}
            />
            <EditorContent
              editor={editor}
              style={{
                minHeight: '100%',
                paddingTop: '24vh',
                paddingBottom: '40vh',
              }}
            />
          </div>
        </div>

        {/* Minimal status bar */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--color-border-default)',
            backgroundColor: 'var(--color-bg-primary)',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <span>{wordCount} words</span>
          <span>{section.footnotes?.length || 0} footnotes</span>
        </div>
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
          placeholder="Section Title"
          disabled={section.isLocked}
          style={{
            width: '100%',
            fontSize: '26px',
            fontWeight: 600,
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
          {/* Status dropdown */}
          <div ref={statusMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => !section.isLocked && setShowStatusMenu(!showStatusMenu)}
              disabled={section.isLocked}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                backgroundColor: `color-mix(in srgb, ${currentStatus.color} 16%, transparent)`,
                border: `1px solid color-mix(in srgb, ${currentStatus.color} 34%, transparent)`,
                borderRadius: '12px',
                cursor: section.isLocked ? 'not-allowed' : 'pointer',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: currentStatus.color,
                }}
              />
              {currentStatus.label}
              {!section.isLocked && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </button>

            {showStatusMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 50,
                  minWidth: '140px',
                  overflow: 'hidden',
                }}
              >
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusSelect(status.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: section.status === status.value ? 'var(--color-bg-tertiary)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      if (section.status !== status.value) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: status.color,
                      }}
                    />
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{wordCount} words</span>

          <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
            {section.footnotes?.length || 0} footnotes
          </span>

          <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
            Last edited {format(new Date(section.modifiedAt), 'MMM d, yyyy')} at{' '}
            {format(new Date(section.modifiedAt), 'h:mm a')}
          </span>

          {/* Notes toggle */}
          <button
            onClick={() => setShowFootnotes(!showFootnotes)}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              color: showFootnotes ? 'var(--color-accent-default)' : 'var(--color-text-secondary)',
              backgroundColor: showFootnotes ? 'var(--color-accent-subtle)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Toggle footnotes panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            Footnotes
          </button>

          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              color: showNotes ? 'var(--color-accent-default)' : 'var(--color-text-secondary)',
              backgroundColor: showNotes ? 'var(--color-accent-subtle)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Toggle author notes"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            Notes
          </button>

          {section.isLocked && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: 'var(--color-text-tertiary)',
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

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'var(--color-bg-canvas-warm)',
          }}
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

        {/* Notes panel */}
        {showNotes && (
          <div
            style={{
              width: '280px',
              borderLeft: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--color-warning-subtle)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Author Notes
              </span>
              <button
                type="button"
                onClick={() => setShowNotes(false)}
                aria-label="Close author notes"
                style={{
                  width: '20px',
                  height: '20px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add private notes about this section..."
              disabled={section.isLocked}
              style={{
                flex: 1,
                padding: '16px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--color-text-primary)',
                backgroundColor: 'transparent',
              }}
            />
          </div>
        )}

        {/* Footnotes panel */}
        {showFootnotes && (
          <div
            style={{
              width: '320px',
              borderLeft: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--color-bg-primary)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <FootnoteManager
              footnotes={section.footnotes ?? []}
              isLocked={section.isLocked}
              onAddFootnote={() => {
                void handleInsertFootnote();
              }}
              onUpdateFootnote={(id, content) => {
                void handleUpdateFootnote(id, content);
              }}
              onDeleteFootnote={(id) => {
                void handleDeleteFootnote(id);
              }}
              onNavigateToFootnote={handleNavigateToFootnote}
              highlightedFootnoteId={highlightedFootnoteId}
            />
          </div>
        )}
      </div>

      {/* Formatting toolbar */}
      {editor && !section.isLocked && (
        <div className="muwi-longdrafts-editor__toolbar">
          <Toolbar
            items={buildSectionToolbarItems(editor, () => {
              void handleInsertFootnote();
            })}
            ariaLabel="Section formatting toolbar"
          />
        </div>
      )}
    </div>
  );
}
