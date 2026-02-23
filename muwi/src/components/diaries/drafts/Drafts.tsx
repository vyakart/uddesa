import { useEffect, useCallback } from 'react';
import { DiaryLayout } from '@/components/common/DiaryLayout';
import {
  useDraftsStore,
  selectDraftsIsLoading,
  selectDraftsError,
  selectCurrentDraft,
  selectDraftsCount,
} from '@/stores/draftsStore';
import { DraftList } from './DraftList';
import { DraftEditor } from './DraftEditor';
import { hasActiveModalDialog, isEditableTarget } from '@/utils/keyboard';

const STATUS_LABELS = {
  'in-progress': 'In Progress',
  review: 'Review',
  complete: 'Complete',
} as const;

function formatReadTime(words: number): string {
  if (words <= 0) {
    return '0 min read';
  }

  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function Drafts() {
  // Use selectors for reactive state
  const isLoading = useDraftsStore(selectDraftsIsLoading);
  const error = useDraftsStore(selectDraftsError);
  const currentDraft = useDraftsStore(selectCurrentDraft);
  const draftCount = useDraftsStore(selectDraftsCount);

  // Get actions (these are stable references)
  const loadDrafts = useDraftsStore((state) => state.loadDrafts);
  const createDraft = useDraftsStore((state) => state.createDraft);
  const updateDraft = useDraftsStore((state) => state.updateDraft);
  const cycleDraftStatus = useDraftsStore((state) => state.cycleDraftStatus);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Memoize current draft ID for stable callback dependencies
  const currentDraftId = currentDraft?.id;

  const handleCreateNew = useCallback(async () => {
    await createDraft();
  }, [createDraft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasActiveModalDialog() || isEditableTarget(e.target)) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + N: Create new draft
      if (isMod && e.key === 'n') {
        e.preventDefault();
        createDraft();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createDraft]);

  const handleTitleChange = useCallback(
    (title: string) => {
      if (currentDraftId) {
        updateDraft(currentDraftId, { title });
      }
    },
    [currentDraftId, updateDraft]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (currentDraftId) {
        updateDraft(currentDraftId, { content });
      }
    },
    [currentDraftId, updateDraft]
  );

  const handleStatusCycle = useCallback(() => {
    if (currentDraftId) {
      cycleDraftStatus(currentDraftId);
    }
  }, [currentDraftId, cycleDraftStatus]);

  if (isLoading) {
    return (
      <DiaryLayout
        diaryType="drafts"
        toolbar={<div />}
        canvas={
          <div className="muwi-loading-state">
            <div className="muwi-loading-state__content">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="muwi-loading-state__spinner"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <span>Loading drafts...</span>
            </div>
          </div>
        }
      />
    );
  }

  if (error) {
    return (
      <DiaryLayout
        diaryType="drafts"
        toolbar={<div />}
        canvas={
          <div className="muwi-error-state">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="muwi-error-state__icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="muwi-error-state__content">
              <p className="muwi-error-state__title">Error loading drafts</p>
              <p className="muwi-error-state__message">{error}</p>
            </div>
            <button
              onClick={() => loadDrafts()}
              className="muwi-button"
              data-variant="primary"
            >
              Try Again
            </button>
          </div>
        }
      />
    );
  }

  const noDrafts = draftCount === 0;
  const statusText = currentDraft ? `Status: ${STATUS_LABELS[currentDraft.status]}` : 'Status: No draft selected';
  const currentWordCount = currentDraft?.wordCount ?? 0;
  const currentReadTime = formatReadTime(currentWordCount);

  const canvas = noDrafts
    ? (
        <div className="muwi-empty-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="muwi-empty-state__icon">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <p className="muwi-empty-state__title">No drafts yet</p>
          <p className="muwi-empty-state__description">Create your first draft to start writing.</p>
          <div className="muwi-empty-state__action">
            <button
              type="button"
              onClick={() => void handleCreateNew()}
              className="muwi-button"
              data-variant="primary"
            >
              Create your first draft
            </button>
          </div>
        </div>
      )
    : (
        <DraftEditor
          key={currentDraftId ?? 'empty-draft'}
          draft={currentDraft}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          onStatusCycle={handleStatusCycle}
        />
      );

  return (
    <DiaryLayout
      diaryType="drafts"
      sidebar={<DraftList onCreateNew={handleCreateNew} />}
      toolbar={
        <DraftsToolbar
          draftCount={draftCount}
        />
      }
      canvas={canvas}
      status={{
        left: statusText,
        right: `${currentWordCount} ${currentWordCount === 1 ? 'word' : 'words'} · ${currentReadTime}`,
      }}
    />
  );
}

interface DraftsToolbarProps {
  draftCount: number;
}

function DraftsToolbar({ draftCount }: DraftsToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontSize: '14px',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span>{draftCount} draft{draftCount !== 1 ? 's' : ''}</span>
      <span
        style={{
          fontSize: '12px',
          color: 'var(--color-text-tertiary)',
        }}
      >
        Ctrl+N to create new
      </span>
    </div>
  );
}
