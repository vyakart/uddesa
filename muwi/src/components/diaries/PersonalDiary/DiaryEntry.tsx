import { useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { format } from 'date-fns';
import { DatePicker } from './DatePicker';
import type { DiaryEntry as DiaryEntryType } from '@/types/diary';

interface DiaryEntryProps {
  entry: DiaryEntryType | null;
  onContentChange: (content: string) => void;
  onDateChange: (date: Date) => void;
}

export function DiaryEntry({
  entry,
  onContentChange,
  onDateChange,
}: DiaryEntryProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your thoughts for today...',
      }),
    ],
    content: entry?.content || '',
    editorProps: {
      attributes: {
        style: `
          min-height: 300px;
          outline: none;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 1.125rem;
          line-height: 1.8;
          color: #1A1A1A;
        `,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      // Debounce save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onContentChange(html);
      }, 500);
    },
  });

  // Update editor content when entry changes
  useEffect(() => {
    if (editor && entry) {
      // Only update if content is different to avoid cursor jumping
      const currentContent = editor.getHTML();
      if (currentContent !== entry.content) {
        editor.commands.setContent(entry.content || '');
      }
    }
  }, [editor, entry?.id]); // Only trigger on entry ID change

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const getWordCount = useCallback(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.split(/\s+/).filter(Boolean).length;
  }, [editor]);

  if (!entry) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888888',
        }}
      >
        <p>Select or create an entry to start writing</p>
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
      }}
    >
      {/* Header with date picker */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #E0E0E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
        }}
      >
        <DatePicker
          selectedDate={entry.date}
          onDateChange={onDateChange}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontSize: '0.875rem',
              color: '#888888',
            }}
          >
            {getWordCount()} words
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#AAAAAA',
            }}
          >
            Last edited: {format(entry.updatedAt, 'h:mm a')}
          </span>
        </div>
      </div>

      {/* Editor Area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#FFFEF9',
          backgroundImage: `
            repeating-linear-gradient(
              transparent,
              transparent 31px,
              #E8E8E8 31px,
              #E8E8E8 32px
            )
          `,
          backgroundSize: '100% 32px',
          backgroundPosition: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '24px 40px',
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

      {/* Formatting Toolbar */}
      {editor && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #E0E0E0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            gap: '4px',
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
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <s>S</s>
          </ToolbarButton>
          <div style={{ width: '1px', backgroundColor: '#E0E0E0', margin: '0 8px' }} />
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
          <div style={{ width: '1px', backgroundColor: '#E0E0E0', margin: '0 8px' }} />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            &bull;
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            1.
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            &ldquo;
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}

// Toolbar button component
function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '6px 10px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: isActive ? '#E8F4F8' : 'transparent',
        color: isActive ? '#4A90A4' : '#666666',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 400,
        minWidth: '32px',
      }}
    >
      {children}
    </button>
  );
}
