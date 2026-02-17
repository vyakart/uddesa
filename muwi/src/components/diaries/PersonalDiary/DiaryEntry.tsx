import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { format, parseISO } from 'date-fns';
import { DatePicker } from './DatePicker';
import { PasskeyPrompt } from '@/components/common';
import { useEditorShortcuts, useContentLocking } from '@/hooks';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type {
  DiaryEntry as DiaryEntryType,
  PersonalDiarySettings,
} from '@/types/diary';

// Helper to safely convert entry.date to Date object (handles both string and Date)
function toDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  return parseISO(date);
}

interface DiaryEntryProps {
  entry: DiaryEntryType | null;
  onContentChange: (content: string) => void;
  onDateChange: (date: Date) => void;
  onLockChange: (isLocked: boolean) => void;
  settings: PersonalDiarySettings;
}

// Helper function to count words from text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, ' ');
}

function getTextureOverlay(texture: string): string | undefined {
  switch (texture) {
    case 'paper-cream':
      return 'radial-gradient(circle at 10% 12%, rgba(0, 0, 0, 0.04) 0 1px, transparent 1px)';
    case 'paper-white':
      return 'radial-gradient(circle at 82% 80%, rgba(0, 0, 0, 0.03) 0 1px, transparent 1px)';
    default:
      return undefined;
  }
}

function getEditorBackground(settings: PersonalDiarySettings): string {
  const layers: string[] = [];

  if (settings.showLines) {
    layers.push(
      'repeating-linear-gradient(to bottom, transparent 0 31px, rgba(74, 144, 164, 0.18) 31px 32px)'
    );
  }

  const textureOverlay = getTextureOverlay(settings.paperTexture);
  if (textureOverlay) {
    layers.push(textureOverlay);
  }

  layers.push(settings.paperColor);
  return layers.join(', ');
}

export function DiaryEntry({
  entry,
  onContentChange,
  onDateChange,
  onLockChange,
  settings,
}: DiaryEntryProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [wordCount, setWordCount] = useState(() => countWords(stripHtml(entry?.content ?? '')));
  const closeDiary = useAppStore((state) => state.closeDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const hasPasskey = useSettingsStore((state) => state.hasPasskey);
  const passkeyHint = useSettingsStore((state) => state.global.passkeyHint);
  const {
    lock,
    unlock,
    error: lockingError,
  } = useContentLocking({
    contentType: 'entry',
    contentId: entry?.id ?? '',
    enabled: Boolean(entry?.id),
  });

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
      Underline,
    ],
    content: entry?.content || '',
    editable: !entry?.isLocked,
    editorProps: {
      attributes: {
        class: 'tiptap',
        style: `
          min-height: 300px;
          outline: none;
          font-size: 1.125rem;
          line-height: 1.8;
          color: #1A1A1A;
        `,
      },
    },
    onUpdate: ({ editor }) => {
      if (entry?.isLocked) {
        return;
      }
      const html = editor.getHTML();
      const text = editor.getText();

      // Update word count immediately
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

  useEffect(() => {
    if (editor) {
      editor.setEditable(!entry?.isLocked);
    }
  }, [editor, entry?.isLocked]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

  const promptPasskeySetup = () => {
    const shouldOpenSettings = confirm('A passkey is required to lock content. Open Settings to set one now?');
    if (shouldOpenSettings) {
      closeDiary();
      openSettings();
    }
  };

  const handleLockToggle = async () => {
    if (entry.isLocked) {
      setShowUnlockPrompt(true);
      return;
    }

    const hasPass = await hasPasskey();
    if (!hasPass) {
      promptPasskeySetup();
      return;
    }

    const didLock = await lock();
    if (didLock) {
      onLockChange(true);
    }
  };

  const handleUnlockSubmit = async (passkey: string) => {
    const didUnlock = await unlock(passkey);
    if (didUnlock) {
      onLockChange(false);
      setShowUnlockPrompt(false);
    }
  };

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
          selectedDate={toDate(entry.date)}
          onDateChange={onDateChange}
          dateFormat={settings.dateFormat}
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
            {wordCount} words
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#AAAAAA',
            }}
          >
            Last edited: {format(entry.modifiedAt, 'h:mm a')}
          </span>
          {entry.isLocked ? (
            <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Locked</span>
          ) : null}
          <button
            type="button"
            onClick={() => void handleLockToggle()}
            style={{
              padding: '0.3rem 0.6rem',
              border: '1px solid #DADADA',
              borderRadius: 6,
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: '#4A4A4A',
            }}
          >
            {entry.isLocked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: getEditorBackground(settings),
          backgroundSize: settings.paperTexture ? '140px 140px' : undefined,
        }}
        data-testid="diary-entry-paper"
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '24px 40px',
            fontFamily: settings.font,
          }}
          data-testid="diary-entry-content"
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
      {editor && !entry.isLocked && (
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
          <div style={{ width: '1px', backgroundColor: '#E0E0E0', margin: '0 8px' }} />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1 (Ctrl+1)"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2 (Ctrl+2)"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3 (Ctrl+3)"
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

      <PasskeyPrompt
        isOpen={showUnlockPrompt}
        onClose={() => setShowUnlockPrompt(false)}
        onSubmit={handleUnlockSubmit}
        title="Unlock entry"
        description="Enter your passkey to unlock this diary entry."
        hint={passkeyHint}
        error={lockingError}
        submitLabel="Unlock"
      />
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
