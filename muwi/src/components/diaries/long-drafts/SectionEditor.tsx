import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { format } from 'date-fns';
import type { Section } from '@/types/longDrafts';
import {
  useLongDraftsStore,
  selectCurrentSection,
  selectViewMode,
} from '@/stores/longDraftsStore';

interface SectionEditorProps {
  section: Section | null;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onNotesChange: (notes: string) => void;
  onStatusChange: (status: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: '#9CA3AF' },
  { value: 'in-progress', label: 'In Progress', color: '#F59E0B' },
  { value: 'review', label: 'Review', color: '#3B82F6' },
  { value: 'complete', label: 'Complete', color: '#10B981' },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
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

  const [title, setTitle] = useState(section?.title || '');
  const [notes, setNotes] = useState(section?.notes || '');
  const [wordCount, setWordCount] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

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
          color: #1A1A1A;
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

  // Update editor content when section changes
  useEffect(() => {
    if (editor && section) {
      const currentContent = editor.getHTML();
      if (currentContent !== section.content) {
        editor.commands.setContent(section.content || '');
      }
      setWordCount(countWords(editor.getText()));
    }
  }, [editor, section?.id]);

  // Update title and notes when section changes
  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setNotes(section.notes || '');
    }
  }, [section?.id]);

  // Initialize word count
  useEffect(() => {
    if (editor) {
      setWordCount(countWords(editor.getText()));
    }
  }, [editor]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
      if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
    };
  }, []);

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

  if (!section) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          backgroundColor: '#F9FAFB',
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
          backgroundColor: '#FFFEF9',
        }}
      >
        <div
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
                color: '#1F2937',
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
              }}
            />
          </div>
        </div>

        {/* Minimal status bar */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '13px',
            color: '#9CA3AF',
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
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header with title, status, and meta info */}
      <div
        style={{
          padding: '20px 32px 16px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
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
            color: '#1F2937',
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
                color: currentStatus.color,
                backgroundColor: `${currentStatus.color}15`,
                border: `1px solid ${currentStatus.color}30`,
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
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
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
                      backgroundColor: section.status === status.value ? '#F3F4F6' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
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

          <span style={{ fontSize: '13px', color: '#6B7280' }}>{wordCount} words</span>

          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
            {section.footnotes?.length || 0} footnotes
          </span>

          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
            Last edited {format(new Date(section.modifiedAt), 'MMM d, yyyy')} at{' '}
            {format(new Date(section.modifiedAt), 'h:mm a')}
          </span>

          {/* Notes toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              color: showNotes ? '#4A90A4' : '#6B7280',
              backgroundColor: showNotes ? '#EFF6FF' : 'transparent',
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
                color: '#9CA3AF',
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
            backgroundColor: '#FFFEF9',
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
              borderLeft: '1px solid #E5E7EB',
              backgroundColor: '#FEFCE8',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#854D0E' }}>
                Author Notes
              </span>
              <button
                onClick={() => setShowNotes(false)}
                style={{
                  width: '20px',
                  height: '20px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#854D0E',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                color: '#713F12',
                backgroundColor: 'transparent',
              }}
            />
          </div>
        )}
      </div>

      {/* Formatting toolbar */}
      {editor && !section.isLocked && (
        <div
          style={{
            padding: '10px 24px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <s>S</s>
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="4" cy="6" r="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="4" cy="18" r="2" />
              <rect x="8" y="5" width="14" height="2" />
              <rect x="8" y="11" width="14" height="2" />
              <rect x="8" y="17" width="14" height="2" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <text x="2" y="8" fontSize="8" fontFamily="sans-serif">
                1.
              </text>
              <text x="2" y="14" fontSize="8" fontFamily="sans-serif">
                2.
              </text>
              <text x="2" y="20" fontSize="8" fontFamily="sans-serif">
                3.
              </text>
              <rect x="10" y="5" width="12" height="2" />
              <rect x="10" y="11" width="12" height="2" />
              <rect x="10" y="17" width="12" height="2" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Block Quote"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton onClick={() => {}} isActive={false} title="Insert Footnote" disabled>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            isActive={false}
            title="Undo (Ctrl+Z)"
            disabled={!editor.can().undo()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" />
              <path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            isActive={false}
            title="Redo (Ctrl+Shift+Z)"
            disabled={!editor.can().redo()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" />
              <path d="M21 13a9 9 0 1 1-3-7.7L21 7" />
            </svg>
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
  disabled = false,
}: {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: isActive ? '#E0F2FE' : 'transparent',
        color: disabled ? '#D1D5DB' : isActive ? '#0284C7' : '#4B5563',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 400,
        minWidth: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.backgroundColor = '#F3F4F6';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div
      style={{
        width: '1px',
        height: '24px',
        backgroundColor: '#E5E7EB',
        margin: '0 8px',
        alignSelf: 'center',
      }}
    />
  );
}
