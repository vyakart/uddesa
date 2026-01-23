import { useState, useCallback, useRef, useEffect, memo } from 'react';
import type { Footnote } from '@/types/longDrafts';

interface FootnoteManagerProps {
  footnotes: Footnote[];
  isLocked: boolean;
  onAddFootnote: () => void;
  onUpdateFootnote: (id: string, content: string) => void;
  onDeleteFootnote: (id: string) => void;
  onNavigateToFootnote: (id: string) => void;
  highlightedFootnoteId?: string | null;
}

export function FootnoteManager({
  footnotes,
  isLocked,
  onAddFootnote,
  onUpdateFootnote,
  onDeleteFootnote,
  onNavigateToFootnote,
  highlightedFootnoteId,
}: FootnoteManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; footnoteId: string } | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, footnoteId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, footnoteId });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this footnote?')) {
        onDeleteFootnote(id);
      }
      setContextMenu(null);
    },
    [onDeleteFootnote]
  );

  if (footnotes.length === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          color: '#9CA3AF',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ margin: '0 auto 12px', opacity: 0.5 }}
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        <p style={{ fontSize: '13px', margin: '0 0 16px' }}>No footnotes yet</p>
        {!isLocked && (
          <button
            onClick={onAddFootnote}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              color: '#4A90A4',
              backgroundColor: '#EFF6FF',
              border: '1px solid #4A90A4',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Add Footnote
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          Footnotes ({footnotes.length})
        </span>
        {!isLocked && (
          <button
            onClick={onAddFootnote}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              color: '#4A90A4',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add
          </button>
        )}
      </div>

      {/* Footnote list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {footnotes.map((footnote) => (
          <FootnoteItem
            key={footnote.id}
            footnote={footnote}
            isEditing={editingId === footnote.id}
            isHighlighted={highlightedFootnoteId === footnote.id}
            isLocked={isLocked}
            onStartEdit={() => setEditingId(footnote.id)}
            onEndEdit={() => setEditingId(null)}
            onUpdate={(content) => onUpdateFootnote(footnote.id, content)}
            onNavigate={() => onNavigateToFootnote(footnote.id)}
            onContextMenu={(e) => handleContextMenu(e, footnote.id)}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            zIndex: 100,
            minWidth: '140px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => {
              onNavigateToFootnote(contextMenu.footnoteId);
              setContextMenu(null);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: '#374151',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M14 10l7-7M10 3H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-6" />
            </svg>
            Go to Text
          </button>
          {!isLocked && (
            <button
              onClick={() => handleDelete(contextMenu.footnoteId)}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '13px',
                color: '#DC2626',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE2E2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface FootnoteItemProps {
  footnote: Footnote;
  isEditing: boolean;
  isHighlighted: boolean;
  isLocked: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onUpdate: (content: string) => void;
  onNavigate: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const FootnoteItem = memo(function FootnoteItem({
  footnote,
  isEditing,
  isHighlighted,
  isLocked,
  onStartEdit,
  onEndEdit,
  onUpdate,
  onNavigate,
  onContextMenu,
}: FootnoteItemProps) {
  const [content, setContent] = useState(footnote.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync content when footnote changes
  useEffect(() => {
    setContent(footnote.content);
  }, [footnote.content]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);

      // Debounce save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onUpdate(newContent);
      }, 500);
    },
    [onUpdate]
  );

  const handleBlur = useCallback(() => {
    // Save immediately on blur
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onUpdate(content);
    onEndEdit();
  }, [content, onUpdate, onEndEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContent(footnote.content); // Reset content
        onEndEdit();
      }
    },
    [footnote.content, onEndEdit]
  );

  return (
    <div
      onContextMenu={onContextMenu}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: isHighlighted ? '#FEF3C7' : 'transparent',
        transition: 'background-color 300ms ease',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        {/* Marker badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#4A90A4',
            backgroundColor: '#EFF6FF',
            borderRadius: '4px',
          }}
        >
          {footnote.marker}
        </span>

        {/* Navigate button */}
        <button
          onClick={onNavigate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            fontSize: '11px',
            color: '#6B7280',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          title="Go to footnote in text"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M14 10l7-7" />
          </svg>
          Go to text
        </button>

        <div style={{ flex: 1 }} />

        {/* Edit button (when not editing and not locked) */}
        {!isEditing && !isLocked && (
          <button
            onClick={onStartEdit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              color: '#6B7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '8px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#374151',
            backgroundColor: '#FFFFFF',
            border: '1px solid #4A90A4',
            borderRadius: '6px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          placeholder="Enter footnote content..."
        />
      ) : (
        <div
          onClick={!isLocked ? onStartEdit : undefined}
          style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: content ? '#374151' : '#9CA3AF',
            cursor: isLocked ? 'default' : 'pointer',
            padding: '4px 0',
          }}
        >
          {content || 'Click to add content...'}
        </div>
      )}
    </div>
  );
});
