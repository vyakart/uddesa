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
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
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
      </DiaryLayout>
    );
  }

  if (error) {
    return (
      <DiaryLayout
        diaryType="drafts"
        toolbar={<div />}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626',
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
            <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>{error}</p>
          </div>
          <button
            onClick={() => loadDrafts()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4A90A4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </DiaryLayout>
    );
  }

  return (
    <DiaryLayout
      diaryType="drafts"
      toolbar={
        <DraftsToolbar
          onCreateNew={handleCreateNew}
          draftCount={draftCount}
        />
      }
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar with draft list */}
        <DraftList onCreateNew={handleCreateNew} />

        {/* Main editor area */}
        <DraftEditor
          key={currentDraftId ?? 'empty-draft'}
          draft={currentDraft}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          onStatusCycle={handleStatusCycle}
        />
      </div>
    </DiaryLayout>
  );
}

interface DraftsToolbarProps {
  onCreateNew: () => void;
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
        color: '#6B7280',
      }}
    >
      <span>{draftCount} draft{draftCount !== 1 ? 's' : ''}</span>
      <span
        style={{
          fontSize: '12px',
          color: '#9CA3AF',
        }}
      >
        Ctrl+N to create new
      </span>
    </div>
  );
}
