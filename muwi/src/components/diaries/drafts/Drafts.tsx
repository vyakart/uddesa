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
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <span>Loading drafts...</span>
            </div>
            <style>
              {`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
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
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-error)',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 500, margin: '0 0 8px 0' }}>Error loading drafts</p>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>{error}</p>
            </div>
            <button
              onClick={() => loadDrafts()}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-accent-default)',
                color: 'var(--color-text-inverse)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
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
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>No drafts yet</p>
          <p style={{ margin: 0, fontSize: '14px' }}>Create your first draft to start writing.</p>
          <button
            type="button"
            onClick={() => void handleCreateNew()}
            style={{
              marginTop: '6px',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'var(--color-accent-default)',
              color: 'var(--color-text-inverse)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Create your first draft
          </button>
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
