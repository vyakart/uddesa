import { useEffect, useCallback, useState } from 'react';
import { format } from 'date-fns';
import { DiaryLayout } from '@/components/common/DiaryLayout';
import { Toolbar, type ToolbarItem } from '@/components/common/Toolbar';
import { useAppStore, selectIsSidebarOpen, selectRightPanel } from '@/stores/appStore';
import {
  useLongDraftsStore,
  selectLongDraftsIsLoading,
  selectLongDraftsError,
  selectCurrentLongDraft,
  selectCurrentSection,
  selectSectionsMap,
  selectLongDraftsCount,
  selectCurrentDocumentWordCount,
  selectViewMode,
} from '@/stores/longDraftsStore';
import type { LongDraft } from '@/types/longDrafts';
import { TableOfContents } from './TableOfContents';
import { SectionEditor } from './SectionEditor';
import { FocusMode } from './FocusMode';
import { hasActiveModalDialog, isEditableTarget } from '@/utils/keyboard';

export function LongDrafts() {
  const isLoading = useLongDraftsStore(selectLongDraftsIsLoading);
  const error = useLongDraftsStore(selectLongDraftsError);
  const currentDocument = useLongDraftsStore(selectCurrentLongDraft);
  const currentSection = useLongDraftsStore(selectCurrentSection);
  const sectionsMap = useLongDraftsStore(selectSectionsMap);
  const documentCount = useLongDraftsStore(selectLongDraftsCount);
  const totalWordCount = useLongDraftsStore(selectCurrentDocumentWordCount);
  const viewMode = useLongDraftsStore(selectViewMode);

  const loadLongDrafts = useLongDraftsStore((state) => state.loadLongDrafts);
  const createLongDraft = useLongDraftsStore((state) => state.createLongDraft);
  const createSection = useLongDraftsStore((state) => state.createSection);
  const updateSection = useLongDraftsStore((state) => state.updateSection);
  const updateLongDraft = useLongDraftsStore((state) => state.updateLongDraft);
  const toggleFocusMode = useLongDraftsStore((state) => state.toggleFocusMode);

  const isSidebarOpen = useAppStore(selectIsSidebarOpen);
  const rightPanelState = useAppStore(selectRightPanel);
  const openRightPanel = useAppStore((state) => state.openRightPanel);
  const closeRightPanel = useAppStore((state) => state.closeRightPanel);

  const [showDocumentList, setShowDocumentList] = useState(false);

  useEffect(() => {
    loadLongDrafts();
  }, [loadLongDrafts]);

  const currentDocumentId = currentDocument?.id;
  const currentSectionId = currentSection?.id;
  const currentSections = currentDocumentId ? (sectionsMap.get(currentDocumentId) ?? []) : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasActiveModalDialog() || isEditableTarget(e.target)) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && !e.shiftKey && e.key.toLowerCase() === 'n' && currentDocumentId) {
        e.preventDefault();
        createSection(currentDocumentId);
      }

      if (isMod && e.shiftKey && e.key.toLowerCase() === 'n') {
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

  const handleToggleTocPanel = useCallback(() => {
    if (rightPanelState.isOpen && rightPanelState.panelType === 'outline') {
      closeRightPanel();
      return;
    }
    openRightPanel('outline', { source: 'long-drafts' });
  }, [rightPanelState.isOpen, rightPanelState.panelType, closeRightPanel, openRightPanel]);

  const handleToggleDocumentSettingsPanel = useCallback(() => {
    if (rightPanelState.isOpen && rightPanelState.panelType === 'document-settings') {
      closeRightPanel();
      return;
    }
    openRightPanel('document-settings', { source: 'long-drafts' });
  }, [rightPanelState.isOpen, rightPanelState.panelType, closeRightPanel, openRightPanel]);

  if (isLoading) {
    return (
      <DiaryLayout
        diaryType="long-drafts"
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
              <span>Loading documents...</span>
            </div>
          </div>
        }
        status={{ left: 'Loading Long Drafts...', right: 'Preparing document workspace' }}
      />
    );
  }

  if (error) {
    return (
      <DiaryLayout
        diaryType="long-drafts"
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
              <p className="muwi-error-state__title">Error loading documents</p>
              <p className="muwi-error-state__message">{error}</p>
            </div>
            <button
              onClick={() => loadLongDrafts()}
              className="muwi-button"
              data-variant="primary"
            >
              Try Again
            </button>
          </div>
        }
        status={{ left: 'Long Drafts unavailable', right: 'Retry loading documents' }}
      />
    );
  }

  if (!currentDocument) {
    return (
      <DiaryLayout
        diaryType="long-drafts"
        toolbar={
          <LongDraftsToolbar
            documentCount={0}
            sectionCount={0}
            wordCount={0}
            onCreateDocument={handleCreateDocument}
            onCreateSection={() => {
              void handleCreateSection(null);
            }}
            onDocumentSelect={() => setShowDocumentList(!showDocumentList)}
            onToggleTocPanel={handleToggleTocPanel}
            onToggleDocumentSettingsPanel={handleToggleDocumentSettingsPanel}
            isTocPanelActive={false}
            isDocumentSettingsPanelActive={false}
            isSidebarOpen={isSidebarOpen}
            isFocusMode={viewMode === 'focus'}
            onToggleFocusMode={toggleFocusMode}
          />
        }
        canvas={
          <div className="muwi-empty-state">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="muwi-empty-state__icon"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            <h2 className="muwi-empty-state__title">Start your first long draft</h2>
            <p className="muwi-empty-state__description">
              Create a document and build it section by section.
            </p>
            <div className="muwi-empty-state__action">
              <button
                onClick={handleCreateDocument}
                className="muwi-button"
                data-variant="primary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create New Document
              </button>
            </div>
          </div>
        }
        status={{ left: 'Section: None selected', right: '0/0 words' }}
      />
    );
  }

  const isFocusMode = viewMode === 'focus';
  const sectionWordCount = currentSection?.wordCount ?? 0;
  const isTocPanelActive = rightPanelState.isOpen && rightPanelState.panelType === 'outline';
  const isDocumentSettingsPanelActive =
    rightPanelState.isOpen && rightPanelState.panelType === 'document-settings';

  const rightPanelContent =
    rightPanelState.panelType === 'outline'
      ? <TableOfContents onCreateSection={handleCreateSection} variant="panel" />
      : rightPanelState.panelType === 'document-settings'
        ? (
            <LongDraftsDocumentSettingsPanel
              document={currentDocument}
              onUpdateDocument={(updates) => updateLongDraft(currentDocument.id, updates)}
            />
          )
        : null;

  return (
    <DiaryLayout
      diaryType="long-drafts"
      sidebar={!isFocusMode ? <TableOfContents onCreateSection={handleCreateSection} /> : undefined}
      toolbar={
        <LongDraftsToolbar
          documentCount={documentCount}
          sectionCount={currentSections.length}
          wordCount={totalWordCount}
          metadataCreatedAt={currentDocument.metadata?.createdAt ?? currentDocument.createdAt}
          metadataModifiedAt={currentDocument.metadata?.modifiedAt ?? currentDocument.modifiedAt}
          author={currentDocument.author}
          subtitle={currentDocument.subtitle}
          documentTitle={currentDocument.title}
          onDocumentSelect={() => setShowDocumentList(!showDocumentList)}
          onCreateSection={() => {
            void handleCreateSection(null);
          }}
          onCreateDocument={handleCreateDocument}
          onToggleTocPanel={handleToggleTocPanel}
          onToggleDocumentSettingsPanel={handleToggleDocumentSettingsPanel}
          isTocPanelActive={isTocPanelActive}
          isDocumentSettingsPanelActive={isDocumentSettingsPanelActive}
          isSidebarOpen={isSidebarOpen}
          isFocusMode={isFocusMode}
          onToggleFocusMode={toggleFocusMode}
        />
      }
      canvas={
        <>
          <FocusMode>
            <SectionEditor
              key={currentSectionId ?? 'empty-section'}
              section={currentSection}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onNotesChange={handleNotesChange}
              onStatusChange={handleStatusChange}
            />
          </FocusMode>

          {showDocumentList ? (
            <DocumentSwitcher
              onClose={() => setShowDocumentList(false)}
              onCreateNew={handleCreateDocument}
            />
          ) : null}
        </>
      }
      status={{
        left: `Section: ${currentSection?.title || 'None selected'}`,
        right: `${sectionWordCount.toLocaleString()}/${totalWordCount.toLocaleString()} words`,
      }}
      rightPanel={rightPanelContent}
      rightPanelTitle={rightPanelState.panelType === 'outline' ? 'Table of Contents' : undefined}
    />
  );
}

interface LongDraftsToolbarProps {
  documentCount: number;
  sectionCount: number;
  wordCount: number;
  metadataCreatedAt?: Date;
  metadataModifiedAt?: Date;
  author?: string;
  subtitle?: string;
  documentTitle?: string;
  onDocumentSelect?: () => void;
  onCreateSection: () => void;
  onCreateDocument: () => void;
  onToggleTocPanel: () => void;
  onToggleDocumentSettingsPanel: () => void;
  isTocPanelActive: boolean;
  isDocumentSettingsPanelActive: boolean;
  isSidebarOpen: boolean;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
}

function formatMetadataDate(value?: Date): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return format(parsed, 'MMM d, yyyy');
}

function LongDraftsToolbar({
  documentCount,
  sectionCount,
  wordCount,
  metadataCreatedAt,
  metadataModifiedAt,
  author,
  subtitle,
  documentTitle,
  onDocumentSelect,
  onCreateSection,
  onCreateDocument,
  onToggleTocPanel,
  onToggleDocumentSettingsPanel,
  isTocPanelActive,
  isDocumentSettingsPanelActive,
  isSidebarOpen,
  isFocusMode,
  onToggleFocusMode,
}: LongDraftsToolbarProps) {
  const formattedCreatedAt = formatMetadataDate(metadataCreatedAt);
  const formattedModifiedAt = formatMetadataDate(metadataModifiedAt);
  const documentActionItems: ToolbarItem[] = [
    ...(documentTitle
      ? [{
          id: 'document-switcher',
          label: documentTitle,
          onClick: () => onDocumentSelect?.(),
          tooltip: 'Switch document',
          showLabel: true,
        }]
      : []),
    {
      id: 'create-section',
      label: 'New Section',
      onClick: onCreateSection,
      tooltip: 'New section (Ctrl+N)',
      showLabel: true,
    },
    {
      id: 'create-document',
      label: 'New Document',
      onClick: onCreateDocument,
      tooltip: 'New document (Ctrl+Shift+N)',
      showLabel: true,
    },
  ];

  const panelItems: ToolbarItem[] = [
    {
      id: 'toc-panel',
      label: 'TOC Panel',
      onClick: onToggleTocPanel,
      tooltip: isSidebarOpen ? 'Open TOC in right panel' : 'Toggle TOC panel',
      toggle: true,
      isActive: isTocPanelActive,
      showLabel: true,
    },
    {
      id: 'document-settings',
      label: 'Settings',
      onClick: onToggleDocumentSettingsPanel,
      tooltip: 'Toggle document settings panel',
      toggle: true,
      isActive: isDocumentSettingsPanelActive,
      showLabel: true,
    },
    {
      id: 'focus-mode',
      label: isFocusMode ? 'Exit Focus' : 'Focus Mode',
      onClick: onToggleFocusMode,
      tooltip: isFocusMode ? 'Exit Focus Mode (Cmd+Shift+F)' : 'Enter Focus Mode (Cmd+Shift+F)',
      toggle: true,
      isActive: isFocusMode,
      showLabel: true,
      icon: isFocusMode ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="muwi-longdrafts-toolbar">
      <div className="muwi-longdrafts-toolbar__group" role="group" aria-label="Document actions">
        <Toolbar items={documentActionItems} ariaLabel="Long drafts document actions" />
      </div>

      <div className="muwi-toolbar__separator" aria-hidden="true" />

      <div className="muwi-longdrafts-toolbar__meta" data-testid="long-drafts-document-metadata">
        <span>{documentCount} document{documentCount !== 1 ? 's' : ''}</span>
        <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
        <span>{wordCount.toLocaleString()} words</span>
        {formattedModifiedAt ? <span>Updated {formattedModifiedAt}</span> : null}
        {formattedCreatedAt ? <span>Created {formattedCreatedAt}</span> : null}
        {author ? <span>Author {author}</span> : null}
        {subtitle ? <span>{subtitle}</span> : null}
      </div>

      <div className="muwi-toolbar__separator" aria-hidden="true" />

      <div className="muwi-longdrafts-toolbar__group" role="group" aria-label="Panels and focus">
        <Toolbar items={panelItems} ariaLabel="Long drafts panels and focus mode" />
      </div>
    </div>
  );
}

interface LongDraftsDocumentSettingsPanelProps {
  document: LongDraft;
  onUpdateDocument: (updates: Partial<LongDraft>) => Promise<void>;
}

function LongDraftsDocumentSettingsPanel({
  document,
  onUpdateDocument,
}: LongDraftsDocumentSettingsPanelProps) {
  const handleBlurField = (field: 'title' | 'subtitle' | 'author', value: string) => {
    const nextValue = value.trim();

    if (field === 'title') {
      const fallback = nextValue || 'Untitled Document';
      if (fallback !== document.title) {
        void onUpdateDocument({ title: fallback });
      }
      return;
    }

    const currentValue = document[field] ?? '';
    const normalizedValue = nextValue || undefined;
    if (currentValue !== (normalizedValue ?? '')) {
      void onUpdateDocument({ [field]: normalizedValue });
    }
  };

  const handleSettingToggle = (setting: 'showTOC' | 'showWordCount', value: boolean) => {
    void onUpdateDocument({
      settings: {
        ...document.settings,
        [setting]: value,
      },
    });
  };

  return (
    <div className="muwi-longdrafts-settings" key={document.id}>
      <p className="muwi-longdrafts-settings__copy">Adjust metadata and workspace defaults for this document.</p>

      <label className="muwi-field">
        <span className="muwi-field__label">Title</span>
        <input
          className="muwi-form-control"
          type="text"
          defaultValue={document.title}
          onBlur={(event) => handleBlurField('title', event.target.value)}
        />
      </label>

      <label className="muwi-field">
        <span className="muwi-field__label">Subtitle</span>
        <input
          className="muwi-form-control"
          type="text"
          defaultValue={document.subtitle ?? ''}
          placeholder="Optional subtitle"
          onBlur={(event) => handleBlurField('subtitle', event.target.value)}
        />
      </label>

      <label className="muwi-field">
        <span className="muwi-field__label">Author</span>
        <input
          className="muwi-form-control"
          type="text"
          defaultValue={document.author ?? ''}
          placeholder="Optional author name"
          onBlur={(event) => handleBlurField('author', event.target.value)}
        />
      </label>

      <label className="muwi-longdrafts-settings__toggle-row">
        <input
          type="checkbox"
          checked={document.settings.showTOC}
          onChange={(event) => handleSettingToggle('showTOC', event.target.checked)}
        />
        <span>Show TOC by default</span>
      </label>

      <label className="muwi-longdrafts-settings__toggle-row">
        <input
          type="checkbox"
          checked={document.settings.showWordCount}
          onChange={(event) => handleSettingToggle('showWordCount', event.target.checked)}
        />
        <span>Show word counts</span>
      </label>
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
    <div className="muwi-document-switcher" onClick={onClose}>
      <div className="muwi-document-switcher__panel" onClick={(e) => e.stopPropagation()}>
        <div className="muwi-document-switcher__header">
          <h3 className="muwi-document-switcher__title">Documents</h3>
          <button onClick={onClose} className="muwi-sidebar-button" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="muwi-document-switcher__list">
          {documents.map((doc) => {
            const updatedDate = formatMetadataDate(doc.metadata?.modifiedAt ?? doc.modifiedAt);

            return (
              <div
                key={doc.id}
                onClick={() => handleSelect(doc.id)}
                className={`muwi-document-switcher__item ${doc.id === currentDocumentId ? 'is-active' : ''}`}
              >
                <div>
                  <div className="muwi-document-switcher__item-title">{doc.title}</div>
                  <div className="muwi-document-switcher__item-meta">
                    {(doc.metadata?.totalWordCount ?? 0).toLocaleString()} words
                    {updatedDate ? ` • Updated ${updatedDate}` : ''}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(doc.id, e)}
                  className="muwi-sidebar-button"
                  title="Delete document"
                  data-destructive="true"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <div className="muwi-document-switcher__footer">
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="muwi-button is-full-width"
            data-variant="primary"
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
