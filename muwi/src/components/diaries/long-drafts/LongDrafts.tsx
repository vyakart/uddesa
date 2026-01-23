import { useEffect, useCallback, useState } from 'react';
import { DiaryLayout } from '@/components/common/DiaryLayout';
import {
  useLongDraftsStore,
  selectLongDraftsIsLoading,
  selectLongDraftsError,
  selectCurrentLongDraft,
  selectCurrentSection,
  selectLongDraftsCount,
  selectCurrentDocumentWordCount,
  selectViewMode,
} from '@/stores/longDraftsStore';
import { TableOfContents } from './TableOfContents';
import { SectionEditor } from './SectionEditor';
import { FocusMode, FocusModeToggle } from './FocusMode';

export function LongDrafts() {
  // Use selectors for reactive state
  const isLoading = useLongDraftsStore(selectLongDraftsIsLoading);
  const error = useLongDraftsStore(selectLongDraftsError);
  const currentDocument = useLongDraftsStore(selectCurrentLongDraft);
  const currentSection = useLongDraftsStore(selectCurrentSection);
  const documentCount = useLongDraftsStore(selectLongDraftsCount);
  const totalWordCount = useLongDraftsStore(selectCurrentDocumentWordCount);
  const viewMode = useLongDraftsStore(selectViewMode);

  // Get actions
  const loadLongDrafts = useLongDraftsStore((state) => state.loadLongDrafts);
  const createLongDraft = useLongDraftsStore((state) => state.createLongDraft);
  const createSection = useLongDraftsStore((state) => state.createSection);
  const updateSection = useLongDraftsStore((state) => state.updateSection);

  const [showDocumentList, setShowDocumentList] = useState(false);

  // Load documents on mount
  useEffect(() => {
    loadLongDrafts();
  }, [loadLongDrafts]);

  // Memoize IDs for stable callback dependencies
  const currentDocumentId = currentDocument?.id;
  const currentSectionId = currentSection?.id;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + N: Create new section
      if (isMod && e.key === 'n' && currentDocumentId) {
        e.preventDefault();
        createSection(currentDocumentId);
      }

      // Ctrl/Cmd + Shift + N: Create new document
      if (isMod && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        createLongDraft();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createSection, createLongDraft, currentDocumentId]);

  const handleCreateDocument = useCallback(async () => {
    await createLongDraft();
  }, [createLongDraft]);

  const handleCreateSection = useCallback(
    async (parentId?: string | null) => {
      if (currentDocumentId) {
        await createSection(currentDocumentId, 'Untitled Section', parentId);
      }
    },
    [currentDocumentId, createSection]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (currentSectionId) {
        updateSection(currentSectionId, { title });
      }
    },
    [currentSectionId, updateSection]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (currentSectionId) {
        updateSection(currentSectionId, { content });
      }
    },
    [currentSectionId, updateSection]
  );

  const handleNotesChange = useCallback(
    (notes: string) => {
      if (currentSectionId) {
        updateSection(currentSectionId, { notes });
      }
    },
    [currentSectionId, updateSection]
  );

  const handleStatusChange = useCallback(
    (status: string) => {
      if (currentSectionId) {
        updateSection(currentSectionId, { status });
      }
    },
    [currentSectionId, updateSection]
  );

  // Loading state
  if (isLoading) {
    return (
      <DiaryLayout diaryType="long-drafts" toolbar={<div />}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <span>Loading documents...</span>
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

  // Error state
  if (error) {
    return (
      <DiaryLayout diaryType="long-drafts" toolbar={<div />}>
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
            <p style={{ fontWeight: 500, margin: '0 0 8px 0' }}>Error loading documents</p>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>{error}</p>
          </div>
          <button
            onClick={() => loadLongDrafts()}
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

  // No documents state
  if (!currentDocument) {
    return (
      <DiaryLayout
        diaryType="long-drafts"
        toolbar={<LongDraftsToolbar documentCount={0} wordCount={0} />}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '24px',
            color: '#6B7280',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            style={{ opacity: 0.5 }}
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px 0', color: '#374151' }}>
              No documents yet
            </h2>
            <p style={{ fontSize: '14px', margin: 0 }}>
              Create your first long-form document to get started
            </p>
          </div>
          <button
            onClick={handleCreateDocument}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#4A90A4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3D7A8C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4A90A4';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create New Document
          </button>
        </div>
      </DiaryLayout>
    );
  }

  const isFocusMode = viewMode === 'focus';

  // Main content wrapped in FocusMode
  const mainContent = (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* TOC Sidebar - hidden in focus mode */}
      {!isFocusMode && <TableOfContents onCreateSection={handleCreateSection} />}

      {/* Main editor area */}
      <SectionEditor
        section={currentSection}
        onTitleChange={handleTitleChange}
        onContentChange={handleContentChange}
        onNotesChange={handleNotesChange}
        onStatusChange={handleStatusChange}
      />
    </div>
  );

  return (
    <DiaryLayout
      diaryType="long-drafts"
      toolbar={
        <LongDraftsToolbar
          documentCount={documentCount}
          wordCount={totalWordCount}
          documentTitle={currentDocument.title}
          onDocumentSelect={() => setShowDocumentList(!showDocumentList)}
        />
      }
    >
      <FocusMode>{mainContent}</FocusMode>

      {/* Document switcher modal */}
      {showDocumentList && (
        <DocumentSwitcher
          onClose={() => setShowDocumentList(false)}
          onCreateNew={handleCreateDocument}
        />
      )}
    </DiaryLayout>
  );
}

interface LongDraftsToolbarProps {
  documentCount: number;
  wordCount: number;
  documentTitle?: string;
  onDocumentSelect?: () => void;
}

function LongDraftsToolbar({
  documentCount,
  wordCount,
  documentTitle,
  onDocumentSelect,
}: LongDraftsToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
      }}
    >
      {/* Document selector */}
      {documentTitle && (
        <button
          onClick={onDocumentSelect}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            backgroundColor: 'transparent',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          {documentTitle}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6B7280' }}>
        <span>{documentCount} document{documentCount !== 1 ? 's' : ''}</span>
        <span>{wordCount.toLocaleString()} words</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Focus mode toggle */}
      <FocusModeToggle />

      {/* Keyboard hint */}
      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Ctrl+N new section</span>
    </div>
  );
}

interface DocumentSwitcherProps {
  onClose: () => void;
  onCreateNew: () => void;
}

function DocumentSwitcher({ onClose, onCreateNew }: DocumentSwitcherProps) {
  const documents = useLongDraftsStore((state) => state.longDrafts);
  const currentDocumentId = useLongDraftsStore((state) => state.currentLongDraftId);
  const setCurrentLongDraft = useLongDraftsStore((state) => state.setCurrentLongDraft);
  const deleteLongDraft = useLongDraftsStore((state) => state.deleteLongDraft);

  const handleSelect = useCallback(
    (id: string) => {
      setCurrentLongDraft(id);
      onClose();
    },
    [setCurrentLongDraft, onClose]
  );

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this document?')) {
        await deleteLongDraft(id);
      }
    },
    [deleteLongDraft]
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '100px',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          maxHeight: '500px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#374151' }}>
            Documents
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
              borderRadius: '4px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Document list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleSelect(doc.id)}
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid #E5E7EB',
                cursor: 'pointer',
                backgroundColor: doc.id === currentDocumentId ? '#EFF6FF' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                if (doc.id !== currentDocumentId) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (doc.id !== currentDocumentId) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  {doc.title}
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                  {(doc.metadata?.totalWordCount ?? 0).toLocaleString()} words
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(doc.id, e)}
                style={{
                  width: '24px',
                  height: '24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  opacity: 0.5,
                  borderRadius: '4px',
                }}
                title="Delete document"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Create new button */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
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
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Document
          </button>
        </div>
      </div>
    </div>
  );
}
