import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { format, parseISO } from 'date-fns';
import { Button, PasskeyPrompt } from '@/components/common';
import { useContentLocking, useEditorShortcuts } from '@/hooks';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { DatePicker } from './DatePicker';
import type { DiaryEntry as DiaryEntryType, PersonalDiarySettings } from '@/types/diary';

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
      return 'radial-gradient(circle at 10% 12%, color-mix(in srgb, var(--color-text-primary) 8%, transparent) 0 1px, transparent 1px)';
    case 'paper-white':
      return 'radial-gradient(circle at 82% 80%, color-mix(in srgb, var(--color-text-primary) 6%, transparent) 0 1px, transparent 1px)';
    default:
      return undefined;
  }
}

function resolvePaperBaseColor(settings: PersonalDiarySettings): string {
  const normalized = settings.paperColor.trim().toLowerCase();
  if (normalized === '#fffef9' || normalized === '#fffdf8') {
    return 'var(--color-bg-canvas-warm)';
  }
  return settings.paperColor;
}

function getEditorBackground(settings: PersonalDiarySettings): string {
  const layers: string[] = [];

  if (settings.showLines) {
    layers.push(
      'repeating-linear-gradient(to bottom, transparent 0 calc((var(--leading-relaxed) * 1rem) - 1px), color-mix(in srgb, var(--color-border-on-canvas) 70%, transparent) calc((var(--leading-relaxed) * 1rem) - 1px) calc(var(--leading-relaxed) * 1rem))'
    );
  }

  const textureOverlay = getTextureOverlay(settings.paperTexture);
  if (textureOverlay) {
    layers.push(textureOverlay);
  }

  layers.push(resolvePaperBaseColor(settings));
  return layers.join(', ');
}

interface PersonalToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  isActive?: boolean;
}

function PersonalToolbarButton({
  onClick,
  title,
  children,
  isActive = false,
}: PersonalToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="muwi-personal-entry__toolbar-button"
      data-active={isActive ? 'true' : 'false'}
      aria-label={title}
    >
      {children}
    </button>
  );
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
        class: 'tiptap muwi-personal-entry-editor',
        style: 'min-height: 300px;',
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
      <div className="muwi-personal-entry__empty">
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
    <div className="muwi-personal-entry">
      {/* Header with date picker */}
      <div className="muwi-personal-entry__header">
        <DatePicker
          selectedDate={toDate(entry.date)}
          onDateChange={onDateChange}
          dateFormat={settings.dateFormat}
        />
        <div className="muwi-personal-entry__meta">
          <span className="muwi-personal-entry__meta-text">{wordCount} words</span>
          <span className="muwi-personal-entry__meta-text is-subtle">
            Last edited: {format(entry.modifiedAt, 'h:mm a')}
          </span>
          {entry.isLocked ? <span className="muwi-personal-entry__lock-state">Locked</span> : null}
          <Button
            type="button"
            onClick={() => void handleLockToggle()}
            variant="secondary"
            size="sm"
            className="muwi-personal-entry__lock-toggle"
          >
            {entry.isLocked ? 'Unlock' : 'Lock'}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        className="muwi-personal-entry__paper"
        style={{
          background: getEditorBackground(settings),
          backgroundSize: settings.paperTexture ? '140px 140px' : undefined,
        }}
        data-testid="diary-entry-paper"
      >
        <div
          className="muwi-personal-entry__content"
          style={{ fontFamily: settings.font }}
          data-testid="diary-entry-content"
        >
          <EditorContent editor={editor} className="muwi-personal-entry__editor-content" />
        </div>
      </div>

      {/* Formatting Toolbar */}
      {editor && !entry.isLocked ? (
        <div className="muwi-personal-entry__toolbar" role="toolbar" aria-label="Personal diary toolbar">
          <PersonalToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            Undo
          </PersonalToolbarButton>
          <PersonalToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            Redo
          </PersonalToolbarButton>
          <span className="muwi-personal-entry__toolbar-separator" role="separator" aria-hidden="true" />
          <PersonalToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </PersonalToolbarButton>
          <PersonalToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </PersonalToolbarButton>
          <PersonalToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </PersonalToolbarButton>
          <span className="muwi-personal-entry__toolbar-separator" role="separator" aria-hidden="true" />
          <span className="muwi-personal-entry__font-display">Font: {settings.font}</span>
        </div>
      ) : null}

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
