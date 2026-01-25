import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import type { AcademicSection } from '@/types/academic';
import {
  useAcademicStore,
  selectAcademicViewMode,
} from '@/stores/academicStore';
import { CitationPicker } from './CitationPicker';

interface AcademicSectionEditorProps {
  section: AcademicSection | null;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function AcademicSectionEditor({
  section,
  onTitleChange,
  onContentChange,
}: AcademicSectionEditorProps) {
  const viewMode = useAcademicStore(selectAcademicViewMode);
  const isFocusMode = viewMode === 'focus';

  const [title, setTitle] = useState(section?.title || '');
  const [wordCount, setWordCount] = useState(0);
  const [showCitationPicker, setShowCitationPicker] = useState(false);
  const [citationPickerPosition, setCitationPickerPosition] = useState<{ x: number; y: number } | undefined>();

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
          font-family: 'Times New Roman', 'Georgia', serif;
          font-size: 12pt;
          line-height: 2;
          color: #1A1A1A;
        `,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();

      setWordCount(countWords(text));

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

  // Update title when section changes
  useEffect(() => {
    if (section) {
      setTitle(section.title);
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
    };
  }, []);

  // Keyboard shortcut for citation picker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        openCitationPicker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const openCitationPicker = useCallback(() => {
    // Get cursor position for positioning the picker
    if (editor) {
      const { view } = editor;
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);
      setCitationPickerPosition({ x: coords.left, y: coords.bottom + 10 });
    }
    setShowCitationPicker(true);
  }, [editor]);

  const handleInsertCitation = useCallback(
    (citation: string) => {
      if (editor) {
        editor.chain().focus().insertContent(citation).run();
      }
      setShowCitationPicker(false);
    },
    [editor]
  );

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
          backgroundColor: '#FFFFFF',
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
              style={{
                width: '100%',
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: "'Times New Roman', 'Georgia', serif",
                color: '#1F2937',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: 0,
                marginBottom: '32px',
                textAlign: 'center',
              }}
            />
            <EditorContent editor={editor} />
          </div>
        </div>

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
        </div>

        {showCitationPicker && (
          <CitationPicker
            onInsert={handleInsertCitation}
            onClose={() => setShowCitationPicker(false)}
            position={citationPickerPosition}
          />
        )}
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
      {/* Header with title */}
      <div
        style={{
          padding: '20px 32px 16px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
        }}
      >
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Section Title"
          style={{
            width: '100%',
            fontSize: '22px',
            fontWeight: 700,
            fontFamily: "'Times New Roman', 'Georgia', serif",
            color: '#1F2937',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            padding: 0,
            marginBottom: '8px',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
            color: '#6B7280',
          }}
        >
          <span>{wordCount} words</span>
          <span style={{ color: '#9CA3AF' }}>
            Press{' '}
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: '#F3F4F6',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              Ctrl+Shift+C
            </kbd>{' '}
            to insert citation
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '32px 48px',
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Formatting toolbar */}
      {editor && (
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

          {/* Citation button */}
          <ToolbarButton
            onClick={openCitationPicker}
            isActive={false}
            title="Insert Citation (Ctrl+Shift+C)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
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

      {/* Citation Picker */}
      {showCitationPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCitationPicker(false);
            }
          }}
        >
          <CitationPicker
            onInsert={handleInsertCitation}
            onClose={() => setShowCitationPicker(false)}
          />
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
