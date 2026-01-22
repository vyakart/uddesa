import { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  useDraftsStore,
  selectCurrentDraftId,
  selectDraftsSortBy,
  selectDraftsSortOrder,
  selectDraftsFilterStatus,
  type DraftSortBy,
} from '@/stores/draftsStore';
import type { Draft, DraftStatus } from '@/types/drafts';
import { StatusBadge } from './StatusBadge';

interface DraftListProps {
  onCreateNew: () => void;
}

const sortByLabels: Record<DraftSortBy, string> = {
  modifiedAt: 'Modified',
  createdAt: 'Created',
  title: 'Title',
  status: 'Status',
};

const filterLabels: Record<DraftStatus | 'all', string> = {
  all: 'All',
  'in-progress': 'In Progress',
  review: 'Review',
  complete: 'Complete',
};

function formatDate(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

function truncateText(text: string, maxLength: number): string {
  // Strip HTML tags for preview
  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).trim() + '...';
}

export function DraftList({ onCreateNew }: DraftListProps) {
  // Use selective subscriptions for better performance
  const currentDraftId = useDraftsStore(selectCurrentDraftId);
  const sortBy = useDraftsStore(selectDraftsSortBy);
  const sortOrder = useDraftsStore(selectDraftsSortOrder);
  const filterStatus = useDraftsStore(selectDraftsFilterStatus);
  const drafts = useDraftsStore((state) => state.getSortedFilteredDrafts());

  // Get stable action references
  const setCurrentDraft = useDraftsStore((state) => state.setCurrentDraft);
  const cycleDraftStatus = useDraftsStore((state) => state.cycleDraftStatus);
  const deleteDraft = useDraftsStore((state) => state.deleteDraft);
  const setSortBy = useDraftsStore((state) => state.setSortBy);
  const setSortOrder = useDraftsStore((state) => state.setSortOrder);
  const setFilterStatus = useDraftsStore((state) => state.setFilterStatus);

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; draftId: string } | null>(null);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const handleSortChange = useCallback((newSortBy: DraftSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setShowSortMenu(false);
  }, [sortBy, sortOrder, setSortBy, setSortOrder]);

  const handleFilterChange = useCallback((status: DraftStatus | 'all') => {
    setFilterStatus(status);
    setShowFilterMenu(false);
  }, [setFilterStatus]);

  const handleContextMenu = useCallback((e: React.MouseEvent, draftId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, draftId });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      await deleteDraft(id);
    }
    setContextMenu(null);
  }, [deleteDraft]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '280px',
        borderRight: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
      }}
    >
      {/* Header with New Draft button */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <button
          onClick={onCreateNew}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#4A90A4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3D7A8C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4A90A4';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Draft
        </button>
      </div>

      {/* Sort and Filter controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {/* Sort dropdown */}
        <div ref={sortMenuRef} style={{ position: 'relative', flex: 1 }}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '12px',
              color: '#4B5563',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{sortByLabels[sortBy]}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: showSortMenu ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showSortMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                zIndex: 50,
              }}
            >
              {(Object.keys(sortByLabels) as DraftSortBy[]).map((option) => (
                <button
                  key={option}
                  onClick={() => handleSortChange(option)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: sortBy === option ? '#F3F4F6' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {sortByLabels[option]}
                  {sortBy === option && (
                    <span style={{ color: '#6B7280' }}>
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter dropdown */}
        <div ref={filterMenuRef} style={{ position: 'relative', flex: 1 }}>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '12px',
              color: '#4B5563',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{filterLabels[filterStatus]}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: showFilterMenu ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showFilterMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                zIndex: 50,
              }}
            >
              {(Object.keys(filterLabels) as (DraftStatus | 'all')[]).map((option) => (
                <button
                  key={option}
                  onClick={() => handleFilterChange(option)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: filterStatus === option ? '#F3F4F6' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {filterLabels[option]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Draft list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {drafts.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#9CA3AF',
              fontSize: '14px',
            }}
          >
            {filterStatus !== 'all' ? 'No drafts match filter' : 'No drafts yet'}
          </div>
        ) : (
          drafts.map((draft) => (
            <DraftListItem
              key={draft.id}
              draft={draft}
              isSelected={draft.id === currentDraftId}
              onSelect={() => setCurrentDraft(draft.id)}
              onStatusClick={() => cycleDraftStatus(draft.id)}
              onContextMenu={(e) => handleContextMenu(e, draft.id)}
            />
          ))
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            zIndex: 100,
            minWidth: '120px',
          }}
        >
          <button
            onClick={() => handleDelete(contextMenu.draftId)}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: '#DC2626',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

interface DraftListItemProps {
  draft: Draft;
  isSelected: boolean;
  onSelect: () => void;
  onStatusClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const DraftListItem = memo(function DraftListItem({
  draft,
  isSelected,
  onSelect,
  onStatusClick,
  onContextMenu,
}: DraftListItemProps) {
  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E5E7EB',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
        borderLeft: isSelected ? '3px solid #4A90A4' : '3px solid transparent',
        transition: 'background-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#F3F4F6';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Title and lock indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '4px',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1F2937',
            margin: 0,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {draft.title || 'Untitled Draft'}
        </h3>
        {draft.isLocked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        )}
      </div>

      {/* Preview text */}
      <p
        style={{
          fontSize: '12px',
          color: '#6B7280',
          margin: '0 0 8px 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {truncateText(draft.content, 60) || 'No content'}
      </p>

      {/* Meta row: status badge, word count, date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div onClick={(e) => { e.stopPropagation(); onStatusClick(); }}>
          <StatusBadge status={draft.status} onClick={onStatusClick} size="sm" />
        </div>
        <span
          style={{
            fontSize: '11px',
            color: '#9CA3AF',
          }}
        >
          {draft.wordCount} words
        </span>
        <span
          style={{
            fontSize: '11px',
            color: '#9CA3AF',
            marginLeft: 'auto',
          }}
        >
          {formatDate(draft.modifiedAt)}
        </span>
      </div>
    </div>
  );
});
