import { lazy, Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { DiaryLayout } from '@/components/common/DiaryLayout';
import { Toolbar, type ToolbarItem } from '@/components/common';
import {
  useAppStore,
  selectRightPanel,
} from '@/stores/appStore';
import {
  useAcademicStore,
  selectPapers,
  selectCurrentPaperId,
  selectCurrentPaper,
  selectAcademicCurrentSections,
  selectAcademicCurrentSection,
  selectAcademicIsLoading,
  selectAcademicError,
  selectCitationStyle,
  selectCurrentPaperWordCount,
  type AcademicSectionNode,
} from '@/stores/academicStore';
import type { AcademicSection, CitationStyle, PaperCreationOptions } from '@/types/academic';
import { AcademicSectionEditor } from './AcademicSectionEditor';
import { hasActiveModalDialog, isEditableTarget } from '@/utils/keyboard';

const BibliographyManager = lazy(async () => {
  const module = await import('./BibliographyManager');
  return { default: module.BibliographyManager };
});

const ReferenceLibraryPanel = lazy(async () => {
  const module = await import('./ReferenceLibraryPanel');
  return { default: module.ReferenceLibraryPanel };
});

const TemplateSelector = lazy(async () => {
  const module = await import('./TemplateSelector');
  return { default: module.TemplateSelector };
});

const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  apa7: 'APA 7th',
  mla9: 'MLA 9th',
  chicago: 'Chicago',
  harvard: 'Harvard',
  ieee: 'IEEE',
};

const PAGE_SIZE_LABELS: Record<'a4' | 'letter', string> = {
  a4: 'A4',
  letter: 'Letter',
};

const STRUCTURE_TEMPLATE = [
  { id: 'abstract', label: 'Abstract', aliases: ['abstract'] },
  { id: 'introduction', label: 'Introduction', aliases: ['introduction'] },
  { id: 'methods', label: 'Methods', aliases: ['methods', 'methodology'] },
  { id: 'results', label: 'Results', aliases: ['results', 'findings'] },
  { id: 'discussion', label: 'Discussion', aliases: ['discussion'] },
  { id: 'conclusion', label: 'Conclusion', aliases: ['conclusion'] },
];

function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function findTemplateMatch(section: AcademicSection, aliases: string[]): boolean {
  const normalized = normalizeTitle(section.title);
  return aliases.some((alias) => normalized.includes(alias));
}

export function Academic() {
  const papers = useAcademicStore(selectPapers);
  const currentPaperId = useAcademicStore(selectCurrentPaperId);
  const currentPaper = useAcademicStore(selectCurrentPaper);
  const currentSections = useAcademicStore(selectAcademicCurrentSections);
  const currentSection = useAcademicStore(selectAcademicCurrentSection);
  const isLoading = useAcademicStore(selectAcademicIsLoading);
  const error = useAcademicStore(selectAcademicError);
  const citationStyle = useAcademicStore(selectCitationStyle);
  const totalWordCount = useAcademicStore(selectCurrentPaperWordCount);

  const rightPanelState = useAppStore(selectRightPanel);
  const openRightPanel = useAppStore((state) => state.openRightPanel);
  const closeRightPanel = useAppStore((state) => state.closeRightPanel);

  const loadPapers = useAcademicStore((state) => state.loadPapers);
  const loadBibliographyEntries = useAcademicStore((state) => state.loadBibliographyEntries);
  const createPaper = useAcademicStore((state) => state.createPaper);
  const setCurrentPaper = useAcademicStore((state) => state.setCurrentPaper);
  const createSection = useAcademicStore((state) => state.createSection);
  const updateSection = useAcademicStore((state) => state.updateSection);
  const deleteSection = useAcademicStore((state) => state.deleteSection);
  const setCurrentSection = useAcademicStore((state) => state.setCurrentSection);
  const setCitationStyle = useAcademicStore((state) => state.setCitationStyle);
  const getSectionHierarchy = useAcademicStore((state) => state.getSectionHierarchy);

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    loadPapers();
    loadBibliographyEntries();
  }, [loadPapers, loadBibliographyEntries]);

  const handleTogglePanel = useCallback(
    (panelType: 'bibliography' | 'reference-library') => {
      if (
        rightPanelState.isOpen &&
        rightPanelState.panelType === panelType &&
        rightPanelState.context?.source === 'academic'
      ) {
        closeRightPanel();
        return;
      }

      openRightPanel(panelType, { source: 'academic' });
    },
    [rightPanelState.isOpen, rightPanelState.panelType, rightPanelState.context, closeRightPanel, openRightPanel]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      const isEditable = isEditableTarget(event.target);

      if (hasActiveModalDialog()) {
        return;
      }

      if (isMod && !event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setShowTemplateSelector(true);
      }

      if (isMod && event.shiftKey && event.key.toLowerCase() === 'n' && currentPaperId) {
        event.preventDefault();
        void createSection(currentPaperId);
      }

      if (isMod && event.key.toLowerCase() === 'b' && !isEditable) {
        event.preventDefault();
        handleTogglePanel('bibliography');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPaperId, createSection, handleTogglePanel]);

  const handleCreatePaper = useCallback(
    async (title: string, template: string | null, options?: PaperCreationOptions) => {
      if (options) {
        await createPaper(title, template || undefined, options);
      } else {
        await createPaper(title, template || undefined);
      }
      setShowTemplateSelector(false);
    },
    [createPaper]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (currentSection) {
        updateSection(currentSection.id, { title });
      }
    },
    [currentSection, updateSection]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (currentSection) {
        updateSection(currentSection.id, { content });
      }
    },
    [currentSection, updateSection]
  );

  const handleAddSection = useCallback(async () => {
    if (currentPaperId) {
      await createSection(currentPaperId);
    }
  }, [currentPaperId, createSection]);

  const handleDeleteSection = useCallback(
    async (id: string) => {
      if (confirm('Are you sure you want to delete this section?')) {
        await deleteSection(id);
      }
    },
    [deleteSection]
  );

  const totalCharacterCount = useMemo(
    () => currentSections.reduce((total, section) => total + stripHtml(section.content).length, 0),
    [currentSections]
  );

  const sectionHierarchy = currentPaperId ? getSectionHierarchy(currentPaperId) : [];
  const structureRows = STRUCTURE_TEMPLATE.map((templateRow) => {
    const matchedSection = currentSections.find((section) => findTemplateMatch(section, templateRow.aliases));
    return {
      ...templateRow,
      section: matchedSection ?? null,
    };
  });

  const isAcademicPanelOpen = rightPanelState.isOpen && rightPanelState.context?.source === 'academic';
  const activeAcademicPanel = isAcademicPanelOpen ? rightPanelState.panelType : null;
  const isBibliographyPanelActive = activeAcademicPanel === 'bibliography';
  const isReferenceLibraryPanelActive = activeAcademicPanel === 'reference-library';

  const toolbarItems: ToolbarItem[] = [
    {
      id: 'new-paper',
      label: 'New Paper',
      onClick: () => setShowTemplateSelector(true),
      tooltip: 'Create a new paper (Ctrl+N)',
      showLabel: true,
    },
    {
      id: 'new-section',
      label: 'New Section',
      onClick: () => {
        void handleAddSection();
      },
      disabled: !currentPaperId,
      tooltip: 'Add a section (Ctrl+Shift+N)',
      showLabel: true,
    },
    { type: 'separator', id: 'academic-sep-1' },
    {
      id: 'bibliography-panel',
      label: 'Bibliography',
      onClick: () => handleTogglePanel('bibliography'),
      tooltip: 'Toggle bibliography panel',
      toggle: true,
      isActive: isBibliographyPanelActive,
      showLabel: true,
    },
    {
      id: 'reference-library-panel',
      label: 'Reference Library',
      onClick: () => handleTogglePanel('reference-library'),
      tooltip: 'Toggle reference library panel',
      toggle: true,
      isActive: isReferenceLibraryPanelActive,
      showLabel: true,
    },
  ];

  const toolbar = (
    <div className="muwi-academic-toolbar">
      <div className="muwi-academic-toolbar__group">
        <Toolbar items={toolbarItems} ariaLabel="Academic actions" />
      </div>
      <div className="muwi-academic-toolbar__meta" aria-hidden="true">
        <span>{currentPaper ? currentPaper.title : 'No paper selected'}</span>
        <span>
          {totalWordCount.toLocaleString()} words · {totalCharacterCount.toLocaleString()} chars
        </span>
      </div>
    </div>
  );

  const sidebarHeader = (
    <div className="muwi-academic-sidebar__paper-select">
      <label htmlFor="academic-paper-select" className="muwi-academic-sidebar__label">Paper</label>
      <div className="muwi-select-wrap">
        <select
          id="academic-paper-select"
          value={currentPaperId ?? ''}
          onChange={(event) => setCurrentPaper(event.target.value || null)}
          className="muwi-form-control muwi-select"
          aria-label="Select paper"
        >
          <option value="">Select paper</option>
          {papers.map((paper) => (
            <option key={paper.id} value={paper.id}>
              {paper.title}
            </option>
          ))}
        </select>
        <span className="muwi-select__chevron" aria-hidden="true">
          ▾
        </span>
      </div>
    </div>
  );

  const sidebar = (
    <div className="muwi-academic-sidebar">
      <section className="muwi-academic-sidebar__section">
        <div className="muwi-academic-sidebar__heading">STRUCTURE</div>
        <div className="muwi-academic-structure-list">
          {structureRows.map((row) => {
            const isActive = currentSection?.id === row.section?.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  if (row.section) {
                    setCurrentSection(row.section.id);
                    return;
                  }

                  if (currentPaperId) {
                    void createSection(currentPaperId, row.label);
                  }
                }}
                className={`muwi-sidebar-item muwi-academic-structure-list__item${isActive ? ' is-active' : ''}`}
                disabled={!currentPaperId}
                aria-label={row.section ? `Open ${row.label}` : `Add ${row.label}`}
              >
                <span className="muwi-academic-structure-list__status" data-complete={row.section ? 'true' : 'false'} />
                <span className="muwi-sidebar-item__label">{row.label}</span>
                <span className="muwi-academic-structure-list__tag">{row.section ? 'Ready' : 'Add'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="muwi-academic-sidebar__section">
        <button
          type="button"
          onClick={() => handleTogglePanel('bibliography')}
          className={`muwi-sidebar-item${isBibliographyPanelActive ? ' is-active' : ''}`}
          aria-label="Open bibliography panel"
        >
          <span aria-hidden="true">📚</span>
          <span className="muwi-sidebar-item__label">BIBLIOGRAPHY</span>
        </button>
      </section>

      <section className="muwi-academic-sidebar__section muwi-academic-sidebar__section--fill">
        <div className="muwi-academic-sidebar__heading">CURRENT SECTIONS</div>
        {sectionHierarchy.length === 0 ? (
          <div className="muwi-academic-sidebar__empty">No sections yet</div>
        ) : (
          <SectionList
            nodes={sectionHierarchy}
            currentSectionId={currentSection?.id || null}
            onSelect={setCurrentSection}
            onDelete={handleDeleteSection}
          />
        )}
      </section>
    </div>
  );

  const sidebarFooter = (
    <div className="muwi-academic-sidebar__actions">
      <button
        type="button"
        onClick={() => {
          void handleAddSection();
        }}
        className="muwi-button"
        data-size="sm"
        data-variant="secondary"
        disabled={!currentPaperId}
      >
        + New Section
      </button>
      <button
        type="button"
        onClick={() => setShowTemplateSelector(true)}
        className="muwi-button"
        data-size="sm"
        data-variant="primary"
      >
        + New Paper
      </button>
    </div>
  );

  const canvas = isLoading ? (
    <div className="muwi-academic-state" data-tone="neutral">
      <div className="muwi-academic-state__spinner" aria-hidden="true" />
      <p>Loading papers...</p>
    </div>
  ) : error ? (
    <div className="muwi-academic-state" data-tone="error">
      <p>{error}</p>
      <button type="button" className="muwi-button" data-size="sm" data-variant="secondary" onClick={() => loadPapers()}>
        Retry
      </button>
    </div>
  ) : papers.length === 0 ? (
    <div className="muwi-academic-state" data-tone="neutral">
      <p>No papers yet</p>
      <span>Choose a template to get started.</span>
      <button
        type="button"
        onClick={() => setShowTemplateSelector(true)}
        className="muwi-button"
        data-size="md"
        data-variant="primary"
      >
        Create Paper
      </button>
    </div>
  ) : (
    <AcademicSectionEditor
      key={currentSection?.id ?? 'empty-academic-section'}
      section={currentSection}
      onTitleChange={handleTitleChange}
      onContentChange={handleContentChange}
      onOpenBibliographyPanel={() => handleTogglePanel('bibliography')}
      onOpenReferenceLibraryPanel={() => handleTogglePanel('reference-library')}
    />
  );

  const rightPanelContent =
    activeAcademicPanel === 'bibliography' || activeAcademicPanel === 'reference-library' ? (
      <div className="muwi-academic-panel">
        <div className="muwi-academic-panel__controls">
          <label htmlFor="academic-panel-citation-style">Citation style</label>
          <div className="muwi-select-wrap">
            <select
              id="academic-panel-citation-style"
              value={citationStyle}
              className="muwi-form-control muwi-select"
              onChange={(event) => setCitationStyle(event.target.value as CitationStyle)}
            >
              {(Object.keys(CITATION_STYLE_LABELS) as CitationStyle[]).map((style) => (
                <option key={style} value={style}>
                  {CITATION_STYLE_LABELS[style]}
                </option>
              ))}
            </select>
            <span className="muwi-select__chevron" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>

        <div className="muwi-academic-panel__content">
          <Suspense fallback={<div className="muwi-academic-sidebar__empty">Loading panel...</div>}>
            {activeAcademicPanel === 'bibliography' ? (
              <BibliographyManager hideHeader />
            ) : (
              <ReferenceLibraryPanel hideHeader compact />
            )}
          </Suspense>
        </div>
      </div>
    ) : null;

  const pageSizeLabel = PAGE_SIZE_LABELS[currentPaper?.settings.pageSize ?? 'a4'];

  return (
    <DiaryLayout
      diaryType="academic"
      sidebar={sidebar}
      sidebarHeader={sidebarHeader}
      sidebarFooter={sidebarFooter}
      toolbar={toolbar}
      canvas={
        <>
          {canvas}
          {showTemplateSelector ? (
            <Suspense fallback={<div className="muwi-academic-state" data-tone="neutral"><p>Loading template selector...</p></div>}>
              <TemplateSelector onSelect={handleCreatePaper} onClose={() => setShowTemplateSelector(false)} />
            </Suspense>
          ) : null}
        </>
      }
      status={{
        left: `${CITATION_STYLE_LABELS[citationStyle]} · ${pageSizeLabel}`,
        right: `${totalWordCount.toLocaleString()} words · ${totalCharacterCount.toLocaleString()} chars`,
      }}
      rightPanel={rightPanelContent}
    />
  );
}

interface SectionListProps {
  nodes: AcademicSectionNode[];
  currentSectionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function SectionList({ nodes, currentSectionId, onSelect, onDelete }: SectionListProps) {
  return (
    <div>
      {nodes.map((node) => {
        const isActive = currentSectionId === node.section.id;
        return (
          <div key={node.section.id}>
            <div
              className={`muwi-sidebar-item muwi-academic-section-item${isActive ? ' is-active' : ''}`}
              style={{ paddingLeft: `${12 + node.depth * 14}px` }}
            >
              <button
                type="button"
                onClick={() => onSelect(node.section.id)}
                className="muwi-academic-section-item__main"
                aria-label={`Open ${node.section.title || 'Untitled section'}`}
              >
                <span className="muwi-sidebar-item__label">{node.section.title || 'Untitled'}</span>
                <span className="muwi-academic-section-item__count">{node.section.wordCount}w</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(node.section.id);
                }}
                className="muwi-academic-section-item__delete"
                aria-label={`Delete ${node.section.title || 'Untitled section'}`}
                title="Delete section"
              >
                ×
              </button>
            </div>
            {node.children.length > 0 ? (
              <SectionList
                nodes={node.children}
                currentSectionId={currentSectionId}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
