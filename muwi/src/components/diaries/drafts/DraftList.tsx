import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import {
  useDraftsStore,
  selectCurrentDraftId,
  selectDrafts,
  selectDraftsSortBy,
  selectDraftsSortOrder,
  selectDraftsFilterStatus,
  type DraftSortBy,
} from '@/stores/draftsStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useContentLocking } from '@/hooks';
import { PasskeyPrompt } from '@/components/common';
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

// Helper to sort drafts
function sortDrafts(drafts: Draft[], sortBy: DraftSortBy, sortOrder: 'asc' | 'desc'): Draft[] {
  const sorted = [...drafts].sort((a, b) => {
    let comparison: number;
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status': {
        const statusOrder: Record<DraftStatus, number> = { 'in-progress': 0, 'review': 1, 'complete': 2 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      }
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'modifiedAt':
      default:
        comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  return sorted;
}

export function DraftList({ onCreateNew }: DraftListProps) {
  // Use selective subscriptions for better performance
  const currentDraftId = useDraftsStore(selectCurrentDraftId);
  const rawDrafts = useDraftsStore(selectDrafts);
  const sortBy = useDraftsStore(selectDraftsSortBy);
  const sortOrder = useDraftsStore(selectDraftsSortOrder);
  const filterStatus = useDraftsStore(selectDraftsFilterStatus);

  // Memoize sorted/filtered drafts to prevent infinite re-renders
  const drafts = useMemo(() => {
    let filtered = rawDrafts;
    if (filterStatus !== 'all') {
      filtered = rawDrafts.filter(d => d.status === filterStatus);
    }
    return sortDrafts(filtered, sortBy, sortOrder);
  }, [rawDrafts, sortBy, sortOrder, filterStatus]);

  // Get stable action references
  const setCurrentDraft = useDraftsStore((state) => state.setCurrentDraft);
  const cycleDraftStatus = useDraftsStore((state) => state.cycleDraftStatus);
  const deleteDraft = useDraftsStore((state) => state.deleteDraft);
  const updateDraft = useDraftsStore((state) => state.updateDraft);
  const setSortBy = useDraftsStore((state) => state.setSortBy);
  const setSortOrder = useDraftsStore((state) => state.setSortOrder);
  const setFilterStatus = useDraftsStore((state) => state.setFilterStatus);
  const closeDiary = useAppStore((state) => state.closeDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const hasPasskey = useSettingsStore((state) => state.hasPasskey);
  const passkeyHint = useSettingsStore((state) => state.global.passkeyHint);

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; draftId: string } | null>(null);
  const [unlockPromptDraftId, setUnlockPromptDraftId] = useState<string | null>(null);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const lockingTargetId = contextMenu?.draftId ?? unlockPromptDraftId ?? '';
  const contextDraft = contextMenu ? drafts.find((draft) => draft.id === contextMenu.draftId) : null;
  const {
    lock,
    unlock,
    error: lockingError,
  } = useContentLocking({
    contentType: 'draft',
    contentId: lockingTargetId,
    enabled: Boolean(lockingTargetId),
  });

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

  const promptPasskeySetup = useCallback(() => {
    const shouldOpenSettings = confirm('A passkey is required to lock content. Open Settings to set one now?');
    if (shouldOpenSettings) {
      closeDiary();
      openSettings();
    }
  }, [closeDiary, openSettings]);

  const handleLockDraft = useCallback(async (draftId: string) => {
    const hasPass = await hasPasskey();
    if (!hasPass) {
      promptPasskeySetup();
      setContextMenu(null);
      return;
    }

    const isLocked = await lock();
    if (isLocked) {
      await updateDraft(draftId, { isLocked: true });
    }
    setContextMenu(null);
  }, [hasPasskey, lock, promptPasskeySetup, updateDraft]);

  const handleUnlockSubmit = useCallback(async (passkey: string) => {
    if (!unlockPromptDraftId) {
      return;
    }

    const isUnlocked = await unlock(passkey);
    if (isUnlocked) {
      await updateDraft(unlockPromptDraftId, { isLocked: false });
      setUnlockPromptDraftId(null);
    }
  }, [unlock, unlockPromptDraftId, updateDraft]);

  return (
    <div className="muwi-drafts-list">
      {/* Header with New Draft button */}
      <div
        style={{
          padding: '8px 0',
          borderBottom: '1px solid var(--color-border-default)',
        }}
      >
        <button
          onClick={onCreateNew}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: 'var(--color-accent-default)',
            color: 'var(--color-text-inverse)',
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
            e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-accent-default)';
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
          padding: '12px 0',
          borderBottom: '1px solid var(--color-border-default)',
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
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border-default)',
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
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-default)',
                borderRadius: '6px',
                boxShadow: 'var(--shadow-md)',
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
                    backgroundColor: sortBy === option ? 'var(--color-bg-tertiary)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {sortByLabels[option]}
                  {sortBy === option && (
                    <span style={{ color: 'var(--color-text-secondary)' }}>
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
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border-default)',
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
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-default)',
                borderRadius: '6px',
                boxShadow: 'var(--shadow-md)',
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
                    backgroundColor: filterStatus === option ? 'var(--color-bg-tertiary)' : 'transparent',
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
      <div className="muwi-drafts-list__scroll">
        {drafts.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--color-text-tertiary)',
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
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            minWidth: '120px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => {
              if (!contextDraft) {
                setContextMenu(null);
                return;
              }
              if (contextDraft.isLocked) {
                setUnlockPromptDraftId(contextDraft.id);
                setContextMenu(null);
                return;
              }
              void handleLockDraft(contextDraft.id);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: 'var(--color-text-primary)',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {contextDraft?.isLocked ? 'Unlock' : 'Lock'}
          </button>
          <div style={{ height: 1, backgroundColor: 'var(--color-border-default)' }} />
          <button
            onClick={() => handleDelete(contextMenu.draftId)}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: 'var(--color-error)',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-error-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Delete
          </button>
        </div>
      )}

      <PasskeyPrompt
        isOpen={unlockPromptDraftId !== null}
        onClose={() => setUnlockPromptDraftId(null)}
        onSubmit={handleUnlockSubmit}
        title="Unlock draft"
        description="Enter your passkey to unlock this draft."
        hint={passkeyHint}
        error={lockingError}
        submitLabel="Unlock"
      />
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
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={['muwi-sidebar-item', 'muwi-drafts-list__item', isSelected ? 'is-active' : null]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="muwi-drafts-list__item-content">
        <div className="muwi-drafts-list__item-head">
          <h3 className="muwi-drafts-list__item-title">
            {draft.title || 'Untitled Draft'}
          </h3>
          {draft.isLocked && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-tertiary)"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          )}
        </div>

        <p className="muwi-drafts-list__item-preview">
          {truncateText(draft.content, 60) || 'No content'}
        </p>

        <div className="muwi-drafts-list__item-meta">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onStatusClick();
            }}
          >
            <StatusBadge status={draft.status} onClick={onStatusClick} size="sm" />
          </div>
          <span className="muwi-drafts-list__item-word-count">{draft.wordCount} words</span>
          <span className="muwi-drafts-list__item-date">{formatDate(draft.modifiedAt)}</span>
        </div>
      </div>
    </div>
  );
});
